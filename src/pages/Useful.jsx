import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { articles as seed } from '../data/articles';

const allTags = Array.from(new Set(seed.flatMap((a) => a.tags))).sort((a,b)=>a.localeCompare(b));
const fmtDate = (ts) => {
  try { return new Date(ts).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; }
};
const readMinutes = (a) => {
  const text = [a.summary, ...(a.content||[])].join(' ');
  const words = (text.match(/\S+/g) || []).length;
  const min = Math.max(1, Math.round(words / 180)); // ~180 wpm
  return `${min} мин чтения`;
};

export default function Useful() {
  const [query, setQuery] = useState(() => { try { return localStorage.getItem('useful:q') || ''; } catch { return ''; } });
  const [tag, setTag] = useState(() => { try { return localStorage.getItem('useful:tag') || 'all'; } catch { return 'all'; } });
  const [sort, setSort] = useState(() => { try { return localStorage.getItem('useful:sort') || 'new'; } catch { return 'new'; } }); // new | old | rand
  const [randKey, setRandKey] = useState(0); // to reshuffle on demand
  const [limit, setLimit] = useState(6);

  // persist filters
  useEffect(() => { try { localStorage.setItem('useful:q', query); } catch {} }, [query]);
  useEffect(() => { try { localStorage.setItem('useful:tag', tag); } catch {} }, [tag]);
  useEffect(() => { try { localStorage.setItem('useful:sort', sort); } catch {} }, [sort]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = seed;
    if (tag !== 'all') base = base.filter((a) => (a.tags || []).includes(tag));
    if (q) {
      base = base.filter((a) =>
        (a.title || '').toLowerCase().includes(q)
        || (a.summary || '').toLowerCase().includes(q)
        || (a.content || []).some((p) => (p || '').toLowerCase().includes(q))
      );
    }
    if (sort === 'text') {
      base = [...base].sort((a,b)=> (a.title||'').localeCompare(b.title||''));
    } else if (sort === 'old') {
      base = [...base].sort((a,b)=> (a.createdAt||0) - (b.createdAt||0));
    } else if (sort === 'new') {
      base = [...base].sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    } else if (sort === 'rand') {
      // simple deterministic shuffle based on randKey
      const arr = [...base];
      let seedX = (randKey || 1) * 1103515245 + 12345;
      const rnd = () => { seedX = (seedX * 1664525 + 1013904223) >>> 0; return seedX / 0xffffffff; };
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      base = arr;
    }
    return base;
  }, [query, tag, sort, randKey]);

  const counters = useMemo(() => {
    const map = { all: seed.length };
    seed.forEach((a)=> (a.tags||[]).forEach((t)=> { map[t] = (map[t]||0)+1; }));
    return map;
  }, []);

  return (
    <div>
      {/* Hero */}
      <div className="favorites-hero useful-hero">
        <div className="favorites-hero-bg" aria-hidden="true" />
        <h1 style={{ marginBottom: 4 }}>Полезное</h1>
        <p className="muted" style={{ margin: 0 }}>Подборка статей и практик • {filtered.length}/{seed.length}</p>
      </div>

      <div className="fav-layout">
        <aside className="sidebar">
          <div className="card" style={{ marginBottom: 12 }}>
            <label htmlFor="u-search" className="muted" style={{ display: 'block', fontSize: 12, marginBottom: 6 }}>Поиск</label>
            <div className="input-wrap">
              <input
                id="u-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Название, идея, техника..."
                style={{
                  minWidth: 200,
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  background: 'var(--elev)',
                  color: 'var(--text)'
                }}
              />
              {query ? (
                <button className="input-clear" onClick={() => setQuery('')} title="Очистить" aria-label="Очистить поиск">×</button>
              ) : null}
            </div>
          </div>

          <div className="card" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Теги</div>
            <div className="chips">
              <button className={`chip ${tag==='all' ? 'active' : ''}`} onClick={()=> setTag('all')}>Все · {counters.all}</button>
              {allTags.map((t)=> (
                <button key={t} className={`chip ${tag===t ? 'active' : ''}`} onClick={()=> setTag(t)}>{t} · {counters[t]||0}</button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Сортировка</div>
            <div className="sort-list" role="tablist" aria-label="Сортировка">
              <button className={`sort-item${sort === 'new' ? ' active' : ''}`} onClick={() => setSort('new')}>Сначала новые</button>
              <button className={`sort-item${sort === 'old' ? ' active' : ''}`} onClick={() => setSort('old')}>Сначала старые</button>
              <button className={`sort-item${sort === 'rand' ? ' active' : ''}`} onClick={() => { setSort('rand'); setRandKey((k)=>k+1); }}>Случайный порядок</button>
            </div>
          </div>
        </aside>

        <section className="content">
          {filtered.length === 0 ? (
            <div className="card placeholder" style={{ marginTop: 0 }}>
              <p>Ничего не найдено. Попробуйте изменить запрос или теги.</p>
            </div>
          ) : (
            <div className="articles-grid">
              {filtered.slice(0, limit).map((a) => (
                <article key={a.id} className="card article-card" style={{ overflow: 'hidden' }}>
                  {a.cover ? (
                    <img src={a.cover} alt="cover" className="article-cover" loading="lazy" />
                  ) : null}
                  <h3 className="article-title">{a.title}</h3>
                  <p className="muted article-summary">{a.summary}</p>
                  <div className="article-meta">
                    <span className="muted">{fmtDate(a.createdAt)}</span>
                    <span className="muted">•</span>
                    <span className="muted">{readMinutes(a)}</span>
                  </div>
                  <div className="article-tags">
                    {(a.tags||[]).map((t)=> (<span key={t} className="chip chip-compact">{t}</span>))}
                  </div>
                  <div className="actions" style={{ marginTop: 8 }}>
                    <Link className="action action-primary" to={`/useful/${a.id}`}>Открыть</Link>
                  </div>
                </article>
              ))}
              {limit < filtered.length && (
                <div className="actions" style={{ justifyContent: 'center', gridColumn: '1 / -1' }}>
                  <button className="action action-secondary" onClick={() => setLimit((n) => n + 6)}>Показать ещё</button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
