# Brute: Back Navigation, Manual Week, Print, Longer Login — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a back button to workout/kine/progress views, a manual week override on the dashboard, a print button for workout sessions, and a silent-renewal login flow so the user rarely sees the Google login screen.

**Architecture:** Four independent slices sharing two data-layer additions (a `weekOverride` parameter threaded through `getCurrentWeek`, and per-athlete override storage in `athletes.js`). No new files beyond one test file; all view changes are template-string edits to existing render/bind functions in `js/views/`.

**Tech Stack:** Vanilla JS (ES modules), no framework. Tests run via `node --test tests/*.test.js` (Node's built-in test runner, no jsdom — DOM-touching code is verified manually in a browser, matching the existing test suite's scope).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-06-30-brute-nav-week-print-login-design.md` (file name as committed: `2026-06-30-brute-nav-week-print-design.md`).
- Existing call signature `getCurrentWeek(startDate)` (one argument) must keep working — `tests/load-calculator.test.js` already calls it that way.
- No new npm dependencies. No new CSS classes where an existing class (`.btn`, `.btn-dim`) already fits.
- Reuse `data-*` attributes for both JS event wiring and print-CSS hiding, to avoid parallel class+attribute bookkeeping.

---

### Task 1: `getCurrentWeek` accepts a manual override

**Files:**
- Modify: `js/load-calculator.js:12-18`
- Test: `tests/load-calculator.test.js` (append)

**Interfaces:**
- Produces: `getCurrentWeek(programStartDate, weekOverride?)` — if `weekOverride` is not `null`/`undefined`, returns it clamped to `[1,6]` and ignores `programStartDate` entirely; otherwise behaves exactly as before (date-based calculation, clamped `[1,6]`).

- [ ] **Step 1: Write the failing tests**

Append to `tests/load-calculator.test.js`:

```js
test('getCurrentWeek returns override when provided', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 4), 4);
});

test('getCurrentWeek clamps override above 6', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 9), 6);
});

test('getCurrentWeek clamps override below 1', () => {
  const today = new Date().toISOString().slice(0, 10);
  assert.equal(getCurrentWeek(today, 0), 1);
});

test('getCurrentWeek falls back to date calculation when override is null', () => {
  const d = new Date();
  d.setDate(d.getDate() - 8);
  assert.equal(getCurrentWeek(d.toISOString().slice(0, 10), null), 2);
});
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `npm test`
Expected: the 4 new tests FAIL (override argument is currently ignored), the 3 pre-existing `getCurrentWeek` tests still PASS.

- [ ] **Step 3: Implement the override**

Replace `js/load-calculator.js:12-18`:

```js
export function getCurrentWeek(programStartDate, weekOverride) {
  if (weekOverride != null) {
    return Math.min(Math.max(parseInt(weekOverride, 10), 1), 6);
  }
  const start = new Date(programStartDate);
  const now   = new Date();
  const days  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const week  = Math.floor(days / 7) + 1;
  return Math.min(Math.max(week, 1), 6);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all `load-calculator.test.js` tests PASS (7 total).

- [ ] **Step 5: Commit**

```bash
git add js/load-calculator.js tests/load-calculator.test.js
git commit -m "feat: support manual week override in getCurrentWeek"
```

---

### Task 2: Per-athlete week override storage

**Files:**
- Modify: `js/athletes.js` (append after `setAthleteProgramStart`, currently ending at line 84)
- Test: Create `tests/athletes.test.js`

**Interfaces:**
- Consumes: `athleteKey(athleteId, suffix)` (already exported in `js/athletes.js:54-56`).
- Produces: `getAthleteWeekOverride(athleteId): number|null`, `setAthleteWeekOverride(athleteId, week)` — `week` is clamped to `[1,6]` before storing.

- [ ] **Step 1: Write the failing tests**

Create `tests/athletes.test.js`:

```js
// tests/athletes.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';

// Node has no built-in localStorage — provide a minimal in-memory shim
// before importing athletes.js, since module-level code in athletes.js
// touches localStorage as soon as its functions run.
class LocalStorageShim {
  #store = new Map();
  getItem(key) { return this.#store.has(key) ? this.#store.get(key) : null; }
  setItem(key, value) { this.#store.set(key, String(value)); }
  removeItem(key) { this.#store.delete(key); }
  clear() { this.#store.clear(); }
}
globalThis.localStorage = new LocalStorageShim();

const { getAthleteWeekOverride, setAthleteWeekOverride } = await import('../js/athletes.js');

test('getAthleteWeekOverride returns null when unset', () => {
  assert.equal(getAthleteWeekOverride('nobody'), null);
});

test('setAthleteWeekOverride then getAthleteWeekOverride round-trips', () => {
  setAthleteWeekOverride('alejandro', 3);
  assert.equal(getAthleteWeekOverride('alejandro'), 3);
});

test('setAthleteWeekOverride clamps above 6', () => {
  setAthleteWeekOverride('alejandro', 9);
  assert.equal(getAthleteWeekOverride('alejandro'), 6);
});

test('setAthleteWeekOverride clamps below 1', () => {
  setAthleteWeekOverride('alejandro', 0);
  assert.equal(getAthleteWeekOverride('alejandro'), 1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with "getAthleteWeekOverride is not a function" (or similar import error).

- [ ] **Step 3: Implement the storage functions**

Append to `js/athletes.js` (after the existing `setAthleteProgramStart` function, end of file):

```js

export function getAthleteWeekOverride(athleteId) {
  const stored = localStorage.getItem(athleteKey(athleteId, 'week_override'));
  return stored ? parseInt(stored, 10) : null;
}

export function setAthleteWeekOverride(athleteId, week) {
  const clamped = Math.min(Math.max(parseInt(week, 10), 1), 6);
  localStorage.setItem(athleteKey(athleteId, 'week_override'), String(clamped));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: all 4 new tests in `athletes.test.js` PASS, and the full suite (all `tests/*.test.js`) still PASSES.

- [ ] **Step 5: Commit**

```bash
git add js/athletes.js tests/athletes.test.js
git commit -m "feat: add per-athlete manual week override storage"
```

---

### Task 3: Manual week selector on the dashboard

**Files:**
- Modify: `js/views/dashboard.js:2-5` (imports), `:11-48` (`renderDashboard`), `:221-273` (`bindDashboard`)

**Interfaces:**
- Consumes: `getCurrentWeek` (Task 1), `getAthleteWeekOverride`/`setAthleteWeekOverride` (Task 2), `getAthleteProgramStart` (already imported).
- Produces: clicking `‹`/`›` on the dashboard changes the active athlete's stored week override and reloads the page.

- [ ] **Step 1: Update imports**

In `js/views/dashboard.js`, replace lines 2-5:

```js
import { getCurrentWeek } from '../load-calculator.js';
import { getAthletes, getActiveAthlete, getActiveAthleteId, setActiveAthlete,
         saveAthlete, deleteAthlete, getAthletePRs, setAthletePRs,
         getAthleteProgramStart, setAthleteProgramStart } from '../athletes.js';
```

with:

```js
import { getCurrentWeek } from '../load-calculator.js';
import { getAthletes, getActiveAthlete, getActiveAthleteId, setActiveAthlete,
         saveAthlete, deleteAthlete, getAthletePRs, setAthletePRs,
         getAthleteProgramStart, setAthleteProgramStart,
         getAthleteWeekOverride, setAthleteWeekOverride } from '../athletes.js';
```

- [ ] **Step 2: Pass the override into `getCurrentWeek` in `renderDashboard`**

Replace `js/views/dashboard.js:13-14`:

```js
  const startDate = getAthleteProgramStart(athlete.id);
  const week      = getCurrentWeek(startDate);
```

with:

```js
  const startDate = getAthleteProgramStart(athlete.id);
  const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athlete.id));
```

- [ ] **Step 3: Add prev/next controls to the week label**

Replace `js/views/dashboard.js:46` (the `<h1>` line):

```html
        <h1>${esc(athlete.icon||'🏋️')} ${esc(athlete.name)} — S${week}/6</h1>
```

with:

```html
        <h1>${esc(athlete.icon||'🏋️')} ${esc(athlete.name)} —
          <button class="week-nav-btn" data-week-action="prev" aria-label="Semana anterior" ${week<=1?'disabled':''}>‹</button>
          S${week}/6
          <button class="week-nav-btn" data-week-action="next" aria-label="Semana siguiente" ${week>=6?'disabled':''}>›</button>
        </h1>
```

- [ ] **Step 4: Wire the buttons in `bindDashboard`**

At the top of `bindDashboard` (`js/views/dashboard.js:221`), add the athlete lookup and a new click handler block, right after the function signature:

```js
export function bindDashboard() {
  const athlete = getActiveAthlete();

  // Manual week selector
  document.querySelectorAll('[data-week-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const startDate = getAthleteProgramStart(athlete.id);
      const current   = getCurrentWeek(startDate, getAthleteWeekOverride(athlete.id));
      const delta      = btn.dataset.weekAction === 'next' ? 1 : -1;
      setAthleteWeekOverride(athlete.id, current + delta);
      location.reload();
    });
  });

  // GZCLP info toggle
  document.getElementById('gzclp-toggle')?.addEventListener('click', () => {
```

(Leave the rest of the existing `bindDashboard` body — the GZCLP toggle, athlete switcher, and add-athlete modal wiring — exactly as-is below this point.)

- [ ] **Step 5: Add the `.week-nav-btn` style**

Append to `css/app.css`:

```css
.week-nav-btn {
  background: transparent; border: 1px solid var(--border); color: var(--dim);
  border-radius: 6px; width: 26px; height: 26px; font-size: 16px; line-height: 1;
  cursor: pointer; vertical-align: middle;
}
.week-nav-btn:disabled { opacity: .3; cursor: default; }
.week-nav-btn:not(:disabled):hover { border-color: var(--cyan); color: var(--cyan); }
```

- [ ] **Step 6: Run the full test suite (regression check)**

Run: `npm test`
Expected: all tests still PASS (this task touches no pure-logic function covered by tests).

- [ ] **Step 7: Manual verification**

1. Serve the app locally (e.g. `npx serve .` or any static server) and open `#/dashboard` logged in.
2. Confirm `‹ S{week}/6 ›` renders, with `‹` disabled at week 1 and `›` disabled at week 6.
3. Click `›` — page reloads, week increments by 1, `#/workout/S1` now shows next week's `byWeek` data.
4. Click `‹` back down — week decrements, `#/workout/S1` reflects it.
5. Switch athlete (if more than one exists) and confirm the week override is independent per athlete.

- [ ] **Step 8: Commit**

```bash
git add js/views/dashboard.js css/app.css
git commit -m "feat: add manual week selector to dashboard"
```

---

### Task 4: Propagate the week override to workout and progress views

**Files:**
- Modify: `js/views/workout.js:1-5` (imports), `:14-15` (`renderWorkout`), `:85-86` (`bindWorkout` complete handler)
- Modify: `js/views/progress.js:1-4` (imports), `:85-86` (`renderProgress`)

**Interfaces:**
- Consumes: `getActiveAthleteId`, `getAthleteWeekOverride` (Task 2); `getCurrentWeek(startDate, weekOverride)` (Task 1).

- [ ] **Step 1: Update `workout.js` imports**

Replace `js/views/workout.js:2-5`:

```js
import { SESSIONS, getPhaseForWeek } from '../workout-data.js';
import { getT1Sets, getCurrentWeek } from '../load-calculator.js';
import { saveSession }                from '../db.js';
import { createTimer }                from '../timer.js';
```

with:

```js
import { SESSIONS, getPhaseForWeek } from '../workout-data.js';
import { getT1Sets, getCurrentWeek } from '../load-calculator.js';
import { saveSession }                from '../db.js';
import { createTimer }                from '../timer.js';
import { getActiveAthleteId, getAthleteWeekOverride } from '../athletes.js';
```

- [ ] **Step 2: Use the override in `renderWorkout`**

Replace `js/views/workout.js:14-15`:

```js
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const week      = getCurrentWeek(startDate);
```

with:

```js
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const athleteId = getActiveAthleteId();
  const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athleteId));
```

- [ ] **Step 3: Use the override in the "Completar sesión" handler**

Replace `js/views/workout.js:85-86` (inside `bindWorkout`'s `completeBtn` click listener):

```js
      const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
      const week      = getCurrentWeek(startDate);
```

with:

```js
      const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
      const athleteId = getActiveAthleteId();
      const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athleteId));
```

- [ ] **Step 4: Update `progress.js` imports**

Replace `js/views/progress.js:3-4`:

```js
import { SESSIONS, PHASES, getPhaseForWeek } from '../workout-data.js';
import { getCurrentWeek } from '../load-calculator.js';
```

with:

```js
import { SESSIONS, PHASES, getPhaseForWeek } from '../workout-data.js';
import { getCurrentWeek } from '../load-calculator.js';
import { getActiveAthleteId, getAthleteWeekOverride } from '../athletes.js';
```

- [ ] **Step 5: Use the override in `renderProgress`**

Replace `js/views/progress.js:85-86`:

```js
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const week      = getCurrentWeek(startDate);
```

with:

```js
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const athleteId = getActiveAthleteId();
  const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athleteId));
```

- [ ] **Step 6: Run the full test suite (regression check)**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 7: Manual verification**

1. On the dashboard, advance the week override to week 3 (Task 3's controls).
2. Open `#/workout/S1` — confirm the `byWeek[3]` data renders (top ×3 set, no warmup rows, per `js/workout-data.js:58-63`).
3. Open `#/progress` — confirm "Semana actual: S3" and the current-week highlighted row match.

- [ ] **Step 8: Commit**

```bash
git add js/views/workout.js js/views/progress.js
git commit -m "feat: use manual week override in workout and progress views"
```

---

### Task 5: Back button on workout, kine, and progress views

**Files:**
- Modify: `js/views/workout.js` (`renderWorkout`, `renderKine`, `bindWorkout`)
- Modify: `js/views/progress.js` (`renderProgress`, `bindProgress`)

**Interfaces:**
- Produces: a `[data-back]` button rendered as the first element of the workout/kine/progress views; clicking it sets `location.hash = '#/dashboard'`.

- [ ] **Step 1: Add the button markup to `renderWorkout`**

In `js/views/workout.js`, the current opening of the returned template (line 20):

```js
  return `
    <div style="padding:14px 14px 20px;" id="workout-view">
      <div class="phase-banner phase-banner--${phase.color}">
```

Insert the button as the first child of `#workout-view`:

```js
  return `
    <div style="padding:14px 14px 20px;" id="workout-view">
      <button class="btn btn-dim" data-back style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <div class="phase-banner phase-banner--${phase.color}">
```

- [ ] **Step 2: Add the button markup to `renderKine`**

In `js/views/workout.js`, `renderKine`'s returned template currently opens (around line 236):

```js
  return `
    <div style="padding:14px 14px 20px;">
      <div class="eva-warning">⚠ EVA máximo ${session.evaMax}/10 — si hay molestia, reducir y reportar al kinesiólogo.</div>
```

Insert the same button:

```js
  return `
    <div style="padding:14px 14px 20px;">
      <button class="btn btn-dim" data-back style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <div class="eva-warning">⚠ EVA máximo ${session.evaMax}/10 — si hay molestia, reducir y reportar al kinesiólogo.</div>
```

- [ ] **Step 3: Wire the button in `bindWorkout`, before the early return**

`bindWorkout` currently starts (line 62):

```js
export function bindWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];
  if (!session || session.readonly) return;
```

Change to wire the back button first, since `renderKine` sessions (`session.readonly === true`) must not skip it:

```js
export function bindWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];

  document.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/dashboard';
  });

  if (!session || session.readonly) return;
```

- [ ] **Step 4: Add the button markup to `renderProgress`**

In `js/views/progress.js`, the returned template currently opens (line 212):

```js
  return `
    <div style="padding:14px 14px 20px">
      <h2 style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:4px">📈 Progresión GZCLP v6</h2>
```

Insert the button:

```js
  return `
    <div style="padding:14px 14px 20px">
      <button class="btn btn-dim" data-back style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <h2 style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:4px">📈 Progresión GZCLP v6</h2>
```

- [ ] **Step 5: Wire the button in `bindProgress`**

`bindProgress` currently starts (line 222):

```js
export function bindProgress() {
  document.getElementById('save-prs')?.addEventListener('click', () => {
```

Add the back-button wiring first:

```js
export function bindProgress() {
  document.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/dashboard';
  });

  document.getElementById('save-prs')?.addEventListener('click', () => {
```

- [ ] **Step 6: Run the full test suite (regression check)**

Run: `npm test`
Expected: all tests PASS (no pure-logic function changed).

- [ ] **Step 7: Manual verification**

1. Open `#/workout/S1`, `#/workout/kine`, and `#/progress` in turn.
2. Confirm "← Volver" appears at the top of each and clicking it returns to `#/dashboard`.

- [ ] **Step 8: Commit**

```bash
git add js/views/workout.js js/views/progress.js
git commit -m "feat: add back button to workout, kine, and progress views"
```

---

### Task 6: Print button for the current workout session

**Files:**
- Modify: `js/views/workout.js` (`renderWorkout`, `renderKine`, `bindWorkout`)
- Modify: `css/print.css` (append)

**Interfaces:**
- Produces: a `#btn-print-session` button in both the normal-session and kine templates; clicking it calls `window.print()`.

- [ ] **Step 1: Replace the complete-session button block in `renderWorkout` with a print+complete row**

Replace `js/views/workout.js:47-52`:

```js
      <button id="btn-complete-session"
        style="width:100%;margin-top:24px;padding:16px;border-radius:14px;
               border:none;background:var(--purple);color:#fff;
               font-size:16px;font-weight:800;cursor:pointer;">
        ✓ Completar sesión
      </button>
```

with:

```js
      <div style="display:flex;gap:10px;margin-top:24px;">
        <button id="btn-print-session"
          style="flex:0 0 56px;padding:16px;border-radius:14px;
                 border:1px solid var(--border);background:transparent;color:var(--dim);
                 font-size:18px;cursor:pointer;">
          🖶
        </button>
        <button id="btn-complete-session"
          style="flex:1;padding:16px;border-radius:14px;
                 border:none;background:var(--purple);color:#fff;
                 font-size:16px;font-weight:800;cursor:pointer;">
          ✓ Completar sesión
        </button>
      </div>
```

- [ ] **Step 2: Add a print button to `renderKine`**

At the end of `renderKine`'s template, right before the closing `</div>` of the outer wrapper (after the `bloqueHombro` map, currently the template's last content line), add:

```js
      <button id="btn-print-session"
        style="width:100%;margin-top:20px;padding:16px;border-radius:14px;
               border:1px solid var(--border);background:transparent;color:var(--dim);
               font-size:14px;font-weight:700;cursor:pointer;">
        🖶 Imprimir
      </button>
    </div>
  `;
```

(This replaces the existing closing `</div>\n  \`;` of `renderKine` — the button is inserted just above it.)

- [ ] **Step 3: Wire the print button in `bindWorkout`**

Extend the block added in Task 5 Step 3 so it also wires printing, before the readonly early return:

```js
export function bindWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];

  document.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/dashboard';
  });
  document.getElementById('btn-print-session')?.addEventListener('click', () => {
    window.print();
  });

  if (!session || session.readonly) return;
```

- [ ] **Step 4: Add print styles for the brute views**

Append to `css/print.css` (a new, separate `@media print` block — leave the existing Nutrical block untouched):

```css

/* ── Brute workout views ── */
@media print {
  [data-back], #btn-print-session, #btn-complete-session, .timer-overlay, .week-nav-btn {
    display: none !important;
  }

  body, #workout-view {
    background: #fff !important;
    color: #000 !important;
  }

  :root {
    --card: #fff;
    --card2: #fff;
    --border: #ccc;
    --text: #000;
    --dim: #444;
  }

  .phase-banner,
  .phase-banner--pink, .phase-banner--mint, .phase-banner--gold,
  .phase-banner--cyan, .phase-banner--purple {
    background: #fff !important;
    border: 1px solid #999 !important;
    color: #000 !important;
    box-shadow: none !important;
  }

  .eva-warning {
    background: #fff !important;
    border: 1px solid #999 !important;
    box-shadow: none !important;
    color: #000 !important;
  }

  .session-card, .session-card::before, .session-card::after {
    box-shadow: none !important;
  }
}
```

- [ ] **Step 5: Run the full test suite (regression check)**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 6: Manual verification**

1. Open `#/workout/S1`, click the 🖶 button, confirm the print preview shows a white background, black text, and no back/complete/timer buttons.
2. Repeat for `#/workout/kine`.
3. Confirm the on-screen (non-print) view is visually unchanged.

- [ ] **Step 7: Commit**

```bash
git add js/views/workout.js css/print.css
git commit -m "feat: add print button and print styles for workout sessions"
```

---

### Task 7: Longer-feeling login session via silent renewal

**Files:**
- Modify: `js/auth.js`

**Interfaces:**
- Consumes: existing `renewToken()` (unchanged internally) and `tokenClient` module state.
- Produces: `accessToken` is now backed by `localStorage` (survives tab close); a `gsi_had_session` flag in `localStorage` triggers one silent renewal attempt on boot before the router decides whether to show the login screen.

- [ ] **Step 1: Switch token storage from `sessionStorage` to `localStorage`**

Replace `js/auth.js:6`:

```js
let accessToken = sessionStorage.getItem('gsi_token') || null;
```

with:

```js
let accessToken = localStorage.getItem('gsi_token') || null;
```

- [ ] **Step 2: Update `logout` to clear both keys from `localStorage`**

Replace `js/auth.js:12-16`:

```js
export function logout() {
  accessToken = null;
  sessionStorage.removeItem('gsi_token');
  location.hash = '#/login';
}
```

with:

```js
export function logout() {
  accessToken = null;
  localStorage.removeItem('gsi_token');
  localStorage.removeItem('gsi_had_session');
  location.hash = '#/login';
}
```

- [ ] **Step 3: Persist the "had a session" flag and switch the callback's storage call**

In `js/auth.js`, inside `initAuth`'s `tokenClient` callback, replace:

```js
        accessToken = resp.access_token;
        sessionStorage.setItem('gsi_token', accessToken);
```

with:

```js
        accessToken = resp.access_token;
        localStorage.setItem('gsi_token', accessToken);
        localStorage.setItem('gsi_had_session', '1');
```

- [ ] **Step 4: Attempt one silent renewal on boot before routing**

Replace the end of `initAuth`'s `ready` function — currently:

```js
    });
    initRouter();
  };
```

with:

```js
    });

    if (!accessToken && localStorage.getItem('gsi_had_session') === '1') {
      renewToken()
        .catch(() => { localStorage.removeItem('gsi_had_session'); })
        .finally(() => initRouter());
    } else {
      initRouter();
    }
  };
```

- [ ] **Step 5: Run the full test suite (regression check)**

Run: `npm test`
Expected: all tests PASS (this module has no existing automated tests — it depends on the `google` global, which is browser-only).

- [ ] **Step 6: Manual verification**

1. Log in normally. Confirm `localStorage.getItem('gsi_token')` and `localStorage.getItem('gsi_had_session')` are both set (DevTools → Application → Local Storage).
2. Close the tab entirely (not just navigate away) and reopen the app. Confirm you land on `#/select` (or wherever you were) without seeing the login screen — the silent renewal succeeded.
3. In DevTools, run `localStorage.clear()` and reload. Confirm you now see the login screen (no stale flags left over).
4. Log in again, then click "Cerrar sesión". Confirm both `gsi_token` and `gsi_had_session` are removed from `localStorage` and you land on `#/login`.

Known caveat to flag to the user: some browsers block the silent `requestAccessToken({ prompt: '' })` call if it fires with zero user gesture on cold page load (popup-blocker heuristics vary by browser/OS). If step 2 above still shows the login screen despite `gsi_had_session` being set, that's the browser's popup policy, not a code defect — the existing reactive 401 renewal path is unaffected either way.

- [ ] **Step 7: Commit**

```bash
git add js/auth.js
git commit -m "feat: persist login across tab close with silent token renewal on boot"
```
