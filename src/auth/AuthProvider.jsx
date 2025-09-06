import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { watchFavorites, watchHidden } from '../services/userData';
import { useAppStore } from '../store/useAppStore';

const AuthContext = createContext({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const setFavorites = useAppStore((s) => s.setFavorites);
  const setHidden = useAppStore((s) => s.setHidden);
  const [unsubs, setUnsubs] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      // reset previous subscriptions
      unsubs.forEach((fn) => { try { fn(); } catch {} });
      setUnsubs([]);
      if (u) {
        const offFav = watchFavorites(u.uid, (list) => setFavorites(list));
        const offHidden = watchHidden(u.uid, (list) => setHidden(list));
        setUnsubs([offFav, offHidden]);
      }
    });
    return () => unsub();
  }, [setFavorites, setHidden]);

  const value = useMemo(() => ({
    user,
    loading,
    signOut: async () => {
      await signOut(auth);
    },
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
