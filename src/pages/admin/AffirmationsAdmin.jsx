import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { adminList, createDraft, publishItem, unpublishItem, updateItem, deleteItem } from '../../services/affirmations';

const cats = ['love','money','health','confidence','calm','growth','feminine'];

export default function AffirmationsAdmin() {
  const { user, isModerator } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('any');
  const [category, setCategory] = useState('any');
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [meaning, setMeaning] = useState('');
  const [practice, setPractice] = useState('');
  const [importAs, setImportAs] = useState('draft'); // 'draft' | 'published'

  const load = async () => {
    setLoading(true);
    try {
      const { items } = await adminList({ status, category });
      setItems(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, category]);

  const onCreate = async () => {
    if (!text.trim()) return;
    const id = await createDraft({ category: category === 'any' ? 'love' : category, text, meaning, practice, createdBy: user?.uid });
    setText(''); setMeaning(''); setPractice('');
    await load();
  };

  const onTogglePublish = async (it) => {
    if (it.status === 'published') await unpublishItem(it.id, user?.uid); else await publishItem(it.id, user?.uid);
    await load();
  };

  const onQuickSave = async (it, field, value) => {
    await updateItem(it.id, { [field]: value }, user?.uid);
  };

  return (
    <div className="admin-aff">
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="admin-filters">
          <div className="form-inline">
            <label className="section-title">Статус</label>
            <div className="chips">
              {['any','pending','draft','published'].map(s => (
                <button key={s} className={`chip chip-compact ${status===s?'active':''}`} onClick={()=>setStatus(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="form-inline">
            <label className="section-title">Категория</label>
            <div className="chips cats">
              {['any',...cats].map(c => (
                <button key={c} className={`chip chip-compact ${category===c?'active':''}`} onClick={()=>setCategory(c)}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-row">
          <div className="section-title">Создать черновик</div>
          <div className="form-row">
            <div className="form-inline">
              <select className="form-input" value={category==='any'?'love':category} onChange={(e)=>setCategory(e.target.value)}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="form-input" placeholder="Текст" value={text} onChange={(e)=>setText(e.target.value)} style={{ flex: 1, minWidth: 220 }} />
            </div>
            <textarea className="form-input" placeholder="Meaning (смысл)" value={meaning} onChange={(e)=>setMeaning(e.target.value)} rows={3} />
            <textarea className="form-input" placeholder="Практика" value={practice} onChange={(e)=>setPractice(e.target.value)} rows={2} />
            <div className="actions"><button className="action action-primary" onClick={onCreate} disabled={!text.trim()}>Создать черновик</button></div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="form-row">
          <div className="section-title">Импорт из public/affirmations.json</div>
          <div className="form-inline">
            <label className="section-title" style={{ margin: 0 }}>Статус импортируемых</label>
            <div className="chips">
              {['draft','published'].map(s => (
                <button key={s} className={`chip chip-compact ${importAs===s?'active':''}`} onClick={()=>setImportAs(s)}>{s}</button>
              ))}
            </div>
            <button className="action action-secondary" onClick={async ()=>{
              try {
                const res = await fetch(`${import.meta.env.BASE_URL}affirmations.json`, { cache: 'no-store' });
                if (!res.ok) throw new Error('json not found');
                const arr = await res.json();
                for (const it of arr) {
                  const cat = (it.category || 'love').toLowerCase();
                  const text = it.text || '';
                  const meaning = it.meaning || it.explanation || it['расшифровка'] || '';
                  const practice = it.practice || '';
                  const id = await createDraft({ category: cat, text, meaning, practice, createdBy: user?.uid });
                  if (importAs === 'published') await publishItem(id, user?.uid);
                }
                await load();
                alert('Импорт завершён');
              } catch (e) {
                alert('Ошибка импорта: ' + (e?.message || e));
              }
            }}>Импортировать из JSON</button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="form-inline" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="section-title">{loading? 'Загрузка…' : `Найдено: ${items.length}`}</div>
          <div className="form-inline" style={{ gap: 6 }}>
            <input className="form-input" placeholder="Поиск по тексту" value={query} onChange={(e)=>setQuery(e.target.value)} style={{ minWidth: 200 }} />
            {query && <button className="action action-secondary" onClick={()=>setQuery('')}>Очистить</button>}
          </div>
        </div>
        <div className="admin-list">
          {(items || []).filter(it => (it.text||'').toLowerCase().includes(query.trim().toLowerCase())).map((it) => (
            <div key={it.id} className="list-item">
              <div className="badges">
                <div className="badge">{it.category}</div>
                <div className={`badge ${it.status==='published'?'published':(it.status==='pending'?'pending':'draft')}`}>{it.status}</div>
              </div>
              <input className="form-input" defaultValue={it.text} onBlur={(e)=>onQuickSave(it,'text',e.target.value)} />
              <textarea className="form-input" defaultValue={it.meaning || it.explanation || ''} rows={3} onBlur={(e)=>onQuickSave(it,'meaning',e.target.value)} />
              <textarea className="form-input" defaultValue={it.practice || ''} rows={2} onBlur={(e)=>onQuickSave(it,'practice',e.target.value)} />
              <div className="actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="action action-secondary" onClick={()=>onTogglePublish(it)}>
                    {it.status==='published' ? 'Снять с публикации' : 'Опубликовать'}
                  </button>
                  <button className="action action-secondary" onClick={async()=>{ if (confirm('Удалить эту аффирмацию?')) { await deleteItem(it.id); await load(); } }}>
                    Удалить
                  </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
