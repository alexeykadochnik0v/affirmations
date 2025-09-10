import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { useAuth } from '../auth/AuthProvider';
import * as firebaseui from 'firebaseui';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, signInWithPopup } from 'firebase/auth';
import 'firebaseui/dist/firebaseui.css';

export default function AuthPage() {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [uiError, setUiError] = useState('');
  const [debugOpen, setDebugOpen] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isInApp = /FBAN|FBAV|Instagram|Line|Twitter|VKClient|OkApp/i.test(navigator.userAgent);
  const preferRedirect = isIOS || isSafari || isInApp;

  useEffect(() => {
    if (user) return; // уже авторизован — покажем карточку профиля ниже
    // 0) Обработаем результат редиректа (если мы вернулись от Google)
    getRedirectResult(auth)
      .then((res) => {
        // навигацию делаем только через onAuthStateChanged в провайдере
        try { console.log('Auth currentUser after redirect:', auth.currentUser || null); } catch {}
      })
      .catch((e) => {
        setUiError(e?.message || 'Ошибка после возврата из Google. Проверьте авторизованные домены в Firebase Auth.');
        try { console.warn('getRedirectResult error', e); } catch {}
      });
    const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(auth);
    ui.start('#firebaseui-auth-container', {
      signInOptions: [
        // добавим GitHub позже
        GoogleAuthProvider.PROVIDER_ID,
      ],
      // На iOS/Safari/встроенных браузерах используем redirect. Иначе попробуем popup.
      signInFlow: preferRedirect ? 'redirect' : 'popup',
      credentialHelper: firebaseui.auth.CredentialHelper.NONE,
      signInSuccessUrl: '/',
      callbacks: {
        signInSuccessWithAuthResult: () => {
          navigate('/');
          return false; // предотвращаем редирект по умолчанию
        },
        signInFailure: (error) => {
          // Покажем пользователю причину (часто это блокировка всплывающих окон/cookie)
          const msg = error?.message || 'Не удалось выполнить вход. Попробуйте ещё раз или отключите блокировку всплывающих окон/трекеров.';
          setUiError(msg);
          try { console.warn('auth ui error', error); } catch {}
        },
        uiShown: () => {
          try { console.log('Auth UI shown'); } catch {}
        }
      },
    });
    return () => ui.reset();
  }, [user, navigate]);

  // Если провайдер уже отдал пользователя — уводим с /auth
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  useEffect(() => {
    try {
      const qp = new URLSearchParams(window.location.search);
      if (qp.get('authdebug') === '1') setDebugOpen(true);
    } catch {}
  }, []);

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1 style={{ marginBottom: 12 }}>Вход</h1>
      {!user && (
        <section className="card" style={{ padding: 20 }}>
          <p className="muted" style={{ marginTop: 0 }}>Выберите способ входа</p>
          <div id="firebaseui-auth-container" />
          {uiError ? (
            <div className="card" style={{ marginTop: 10, border: '1px solid #fecaca', background: '#fff1f2', color: '#7f1d1d' }}>
              {uiError}
            </div>
          ) : null}
          {loading ? (
            <div className="card" style={{ marginTop: 10 }}>
              Проверяем сессию…
            </div>
          ) : null}
          {debugOpen && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>Auth Debug</strong>
                <button className="action pill-mini" onClick={() => setDebugOpen(false)}>Скрыть</button>
              </div>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, opacity: .9 }}>
{JSON.stringify({
  useAuth_user_uid: user?.uid || null,
  useAuth_loading: loading,
  auth_current_uid: auth.currentUser?.uid || null,
}, null, 2)}
              </pre>
              <div className="actions">
                <button className="action" onClick={() => { try { console.log('auth.currentUser', auth.currentUser); alert('См. консоль: auth.currentUser'); } catch {} }}>Показать currentUser в консоли</button>
                <button className="action" onClick={async () => { try { if (auth.currentUser) { await auth.currentUser.getIdToken(true); alert('Токен обновлён'); } else { alert('Пользователь не найден'); } } catch (e) { alert(e?.message || 'Ошибка обновления токена'); } }}>Обновить токен</button>
              </div>
              <div className="muted" style={{ fontSize: 12 }}>Откройте /auth?authdebug=1 чтобы видеть этот блок.</div>
            </div>
          )}
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
