import { collection, addDoc, doc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, where, limit, startAfter, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const COL = 'articles';

export async function listArticles({ status = 'any', pageSize = 50, cursor = null } = {}) {
  const col = collection(db, COL);
  const clauses = [];
  if (status !== 'any') clauses.push(where('status', '==', status));
  let q = query(col, ...clauses, orderBy('createdAt', 'desc'), limit(pageSize));
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export async function createArticleDraft({ cover = '', title = '', summary = '', tags = [], content = [], contentMd = '', readMinutes = null, createdBy }) {
  const col = collection(db, COL);
  const now = serverTimestamp();
  const ref = await addDoc(col, {
    cover,
    title,
    summary,
    content: Array.isArray(content) ? content : [],
    contentMd: String(contentMd || ''),
    tags: Array.isArray(tags) ? tags : [],
    status: 'draft',
    readMinutes: typeof readMinutes === 'number' && readMinutes > 0 ? Math.round(readMinutes) : null,
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || null,
    updatedBy: createdBy || null,
  });
  return ref.id;
}

export async function updateArticle(id, data, userId) {
  const ref = doc(db, COL, id);
  const patch = { ...data };
  if ('content' in patch) {
    patch.content = Array.isArray(patch.content) ? patch.content : [];
  }
  if ('contentMd' in patch) {
    patch.contentMd = String(patch.contentMd || '');
  }
  if ('readMinutes' in patch) {
    const v = Number(patch.readMinutes);
    patch.readMinutes = Number.isFinite(v) && v > 0 ? Math.round(v) : null;
  }
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function publishArticle(id, userId) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { status: 'published', updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function unpublishArticle(id, userId) {
  const ref = doc(db, COL, id);
  await updateDoc(ref, { status: 'draft', updatedAt: serverTimestamp(), updatedBy: userId || null });
}

export async function deleteArticle(id) {
  const ref = doc(db, COL, id);
  await deleteDoc(ref);
}

// Public readers
export async function listPublishedArticles(pageSize = 50, cursor = null) {
  const col = collection(db, COL);
  let q = query(col, where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(pageSize));
  if (cursor) q = query(q, startAfter(cursor));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : null;
  return { items, nextCursor };
}

export async function getArticleById(id) {
  const ref = doc(db, COL, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
