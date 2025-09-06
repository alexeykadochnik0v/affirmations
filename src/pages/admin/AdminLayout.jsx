import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';

export default function AdminLayout() {
  const { user, role, roleLoaded, isModerator } = useAuth();
  return (
    <div>
      <div className="favorites-hero">
        <div className="favorites-hero-bg" aria-hidden="true" />
        <h1 style={{ marginBottom: 4 }}>Админка</h1>
        <p className="muted" style={{ margin: 0 }}>Управление контентом и ролями</p>
      </div>

      <div className="fav-layout">
        <aside className="sidebar">
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>Разделы</div>
            <nav className="chips admin-tabs">
              <NavLink className={({isActive}) => `chip ${isActive?'active':''}`} to="/admin/articles">Статьи</NavLink>
              <NavLink className={({isActive}) => `chip ${isActive?'active':''}`} to="/admin/affirmations">Аффирмации</NavLink>
              <NavLink className={({isActive}) => `chip ${isActive?'active':''}`} to="/admin/roles">Роли</NavLink>
            </nav>
          </div>
        </aside>
        <section className="content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
