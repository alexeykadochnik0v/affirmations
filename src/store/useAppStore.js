import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // initialize from localStorage where possible
  favorites: (() => {
    try { return JSON.parse(localStorage.getItem('favorites')) || []; } catch { return []; }
  })(),
  hidden: (() => {
    try { return JSON.parse(localStorage.getItem('hidden')) || []; } catch { return []; }
  })(),

  addFavorite: (item) => set((s) => {
    // prevent duplicates by id
    if (s.favorites.some((x) => x.id === item.id)) return {};
    const next = [...s.favorites, { ...item, addedAt: item.addedAt || Date.now() }];
    try { localStorage.setItem('favorites', JSON.stringify(next)); } catch {}
    return { favorites: next };
  }),

  removeFavorite: (id) => set((s) => {
    const next = s.favorites.filter((x) => x.id !== id);
    try { localStorage.setItem('favorites', JSON.stringify(next)); } catch {}
    return { favorites: next };
  }),

  hideAffirmation: (id) => set((s) => {
    if (s.hidden.includes(id)) return {};
    const next = [...s.hidden, id];
    try { localStorage.setItem('hidden', JSON.stringify(next)); } catch {}
    return { hidden: next };
  }),
}));
