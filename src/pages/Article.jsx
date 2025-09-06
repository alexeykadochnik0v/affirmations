import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articles as seed } from '../data/articles';

const fmtDate = (ts) => {
  try { return new Date(ts).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' }); } catch { return ''; }
};
const readMinutes = (a) => {
  const text = [a.summary, ...(a.content||[])].join(' ');
  const words = (text.match(/\S+/g) || []).length;
  const min = Math.max(1, Math.round(words / 180));
  return `${min} мин чтения`;
};

export default function Article() {
  const { id } = useParams();
  const article = useMemo(() => seed.find((x) => x.id === id), [id]);

  if (!article) {
    return (
      <div>
        <div className="favorites-hero">
          <div className="favorites-hero-bg" aria-hidden="true" />
          <h1 style={{ marginBottom: 4 }}>Статья не найдена</h1>
          <p className="muted" style={{ margin: 0 }}>Возможно, она была перемещена или удалена</p>
        </div>
        <div className="actions">
          <Link className="action action-primary" to="/useful">Вернуться в раздел «Полезное»</Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="favorites-hero">
        <div className="favorites-hero-bg" aria-hidden="true" />
        <h1 style={{ marginBottom: 4 }}>{article.title}</h1>
        <p className="muted" style={{ margin: 0 }}>{fmtDate(article.createdAt)} • {readMinutes(article)}</p>
      </div>

      <article className="card" style={{ overflow: 'hidden' }}>
        {article.cover ? (
          <img src={article.cover} alt="cover" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} loading="lazy" />
        ) : null}
        {article.summary ? (
          <p className="muted" style={{ marginTop: 0 }}>{article.summary}</p>
        ) : null}
        <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
          {(article.content || []).map((p, idx) => (
            <p key={idx} style={{ margin: 0, color: 'var(--text)' }}>{p}</p>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          {(article.tags||[]).map((t)=> (<span key={t} className="chip" style={{ padding: '4px 8px' }}>{t}</span>))}
        </div>
        <div className="actions" style={{ marginTop: 14 }}>
          <Link className="action action-secondary" to="/useful">Назад к списку</Link>
        </div>
      </article>
    </div>
  );
}
