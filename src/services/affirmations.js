import { collection, addDoc, serverTimestamp, updateDoc, doc, query, where, orderBy, limit, getDocs, startAfter, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const COL = 'affirmations';
const colMy = (uid) => collection(db, 'users', uid, 'my_affirmations');

// Public: list published by category with optional pagination
export async function listPublishedByCategory(category, pageSize = 20, cursor = null) {
  const col = collection(db, COL);
  let q = query(
    col,
    where('status', '==', 'published'),
    where('category', '==', (category || 'love').toLowerCase()),
    orderBy('createdAt', 'desc'),
    limit(pageSize)
  );
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

// ===== Personal (per-user) affirmations =====
export async function listMy(uid, pageSize = 50, cursor = null) {
  const col = colMy(uid);
  let q = query(col, orderBy('createdAt', 'desc'), limit(pageSize));
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export async function addMy(uid, { category, title = '', text, meaning = '', practice = '' }) {
  const now = serverTimestamp();
  const ref = await addDoc(colMy(uid), {
    category: (category || 'love').toLowerCase(),
    title: title || '',
    text: text || '',
    meaning: meaning || '',
    practice: practice || '',
    createdAt: now,
    updatedAt: now,
    source: 'ai',
  });
  return { id: ref.id, category: (category||'love').toLowerCase(), title, text, meaning, practice };
}

export async function removeMy(uid, id) {
  const ref = doc(db, 'users', uid, 'my_affirmations', id);
  await deleteDoc(ref);
}

// Admin: list with filters
export async function adminList({ status = 'any', category = 'any', pageSize = 50, cursor = null } = {}) {
  const col = collection(db, COL);
  const clauses = [];
  if (status !== 'any') clauses.push(where('status', '==', status));
  if (category !== 'any') clauses.push(where('category', '==', category));
  let q = query(col, ...clauses, orderBy('createdAt', 'desc'), limit(pageSize));
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export async function createDraft({ category, text, meaning = '', practice = '', createdBy }) {
  const col = collection(db, COL);
  const now = serverTimestamp();
  const docRef = await addDoc(col, {
    category: (category || 'love').toLowerCase(),
    text: text || '',
    meaning: meaning || '',
    practice: practice || '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || null,
    updatedBy: createdBy || null,
  });
  return docRef.id;
}

export async function updateItem(id, data, userId) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function publishItem(id, userId) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { status: 'published', updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function unpublishItem(id, userId) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { status: 'draft', updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function deleteItem(id) {
  const ref = doc(db, COL, id);
  await deleteDoc(ref);
}

// Helper: создать черновик и сразу опубликовать
export async function createAndPublish({ category, text, meaning = '', practice = '', createdBy }) {
  const id = await createDraft({ category, text, meaning, practice, createdBy });
  await publishItem(id, createdBy);
  return { id, category: (category||'love').toLowerCase(), text, meaning, practice, status: 'published' };
}

// Helper: создать запись в статусе pending (на модерации)
export async function createPending({ category, title = '', text, meaning = '', practice = '', createdBy }) {
  const col = collection(db, COL);
  const now = serverTimestamp();
  const docRef = await addDoc(col, {
    category: (category || 'love').toLowerCase(),
    title: title || '',
    text: text || '',
    meaning: meaning || '',
    practice: practice || '',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || null,
    updatedBy: createdBy || null,
    source: 'ai',
  });
  return { id: docRef.id, category: (category||'love').toLowerCase(), title, text, meaning, practice, status: 'pending' };
}
