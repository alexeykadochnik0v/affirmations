import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, Link } from "react-router-dom";
import { IconHeart, IconSun, IconMoonStars } from "@tabler/icons-react";

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
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
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

  // click outside to close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('touchstart', onDocClick, { passive: true });
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('touchstart', onDocClick);
    };
  }, [open]);
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
          <NavLink to="/donate" style={({ isActive }) => ({ ...linkStyle, border: "1px solid var(--border)", ...(isActive ? activeStyle : {}) })}>донат</NavLink>
        </nav>
        <div className="actions" style={{ display: 'flex', gap: 8, marginLeft: 8 }}>
          <button aria-label={open ? 'закрыть меню' : 'открыть меню'} aria-haspopup="menu" aria-expanded={open} aria-controls="main-nav" onClick={() => setOpen(v => !v)} className={`burger ${open ? 'open' : ''}`}>
            <span className="line" />
            <span className="line" />
            <span className="line" />
          </button>
          <button
            aria-label={theme === 'dark' ? 'включить светлую тему' : 'включить тёмную тему'}
            className={`theme theme-${theme}`}
            onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
            title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          >
            {theme === 'dark' ? <IconSun size={20} stroke={2.2} /> : <IconMoonStars size={20} stroke={2.2} />}
          </button>
        </div>
      </div>
    </header>
  );
}
