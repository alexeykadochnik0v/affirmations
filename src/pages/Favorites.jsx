import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { affirmations as localAffirmations } from '../data/affirmations';
import { loadAffirmations } from '../data/loadAffirmations';
import { useAuth } from '../auth/AuthProvider';
import { removeFavoriteRemote } from '../services/userData';

export default function Favorites() {
  const favorites = useAppStore((s) => s.favorites);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const { user } = useAuth();

  // load dataset so we can enrich items by id
  const [data, setData] = useState(localAffirmations);
  useEffect(() => {
    let mounted = true;
    loadAffirmations().then((remote) => { if (mounted && remote) setData(remote); });
    return () => { mounted = false; };
  }, []);

  // Build quick lookup map by id across all categories
  const byId = useMemo(() => {
    const map = new Map();
    Object.values(data || {}).forEach((arr) => {
      (arr || []).forEach((item) => { map.set(item.id, item); });
    });
    return map;
  }, [data]);

  // Placeholder for future sorting options; default: by addedAt desc if present
  const [sort, setSort] = useState('new'); // 'new' | 'old' | 'text'
  const [query, setQuery] = useState(() => {
    try { return localStorage.getItem('favSearchQuery') || ''; } catch { return ''; }
  });
  const [cat, setCat] = useState('all'); // category filter

  // Join favorites with dataset (text/practice) for render and search
  const enriched = useMemo(() => favorites.map((f) => ({ ...byId.get(f.id), ...f })), [favorites, byId]);

  // Build decoding text ("расшифровка") if not provided in dataset
  const decoding = (item) => {
    if (!item) return '';
    const provided = item['расшифровка'];
    if (provided && String(provided).trim()) return provided;
    const t = item.text || '';
    const p = item.practice || '';
    if (!t && !p) return '';
    const practicePart = p ? ` Практика закрепляет смысл через конкретный шаг: ${p}` : '';
    return `Аффирмация помогает перестраивать внутренний диалог и ежедневно выбирать действия в пользу заявленного намерения: «${t}».${practicePart}`;
  };


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = cat === 'all' ? enriched : enriched.filter((f) => (f.category || f.categoryKey) === cat);
    if (!q) return base;
    return base.filter((f) =>
      (f.text || '').toLowerCase().includes(q)
      || (f.practice || '').toLowerCase().includes(q)
      || (decoding(f).toLowerCase().includes(q))
    );
  }, [enriched, query, cat]);

  const list = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'text') return arr.sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    if (sort === 'old') return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }, [filtered, sort]);

  // Category counters for chips
  const counters = useMemo(() => {
    const map = { all: favorites.length };
    for (const f of favorites) {
      const k = (f.category || f.categoryKey) || 'other';
      map[k] = (map[k] || 0) + 1;
    }
    return map;
  }, [favorites]);

  return (
    <div>
      {/* Hero */}
      <div className="favorites-hero">
        <div className="favorites-hero-bg" aria-hidden="true" />
        <h1 style={{ marginBottom: 4 }}>Избранное</h1>
        <p className="muted" style={{ margin: 0 }}>Ваши сохранённые аффирмации и практики • {list.length}/{favorites.length}</p>
      </div>

      <div className="fav-layout">
        <aside className="sidebar">
          <div className="card" style={{ marginBottom: 12 }}>
            <label htmlFor="fav-search" className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Поиск по тексту</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                id="fav-search"
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  try { localStorage.setItem('favSearchQuery', e.target.value); } catch {}
                }}
                placeholder="Например: благодарю, деньги, любовь..."
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--elev)',
                  color: 'var(--text)'
                }}
              />
              {query ? (
                <button className="action action-secondary" onClick={() => { setQuery(''); try { localStorage.removeItem('favSearchQuery'); } catch {} }} title="Очистить поиск">Очистить</button>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Категории</div>
            <div className="chips">
              {['all','love','money','health','confidence','calm','growth','feminine'].map((k) => (
                <button
                  key={k}
                  className={`chip ${cat === k ? 'active' : ''}`}
                  onClick={() => setCat(k)}
                  title={k === 'all' ? 'Все' : k}
                >
                  {labelByCat(k)}{typeof counters[k] === 'number' ? ` · ${counters[k]}` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Сортировка</div>
            <div className="sort-list" role="tablist" aria-label="Сортировка">
              <button className={`sort-item${sort === 'new' ? ' active' : ''}`} onClick={() => setSort('new')}>Новые</button>
              <button className={`sort-item${sort === 'old' ? ' active' : ''}`} onClick={() => setSort('old')}>Старые</button>
              <button className={`sort-item${sort === 'text' ? ' active' : ''}`} onClick={() => setSort('text')}>По алфавиту</button>
            </div>
            {(cat !== 'all' || query) && (
              <div className="actions" style={{ marginTop: 10 }}>
                <button className="action action-secondary" onClick={() => { setCat('all'); setQuery(''); }}>Сбросить фильтры</button>
              </div>
            )}
          </div>
        </aside>

        <section className="content">
          {favorites.length === 0 ? (
            <div className="card placeholder" style={{ marginTop: 0 }}>
              <p>Пока нет сохранённых аффирмаций. Добавляйте их через кнопку «В избранное» на карточке.</p>
            </div>
          ) : list.length === 0 ? (
            <div className="card placeholder" style={{ marginTop: 0 }}>
              <p>По запросу ничего не найдено.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              {list.map((item) => (
                <article key={`${item.id}`} className="card fav-card" data-cat={(item.category || item.categoryKey) || ''} style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, lineHeight: 1.35 }}>{item.text}</h3>
                  {item.practice ? (
                    <p style={{ margin: 0, color: 'var(--muted)' }}>{item.practice}</p>
                  ) : null}
                  {decoding(item) ? (
                    <p style={{ margin: '8px 0 0 0', color: 'var(--text)' }}>{decoding(item)}</p>
                  ) : null}
                  
                  <div className="actions" style={{ marginTop: 12 }}>
                    <button
                      className="action action-secondary"
                      onClick={() => {
                        removeFavorite(item.id);
                        if (user) removeFavoriteRemote(user.uid, item.id).catch(() => {});
                      }}
                      title="Убрать из избранного"
                    >
                      Убрать
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function labelByCat(k) {
  const map = {
    all: 'Все',
    love: 'Любовь ❤️',
    money: 'Деньги 💰',
    health: 'Здоровье 🌿',
    confidence: 'Уверенность 💪',
    calm: 'Спокойствие 🕊️',
    growth: 'Саморазвитие 🚀',
    feminine: 'Женственность 🌸',
  };
  return map[k] || k;
}
