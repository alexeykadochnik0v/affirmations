import { useState } from 'react';
import { setUserRole } from '../../services/userData';

export default function RolesAdmin() {
  const [uid, setUid] = useState('');
  const [role, setRole] = useState('moderator');
  const [status, setStatus] = useState('');

  const onSave = async () => {
    setStatus('');
    try {
      if (!uid) { setStatus('Укажите UID пользователя'); return; }
      await setUserRole(uid.trim(), role);
      setStatus('Сохранено');
    } catch (e) {
      setStatus('Ошибка: ' + (e?.message || String(e)));
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Назначение ролей</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px auto', gap: 8, alignItems: 'center' }}>
          <input value={uid} onChange={(e)=>setUid(e.target.value)} placeholder="UID пользователя" style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 10 }} />
          <select value={role} onChange={(e)=>setRole(e.target.value)} style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 10 }}>
            <option value="moderator">moderator</option>
            <option value="admin">admin</option>
            <option value="user">user</option>
          </select>
          <button className="action action-primary" onClick={onSave}>Сохранить</button>
        </div>
        {status && <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>{status}</div>}
      </div>
      <div className="card">
        <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Как получить UID</div>
        <ol style={{ margin: 0, color: 'var(--muted)' }}>
          <li>Firebase Console → Authentication → Users → колонка UID</li>
          <li>Скопируйте UID и вставьте в поле выше</li>
        </ol>
      </div>
    </div>
  );
}
