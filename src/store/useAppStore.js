import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  favorites: [],
  hidden: [],
  addFavorite: (item) => set((s) => ({ favorites: [...s.favorites, item] })),
  removeFavorite: (id) => set((s) => ({ favorites: s.favorites.filter((x) => x.id !== id) })),
  hideAffirmation: (id) => set((s) => ({ hidden: [...s.hidden, id] })),
}));
