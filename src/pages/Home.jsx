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
  const current = visible[index] || visible[0];

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

  // After visible list is ready, try to restore index by stored ID once
  useEffect(() => {
    if (restoredRef.current) return;
    const storedId = storedIdRef.current;
    if (!storedId) { restoredRef.current = true; return; }
    const idx = visible.findIndex((i) => i.id === storedId);
    if (idx >= 0) setIndex(idx);
    restoredRef.current = true;
  }, [visible]);

  const onNext = () => {
    if (!visible.length) return;
    setIndex((i) => (i + 1) % visible.length);
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
    // сдвинемся к следующей
    setTimeout(onNext, 0);
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
          />
        </div>
      )}
    </div>
  );
}
