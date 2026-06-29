// js/db.js
export const DB_NAME    = 'workout-app';
export const DB_VERSION = 1;
export const STORES     = ['workout_sessions'];

const VALID_SESSIONS = ['S1', 'S3', 'S5', 'kine'];
const VALID_PHASES   = ['volumen', 'acumulacion', 'intensificacion', 'peak_pr'];

export function validateSession(s) {
  if (!VALID_SESSIONS.includes(s.session))
    throw new Error(`session must be one of ${VALID_SESSIONS.join('|')}, got "${s.session}"`);
  if (s.week < 1 || s.week > 6)
    throw new Error(`week must be 1–6, got ${s.week}`);
  if (!VALID_PHASES.includes(s.phase))
    throw new Error(`phase must be one of ${VALID_PHASES.join('|')}, got "${s.phase}"`);
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('workout_sessions')) {
        const store = db.createObjectStore('workout_sessions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by_date',    'date',    { unique: false });
        store.createIndex('by_week',    'week',    { unique: false });
        store.createIndex('by_session', 'session', { unique: false });
      }
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

function tx(db, storeName, mode, fn) {
  return new Promise((resolve, reject) => {
    const t     = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const req   = fn(store);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

export async function saveSession(session) {
  validateSession(session);
  const db  = await openDB();
  const id  = await tx(db, 'workout_sessions', 'readwrite', s => s.put(session));
  db.close();
  return id;
}

export async function getSession(id) {
  const db  = await openDB();
  const rec = await tx(db, 'workout_sessions', 'readonly', s => s.get(id));
  db.close();
  return rec;
}

export async function getAllSessions() {
  const db  = await openDB();
  const all = await tx(db, 'workout_sessions', 'readonly', s => s.getAll());
  db.close();
  return all;
}

export async function getSessionsByWeek(week) {
  const db  = await openDB();
  const idx = await new Promise((resolve, reject) => {
    const t     = db.transaction('workout_sessions', 'readonly');
    const store = t.objectStore('workout_sessions');
    const index = store.index('by_week');
    const req   = index.getAll(week);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
  db.close();
  return idx;
}
