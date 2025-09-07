import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { listArticles, createArticleDraft, updateArticle, publishArticle, unpublishArticle, deleteArticle } from '../../services/articles';
import { articles as seed } from '../../data/articles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const allTags = ['саморазвитие','здоровье','осознанность','практика','навыки','спокойствие'];

export default function ArticlesAdmin() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('any'); // any|draft|published
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null); // item or null
  const [importAs, setImportAs] = useState('draft'); // 'draft' | 'published'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const ENV_CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const ENV_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const [cloudOverride, setCloudOverride] = useState(() => { try { return localStorage.getItem('cloud:cn') || ''; } catch { return ''; } });
  const [presetOverride, setPresetOverride] = useState(() => { try { return localStorage.getItem('cloud:preset') || ''; } catch { return ''; } });
  const CLOUDINARY_CLOUD = ENV_CLOUD || cloudOverride;
  const CLOUDINARY_PRESET = ENV_PRESET || presetOverride;
  const hasCloudinary = !!(CLOUDINARY_CLOUD && CLOUDINARY_PRESET);
  useEffect(() => { try { localStorage.setItem('cloud:cn', cloudOverride); } catch {} }, [cloudOverride]);
  useEffect(() => { try { localStorage.setItem('cloud:preset', presetOverride); } catch {} }, [presetOverride]);

  const load = async () => {
    const { items } = await listArticles({ status });
    setItems(items);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status]);

  const onCreate = () => { setEditing({ id: null, cover: '', title: '', summary: '', tags: [], content: [], contentMd: '', readMinutes: '' }); setOpen(true); };
  const onEdit = (it) => { setEditing({ ...it }); setOpen(true); };

  const filtered = useMemo(() => {
    let base = items;
    const query = q.trim().toLowerCase();
    if (query) base = base.filter(a => (a.title||'').toLowerCase().includes(query) || (a.summary||'').toLowerCase().includes(query));
    if (sort === 'old') return [...base].sort((a,b)=> (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
    return [...base].sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
  }, [items, q, sort]);

  const stats = useMemo(() => {
    const total = items.length;
    const drafts = items.filter(i=>i.status==='draft').length;
    const published = items.filter(i=>i.status==='published').length;
    const tagMap = new Map();
    items.forEach(a => (a.tags||[]).forEach(t => tagMap.set(t, (tagMap.get(t)||0)+1)));
    const topTags = Array.from(tagMap.entries()).sort((a,b)=> b[1]-a[1]).slice(0,5);
    return { total, drafts, published, topTags };
  }, [items]);

  const saveEditing = async () => {
    if (!editing) return;
    if (!editing.title?.trim()) { alert('Введите заголовок'); return; }
    if (editing.id) {
      await updateArticle(editing.id, { cover: editing.cover||'', title: editing.title||'', summary: editing.summary||'', tags: editing.tags||[], content: editing.content||[], contentMd: editing.contentMd||'', readMinutes: editing.readMinutes ? Number(editing.readMinutes) : null }, user?.uid);
    } else {
      const id = await createArticleDraft({ cover: editing.cover||'', title: editing.title||'', summary: editing.summary||'', tags: editing.tags||[], content: editing.content||[], contentMd: editing.contentMd||'', readMinutes: editing.readMinutes ? Number(editing.readMinutes) : null, createdBy: user?.uid });
      editing.id = id;
    }
    setOpen(false); setEditing(null); await load();
  };

  return (
    <div className="admin-aff">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="admin-filters">
          <div className="form-inline">
            <label className="section-title">Статус</label>
            <div className="chips">
              {[
                {v:'any', l:'любой'},
                {v:'draft', l:'черновик'},
                {v:'published', l:'опубликовано'},
              ].map(({v,l}) => (
                <button key={v} className={`chip chip-compact ${status===v?'active':''}`} onClick={()=>setStatus(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="form-inline" style={{ justifyContent: 'flex-end' }}>
            <input className="form-input" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Поиск по названию или описанию" />
            <select className="form-input" value={sort} onChange={(e)=>setSort(e.target.value)}>
              <option value="new">Сначала новые</option>
              <option value="old">Сначала старые</option>
            </select>
            <button className="action action-primary" onClick={onCreate}>Создать черновик</button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-inline" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="section-title">Всего: {stats.total} • Черновиков: {stats.drafts} • Опубликовано: {stats.published}</div>
          <div className="form-inline" style={{ gap: 6 }}>
            {stats.topTags.map(([t,c]) => (<span key={t} className="chip chip-compact">{t} · {c}</span>))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-row">
          <div className="section-title">Импорт из локальных статей (src/data/articles.js)</div>
          <div className="form-inline">
            <label className="section-title" style={{ margin: 0 }}>Статус импортируемых</label>
            <div className="chips">
              {[
                {v:'draft', l:'черновик'},
                {v:'published', l:'опубликовано'},
              ].map(({v,l}) => (
                <button key={v} className={`chip chip-compact ${importAs===v?'active':''}`} onClick={()=>setImportAs(v)}>{l}</button>
              ))}
            </div>
            <button className="action action-secondary" onClick={async()=>{
              try {
                if (!Array.isArray(seed) || seed.length === 0) { alert('Локальные статьи не найдены'); return; }
                for (const a of seed) {
                  const id = await createArticleDraft({
                    cover: a.cover || '',
                    title: a.title || '',
                    summary: a.summary || '',
                    tags: Array.isArray(a.tags) ? a.tags : [],
                    createdBy: user?.uid,
                  });
                  if (importAs === 'published') await publishArticle(id, user?.uid);
                }
                await load();
                alert('Импорт завершён');
              } catch (e) {
                alert('Ошибка импорта: ' + (e?.message || e));
              }
            }}>Импортировать</button>
          </div>
        </div>
      </div>

      <div className="admin-list">
        {filtered.map((a) => (
          <article key={a.id} className="list-item">
            {a.cover ? <img src={a.cover} alt="cover" className="article-cover" style={{ width: 120, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} /> : <div style={{ width: 120, height: 70, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)' }} />}
            <div>
              <div style={{ fontWeight: 700 }}>{a.title || 'Без названия'}</div>
              <div className="muted" style={{ fontSize: 13 }}>{a.createdAt ? new Date(a.createdAt.seconds * 1000).toLocaleString('ru-RU') : 'черновик'}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{(a.tags||[]).map(t=> <span key={t} className="chip chip-compact">{t}</span>)}</div>
            </div>
            <div className="actions" style={{ justifyContent: 'flex-end' }}>
              <button className="action action-secondary" onClick={()=>onEdit(a)}>Редактировать</button>
              <button className="action action-secondary" onClick={async()=>{ if (a.status==='published') await unpublishArticle(a.id, user?.uid); else await publishArticle(a.id, user?.uid); await load(); }}>
                {a.status==='published' ? 'Снять с публикации' : 'Опубликовать'}
              </button>
              <button className="action action-secondary" onClick={async()=>{ if (confirm('Удалить статью?')) { await deleteArticle(a.id); await load(); } }}>Удалить</button>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <div className="modal-backdrop" aria-modal="true" role="dialog" onClick={()=>{ setOpen(false); setEditing(null); }}>
          <div className="card" style={{ width: 'min(1024px, 96vw)' }} onClick={(e)=>e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>{editing?.id ? 'Редактировать статью' : 'Новая статья (черновик)'}</h3>
            <div className="modal-grid two-col" style={{ marginTop: 8 }}>
              {/* Левая колонка: форма */}
              <div className="form-row">
              <div className="form-inline" style={{ alignItems: 'stretch' }}>
                <input className="form-input" placeholder="Ссылка на картинку (cover)" value={editing?.cover||''} onChange={(e)=>setEditing((s)=>({...s, cover: e.target.value}))} />
                <label className={`action action-secondary ${!hasCloudinary ? 'disabled' : ''}`} style={{ display: 'inline-flex', alignItems: 'center', cursor: hasCloudinary ? 'pointer' : 'not-allowed', opacity: hasCloudinary ? 1 : 0.6 }} title={hasCloudinary ? 'Загрузить файл в Cloudinary' : 'Заполните VITE_CLOUDINARY_* в .env и перезапустите dev-сервер'}>
                  Загрузить (Cloudinary)
                  <input type="file" accept="image/*" style={{ display: 'none' }} disabled={!hasCloudinary} onChange={async (e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        setUploadProgress(1);
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('upload_preset', CLOUDINARY_PRESET);
                        const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
                          method: 'POST',
                          body: fd,
                        });
                        if (!resp.ok) throw new Error('Cloudinary upload failed');
                        const data = await resp.json();
                        const url = data.secure_url || data.url;
                        if (!url) throw new Error('Нет URL от Cloudinary');
                        setEditing((s)=> ({...s, cover: url}));
                        setUploadProgress(100);
                      } catch (err) {
                        alert('Ошибка загрузки в Cloudinary: ' + (err?.message || err));
                        setUploadProgress(0);
                      }
                    }} />
                </label>
              </div>
              {uploadProgress>0 && uploadProgress<100 ? (<div className="muted" style={{ fontSize: 12 }}>Загрузка: {uploadProgress}%</div>) : null}
              <div className="muted" style={{ fontSize: 12 }}>
                Cloudinary: {hasCloudinary ? 'готов' : 'не настроен'} (используем cloud="{CLOUDINARY_CLOUD||'-'}", preset="{CLOUDINARY_PRESET||'-'}")
              </div>
              {!ENV_CLOUD || !ENV_PRESET ? (
                <div className="form-inline" style={{ gap: 6 }}>
                  <input className="form-input" placeholder="Cloud name" style={{ width: 180 }} value={cloudOverride} onChange={(e)=>setCloudOverride(e.target.value)} />
                  <input className="form-input" placeholder="Upload preset" style={{ width: 200 }} value={presetOverride} onChange={(e)=>setPresetOverride(e.target.value)} />
                </div>
              ) : null}
              {editing?.cover ? <img src={editing.cover} alt="preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }} /> : null}
              <input className="form-input" placeholder="Название" value={editing?.title||''} onChange={(e)=>setEditing((s)=>({...s, title: e.target.value}))} />
              <textarea className="form-input" placeholder="Описание (summary)" rows={3} value={editing?.summary||''} onChange={(e)=>setEditing((s)=>({...s, summary: e.target.value}))} />
              <div className="form-inline">
                <label className="section-title">Время чтения (мин)</label>
                <input className="form-input" type="number" min="1" step="1" placeholder="например, 3" style={{ width: 120 }} value={editing?.readMinutes||''}
                  onChange={(e)=> setEditing((s)=> ({...s, readMinutes: e.target.value}))} />
              </div>
              <div className="form-inline">
                <label className="section-title">Теги</label>
                <div className="tags-row">
                  {allTags.map(t => (
                    <button key={t} className={`chip chip-compact ${(editing?.tags||[]).includes(t) ? 'active' : ''}`} onClick={()=> setEditing((s)=> ({...s, tags: (s.tags||[]).includes(t) ? (s.tags||[]).filter(x=>x!==t) : [...(s.tags||[]), t]}))}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <label className="section-title">Текст статьи (Markdown)</label>
                <textarea className="form-input" rows={10} placeholder="Поддержка: заголовки, списки, таблицы (GFM), ссылки, изображения" value={editing?.contentMd||''}
                  onChange={(e)=> setEditing((s)=> ({...s, contentMd: e.target.value}))} />
              </div>
              </div>

              {/* Правая колонка: предпросмотр markdown */}
              <div className="form-row">
                <div className="form-inline" style={{ justifyContent: 'space-between', marginTop: 4 }}>
                  <span className="muted" style={{ fontSize: 12 }}>Предпросмотр текста</span>
                  <label className="muted" style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="checkbox" checked={showPreview} onChange={(e)=>setShowPreview(e.target.checked)} /> Показать
                  </label>
                </div>
                {showPreview && (
                  <div className="card" style={{ background: 'var(--surface)', border: '1px dashed var(--border)', maxHeight: 520, overflow: 'auto' }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{editing?.contentMd||''}</ReactMarkdown>
                  </div>
                )}
              </div>
            {/* Предпросмотр карточки (внизу) */}
            <div className="card" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
              {editing?.cover ? (
                <img src={editing.cover} alt="cover" className="article-cover" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
              ) : null}
              <div style={{ fontWeight: 700, marginBottom: 6 }}>{editing?.title || 'Без названия'}</div>
              {editing?.summary ? (<p className="muted" style={{ marginTop: 0 }}>{editing.summary}</p>) : null}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>{(editing?.tags||[]).map(t=> <span key={t} className="chip chip-compact">{t}</span>)}</div>
            </div>
            </div>
            <div className="actions" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="action action-secondary" onClick={()=>{ setOpen(false); setEditing(null); }}>Отмена</button>
              <button className="action action-primary" onClick={saveEditing}>Сохранить</button>
            </div>
            <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>Дата и время создаются автоматически при сохранении (serverTimestamp).</p>
          </div>
        </div>
      )}
    </div>
  );
}
