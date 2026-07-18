// js/workout-sync.js
// Respaldo de la progresión de workout en Google Sheets (pestañas Entrenamientos y PRs).
// Queue-first: cada fila se encola en localStorage ANTES de intentar enviarla, así el
// registro local nunca depende de la red. La cola se vacía al completar sesión, al
// abrir el dashboard y con el botón Sincronizar de Progresión.
// Los imports de sheets.js/db.js/athletes.js son dinámicos para que los helpers puros
// de este módulo sean testeables en Node sin arrastrar el grafo completo de la app.

const QUEUE_KEY = 'workout_sync_queue';

// ── Mapeo fila ⇄ objeto ─────────────────────────────────────────────────────
export function sessionToRow(rec, athleteId) {
  return [rec.date, rec.session, String(rec.week), rec.phase, athleteId, new Date().toISOString()];
}

export function rowToSession([date, session, week, phase, athlete] = []) {
  return { date, session, week: parseInt(week, 10), phase, athlete, completed: true, sets: [] };
}

export function prsToRow(prs, athleteId) {
  return [
    new Date().toISOString().slice(0, 10), athleteId,
    prs.banca ?? '', prs.deadlift ?? '', prs.sentadilla ?? '', prs.pullups ?? '',
  ];
}

export function sessionKeyOf(r) {
  return `${r.date}|${r.session}|${r.week}`;
}

// ── Cola offline ────────────────────────────────────────────────────────────
function readQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; }
  catch { return []; }
}

function writeQueue(q) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

export function enqueue(sheet, row) {
  const q = readQueue();
  q.push({ sheet, row });
  writeQueue(q);
}

export function pendingCount() {
  return readQueue().length;
}

// Intenta enviar todo lo encolado. Best-effort por pestaña: lo que falla queda en cola.
export async function flushQueue() {
  let q = readQueue();
  if (!q.length) return { synced: 0, pending: 0 };
  let synced = 0;
  try {
    const { ensureWorkoutTabs, appendRows } = await import('./sheets.js');
    await ensureWorkoutTabs();
    for (const sheet of [...new Set(q.map(i => i.sheet))]) {
      const rows = q.filter(i => i.sheet === sheet).map(i => i.row);
      const ok = await appendRows(sheet, rows).catch(() => null);
      if (ok) {
        q = q.filter(i => i.sheet !== sheet);
        writeQueue(q);
        synced += rows.length;
      }
    }
  } catch { /* sin conexión o sin sesión de Google — la cola persiste */ }
  return { synced, pending: q.length };
}

// ── Push (encolar + intentar enviar) ────────────────────────────────────────
export async function pushSession(record, athleteId) {
  enqueue('Entrenamientos', sessionToRow(record, athleteId));
  return flushQueue();
}

export async function pushPRs(prs, athleteId) {
  enqueue('PRs', prsToRow(prs, athleteId));
  return flushQueue();
}

// ── Pull + merge (multi-dispositivo / restauración) ─────────────────────────
export async function syncNow() {
  const pushed = await flushQueue();

  const { ensureWorkoutTabs, getRows } = await import('./sheets.js');
  const { getAllSessions, saveSession } = await import('./db.js');

  await ensureWorkoutTabs();
  const rows = await getRows('Entrenamientos');
  if (rows === null) return { ...pushed, imported: null }; // pull falló

  const remote = rows.map(rowToSession).filter(r => r.date && r.session && r.week);
  const local  = await getAllSessions();
  const seen   = new Set(local.map(sessionKeyOf));

  let imported = 0;
  for (const r of remote) {
    if (seen.has(sessionKeyOf(r))) continue;
    seen.add(sessionKeyOf(r));
    try {
      await saveSession({ date: r.date, session: r.session, week: r.week, phase: r.phase, completed: true, sets: [] });
      imported++;
    } catch { /* fila de un programa anterior con claves/fases retiradas — se ignora */ }
  }

  // PRs: si no hay PRs locales, adoptar la última fila remota del atleta activo.
  let prsRestored = false;
  try {
    const localPRs = JSON.parse(localStorage.getItem('gzclp_prs') || '{}');
    if (!Object.keys(localPRs).length) {
      const { getActiveAthleteId, setAthletePRs } = await import('./athletes.js');
      const athleteId = getActiveAthleteId();
      const prRows = await getRows('PRs');
      const mine   = (prRows || []).filter(r => r[1] === athleteId);
      const last   = mine[mine.length - 1];
      if (last) {
        const prs = {};
        const [, , banca, deadlift, sentadilla, pullups] = last;
        if (banca)      prs.banca      = parseFloat(banca);
        if (deadlift)   prs.deadlift   = parseFloat(deadlift);
        if (sentadilla) prs.sentadilla = parseFloat(sentadilla);
        if (pullups)    prs.pullups    = parseInt(pullups, 10);
        if (Object.keys(prs).length) { setAthletePRs(athleteId, prs); prsRestored = true; }
      }
    }
  } catch { /* PRs remotos no disponibles — no es crítico */ }

  return { ...pushed, imported, prsRestored };
}
