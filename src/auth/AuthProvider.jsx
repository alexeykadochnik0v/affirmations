import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import { watchFavorites, watchHidden, migrateLocalToCloud, watchUserRole } from '../services/userData';
import { useAppStore } from '../store/useAppStore';

const AuthContext = createContext({ user: null, loading: true, role: null, roleLoaded: false, isModerator: false, isAdmin: false, signOut: async () => {} });

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const setFavorites = useAppStore((s) => s.setFavorites);
  const setHidden = useAppStore((s) => s.setHidden);
  const [unsubs, setUnsubs] = useState([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      // reset previous subscriptions
      unsubs.forEach((fn) => { try { fn(); } catch {} });
      setUnsubs([]);
      if (u) {
        // one-time migration of local data to cloud
        try {
          const migrated = localStorage.getItem('migrated_to_cloud');
          if (!migrated) {
            const localFav = JSON.parse(localStorage.getItem('favorites') || '[]');
            const localHidden = JSON.parse(localStorage.getItem('hidden') || '[]');
            await migrateLocalToCloud(u.uid, localFav, localHidden);
            localStorage.setItem('migrated_to_cloud', '1');
          }
        } catch {}
        const offFav = watchFavorites(u.uid, (list) => setFavorites(list));
        const offHidden = watchHidden(u.uid, (list) => setHidden(list));
        const offRole = watchUserRole(u.uid, (r) => { setRole(r?.role || null); setRoleLoaded(true); });
        setUnsubs([offFav, offHidden, offRole]);
      }
    });
    return () => unsub();
  }, [setFavorites, setHidden]);

  const value = useMemo(() => ({
    user,
    loading,
    role,
    roleLoaded,
    isModerator: role === 'moderator' || role === 'admin',
    isAdmin: role === 'admin',
    signOut: async () => {
      await signOut(auth);
    },
  }), [user, loading, role, roleLoaded]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
