import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export default function Favorites() {
  const favorites = useAppStore((s) => s.favorites);
  const removeFavorite = useAppStore((s) => s.removeFavorite);

  // Placeholder for future sorting options; default: by addedAt desc if present
  const [sort, setSort] = useState('new'); // 'new' | 'old' | 'text'
  const [query, setQuery] = useState(() => {
    try { return localStorage.getItem('favSearchQuery') || ''; } catch { return ''; }
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return favorites;
    return favorites.filter((f) =>
      (f.text || '').toLowerCase().includes(q) || (f.practice || '').toLowerCase().includes(q)
    );
  }, [favorites, query]);

  const list = useMemo(() => {
    const arr = [...filtered];
    if (sort === 'text') return arr.sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    if (sort === 'old') return arr.sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
    return arr.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  }, [filtered, sort]);

  return (
    <div>
      <h1 style={{ marginBottom: 16 }}>Избранное</h1>

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

          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Сортировка</div>
            <div className="actions">
              <button className={`action action-secondary${sort === 'new' ? '' : ''}`} onClick={() => setSort('new')} title="Сначала новые">Сначала новые</button>
              <button className="action action-secondary" onClick={() => setSort('old')} title="Сначала старые">Сначала старые</button>
              <button className="action action-secondary" onClick={() => setSort('text')} title="По алфавиту">По алфавиту</button>
            </div>
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
                <article key={`${item.id}`} className="card" style={{ overflow: 'hidden' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: 18, lineHeight: 1.35 }}>{item.text}</h3>
                  {item.practice ? (
                    <p style={{ margin: 0, color: 'var(--muted)' }}>{item.practice}</p>
                  ) : null}
                  <div className="actions" style={{ marginTop: 12 }}>
                    <button className="action action-secondary" onClick={() => removeFavorite(item.id)} title="Убрать из избранного">Убрать</button>
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
