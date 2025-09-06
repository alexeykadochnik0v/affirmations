import { useMemo, useState } from 'react';
import { articles as seed } from '../../data/articles';

export default function ArticlesAdmin() {
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let base = seed;
    if (query) {
      base = base.filter((a) => (a.title || '').toLowerCase().includes(query) || (a.summary || '').toLowerCase().includes(query));
    }
    if (sort === 'new') return [...base].sort((a,b)=> (b.createdAt||0) - (a.createdAt||0));
    if (sort === 'old') return [...base].sort((a,b)=> (a.createdAt||0) - (b.createdAt||0));
    return base;
  }, [q, sort]);

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Статьи</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск по названию" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 10 }} />
          <select value={sort} onChange={(e)=>setSort(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 10 }}>
            <option value="new">Сначала новые</option>
            <option value="old">Сначала старые</option>
          </select>
          <button className="action action-primary" disabled title="Скоро">Создать черновик</button>
        </div>
      </div>

      <div className="admin-list">
        {filtered.map((a) => (
          <article key={a.id} className="card admin-item">
            {a.cover ? <img src={a.cover} alt="cover" className="admin-thumb" /> : <div className="admin-thumb" />}
            <div>
              <div style={{ fontWeight: 700 }}>{a.title}</div>
              <div className="muted" style={{ fontSize: 13 }}>{new Date(a.createdAt).toLocaleDateString('ru-RU')}</div>
            </div>
            <div className="actions">
              <button className="action action-secondary" disabled title="Скоро">Редактировать</button>
              <button className="action action-secondary" disabled title="Скоро">Опубликовать</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
