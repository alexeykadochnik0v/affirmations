import { collection, doc, getDocs, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const colFavorites = (uid) => collection(db, 'users', uid, 'favorites');
const colHidden = (uid) => collection(db, 'users', uid, 'hidden');

export async function fetchFavorites(uid) {
  const snap = await getDocs(colFavorites(uid));
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
}

export async function fetchHidden(uid) {
  const snap = await getDocs(colHidden(uid));
  const list = [];
  snap.forEach((d) => list.push(d.id));
  return list;
}

export function watchFavorites(uid, cb) {
  return onSnapshot(colFavorites(uid), (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    cb(list);
  });
}

export function watchHidden(uid, cb) {
  return onSnapshot(colHidden(uid), (snap) => {
    const list = [];
    snap.forEach((d) => list.push(d.id));
    cb(list);
  });
}

export async function addFavoriteRemote(uid, item) {
  const ref = doc(db, 'users', uid, 'favorites', item.id);
  await setDoc(ref, {
    categoryKey: item.category || item.categoryKey,
    addedAt: item.addedAt || Date.now(),
  }, { merge: true });
}

export async function removeFavoriteRemote(uid, id) {
  const ref = doc(db, 'users', uid, 'favorites', id);
  await deleteDoc(ref);
}

export async function addHiddenRemote(uid, id, categoryKey) {
  const ref = doc(db, 'users', uid, 'hidden', id);
  await setDoc(ref, {
    categoryKey,
    createdAt: Date.now(),
  }, { merge: true });
}

export async function removeHiddenRemote(uid, id) {
  const ref = doc(db, 'users', uid, 'hidden', id);
  await deleteDoc(ref);
}

// One-time migration: push local favorites/hidden to cloud
export async function migrateLocalToCloud(uid, localFavorites = [], localHidden = []) {
  const ops = [];
  // favorites
  for (const f of localFavorites) {
    const ref = doc(db, 'users', uid, 'favorites', f.id);
    ops.push(setDoc(ref, {
      categoryKey: f.category || f.categoryKey,
      addedAt: f.addedAt || Date.now(),
    }, { merge: true }));
  }
  // hidden
  for (const id of localHidden) {
    const ref = doc(db, 'users', uid, 'hidden', id);
    ops.push(setDoc(ref, {
      categoryKey: null,
      createdAt: Date.now(),
    }, { merge: true }));
  }
  if (ops.length) await Promise.allSettled(ops);
}
