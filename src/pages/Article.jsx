import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { articles as seed } from '../data/articles';
import { getArticleById } from '../services/articles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [article, setArticle] = useState(() => seed.find((x)=>x.id===id) || null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const a = await getArticleById(id);
        if (mounted && a) {
          setArticle({
            ...a,
            createdAt: a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt,
          });
          setLoading(false);
          return;
        }
      } catch {}
      if (mounted) {
        setArticle(seed.find((x)=>x.id===id) || null);
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

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
        {loading ? (
          <>
            <div className="skeleton skeleton-title" style={{ width: '60%', marginBottom: 8 }} />
            <div className="skeleton skeleton-text" style={{ width: 240 }} />
          </>
        ) : (
          <>
            <h1 style={{ marginBottom: 4 }}>{article.title}</h1>
            <p className="muted" style={{ margin: 0 }}>{fmtDate(article.createdAt)} • {readMinutes(article)}</p>
          </>
        )}
      </div>

      <article className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <>
            <div className="skeleton skeleton-thumb" />
            <div className="skeleton skeleton-text" style={{ marginTop: 12, width: '90%' }} />
            <div className="skeleton skeleton-text" style={{ marginTop: 6, width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ marginTop: 6, width: '70%' }} />
          </>
        ) : (
          <>
            {article.cover ? (
              <img src={article.cover} alt="cover" style={{ width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} loading="lazy" />
            ) : null}
            {article.summary ? (
              <p className="muted" style={{ marginTop: 0 }}>{article.summary}</p>
            ) : null}
            {article.contentMd ? (
              <div className="md" style={{ marginTop: 8 }}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.contentMd}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                {(article.content || []).map((p, idx) => (
                  <p key={idx} style={{ margin: 0, color: 'var(--text)' }}>{p}</p>
                ))}
              </div>
            )}
          </>
        )}
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
