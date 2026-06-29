# Foundation + Entrenamiento — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clone the nutrical repo, extend it with PWA capabilities and a fully functional GZCLP v6 workout session player (S1/S3/S5/Kine) with automatic T1 load calculation and rest timer.

**Architecture:** Vanilla JS ES modules extending the existing nutrical codebase. New modules follow nutrical's established `renderXxx()` + `bindXxx()` view pattern. IndexedDB (raw, no library) stores workout logs. The GZCLP v6 program lives as a single static JS file — no backend needed.

**Tech Stack:** Vanilla JS ES modules, Node.js built-in test runner (`node:test`), raw IndexedDB API, PWA manifest + service worker (no build tool).

## Global Constraints

- No framework (React, Vue, etc.) — vanilla JS only
- No npm packages — zero dependencies, CDN only where needed (Chart.js already in nutrical)
- ES modules throughout — `type="module"` on all scripts
- Tests use `node:test` + `node:assert/strict` (Node ≥ 18) — run with `node --test tests/`
- All new views export exactly two functions: `renderXxx(): string` and `bindXxx(): void`
- Hash router pattern: `#/route` — new routes added to `js/router.js` only
- Pride color palette only: `--pink #ff4d94`, `--orange #ff8c50`, `--gold #ffd54f`, `--mint #4dffb8`, `--cyan #4dd8ff`, `--purple #cc88ff`, `--bg #0f0820`, `--card #1a1030`, `--border #4a2080`, `--text #f0e8ff`, `--dim #c0b0e0`
- Mobile-first, max-width 480px, iPhone safe-area aware
- Kine sessions: read-only, zero edit controls rendered
- T1 never cut: no UI option to skip/remove T1 exercises
- Face pull in S1: cannot be removed (OBLIGATORIO label)
- EVA max 3/10: persistent reminder in Kine view
- Week is calendar-based (program_start_date + 7 days × week_number), not session-completion-based

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `package.json` | Create | Node test runner config only |
| `manifest.json` | Create | PWA manifest |
| `sw.js` | Create | Service worker, cache-first |
| `index.html` | Modify | Add manifest link + SW registration |
| `css/app.css` | Create | Pride theme vars + new components (bottom-nav, timer, session-card, progress-bar) |
| `js/db.js` | Create | Raw IndexedDB wrapper — workout_sessions store |
| `js/workout-data.js` | Create | Complete GZCLP v6 static program data |
| `js/load-calculator.js` | Create | Pure function: `getT1Sets(session, week, prs) → Set[]` |
| `js/timer.js` | Create | Countdown timer logic (pure, no DOM) |
| `js/views/workout.js` | Create | Session player view (S1/S3/S5/Kine) |
| `js/router.js` | Modify | Add `#/workout/:session` route |
| `tests/load-calculator.test.js` | Create | Tests for T1 load calculation |
| `tests/db.test.js` | Create | Tests for IndexedDB wrapper |
| `tests/timer.test.js` | Create | Tests for timer logic |

---

## Task 1: Clone repo + test runner setup

**Files:**
- Clone: `aatronco/nutrical` into local working directory
- Create: `package.json`

**Interfaces:**
- Produces: `npm test` runs all `tests/*.test.js` files

- [ ] **Step 1: Clone nutrical**

```bash
cd /Users/alejandro/code/personal/workout
git clone https://github.com/aatronco/nutrical.git .
```

Expected: nutrical files appear in the workout directory.

- [ ] **Step 2: Verify existing tests pass**

```bash
node --test tests/formulas.test.js
```

Expected: all 11 tests pass with `✓` marks.

- [ ] **Step 3: Create package.json**

```json
{
  "name": "workout-app",
  "version": "1.0.0",
  "description": "Personal workout + nutrition PWA — GZCLP v6",
  "type": "module",
  "scripts": {
    "test": "node --test tests/**/*.test.js"
  },
  "engines": { "node": ">=18" }
}
```

- [ ] **Step 4: Run all tests via npm**

```bash
npm test
```

Expected: same 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add package.json
git commit -m "chore: add package.json for node:test runner"
```

---

## Task 2: PWA manifest + service worker

**Files:**
- Create: `manifest.json`
- Create: `sw.js`
- Modify: `index.html` — add `<link rel="manifest">` + SW registration script

**Interfaces:**
- Produces: app installable on iPhone Safari, works offline

- [ ] **Step 1: Create manifest.json**

```json
{
  "name": "Workout — Alejandro",
  "short_name": "Workout",
  "description": "GZCLP v6 — entrenamiento y nutrición",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0f0820",
  "theme_color": "#0f0820",
  "start_url": "/#/dashboard",
  "lang": "es",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

- [ ] **Step 2: Create placeholder icons**

```bash
# Generate a simple purple square icon (requires ImageMagick; if not available, use any 192×192 PNG)
convert -size 192x192 xc:#4a2080 icon-192.png 2>/dev/null || \
  curl -o icon-192.png "https://via.placeholder.com/192/0f0820/cc88ff?text=W"
convert -size 512x512 xc:#4a2080 icon-512.png 2>/dev/null || \
  curl -o icon-512.png "https://via.placeholder.com/512/0f0820/cc88ff?text=W"
```

Note: Replace with proper icons before shipping. Any 192×192 and 512×512 PNG files work for testing.

- [ ] **Step 3: Create sw.js**

```js
// sw.js
const CACHE = 'workout-v1';
const PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/app.css',
  '/js/auth.js',
  '/js/router.js',
  '/js/db.js',
  '/js/workout-data.js',
  '/js/load-calculator.js',
  '/js/timer.js',
  '/js/views/dashboard.js',
  '/js/views/workout.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
```

- [ ] **Step 4: Modify index.html — add manifest link + SW registration**

In `<head>`, after the existing `<meta>` tags, add:
```html
  <link rel="manifest" href="/manifest.json">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Workout">
  <link rel="apple-touch-icon" href="/icon-192.png">
```

Before `</body>`, add:
```html
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
    }
  </script>
```

- [ ] **Step 5: Test in browser**

```bash
# Serve locally (Python built-in server)
python3 -m http.server 8080
```

Open `http://localhost:8080` in Safari/Chrome. Open DevTools → Application → Manifest. Verify: name, theme color, icons show correctly. Check Service Workers tab — status should be "activated and is running".

- [ ] **Step 6: Commit**

```bash
git add manifest.json sw.js index.html icon-192.png icon-512.png
git commit -m "feat: add PWA manifest and service worker (cache-first)"
```

---

## Task 3: CSS — pride theme + new components

**Files:**
- Create: `css/app.css`
- Modify: `index.html` — add `<link rel="stylesheet" href="css/app.css">`

**Interfaces:**
- Produces: CSS classes `.bottom-nav`, `.bottom-nav__item`, `.bottom-nav__item--active`, `.timer-overlay`, `.session-card`, `.ex-card`, `.set-row`, `.set-row--work`, `.set-row--pr`, `.progress-bar`, `.progress-bar__fill`, `.badge-kine`, `.pill-obligatorio`

- [ ] **Step 1: Create css/app.css**

```css
/* css/app.css — Workout PWA extensions */

:root {
  --bg:     #0f0820;
  --card:   #1a1030;
  --card2:  #221440;
  --border: #4a2080;
  --text:   #f0e8ff;
  --dim:    #c0b0e0;
  --pink:   #ff4d94;
  --orange: #ff8c50;
  --gold:   #ffd54f;
  --mint:   #4dffb8;
  --cyan:   #4dd8ff;
  --purple: #cc88ff;
  --safe-bottom: env(safe-area-inset-bottom, 0px);
}

/* ── Layout ── */
body { padding-bottom: calc(64px + var(--safe-bottom)); }

/* ── Bottom navigation ── */
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
  background: rgba(15,8,32,.97);
  backdrop-filter: blur(16px);
  border-top: 1px solid var(--border);
  padding-bottom: var(--safe-bottom);
  z-index: 200;
}
.bottom-nav__item {
  flex: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 4px 8px;
  font-size: 10px; font-weight: 700; letter-spacing: .5px;
  color: var(--dim);
  text-decoration: none;
  border: none; background: none; cursor: pointer;
  text-transform: uppercase;
  transition: color .15s;
}
.bottom-nav__item .icon { font-size: 20px; margin-bottom: 3px; }
.bottom-nav__item--active { color: var(--purple); }

/* ── Session card ── */
.session-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px;
  margin-bottom: 10px;
}
.session-card__title {
  font-size: 15px; font-weight: 800; color: var(--text);
  margin-bottom: 10px;
  display: flex; justify-content: space-between; align-items: center;
}

/* ── Set table ── */
.set-table { width: 100%; border-collapse: collapse; font-size: 13px; margin: 8px 0; }
.set-table th {
  text-align: left; padding: 6px 5px;
  font-size: 10px; text-transform: uppercase; letter-spacing: .5px;
  color: var(--dim); border-bottom: 1px solid var(--border);
}
.set-table td { padding: 7px 5px; border-bottom: 1px solid rgba(255,255,255,.05); color: var(--text); }
.set-table tr:last-child td { border-bottom: none; }
.set-row--work td  { color: var(--gold); font-weight: 700; }
.set-row--pr td    { color: var(--pink); font-weight: 800; font-size: 14px; }
.set-row--done td  { opacity: .5; text-decoration: line-through; }

/* ── Progress bar ── */
.progress-bar {
  height: 10px; border-radius: 5px;
  background: var(--card2); overflow: hidden; margin: 6px 0;
}
.progress-bar__fill {
  height: 100%; border-radius: 5px;
  background: linear-gradient(90deg, var(--pink), var(--purple));
  transition: width .4s ease;
}
.progress-bar__fill--success { background: linear-gradient(90deg, var(--mint), var(--cyan)); }

/* ── Rest timer overlay ── */
.timer-overlay {
  position: fixed; inset: 0; z-index: 500;
  background: rgba(15,8,32,.97);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 20px;
}
.timer-overlay__time {
  font-family: Georgia, serif;
  font-size: clamp(72px, 20vw, 96px);
  font-weight: 800; color: var(--text);
  background: linear-gradient(90deg, var(--pink), var(--purple));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.timer-overlay__label { font-size: 13px; color: var(--dim); letter-spacing: 2px; text-transform: uppercase; }
.timer-overlay__skip {
  margin-top: 20px;
  padding: 12px 32px; border-radius: 30px;
  border: 1.5px solid var(--border); background: var(--card);
  color: var(--dim); font-size: 14px; font-weight: 700;
  cursor: pointer;
}

/* ── Badges ── */
.badge-kine {
  display: inline-block; padding: 4px 12px; border-radius: 10px;
  background: rgba(77,216,255,.15); border: 1px solid var(--cyan);
  color: var(--cyan); font-size: 10px; font-weight: 800; letter-spacing: 1px;
}
.pill-obligatorio {
  display: inline-block; padding: 2px 8px; border-radius: 6px;
  background: rgba(255,77,148,.15); border: 1px solid var(--pink);
  color: var(--pink); font-size: 9px; font-weight: 800;
}
.pill-new {
  background: var(--mint); color: #0a2010;
  font-size: 9px; font-weight: 800; padding: 2px 7px; border-radius: 8px;
}

/* ── Phase banner ── */
.phase-banner {
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; font-weight: 800;
  margin: 16px 0 10px;
}
.phase-banner--pink   { background: rgba(255,77,148,.15); border: 1px solid rgba(255,77,148,.4); color: var(--pink); }
.phase-banner--mint   { background: rgba(77,255,184,.12); border: 1px solid rgba(77,255,184,.35); color: var(--mint); }
.phase-banner--gold   { background: rgba(255,213,79,.12); border: 1px solid rgba(255,213,79,.35); color: var(--gold); }
.phase-banner--cyan   { background: rgba(77,216,255,.12); border: 1px solid rgba(77,216,255,.35); color: var(--cyan); }
.phase-banner--purple { background: rgba(204,136,255,.12); border: 1px solid rgba(204,136,255,.35); color: var(--purple); }

/* ── Tip box ── */
.tip-box {
  background: #0d0820; border: 2px solid var(--gold);
  border-radius: 12px; padding: 13px 14px; margin: 10px 0;
}
.tip-box__title { font-size: 13px; font-weight: 800; color: var(--gold); margin-bottom: 6px; }
.tip-box ul { padding-left: 16px; }
.tip-box li { font-size: 13px; color: var(--text); margin-bottom: 5px; line-height: 1.45; }

/* ── EVA warning ── */
.eva-warning {
  background: rgba(255,77,148,.1); border: 1.5px solid var(--pink);
  border-radius: 10px; padding: 10px 14px;
  font-size: 13px; font-weight: 700; color: var(--pink);
  margin-bottom: 12px;
}
```

- [ ] **Step 2: Add link in index.html**

In `<head>`, after `<link rel="stylesheet" href="css/style.css">`, add:
```html
  <link rel="stylesheet" href="css/app.css">
```

- [ ] **Step 3: Verify in browser**

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Verify existing nutrical UI looks unchanged (no style regressions from the new CSS file).

- [ ] **Step 4: Commit**

```bash
git add css/app.css index.html
git commit -m "feat: add pride theme CSS — bottom-nav, timer, session-card components"
```

---

## Task 4: IndexedDB wrapper

**Files:**
- Create: `js/db.js`
- Create: `tests/db.test.js`

**Interfaces:**
- Produces:
  - `openDB(): Promise<IDBDatabase>`
  - `saveSession(session: SessionObject): Promise<number>` — returns generated id
  - `getSession(id: number): Promise<SessionObject>`
  - `getAllSessions(): Promise<SessionObject[]>`
  - `getSessionsByWeek(week: number): Promise<SessionObject[]>`

`SessionObject` shape:
```js
{
  id,          // auto (omit on save)
  date,        // "YYYY-MM-DD"
  session,     // "S1" | "S3" | "S5"
  week,        // 1–6
  phase,       // "volumen"|"acumulacion"|"intensificacion"|"peak_pr"
  completed,   // bool
  sets: [{
    exercise,  // string
    setNumber, // int
    reps,      // int
    weightKg,  // number
    rpe,       // number|null
    completed  // bool
  }]
}
```

- [ ] **Step 1: Write failing test**

Create `tests/db.test.js`:

```js
// tests/db.test.js
// IndexedDB is not available in Node — test the pure helper that builds
// the object store config and validates session objects.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateSession, DB_NAME, DB_VERSION, STORES } from '../js/db.js';

test('DB_NAME and DB_VERSION are defined', () => {
  assert.equal(typeof DB_NAME, 'string');
  assert.ok(DB_VERSION >= 1);
});

test('STORES contains workout_sessions', () => {
  assert.ok(STORES.includes('workout_sessions'));
});

test('validateSession accepts valid session', () => {
  const s = {
    date: '2026-06-28', session: 'S1', week: 1,
    phase: 'volumen', completed: false, sets: []
  };
  assert.doesNotThrow(() => validateSession(s));
});

test('validateSession rejects invalid session name', () => {
  const s = {
    date: '2026-06-28', session: 'S9', week: 1,
    phase: 'volumen', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /session/);
});

test('validateSession rejects week out of range', () => {
  const s = {
    date: '2026-06-28', session: 'S1', week: 9,
    phase: 'volumen', completed: false, sets: []
  };
  assert.throws(() => validateSession(s), /week/);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tests/db.test.js
```

Expected: FAIL — `Cannot find module '../js/db.js'`

- [ ] **Step 3: Create js/db.js**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tests/db.test.js
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/db.js tests/db.test.js
git commit -m "feat: add IndexedDB wrapper for workout sessions"
```

---

## Task 5: Static workout data

**Files:**
- Create: `js/workout-data.js`

**Interfaces:**
- Produces:
  - `PHASES: Phase[]` — 4 phases with week ranges
  - `SESSIONS: { S1, S3, S5, kine }` — complete program
  - `getPhaseForWeek(week: number): Phase`

- [ ] **Step 1: No test needed** — this is pure static data, verified visually in Task 8.

- [ ] **Step 2: Create js/workout-data.js**

```js
// js/workout-data.js
// Complete GZCLP v6 program data — static, never modified by the app.
// All load values are exact kg from the spec for Alejandro's PRs:
//   Press Banca base: 125 kg | DL Convencional base: 140 kg | Pullups: 6 reps

export const PHASES = [
  { weeks: [1,2], name: 'volumen',         label: 'Volumen',        color: 'pink',   t2Sets: '4-5×10-12', t3Rest: 75 },
  { weeks: [3,4], name: 'acumulacion',     label: 'Acumulación',    color: 'orange', t2Sets: '3-4×8-10',  t3Rest: 90 },
  { weeks: [5],   name: 'intensificacion', label: 'Intensificación',color: 'gold',   t2Sets: '3×8-10',    t3Rest: 90 },
  { weeks: [6],   name: 'peak_pr',         label: 'Peak PR ★',      color: 'purple', t2Sets: '2×8',       t3Rest: 0  },
];

export function getPhaseForWeek(week) {
  return PHASES.find(p => p.weeks.includes(week)) ?? PHASES[0];
}

// ── S1: Empuje ──────────────────────────────────────────────────────────────
export const S1 = {
  name: 'S1 — Empuje',
  color: 'pink',
  dayLabel: 'Lunes',

  warmup: [
    { name: 'Retracción escapular colgado',        load: 'Peso corporal', sets: 2, reps: '10',    rest: 30 },
    { name: 'Rotación externa mancuerna',          load: '3–5 kg',        sets: 2, reps: '12/lado', rest: 30 },
    { name: 'Deadbug con disco',                   load: '10 kg',         sets: 2, reps: '8/lado', rest: 30 },
    { name: 'Elevaciones laterales activación',    load: '4–5 kg',        sets: 2, reps: '15',    rest: 30 },
  ],

  T1: {
    exercise: 'Press Banca',
    prBase: 125,
    byWeek: {
      1: {
        warmup: [
          { label: '1a', reps: 8,  kg: 52,  rest: 90, type: 'warmup' },
          { label: '1b', reps: 6,  kg: 68,  rest: 90, type: 'warmup' },
          { label: '1c', reps: 4,  kg: 79,  rest: 120, type: 'warmup' },
        ],
        work: [
          { label: '1d', reps: 10, kg: 88,  rest: 180, type: 'work', note: 'excéntrica 3 seg' },
          { label: '1e', reps: 10, kg: 88,  rest: 180, type: 'work' },
          { label: '1f', reps: 8,  kg: 94,  rest: 0,   type: 'work', note: 'RPE 7 máximo' },
        ],
      },
      2: {
        warmup: [
          { label: '1a', reps: 8,  kg: 52,  rest: 90, type: 'warmup' },
          { label: '1b', reps: 6,  kg: 70,  rest: 90, type: 'warmup' },
          { label: '1c', reps: 4,  kg: 81,  rest: 120, type: 'warmup' },
        ],
        work: [
          { label: '1d', reps: 10, kg: 91,  rest: 180, type: 'work' },
          { label: '1e', reps: 10, kg: 91,  rest: 180, type: 'work' },
          { label: '1f', reps: 8,  kg: 97,  rest: 0,   type: 'work' },
        ],
      },
      3: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 104, rest: 240, type: 'work', note: '3×3' },
        ],
      },
      4: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3,  kg: 109, rest: 240, type: 'work', note: '3×3' },
          { label: 'Backoff',reps: 5,  kg: 91,  rest: 180, type: 'work', note: '2×5' },
        ],
      },
      5: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 114, rest: 300, type: 'work', note: '112–116 kg' },
        ],
      },
      6: {
        warmup: [],
        work: [
          { label: 'Intento 1', reps: 1, kg: 119, rest: 300, type: 'pr', note: '95% — sólido y rápido' },
          { label: 'Intento 2', reps: 1, kg: 123, rest: 300, type: 'pr', note: '98% — solo si intento 1 limpio' },
          { label: 'PR ★',      reps: 1, kg: 127, rest: 0,   type: 'pr', note: '125–129 kg' },
        ],
      },
    },
  },

  T2: [
    {
      name: 'Press militar barra',
      setsReps: '4×8-12', rest: 120,
      note: 'Agarre más ancho. Codos adelante. Última serie RPE 9.',
      removeWeeks: [6],
    },
    {
      name: 'Press inclinado mancuerna',
      setsReps: '4×8-12', rest: 90,
      note: 'Rango completo. Bajada 2–3 seg.',
      reduceWeeks: { 3: '3×8-12', 4: '3×8-12', 5: '3×8-12' },
      removeWeeks: [6],
    },
    {
      name: 'Fondos en paralelas',
      setsReps: '3×8-12', rest: 90,
      note: 'Peso corporal o +5 kg.',
      removeWeeks: [5, 6],
    },
    {
      name: 'Face pull polea',
      setsReps: '3×15', rest: 60,
      note: 'OBLIGATORIO — salud escapular.',
      obligatorio: true,
    },
  ],

  T3: [
    { name: 'Tríceps francés polea',   setsReps: '3×12-15', reduceWeek5: '2×10' },
    { name: 'Tríceps pushdown',         setsReps: '3×12-15', removeWeeks: [5, 6] },
    { name: 'Elevaciones laterales',    setsReps: '3×12-15', note: 'Pausa 1 seg posición baja.', reduceWeek5: '2×12' },
    { name: 'Abdominal oblicuo polea',  setsReps: '3×12-15/lado', removeWeeks: [5, 6] },
    { name: 'Plancha abdominal',        setsReps: '3×45"', reduceWeek5: '2×60"' },
  ],
};

// ── S3: Tirón ───────────────────────────────────────────────────────────────
export const S3 = {
  name: 'S3 — Tirón',
  color: 'mint',
  dayLabel: 'Miércoles',

  T1: {
    exercise: 'Pullups',
    note: 'Protocolo de dos frentes',
    frente1: {
      label: 'Frente 1 — Fuerza',
      warmup: { name: 'Escapulares', reps: 10, rest: 30, type: 'warmup' },
      description: '5 series al fallo controlado. Para cuando la velocidad baja.',
      sets: 5, rest: 180, type: 'bodyweight',
    },
    frente2: {
      label: 'Frente 2 — Volumen Asistido',
      description: '4 series asistidas, agarre prono. RPE 8.',
      sets: 4, reps: [8, 10], rest: 90, type: 'assisted',
      progressionNote: 'Reducir asistencia cada semana',
    },
    prTarget: { week6Reps: [10, 12], note: 'PR de reps, no de carga. 5 min descanso antes del intento.' },
  },

  T2: [
    { name: 'Remo con barra (Pendlay)',     setsReps: '5×5',      rest: 120, note: 'Espalda plana. Transferencia al DL.' },
    { name: 'Remo mancuerna unilateral',    setsReps: '4×8-12/lado', rest: 90, reduceWeeks: { 3: '3×8-12', 4: '3×8-12' } },
    { name: 'Chin up supinado',             setsReps: '4×8-12',   rest: 90, note: 'Palmas hacia ti. Bíceps activo. Rango completo.', isNew: true, reduceWeeks: { 3: '3×8-12', 4: '3×8-12' } },
  ],

  T3: [
    { name: 'Curl bíceps mancuerna 45°',  setsReps: '3×10-12', note: 'Supinación completa.' },
    { name: 'Curl martillo',               setsReps: '3×10-12', note: 'Braquial y braquiorradial.' },
    { name: 'Curl concentrado mancuerna', setsReps: '3×10/lado', note: 'Contracción peak.' },
    { name: 'Gemelos en Smith',            setsReps: '3×15-20', note: 'Frecuencia 2×. Rango completo.', isNew: true },
    { name: 'Curl inverso con barra',      setsReps: '2×12-15', note: 'Agarre prono. Antebrazo extensor.', isNew: true },
  ],

  hombroTerapeutico: {
    label: '— Hombro Terapéutico —',
    note: 'PARTE ESTRUCTURAL DEL PROGRAMA — no es accesorio opcional',
    exercises: [
      { name: 'Press landmine unilateral',        load: '25 kg',         setsReps: '2×12/lado' },
      { name: 'Chaos push up (pelota)',            load: 'Bandas gruesas', setsReps: '2×máx' },
      { name: 'Press serrato unilateral',          load: '@8',            setsReps: '2×20' },
      { name: 'Press banca inclinado con barra',   load: '@7',            setsReps: '3×8-10', note: 'Con barra, NO multipower.' },
    ],
  },
};

// ── S5: Cadena Posterior ────────────────────────────────────────────────────
export const S5 = {
  name: 'S5 — Cadena Posterior',
  color: 'gold',
  dayLabel: 'Viernes / Sábado',

  T1: {
    exercise: 'Peso Muerto Convencional',
    prBase: 140,
    technicalCues: [
      'Pies a ancho de cadera, barra sobre mediopiés',
      'Caderas atrás, espalda neutra',
      'Empuja el suelo — no jales la barra',
      'Si la espalda baja se redondea, para la serie',
    ],
    byWeek: {
      1: {
        warmup: [
          { label: '1a', reps: 5, kg: 60,  rest: 90,  type: 'warmup' },
          { label: '1b', reps: 4, kg: 90,  rest: 90,  type: 'warmup' },
          { label: '1c', reps: 3, kg: 115, rest: 120, type: 'warmup' },
          { label: '1d', reps: 2, kg: 130, rest: 120, type: 'warmup' },
        ],
        work: [
          { label: 'Top set', reps: 6, kg: 140, rest: 240, type: 'work', note: '3×5-6 — foco en técnica' },
        ],
      },
      2: {
        warmup: [
          { label: '1a', reps: 5, kg: 60,  rest: 90,  type: 'warmup' },
          { label: '1b', reps: 4, kg: 95,  rest: 90,  type: 'warmup' },
          { label: '1c', reps: 3, kg: 120, rest: 120, type: 'warmup' },
          { label: '1d', reps: 2, kg: 135, rest: 120, type: 'warmup' },
        ],
        work: [
          { label: 'Top set', reps: 6, kg: 140, rest: 240, type: 'work', note: 'Top set fijo — técnica' },
        ],
      },
      3: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 150, rest: 270, type: 'work', note: '3×3' },
        ],
      },
      4: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 155, rest: 270, type: 'work', note: '3×3' },
          { label: 'Backoff', reps: 5, kg: 135, rest: 180, type: 'work', note: '2×5' },
        ],
      },
      5: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 163, rest: 300, type: 'work', note: '162–165 kg' },
        ],
      },
      6: {
        warmup: [],
        work: [
          { label: 'Intento 1', reps: 1, kg: 170, rest: 300, type: 'pr', note: 'Rápido y limpio' },
          { label: 'Intento 2', reps: 1, kg: 175, rest: 300, type: 'pr', note: 'Solo si intento 1 impecable' },
          { label: 'PR ★',      reps: 1, kg: 180, rest: 0,   type: 'pr', note: '178–182 kg ★' },
        ],
      },
    },
  },

  T2: [
    {
      name: 'Leg curl acostado',
      setsReps: '4×8-12', rest: 90,
      note: 'Bajada 3 seg. Isquiotibial en elongación.',
      reduceWeeks: { 4: '3×8-12', 5: '3×8-10' },
    },
    {
      name: 'Gemelos en Smith',
      setsReps: '4×15-20', rest: 75,
      note: 'Rango completo. Pausa arriba y abajo.',
      reduceWeeks: { 4: '3×12', 5: '3×12' },
    },
  ],

  T3: [
    { name: 'Push ups con protracción',  setsReps: '3×máx', note: 'Empuje horizontal 2×. Empuja un poco más al final.', isNew: true },
    { name: 'Remo en polea sentado',     setsReps: '3×8-12', rest: 90, note: 'Tirón horizontal 2×. Codo pegado.', isNew: true },
    { name: 'Back extension',            setsReps: '3×12-15', note: 'Erector espinal directo.' },
    { name: 'Pallof press en polea',     setsReps: '3×12/lado', note: 'Antirrotación.' },
    { name: 'Plancha abdominal',         setsReps: '3×45"', removeWeeks: [5, 6] },
    { name: 'Elevación de rodillas',     setsReps: '3×10', removeWeeks: [5, 6] },
    { name: 'Curl inverso con barra',    setsReps: '3×12-15', note: 'Agarre prono. Braquiorradial.' },
    { name: 'Farmer carry',             setsReps: '3×30m', rest: 90, note: 'Grip al límite. Sube cuando 30m se sienten fáciles.' },
  ],
};

// ── Kine: S2 y S4 ───────────────────────────────────────────────────────────
export const KINE = {
  name: 'Kine — S2 y S4',
  color: 'cyan',
  readonly: true,
  evaMax: 3,
  videosRequired: [1, 2, 3, 5, 7],
  bloqueRodilla: [
    { num: 1, name: 'Bulgarian pogos',                     load: 'Barra 20 kg',    sets: 3, reps: '15',       rest: 30, video: true },
    { num: 2, name: 'Lateral hop + salto lateral 1:1',     load: '10 kg opcional', sets: 2, reps: '8/pierna', rest: 30, video: true },
    { num: 3, name: 'Squat frontal (back bar)',             load: '@8',             sets: 3, reps: '8',        rest: 60, video: true },
    { num: 4, name: 'Hip thrust bilateral',                 load: 'RPE 9',          sets: 3, reps: '10',       rest: 60 },
    { num: 5, name: 'High step con barra',                  load: '60 kg',          sets: 2, reps: '15',       rest: 120, video: true },
    { num: 6, name: 'Single leg RDL',                       load: '45 kg totales',  sets: 2, reps: '12/pierna', rest: 30 },
    { num: 7, name: 'Pistol SQ asistido con banda',         load: 'Sin peso',       sets: 2, reps: '8/pierna', rest: 60, video: true },
    { num: 8, name: 'Búlgaras unilaterales',                load: '12→28→30 kg',   reps: '12-15/pierna',       rest: 60 },
    { num: 9, name: 'Pata de glúteo en polea',              load: 'RPE 10',         sets: 3, reps: '12-15',    rest: 0 },
  ],
  bloqueHombro: [
    { num: 1, name: 'Retracción + depresión escapular',     load: 'Peso corporal', sets: 2, reps: '10',       rest: 30 },
    { num: 2, name: 'Isométrico acostado o en pared',       load: '5 kg (progresar)', sets: 3, reps: '12',    rest: 60 },
    { num: 3, name: 'Press landmine',                       load: '25 kg',         sets: 2, reps: '12',       rest: 60 },
    { num: 4, name: 'Deadbug con disco',                    load: '25 kg',         sets: 2, reps: '10/lado',  rest: 30 },
    { num: 5, name: 'Chaos push up (pelota)',                load: 'Bandas gruesas', sets: 2, reps: 'máx',     rest: 30 },
    { num: 6, name: 'Press serrato unilateral',              load: '@8',            sets: 2, reps: '20',       rest: 30 },
    { num: 7, name: 'Press banca inclinado con barra',       load: '@7',            sets: 3, reps: '8-10',     rest: 60, note: 'Con barra, NO multipower.' },
    { num: 8, name: 'Nadador con bandas',                    load: 'Banda tensa',   reps: '12/brazo',         rest: 60 },
  ],
};

export const SESSIONS = { S1, S3, S5, kine: KINE };
```

- [ ] **Step 3: Commit**

```bash
git add js/workout-data.js
git commit -m "feat: add complete GZCLP v6 static program data"
```

---

## Task 6: T1 load calculator

**Files:**
- Create: `js/load-calculator.js`
- Create: `tests/load-calculator.test.js`

**Interfaces:**
- Consumes: `SESSIONS` from `js/workout-data.js`
- Produces:
  - `getT1Sets(session: 'S1'|'S3'|'S5', week: number): Set[]`
  - `getCurrentWeek(programStartDate: string): number` — returns 1–6 clamped

- [ ] **Step 1: Write failing test**

```js
// tests/load-calculator.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getT1Sets, getCurrentWeek } from '../js/load-calculator.js';

test('getT1Sets S1 week 1 returns correct kg', () => {
  const sets = getT1Sets('S1', 1);
  const workSets = sets.filter(s => s.type === 'work');
  assert.equal(workSets[0].kg, 88);
  assert.equal(workSets[0].reps, 10);
  assert.equal(workSets[1].kg, 88);
  assert.equal(workSets[2].kg, 94);
});

test('getT1Sets S1 week 6 returns PR attempts', () => {
  const sets = getT1Sets('S1', 6);
  const prSets = sets.filter(s => s.type === 'pr');
  assert.equal(prSets.length, 3);
  assert.equal(prSets[0].kg, 119);
  assert.equal(prSets[1].kg, 123);
});

test('getT1Sets S5 week 1 returns 140 kg top set', () => {
  const sets = getT1Sets('S5', 1);
  const work = sets.find(s => s.type === 'work');
  assert.equal(work.kg, 140);
});

test('getT1Sets S5 week 6 returns PR sequence', () => {
  const sets = getT1Sets('S5', 6);
  assert.ok(sets.some(s => s.kg === 170 && s.type === 'pr'));
  assert.ok(sets.some(s => s.kg === 175 && s.type === 'pr'));
});

test('getCurrentWeek returns 1 for day 0', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today), 1);
});

test('getCurrentWeek returns 2 for day 8', () => {
  const d = new Date();
  d.setDate(d.getDate() - 8);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10)), 2);
});

test('getCurrentWeek clamps to 6 maximum', () => {
  const d = new Date();
  d.setDate(d.getDate() - 60);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10)), 6);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tests/load-calculator.test.js
```

Expected: FAIL — `Cannot find module '../js/load-calculator.js'`

- [ ] **Step 3: Create js/load-calculator.js**

```js
// js/load-calculator.js
import { SESSIONS } from './workout-data.js';

export function getT1Sets(session, week) {
  const s = SESSIONS[session];
  if (!s || !s.T1 || !s.T1.byWeek) return [];
  const weekData = s.T1.byWeek[week];
  if (!weekData) return [];
  return [...(weekData.warmup || []), ...(weekData.work || [])];
}

export function getCurrentWeek(programStartDate) {
  const start = new Date(programStartDate);
  const now   = new Date();
  const days  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const week  = Math.floor(days / 7) + 1;
  return Math.min(Math.max(week, 1), 6);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tests/load-calculator.test.js
```

Expected: all 7 tests pass.

- [ ] **Step 5: Run all tests**

```bash
npm test
```

Expected: all tests pass (formulas + db + load-calculator).

- [ ] **Step 6: Commit**

```bash
git add js/load-calculator.js tests/load-calculator.test.js
git commit -m "feat: add T1 load calculator with week-based progression"
```

---

## Task 7: Timer logic

**Files:**
- Create: `js/timer.js`
- Create: `tests/timer.test.js`

**Interfaces:**
- Produces:
  - `createTimer(seconds: number, onTick: (remaining: number) => void, onComplete: () => void): { start, stop, skip }`

- [ ] **Step 1: Write failing test**

```js
// tests/timer.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer } from '../js/timer.js';

test('createTimer calls onComplete when seconds elapse', async () => {
  let completed = false;
  const timer = createTimer(0, () => {}, () => { completed = true; });
  timer.start();
  await new Promise(r => setTimeout(r, 50));
  assert.ok(completed);
});

test('createTimer skip calls onComplete immediately', () => {
  let completed = false;
  const timer = createTimer(300, () => {}, () => { completed = true; });
  timer.start();
  timer.skip();
  assert.ok(completed);
});

test('createTimer stop prevents onComplete', async () => {
  let completed = false;
  const timer = createTimer(0, () => {}, () => { completed = true; });
  timer.start();
  timer.stop();
  await new Promise(r => setTimeout(r, 50));
  assert.equal(completed, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
node --test tests/timer.test.js
```

Expected: FAIL — `Cannot find module '../js/timer.js'`

- [ ] **Step 3: Create js/timer.js**

```js
// js/timer.js
export function createTimer(seconds, onTick, onComplete) {
  let remaining = seconds;
  let interval  = null;
  let active    = false;

  function stop() {
    active = false;
    if (interval) { clearInterval(interval); interval = null; }
  }

  function skip() {
    stop();
    onComplete();
  }

  function start() {
    active = true;
    if (remaining <= 0) { onComplete(); return; }
    onTick(remaining);
    interval = setInterval(() => {
      if (!active) return;
      remaining--;
      onTick(remaining);
      if (remaining <= 0) { stop(); onComplete(); }
    }, 1000);
  }

  return { start, stop, skip };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
node --test tests/timer.test.js
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/timer.js tests/timer.test.js
git commit -m "feat: add countdown timer with start/stop/skip"
```

---

## Task 8: Bottom navigation + router extension

**Files:**
- Create: `js/views/dashboard.js` (stub — full implementation in Plan 2)
- Modify: `js/router.js` — add bottom nav rendering + new routes
- Modify: `index.html` — add bottom nav container

**Interfaces:**
- Consumes: `renderDashboard()`, `renderWorkout()` from their view files
- Produces: bottom nav visible on all authenticated routes; `#/workout/S1`, `#/workout/S3`, `#/workout/S5`, `#/workout/kine` routes work

- [ ] **Step 1: Create js/views/dashboard.js (stub)**

```js
// js/views/dashboard.js
import { getCurrentWeek } from '../load-calculator.js';

export function renderDashboard() {
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  if (!localStorage.getItem('gzclp_program_start')) {
    localStorage.setItem('gzclp_program_start', startDate);
  }
  const week = getCurrentWeek(startDate);
  const prs  = JSON.parse(localStorage.getItem('gzclp_prs') || '{"banca":125,"deadlift":140,"pullups":6}');

  return `
    <div style="padding:20px 14px;">
      <div class="hero" style="border-radius:14px;margin-bottom:16px;">
        <div class="hero-eyebrow">▸ PRIDE EDITION ▸</div>
        <h1>Semana ${week} / 6</h1>
        <p class="hero-sub">GZCLP v6 — ${phaseLabel(week)}</p>
      </div>
      <div class="pr-strip" style="padding:0;margin-bottom:16px;">
        <div class="pr-card">
          <div class="pr-lbl">Press Banca</div>
          <div class="pr-val">${prs.banca} kg</div>
        </div>
        <div class="pr-card">
          <div class="pr-lbl">DL Conv.</div>
          <div class="pr-val">${prs.deadlift} kg</div>
        </div>
        <div class="pr-card">
          <div class="pr-lbl">Pullups</div>
          <div class="pr-val">${prs.pullups} reps</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;">
        <a href="#/workout/S1" style="display:block;padding:16px;background:var(--card);border:1px solid var(--pink);border-radius:14px;color:var(--pink);font-weight:800;text-decoration:none;text-align:center;">
          💪 Iniciar S1 — Empuje
        </a>
        <a href="#/workout/S3" style="display:block;padding:16px;background:var(--card);border:1px solid var(--mint);border-radius:14px;color:var(--mint);font-weight:800;text-decoration:none;text-align:center;">
          💪 Iniciar S3 — Tirón
        </a>
        <a href="#/workout/S5" style="display:block;padding:16px;background:var(--card);border:1px solid var(--gold);border-radius:14px;color:var(--gold);font-weight:800;text-decoration:none;text-align:center;">
          💪 Iniciar S5 — Cadena Posterior
        </a>
        <a href="#/workout/kine" style="display:block;padding:16px;background:var(--card);border:1px solid var(--cyan);border-radius:14px;color:var(--cyan);font-weight:800;text-decoration:none;text-align:center;">
          🏥 Ver Kine — S2 / S4
        </a>
      </div>
    </div>
  `;
}

export function bindDashboard() {}

function phaseLabel(week) {
  if (week <= 2) return 'Fase Volumen';
  if (week <= 4) return 'Acumulación';
  if (week === 5) return 'Intensificación';
  return 'Peak PR ★';
}
```

- [ ] **Step 2: Modify js/router.js — add bottom nav + new routes**

Replace the full contents of `js/router.js` with:

```js
// js/router.js
import { isLoggedIn }                                   from './auth.js';
import { renderLogin, bindLogin }                       from './views/login.js';
import { renderPatients, bindPatients }                 from './views/patients.js';
import { renderPatientDetail, bindPatientDetail }       from './views/patient-detail.js';
import { renderConsultation, bindConsultation }         from './views/consultation.js';
import { renderReport, bindReport }                     from './views/report.js';
import { renderDashboard, bindDashboard }               from './views/dashboard.js';
import { renderWorkout, bindWorkout }                   from './views/workout.js';

const main    = () => document.getElementById('main');
const nav     = () => document.getElementById('topnav');
const bottomNav = () => document.getElementById('bottom-nav');

const WORKOUT_ROUTES = ['dashboard', 'workout', 'nutrition', 'mobility', 'progress'];

function renderTopNav(patientName) {
  const n = nav();
  n.classList.remove('hidden');
  n.innerHTML = `
    <span class="brand">Nutrical</span>
    ${patientName ? `<span style="color:rgba(255,255,255,.6);font-size:13px">${patientName}</span>` : ''}
    <button id="logout-btn">Cerrar sesión</button>
  `;
  document.getElementById('logout-btn').addEventListener('click', () => {
    import('./auth.js').then(m => m.logout());
  });
}

function renderBottomNav(active) {
  const bn = bottomNav();
  if (!bn) return;
  const tabs = [
    { key: 'dashboard',  label: 'Inicio',    icon: '🏠', href: '#/dashboard' },
    { key: 'workout',    label: 'Entrena',   icon: '💪', href: '#/workout/S1' },
    { key: 'nutrition',  label: 'Nutrición', icon: '🥗', href: '#/nutrition' },
    { key: 'mobility',   label: 'Movilidad', icon: '🧘', href: '#/mobility' },
    { key: 'progress',   label: 'Progreso',  icon: '📈', href: '#/progress' },
  ];
  bn.innerHTML = `<nav class="bottom-nav">${tabs.map(t => `
    <a href="${t.href}" class="bottom-nav__item ${t.key === active ? 'bottom-nav__item--active' : ''}">
      <span class="icon">${t.icon}</span>${t.label}
    </a>`).join('')}</nav>`;
}

function hideBottomNav() {
  const bn = bottomNav();
  if (bn) bn.innerHTML = '';
}

async function route() {
  const hash  = location.hash || '#/login';
  const parts = hash.replace('#/', '').split('/');
  const root  = parts[0];

  if (!isLoggedIn() && root !== 'login') {
    location.hash = '#/login';
    return;
  }

  // Login
  if (root === 'login' || !isLoggedIn()) {
    hideBottomNav();
    main().innerHTML = renderLogin();
    bindLogin();
    return;
  }

  // Workout app routes
  if (root === 'dashboard') {
    nav().classList.add('hidden');
    renderBottomNav('dashboard');
    main().innerHTML = renderDashboard();
    bindDashboard();
    return;
  }

  if (root === 'workout' && parts[1]) {
    nav().classList.add('hidden');
    renderBottomNav('workout');
    main().innerHTML = renderWorkout(parts[1]);
    bindWorkout(parts[1]);
    return;
  }

  // Nutrical legacy routes
  if (root === 'patients' && !parts[1]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderPatients();
    bindPatients();
    return;
  }

  if (root === 'patients' && parts[1] && !parts[2]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderPatientDetail(parts[1]);
    await bindPatientDetail(parts[1]);
    return;
  }

  if (root === 'patients' && parts[2] === 'c' && parts[3]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderConsultation(parts[1], parseInt(parts[3]));
    bindConsultation(parts[1], parseInt(parts[3]));
    return;
  }

  if (root === 'patients' && parts[2] === 'report') {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderReport(parts[1]);
    bindReport(parts[1]);
    return;
  }

  location.hash = '#/dashboard';
}

export function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
```

- [ ] **Step 3: Add bottom-nav container to index.html**

In `index.html`, change:
```html
  <div id="app">
    <nav id="topnav" class="hidden"></nav>
    <main id="main"></main>
  </div>
```
to:
```html
  <div id="app">
    <nav id="topnav" class="hidden"></nav>
    <main id="main"></main>
    <div id="bottom-nav"></div>
  </div>
```

- [ ] **Step 4: Test in browser**

```bash
python3 -m http.server 8080
```

Log in, navigate to `http://localhost:8080/#/dashboard`. Verify:
- Bottom nav appears with 5 tabs
- Active tab highlights in purple
- Tapping "Entrena" changes active tab
- Existing nutrical routes (`#/patients`) still work with top nav

- [ ] **Step 5: Commit**

```bash
git add js/router.js js/views/dashboard.js index.html
git commit -m "feat: add bottom navigation and workout app routes"
```

---

## Task 9: Workout session view — S1, S3, S5, Kine

**Files:**
- Create: `js/views/workout.js`

**Interfaces:**
- Consumes: `SESSIONS`, `getPhaseForWeek` from `js/workout-data.js`; `getT1Sets` from `js/load-calculator.js`; `saveSession` from `js/db.js`; `createTimer` from `js/timer.js`
- Produces: `renderWorkout(session: string): string`, `bindWorkout(session: string): void`

- [ ] **Step 1: No unit test** — view is DOM-heavy. Tested visually in browser.

- [ ] **Step 2: Create js/views/workout.js**

```js
// js/views/workout.js
import { SESSIONS, getPhaseForWeek } from '../workout-data.js';
import { getT1Sets, getCurrentWeek } from '../load-calculator.js';
import { saveSession }                from '../db.js';
import { createTimer }                from '../timer.js';

let activeTimer = null;

export function renderWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];
  if (!session) return `<p style="padding:20px;color:var(--dim)">Sesión no encontrada.</p>`;
  if (session.readonly) return renderKine(session);

  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const week      = getCurrentWeek(startDate);
  const phase     = getPhaseForWeek(week);
  const t1Sets    = getT1Sets(sessionKey, week);

  return `
    <div style="padding:14px 14px 20px;" id="workout-view">
      <div class="phase-banner phase-banner--${phase.color}">
        ◈ ${phase.label} — Semana ${week}
      </div>

      ${sessionKey === 'S1' ? renderWarmup(session.warmup) : ''}

      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--${session.color})"></span>T1 — ${session.T1.exercise}
      </h2>
      ${renderT1Table(t1Sets)}

      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--mint)"></span>T2 — Hipertrofia
        <span style="font-size:11px;color:var(--dim);font-weight:400;">tempo 2-3s · última RPE 9</span>
      </h2>
      ${renderT2List(session.T2, week)}

      ${session.hombroTerapeutico ? renderHombroTerapeutico(session.hombroTerapeutico) : ''}

      <h2 class="sh" style="margin-top:18px;">
        <span class="dot" style="background:var(--orange)"></span>T3 — Aislamiento
      </h2>
      ${renderT3List(session.T3, week)}

      <button id="btn-complete-session"
        style="width:100%;margin-top:24px;padding:16px;border-radius:14px;
               border:none;background:var(--purple);color:#fff;
               font-size:16px;font-weight:800;cursor:pointer;">
        ✓ Completar sesión
      </button>
    </div>
    <div id="timer-overlay" class="timer-overlay" style="display:none;">
      <div class="timer-overlay__label">Descanso</div>
      <div class="timer-overlay__time" id="timer-display">0:00</div>
      <button class="timer-overlay__skip" id="btn-skip-timer">Saltar</button>
    </div>
  `;
}

export function bindWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];
  if (!session || session.readonly) return;

  // Rest timer on set rows
  document.querySelectorAll('[data-rest]').forEach(btn => {
    btn.addEventListener('click', () => {
      const secs = parseInt(btn.dataset.rest, 10);
      if (secs > 0) startTimer(secs);
    });
  });

  // Skip timer
  const skipBtn = document.getElementById('btn-skip-timer');
  if (skipBtn) skipBtn.addEventListener('click', () => { if (activeTimer) activeTimer.skip(); });

  // Complete session
  const completeBtn = document.getElementById('btn-complete-session');
  if (completeBtn) {
    completeBtn.addEventListener('click', async () => {
      const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
      const week      = getCurrentWeek(startDate);
      const phase     = getPhaseForWeek(week);
      await saveSession({
        date: new Date().toISOString().slice(0,10),
        session: sessionKey,
        week,
        phase: phase.name,
        completed: true,
        sets: [],
      });
      completeBtn.textContent = '✓ ¡Sesión guardada!';
      completeBtn.style.background = 'var(--mint)';
      completeBtn.style.color = '#0a2010';
      completeBtn.disabled = true;
    });
  }
}

// ── Render helpers ──────────────────────────────────────────────────────────

function renderWarmup(exercises) {
  return `
    <h2 class="sh" style="margin-top:4px;">
      <span class="dot" style="background:var(--cyan)"></span>Calentamiento Hombro
      <span class="pill-obligatorio">OBLIGATORIO</span>
    </h2>
    ${exercises.map(e => `
      <div class="session-card">
        <div class="session-card__title">${e.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${e.load}</b> · ${e.sets}×${e.reps} · ${e.rest}"
        </div>
      </div>
    `).join('')}
  `;
}

function renderT1Table(sets) {
  if (!sets.length) return `<p style="color:var(--dim);font-size:13px;padding:8px 0;">Sin sets para esta semana.</p>`;
  return `
    <table class="set-table">
      <thead><tr><th>Serie</th><th>Reps</th><th>Kg</th><th>Desc</th><th></th></tr></thead>
      <tbody>
        ${sets.map(s => `
          <tr class="${s.type === 'work' ? 'set-row--work' : s.type === 'pr' ? 'set-row--pr' : ''}">
            <td>${s.label}</td>
            <td>${s.reps}</td>
            <td>${s.kg}</td>
            <td>${s.rest ? s.rest + '"' : '—'}</td>
            <td>${s.rest > 0 ? `<button data-rest="${s.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;cursor:pointer;">▶</button>` : ''}</td>
          </tr>
          ${s.note ? `<tr><td colspan="5" style="font-size:11px;color:var(--cyan);padding-bottom:6px;">${s.note}</td></tr>` : ''}
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderT2List(exercises, week) {
  return exercises
    .filter(e => !e.removeWeeks?.includes(week))
    .map(e => {
      const setsReps = e.reduceWeeks?.[week] ?? e.setsReps;
      return `
        <div class="session-card">
          <div class="session-card__title">
            ${e.name}
            ${e.obligatorio ? '<span class="pill-obligatorio">OBLIGATORIO</span>' : ''}
          </div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${setsReps}</b>
            ${e.rest ? `· ${e.rest}"` : ''}
            ${e.rest > 0 ? `<button data-rest="${e.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:3px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>` : ''}
          </div>
          ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
        </div>
      `;
    }).join('');
}

function renderT3List(exercises, week) {
  return exercises
    .filter(e => !e.removeWeeks?.includes(week))
    .map(e => {
      const setsReps = week === 5 && e.reduceWeek5 ? e.reduceWeek5 : e.setsReps;
      return `
        <div class="session-card">
          <div class="session-card__title">
            ${e.name}
            ${e.isNew ? '<span class="pill-new">v6</span>' : ''}
          </div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${setsReps}</b>
            ${e.rest ? `· ${e.rest}"` : ''}
          </div>
          ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
        </div>
      `;
    }).join('');
}

function renderHombroTerapeutico(bloque) {
  return `
    <div style="margin:16px 0 8px;font-size:12px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">
      — Hombro Terapéutico —
    </div>
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px;">${bloque.note}</div>
    ${bloque.exercises.map(e => `
      <div class="session-card">
        <div class="session-card__title">${e.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${e.load}</b> · ${e.setsReps}
        </div>
        ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
      </div>
    `).join('')}
  `;
}

function renderKine(session) {
  return `
    <div style="padding:14px 14px 20px;">
      <div class="eva-warning">⚠ EVA máximo ${session.evaMax}/10 — si hay molestia, reducir y reportar al kine.</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <h2 style="font-size:17px;font-weight:800;color:var(--text);">${session.name}</h2>
        <span class="badge-kine">PROTOCOLO KINE — solo lectura</span>
      </div>
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin:12px 0 8px;padding-left:10px;border-left:3px solid var(--cyan);">Bloque Rodilla</h3>
      ${session.bloqueRodilla.map(e => `
        <div class="session-card">
          <div class="session-card__title">
            ${e.num}. ${e.name}
            ${e.video ? '<span style="background:var(--cyan);color:#001020;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;">VIDEO</span>' : ''}
          </div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${e.load}</b> · ${e.reps ?? (e.sets + '×' + e.reps)} · ${e.rest || 0}"
          </div>
        </div>
      `).join('')}
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin:18px 0 8px;padding-left:10px;border-left:3px solid var(--purple);">Bloque Hombro</h3>
      ${session.bloqueHombro.map(e => `
        <div class="session-card">
          <div class="session-card__title">${e.num}. ${e.name}</div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${e.load}</b> · ${e.reps ?? (e.sets + '×' + e.reps)} · ${e.rest || 0}"
          </div>
          ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ── Timer ───────────────────────────────────────────────────────────────────
function startTimer(seconds) {
  const overlay  = document.getElementById('timer-overlay');
  const display  = document.getElementById('timer-display');
  if (!overlay || !display) return;

  overlay.style.display = 'flex';

  if (activeTimer) activeTimer.stop();

  activeTimer = createTimer(
    seconds,
    remaining => { display.textContent = formatTime(remaining); },
    () => {
      overlay.style.display = 'none';
      activeTimer = null;
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
  );
  activeTimer.start();
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
```

- [ ] **Step 3: Test in browser**

```bash
python3 -m http.server 8080
```

Navigate to `http://localhost:8080/#/workout/S1`. Verify:
- Phase banner shows correct week/phase
- S1 warmup section appears first
- T1 table shows correct weights for current week
- Tapping ▶ on a set opens the timer overlay with countdown
- Skip closes the overlay
- "Completar sesión" saves and shows confirmation

Navigate to `#/workout/kine`. Verify:
- EVA warning appears
- "PROTOCOLO KINE — solo lectura" badge visible
- No edit controls, no complete button

Navigate to `#/workout/S3` and `#/workout/S5`. Verify each shows correct exercises for current week.

- [ ] **Step 4: Run all tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/views/workout.js
git commit -m "feat: add workout session view — S1/S3/S5/Kine with T1 auto-loads and rest timer"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| PWA offline / installable | Task 2 |
| Pride color palette | Task 3 |
| IndexedDB persistence | Task 4 |
| GZCLP v6 full program data | Task 5 |
| T1 auto load calculation | Task 6 |
| Rest timer | Task 7 |
| Bottom navigation | Task 8 |
| Session views S1/S3/S5 | Task 9 |
| Kine read-only | Task 9 |
| Face pull OBLIGATORIO | Task 9 (renderT2List) |
| Hombro terapéutico structural | Task 9 (renderHombroTerapeutico) |
| EVA max 3/10 reminder | Task 9 (renderKine) |
| Session logged to IndexedDB | Task 9 (bindWorkout) |
| Calendar-based week | Task 6 (getCurrentWeek) |

**Placeholder scan:** No TBDs. Every step has actual code.

**Type consistency:**
- `getT1Sets(session, week)` defined in Task 6, consumed in Task 9 ✓
- `createTimer(seconds, onTick, onComplete)` defined in Task 7, consumed in Task 9 ✓
- `saveSession(session)` defined in Task 4, consumed in Task 9 ✓
- `SESSIONS[key]` defined in Task 5, consumed in Tasks 8+9 ✓
- `renderWorkout(sessionKey)` / `bindWorkout(sessionKey)` produced in Task 9, consumed in Task 8 (router) ✓

**Gap found:** The router in Task 8 imports `renderWorkout` and `bindWorkout` from `js/views/workout.js` but that file doesn't exist until Task 9. **Fix:** Tasks are ordered correctly (Task 8 before Task 9), but the `js/views/workout.js` import in Task 8's router will cause an error until Task 9 is done. Resolution: in Task 8, also create a minimal stub for `workout.js` before modifying router. Added stub content to Task 8 Step 2 note.

Actually the plan already creates `dashboard.js` as a stub in Task 8 Step 1. The workout.js is fully created in Task 9. The router imports both. To avoid a broken state between tasks 8 and 9, add a workout stub in Task 8.

**Fix applied** — add this note to Task 8 Step 2: create a minimal workout.js stub alongside dashboard.js so the router doesn't fail on import:

```js
// Minimal stub — replaced in Task 9
export function renderWorkout(s) { return `<p style="padding:20px;color:var(--dim)">Cargando ${s}…</p>`; }
export function bindWorkout() {}
```

Create this file at the start of Task 8 Step 1.
