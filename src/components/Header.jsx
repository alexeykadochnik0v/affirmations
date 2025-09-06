import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
import { IconHeart, IconMoonStars, IconSun, IconUser } from '@tabler/icons-react';
import DonateModal from '../components/DonateModal';
import { useAuth } from '../auth/AuthProvider';

const linkStyle = {
  padding: "8px 12px",
  borderRadius: 8,
  color: "var(--text)",
  textDecoration: "none",
};

const activeStyle = {
  background: "var(--surface)",
  fontWeight: 600,
};

export default function Header() {
  const { user, signOut, isModerator } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [donateOpen, setDonateOpen] = useState(false);
  const wrapRef = useRef(null);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {}
    const prefersDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768 && open) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open]);

  // lock scroll on mobile when menu opened
  useEffect(() => {
    const isMobile = () => window.innerWidth < 768;
    if (open && isMobile()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // init theme from storage or prefers
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // click outside to close menus
  useEffect(() => {
    if (!open && !profileOpen) return;
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) { setOpen(false); setProfileOpen(false); }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open, profileOpen]);
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 10 }}>
      <div ref={wrapRef} className="container" style={{ display: "flex", alignItems: "center", justifyContent: 'space-between' }}>
        <Link to="/" aria-label="На главную" style={{ display: 'flex', alignItems: 'center', gap: 8, color: "var(--text)", textDecoration: "none" }}>
          <IconHeart size={22} stroke={1.8} />
        </Link>
        <nav id="main-nav" role="menu" className={`nav ${open ? 'nav-open' : ''}`} onClick={() => setOpen(false)}>
          <NavLink to="/about" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>о проекте</NavLink>
          <NavLink to="/useful" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>полезное</NavLink>
          <NavLink to="/contacts" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>контакты</NavLink>
          <NavLink to="/favorites" style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}>избранное</NavLink>
          <button
            type="button"
            className="nav-donate-btn"
            onClick={(e) => { e.stopPropagation(); setDonateOpen(true); setOpen(false); }}
          >донат</button>
          {/* no theme toggle in burger menu per request */}
        </nav>
        <div className="actions" style={{ display: 'flex', gap: 8, marginLeft: 8, position: 'relative' }}>
          {isModerator && (
            <Link to="/admin" className="action action-secondary pill-mini" title="Админка" style={{ whiteSpace: 'nowrap' }}>админ</Link>
          )}
          {user ? (
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="profile-btn"
              onClick={() => setProfileOpen(v => !v)}
              title="Профиль"
            >
              {user.photoURL && !avatarFailed ? (
                <img
                  src={`${user.photoURL}${user.photoURL.includes('?') ? '&' : '?'}sz=64`}
                  alt="avatar"
                  width={40}
                  height={40}
                  style={{ borderRadius: 999 }}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  onError={() => setAvatarFailed(true)}
                />
              ) : (
                <IconUser size={22} stroke={2.2} />
              )}
            </button>
          ) : (
            <Link to="/auth" aria-label="Войти" className="profile-btn" title="Войти"><IconUser size={22} stroke={2.2} /></Link>
          )}
          {user && profileOpen && (
            <div className="profile-menu" role="menu" aria-label="Профиль">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {user.photoURL && !avatarFailed ? (
                  <img
                    src={`${user.photoURL}${user.photoURL.includes('?') ? '&' : '?'}sz=128`}
                    alt="avatar"
                    width={40}
                    height={40}
                    style={{ borderRadius: 999 }}
                    referrerPolicy="no-referrer"
                  />
                ) : <IconUser size={22} stroke={2.2} />}
                <div>
                  <div style={{ fontWeight: 800 }}>Вы авторизованы</div>
                  <div>{user.displayName || 'Пользователь'}</div>
                </div>
              </div>
              <div className="actions" style={{ marginTop: 10 }}>
                <button className="action action-primary" onClick={() => { setProfileOpen(false); navigate('/'); }}>На главную</button>
                <button className="action action-secondary" onClick={async () => { setProfileOpen(false); await signOut(); navigate('/'); }}>Выйти</button>
              </div>
            </div>
          )}
          <button aria-label={open ? 'закрыть меню' : 'открыть меню'} aria-haspopup="menu" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(v => !v)} className={`burger ${open ? 'open' : ''}`}>
            <span className="line" />
            <span className="line" />
            <span className="line" />
          </button>
          {/* Desktop theme toggle (icon button). Hidden text in small screens handled by CSS */}
          <button
            aria-label={theme === 'dark' ? 'включить светлую тему' : 'включить тёмную тему'}
            className={`theme theme-${theme}`}
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <IconSun size={18} /> : <IconMoonStars size={18} />}
            <span className="label">{theme === 'dark' ? 'Светлая' : 'Тёмная'}</span>
          </button>
        </div>
        <DonateModal open={donateOpen} onClose={() => setDonateOpen(false)} qrSrc="/qr.svg" />
      </div>
    </header>
  );
}
