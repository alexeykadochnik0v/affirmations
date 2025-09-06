import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { useAuth } from '../auth/AuthProvider';
import * as firebaseui from 'firebaseui';
import { GoogleAuthProvider } from 'firebase/auth';
import 'firebaseui/dist/firebaseui.css';

export default function AuthPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) return; // уже авторизован — покажем карточку профиля ниже
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        // добавим GitHub позже
        GoogleAuthProvider.PROVIDER_ID,
      ],
      signInFlow: 'popup',
      callbacks: {
        signInSuccessWithAuthResult: () => {
          navigate('/');
          return false; // предотвращаем редирект по умолчанию
        },
      },
    });
    return () => ui.reset();
  }, [user, navigate]);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 12 }}>Вход</h1>
      {!user && (
        <section className="card" style={{ padding: 20 }}>
          <p className="muted" style={{ marginTop: 0 }}>Выберите способ входа</p>
          <div id="firebaseui-auth-container" />
        </section>
      )}

      {user && (
        <section className="card" style={{ padding: 20 }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: 20 }}>Вы авторизованы</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {user.photoURL ? (
              <img
                src={`${user.photoURL}${user.photoURL.includes('?') ? '&' : '?'}sz=128`}
                alt="avatar"
                width={40}
                height={40}
                style={{ borderRadius: 999 }}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : null}
            <div>
              <div style={{ fontWeight: 700 }}>{user.displayName || 'Без имени'}</div>
              <div className="muted" style={{ fontSize: 14 }}>{user.email}</div>
            </div>
          </div>
          <div className="actions" style={{ marginTop: 12 }}>
            <button className="action action-primary" onClick={() => navigate('/')}>На главную</button>
            <button className="action action-secondary" onClick={signOut}>Выйти</button>
          </div>
        </section>
      )}
    </div>
  );
}
