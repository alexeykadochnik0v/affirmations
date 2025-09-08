// Страница с категориями и карточкой аффирмации
import { useEffect, useMemo, useRef, useState } from 'react';
import AffirmationCard from '../components/AffirmationCard';
import { affirmations as localAffirmations } from '../data/affirmations';
import { loadAffirmations } from '../data/loadAffirmations';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../auth/AuthProvider';
import { addFavoriteRemote, removeFavoriteRemote, addHiddenRemote, watchUserRole } from '../services/userData';
import { listPublishedByCategory, createAndPublish, createPending, listMy, addMy } from '../services/affirmations';
import { generateAffirmation, getOpenAIApiKey, setOpenAIApiKey, getDailyUsed, incDailyUsed } from '../services/ai';

const categories = [
  { key: 'love', labelShort: 'Любовь ❤️', labelLong: 'Любовь и отношения ❤️' },
  { key: 'money', labelShort: 'Деньги 💰', labelLong: 'Деньги и изобилие 💰' },
  { key: 'health', labelShort: 'Здоровье 🌿', labelLong: 'Здоровье и гармония 🌿' },
  { key: 'confidence', labelShort: 'Уверенность 💪', labelLong: 'Уверенность и сила 💪' },
  { key: 'calm', labelShort: 'Спокойствие 🕊️', labelLong: 'Спокойствие и расслабление 🕊️' },
  { key: 'growth', labelShort: 'Саморазвитие 🚀', labelLong: 'Саморазвитие и цели 🚀' },
  { key: 'feminine', labelShort: 'Женственность 🌸', labelLong: 'Женская энергия 🌸' },
];

export default function Home() {
  const { user } = useAuth();
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
  // AI modal state
  const [showAi, setShowAi] = useState(false);
  const [aiCategory, setAiCategory] = useState(() => {
    try { return localStorage.getItem('ai:category') || 'love'; } catch { return 'love'; }
  });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [notice, setNotice] = useState('');
  const [sentPublicIds, setSentPublicIds] = useState([]); // ids from "Мои", уже отправленные на модерацию
  const DAILY_LIMIT = 3;
  const usedToday = getDailyUsed();
  const [role, setRole] = useState(null); // { role: 'pro' | 'admin' | 'user' } | null
  const isUnlimited = role?.role === 'pro' || role?.role === 'admin';

  useEffect(() => {
    if (!user?.uid) { setRole(null); return; }
    const unsub = watchUserRole(user.uid, (r)=> setRole(r));
    return () => { try { unsub && unsub(); } catch {} };
  }, [user?.uid]);

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
    // 1) если вкладка "Мои" — грузим персональные
    (async () => {
      try {
        if (category === 'my' && user?.uid) {
          const { items } = await listMy(user.uid, 200);
          if (mounted) {
            const normalized = items.map((it) => ({ id: it.id, text: it.text || '', practice: it.practice || '', explanation: it.meaning || '' }));
            setData((prev) => ({ ...prev, my: normalized }));
          }
          return;
        } else if (category !== 'my') {
          const { items } = await listPublishedByCategory(category, 200);
          if (mounted && items && items.length) {
            const normalized = items.map((it) => ({ id: it.id, text: it.text || '', practice: it.practice || '', explanation: it.meaning || it.explanation || '' }));
            setData((prev) => ({ ...prev, [category]: normalized }));
            return;
          }
        }
      } catch {}
      // 2) иначе — загрузим JSON (глобально), он уже распределён по категориям
      try {
        const remote = await loadAffirmations();
        if (mounted && remote) setData(remote);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [category, user?.uid]);

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

  // Отправить текущую персональную аффирмацию в общий список (на модерацию)
  const onSubmitPublic = async () => {
    if (category !== 'my' || !current || !user?.uid) return;
    try {
      // нормализуем заголовок из текущего элемента
      const toWords = (s) => (s || '').toString().trim().split(/\s+/).filter(Boolean);
      const clampWords = (arr, n=6) => arr.slice(0, n).join(' ');
      const titleSource = (current.title || current.text || '').toString();
      const words = toWords(titleSource);
      const titleNorm = words.length ? (words.length>6 ? clampWords(words,6)+'…' : words.join(' ')) : 'Аффирмация';
      await createPending({
        category: aiCategory || category,
        title: titleNorm,
        text: current.text,
        meaning: current.explanation,
        practice: current.practice,
        createdBy: user.uid,
      });
      setSentPublicIds((prev) => prev.includes(current.id) ? prev : [...prev, current.id]);
      setNotice('Отправлено на модерацию. После одобрения появится в общей ленте.');
      setTimeout(()=> setNotice(''), 3000);
    } catch (e) {
      setAiError(e?.message || 'Не удалось отправить на модерацию');
    }
  };

  const onOpenAi = () => { setShowAi(true); setAiError(''); };
  const onCreateAi = async () => {
    setAiError('');
    if (!aiPrompt.trim()) { setAiError('Опишите, о чём именно нужна аффирмация.'); return; }
    if (!user?.uid) { setAiError('Войдите в аккаунт, чтобы создать свою аффирмацию.'); return; }
    // лимит в сутки
    if (!isUnlimited && getDailyUsed() >= DAILY_LIMIT) { setAiError('Лимит на сегодня исчерпан. Возвращайтесь завтра ✨'); return; }
    const key = getOpenAIApiKey(); // может быть пустым, если настроен прокси
    setAiLoading(true);
    try {
      // 1) запрос к модели
      const gen = await generateAffirmation({ apiKey: key, category: aiCategory, prompt: aiPrompt });
      // Нормализуем заголовок: максимум 6 слов, иначе возьмём из текста
      const toWords = (s) => (s || '').toString().trim().split(/\s+/).filter(Boolean);
      const clampWords = (arr, n=6) => arr.slice(0, n).join(' ');
      const titleRaw = (gen.title || '').trim();
      const titleNorm = (() => {
        const words = toWords(titleRaw);
        if (words.length === 0) return clampWords(toWords(gen.text || ''), 6);
        if (words.length > 6) return clampWords(words, 6) + '…';
        return words.join(' ');
      })();
      // 2) Всегда сохраняем в личные "Мои"
      const mine = await addMy(user.uid, {
        category: aiCategory,
        title: titleNorm,
        text: gen.text,
        meaning: gen.explanation,
        practice: gen.practice,
      });
      // Добавим в локальные данные раздела "Мои" и покажем сразу
      setData((prev) => {
        const list = prev.my || [];
        const next = [{ id: mine.id, title: mine.title, text: mine.text, practice: mine.practice, explanation: mine.meaning }, ...list];
        return { ...prev, my: next };
      });
      setCategory('my');
      setQueue((q)=> [mine.id, ...q.filter((id)=> id !== mine.id)]);
      setIndex(0);
      // сохранить выбор категории для модалки
      try { localStorage.setItem('ai:category', aiCategory); } catch {}
      // 4) закрыть модалку и очистить ошибки
      setShowAi(false);
      if (!isUnlimited) incDailyUsed();
    } catch (e) {
      setAiError(e?.message || 'Ошибка генерации');
    } finally {
      setAiLoading(false);
    }
  };

  const onSelectCategory = (key) => {
    setCategory(key);
    setIndex(0);
  };

  const onFavorite = () => {
    if (!current) return;
    const exists = favorites.some((x) => x.id === current.id);
    if (exists) {
      useAppStore.getState().removeFavorite(current.id);
      if (user) { removeFavoriteRemote(user.uid, current.id).catch(() => {}); }
    } else {
      addFavorite({ ...current, category });
      if (user) { addFavoriteRemote(user.uid, { ...current, category }).catch(() => {}); }
    }
  };

  const onHide = () => {
    if (!current) return;
    hideAffirmation(current.id);
    if (user) { addHiddenRemote(user.uid, current.id, category).catch(() => {}); }
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
            className={`chip ${category === c.key ? 'active' : ''}`}
            onClick={() => onSelectCategory(c.key)}
            style={{ cursor: 'pointer' }}
          >
            {c.labelShort}
            {category === c.key && <span className="chip-dot" aria-hidden="true" />}
          </button>
        ))}
        {user?.uid && (
          <button
            key="my"
            className={`chip ${category === 'my' ? 'active' : ''}`}
            onClick={() => onSelectCategory('my')}
            style={{ cursor: 'pointer' }}
          >
            Мои ✨
            {category === 'my' && <span className="chip-dot" aria-hidden="true" />}
          </button>
        )}

      {notice && (
        <div className="card" style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 70, background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div style={{ padding: '10px 14px' }}>{notice}</div>
        </div>
      )}
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
            onOpenAi={onOpenAi}
            disabledNext={showPause}
            categoryLabel={category === 'my' ? 'Мои аффирмации ✨' : (categories.find((x) => x.key === category) || {}).labelLong}
            onSubmitPublic={category === 'my' && isUnlimited ? onSubmitPublic : undefined}
            submitPublicDone={category === 'my' && current ? sentPublicIds.includes(current.id) : false}
            favorited={!!(current && favorites.some((x) => x.id === current.id))}
          />
          <div className="actions" style={{ marginTop: 12, justifyContent: 'flex-start' }}>
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

      {showAi && (
        <div aria-modal="true" role="dialog" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.45)' }}>
          <div className="card ai-modal" style={{ width: 'min(720px, 96vw)', padding: 20 }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Создать аффирмацию на свою тему</h2>
            <p className="muted" style={{ marginTop: 0 }}>Шаг 1. Выберите категорию • Шаг 2. Опишите запрос • Шаг 3. Создайте</p>
            <div className="form-row">
              <label className="section-title">Категория</label>
              <div className="chips">
                {categories.map((c) => (
                  <button key={c.key} className={`chip chip-compact ${aiCategory===c.key?'active':''}`} onClick={()=>setAiCategory(c.key)}>{c.labelShort}</button>
                ))}
              </div>
            </div>
            <div className="form-row">
              <label className="section-title">Ваш запрос</label>
              <textarea
                className="form-input ai-textarea"
                rows={8}
                style={{ resize: 'vertical', minHeight: 140, fontSize: 15.5, lineHeight: 1.55, padding: '14px 16px' }}
                value={aiPrompt}
                onChange={(e)=>setAiPrompt(e.target.value)}
                placeholder={`Опишите контекст, желаемое состояние и стиль. Например: «Аффирмация про уверенность в создании сайтов как фрилансер — меньше сомнений, больше фокуса и радости от процесса».`}
              />
              <div className="muted" style={{ fontSize: 12 }}>
                Подсказка: напишите контекст (что происходит), желаемое состояние (что хотите чувствовать/делать), и ограничения (без токсичной позитивности, современный язык).
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12 }}>
              {user?.uid ? (
                isUnlimited ? 'У вас расширенный аккаунт (PRO/ADMIN): без лимитов ✨' : `Доступно сегодня: ${Math.max(0, DAILY_LIMIT - usedToday)} из ${DAILY_LIMIT}`
              ) : 'Войдите, чтобы создавать свои аффирмации'}
            </div>
            {aiError ? <div className="card" style={{ border: '1px solid #fecaca', background: '#fff1f2', color: '#7f1d1d' }}>{aiError}</div> : null}
            {aiLoading && (
              <div className="card" style={{ marginTop: 8, padding: 12, background: 'var(--elev)', border: '1px dashed var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Создаём вашу аффирмацию…</div>
                <div style={{ height: 8, background: 'var(--surface)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #b3e5fc 0%, #81d4fa 50%, #b3e5fc 100%)', backgroundSize: '200% 100%', animation: 'shine 1.2s infinite linear' }} />
                </div>
              </div>
            )}
            <div className="actions" style={{ marginTop: 12, justifyContent: 'flex-end', gap: 8 }}>
              <button className="action action-secondary" onClick={()=>{ setShowAi(false); }}>Отмена</button>
              <button className="action action-primary" onClick={onCreateAi} disabled={aiLoading || !user?.uid || (!isUnlimited && usedToday >= DAILY_LIMIT)}>{aiLoading ? 'Создаём…' : 'Создать'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
