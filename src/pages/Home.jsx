// Страница с категориями и карточкой аффирмации
import { useEffect, useMemo, useRef, useState } from 'react';
import AffirmationCard from '../components/AffirmationCard';
import { affirmations as localAffirmations } from '../data/affirmations';
import { loadAffirmations } from '../data/loadAffirmations';
import { useAppStore } from '../store/useAppStore';

const categories = [
  { key: 'love', label: 'Любовь и отношения ❤️' },
  { key: 'money', label: 'Деньги и изобилие 💰' },
  { key: 'health', label: 'Здоровье и гармония 🌿' },
  { key: 'confidence', label: 'Уверенность и сила 💪' },
  { key: 'calm', label: 'Спокойствие и расслабление 🕊️' },
  { key: 'growth', label: 'Саморазвитие и цели 🚀' },
  { key: 'feminine', label: 'Женская энергия 🌸' },
];

export default function Home() {
  const [category, setCategory] = useState(() => {
    try { return localStorage.getItem('selectedCategory') || 'love'; } catch { return 'love'; }
  });
  const [index, setIndex] = useState(0);
  const [data, setData] = useState(localAffirmations);
  const favorites = useAppStore((s) => s.favorites);
  const hidden = useAppStore((s) => s.hidden);
  const addFavorite = useAppStore((s) => s.addFavorite);
  const hideAffirmation = useAppStore((s) => s.hideAffirmation);
  const [queue, setQueue] = useState([]); // stable order of IDs for current category
  const [showPause, setShowPause] = useState(false);
  const [pauseLeft, setPauseLeft] = useState(30);
  const pauseTimerRef = useRef(null);
  const rapidRef = useRef({ lastAt: 0, streak: 0 });
  const [practiceIdx, setPracticeIdx] = useState(0);

  // Mindful practice variants for pause modal
  const practices = [
    {
      title: 'Ровное дыхание',
      text: 'Закройте глаза и мягко переведите внимание на дыхание. Сделайте медленный вдох на 4 счёта (вдох), задержите на 2, и плавно выдохните на 6 (выдох). На каждом выдохе отпускайте спешку и напряжение. Прочувствуйте смысл аффирмации и позвольте ей отозваться внутри — не умом, а телом.'
    },
    {
      title: 'Тихое повторение',
      text: 'Про себя трижды повторите ключевую фразу аффирмации в настоящем времени. На каждом повторении чуть замедляйтесь и отмечайте, как меняется ощущение в теле. Если мысль ускользает — мягко возвращайтесь к словам.'
    },
    {
      title: 'Сканирование тела',
      text: 'Мягко проведите вниманием от макушки до стоп. Заметьте, где есть напряжение, и на выдохе отпускайте эти места. Затем вновь вспомните аффирмацию и позвольте ей наполнить расслабленные области.'
    },
    {
      title: 'Образ и состояние',
      text: 'Представьте образ, который воплощает суть аффирмации. Что вы чувствуете в этом образе? Удержите это состояние несколько дыханий, слегка усиливая ощущение уверенности и спокойствия.'
    }
  ];

  // Restore previously viewed affirmation by ID once, when data becomes available
  const restoredRef = useRef(false);
  const storedIdRef = useRef(null);
  useEffect(() => {
    try { storedIdRef.current = localStorage.getItem('currentAffirmationId') || null; } catch { storedIdRef.current = null; }
  }, []);

  useEffect(() => {
    let mounted = true;
    loadAffirmations().then((remote) => {
      if (mounted && remote) setData(remote);
    });
    return () => { mounted = false; };
  }, []);

  const list = data[category] || [];
  const visible = useMemo(() => list.filter((i) => !hidden.includes(i.id)), [list, hidden]);
  // Build ordered visible list based on queue of IDs
  const orderedVisible = useMemo(() => {
    if (!visible.length) return [];
    const setIds = new Set(visible.map((v) => v.id));
    const fromQueue = queue.filter((id) => setIds.has(id));
    const missing = visible.map((v) => v.id).filter((id) => !fromQueue.includes(id));
    const order = [...fromQueue, ...missing];
    // map to items
    const byId = new Map(visible.map((v) => [v.id, v]));
    return order.map((id) => byId.get(id)).filter(Boolean);
  }, [visible, queue]);
  const current = orderedVisible[index] || orderedVisible[0];

  // Apply saved selectedCategory whenever it changes
  useEffect(() => {
    try { localStorage.setItem('selectedCategory', category); } catch {}
  }, [category]);

  // Save current affirmation ID on change
  useEffect(() => {
    if (current?.id) {
      try { localStorage.setItem('currentAffirmationId', current.id); } catch {}
    }
  }, [current?.id]);

  // Track view counters: increment when current changes
  useEffect(() => {
    if (!current?.id) return;
    try {
      const raw = localStorage.getItem('views');
      const map = raw ? JSON.parse(raw) : {};
      const prev = map[current.id] || { count: 0, lastViewedAt: 0 };
      const now = Date.now();
      map[current.id] = { count: (prev.count || 0) + 1, lastViewedAt: now };
      localStorage.setItem('views', JSON.stringify(map));
    } catch {}
  }, [current?.id]);

  // After visible list is ready, restore queue and last index
  useEffect(() => {
    if (restoredRef.current) return;
    const storedId = storedIdRef.current;
    // Initialize queue from storage per category or from current visible order
    try {
      const raw = localStorage.getItem(`queue:${category}`);
      let storedQueue = Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : null;
      if (!storedQueue) throw new Error('no queue');
      setQueue(() => {
        // sanitize to current visible set and append missing at end in natural order
        const idsSet = new Set(visible.map((v) => v.id));
        const base = storedQueue.filter((id) => idsSet.has(id));
        const missing = visible.map((v) => v.id).filter((id) => !base.includes(id));
        return [...base, ...missing];
      });
    } catch {
      // no stored queue: initialize from visible natural order
      setQueue(visible.map((v) => v.id));
    }
    // Restore lastIndex if present
    try {
      const rawIdx = localStorage.getItem(`lastIndex:${category}`);
      const parsed = rawIdx != null ? parseInt(rawIdx, 10) : 0;
      if (!Number.isNaN(parsed)) setIndex(Math.max(0, parsed)); else setIndex(0);
    } catch { setIndex(0); }
    restoredRef.current = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible.length, category]);

  // Keep queue in sync when visible set changes (hidden toggled or data updates)
  useEffect(() => {
    if (!visible.length) { setQueue([]); return; }
    setQueue((q) => {
      const idsSet = new Set(visible.map((v) => v.id));
      const base = q.filter((id) => idsSet.has(id));
      const missing = visible.map((v) => v.id).filter((id) => !base.includes(id));
      return [...base, ...missing];
    });
  }, [visible.map((v) => v.id).join('|')]);

  // Persist queue per category
  useEffect(() => {
    try { localStorage.setItem(`queue:${category}`, JSON.stringify(queue)); } catch {}
  }, [queue, category]);

  // Persist last viewed index per category
  useEffect(() => {
    try { localStorage.setItem(`lastIndex:${category}`, String(index)); } catch {}
  }, [index, category]);

  const onNext = () => {
    if (!orderedVisible.length || !current) return;
    // Anti-binge guard: detect too frequent clicks
    const now = Date.now();
    const since = now - (rapidRef.current.lastAt || 0);
    if (since < 3000) {
      rapidRef.current.streak = (rapidRef.current.streak || 0) + 1;
    } else {
      rapidRef.current.streak = 0;
    }
    rapidRef.current.lastAt = now;
    if (rapidRef.current.streak >= 2) { // 3 быстрых клика подряд
      if (!showPause) {
        setShowPause(true);
        setPauseLeft(30);
        setPracticeIdx((i) => (i + 1) % practices.length);
        if (pauseTimerRef.current) clearInterval(pauseTimerRef.current);
        pauseTimerRef.current = setInterval(() => {
          setPauseLeft((s) => {
            if (s <= 1) {
              clearInterval(pauseTimerRef.current);
              pauseTimerRef.current = null;
              setShowPause(false);
              rapidRef.current.streak = 0;
              return 0;
            }
            return s - 1;
          });
        }, 1000);
      }
      return; // block advancing during pause
    }

    // Move to next item by index, without rotating order
    setIndex((i) => (i + 1) % orderedVisible.length);
  };

  const onSelectCategory = (key) => {
    setCategory(key);
    setIndex(0);
  };

  const onFavorite = () => {
    if (!current) return;
    const exists = favorites.some((x) => x.id === current.id);
    if (!exists) addFavorite({ ...current, category });
  };

  const onHide = () => {
    if (!current) return;
    hideAffirmation(current.id);
    // удалим из очереди, оставив индекс — следующая встанет на его место
    setQueue((q) => q.filter((id) => id !== current.id));
  };

  const onResetOrder = () => {
    // Clear queue and last index for this category
    try {
      localStorage.removeItem(`queue:${category}`);
      localStorage.removeItem(`lastIndex:${category}`);
    } catch {}
    setQueue(visible.map((v) => v.id));
    setIndex(0);
  };

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Главная</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Выбери категорию аффирмаций:</p>
      <div className="chips" style={{ marginBottom: 16 }}>
        {categories.map((c) => (
          <button
            key={c.key}
            className="chip"
            onClick={() => onSelectCategory(c.key)}
            style={{ cursor: 'pointer', border: category === c.key ? '2px solid var(--accent)' : '1px solid var(--border)' }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {!visible.length ? (
        <div className="card placeholder" style={{ marginTop: 24 }}>
          <p>Все аффирмации категории скрыты. Сбросьте скрытые или выберите другую категорию.</p>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <AffirmationCard
            item={current}
            onNext={onNext}
            onFavorite={onFavorite}
            onHide={onHide}
            disabledNext={showPause}
          />
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="action action-secondary" onClick={onResetOrder} title="Сбросить порядок показа для этой категории">Сбросить порядок</button>
          </div>
        </div>
      )}

      {showPause && (
        <div aria-modal="true" role="dialog" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)' }}>
          <div className="card" style={{ width: 'min(560px, 92vw)', padding: 20 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Небольшая пауза осознанности</h2>
            <p className="muted" style={{ marginTop: 0 }}>Осталось: {pauseLeft} сек.</p>
            <div style={{ marginTop: 12, padding: 12, border: '1px dashed var(--border)', borderRadius: 10, background: 'var(--elev)' }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>Практика • {practices[practiceIdx]?.title}</div>
              <p style={{ margin: 0, color: 'var(--text)' }}>{practices[practiceIdx]?.text}</p>
            </div>
            <div className="actions" style={{ marginTop: 14 }}>
              <button
                className="action action-primary"
                disabled={pauseLeft > 0}
                onClick={() => { if (pauseLeft <= 0) setShowPause(false); }}
                title={pauseLeft > 0 ? 'Подождите окончания таймера' : 'Продолжить' }
              >
                {pauseLeft > 0 ? 'Подождите…' : 'Я готов(а), продолжить осознанно'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
