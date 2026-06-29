# Workout PWA — Design Spec
**Date:** 2026-06-28  
**Author:** Alejandro Troncoso  
**Repo base:** aatronco/nutrical (extended, not replaced)

---

## Overview

Extend the existing `nutrical` vanilla JS app with 5 new modules to create a personal workout + nutrition PWA. The app centralizes the GZCLP v6 training program, daily nutrition logging, 12-week mobility routine, and body composition tracking. It functions offline on iPhone Safari and is installable as a PWA. Long-term goal: productize for other users.

---

## 1. Architecture

Extend nutrical in-place. No framework migration.

### File structure additions

```
nutrical/
├── js/
│   ├── db.js                   NEW — IndexedDB wrapper (Dexie.js or raw idb)
│   ├── workout-data.js         NEW — GZCLP v6 static program data
│   └── views/
│       ├── dashboard.js        NEW
│       ├── workout.js          NEW — session player (S1/S3/S5/Kine)
│       ├── nutrition.js        NEW — daily portion logger
│       ├── mobility.js         NEW — 12-week routine + timer
│       └── progress.js         NEW — charts + body comp (uses formulas.js)
├── css/
│   └── app.css                 EXTEND — pride theme vars + new component classes
├── manifest.json               NEW — PWA manifest
└── sw.js                       NEW — service worker (cache-first)
```

### Routing

Extend the existing hash router (`js/router.js`) with:
- `#/dashboard`
- `#/workout/:session` (session = S1 | S3 | S5 | kine)
- `#/nutrition`
- `#/mobility`
- `#/progress`

Existing nutrical routes (`#/patients`, `#/consultation`, etc.) remain untouched.

### Storage split

| Data | Storage | Rationale |
|------|---------|-----------|
| Body comp consultations | Google Sheets (existing) | Nutritionist-managed, sync when online |
| Workout session logs | IndexedDB | Offline-first, structured queries |
| Nutrition daily logs | IndexedDB | Offline-first |
| Mobility logs | IndexedDB | Simple, offline |
| Current week/phase/PRs | localStorage | Fast reads, small data |
| User preferences | localStorage | Simple key-value |

---

## 2. Data Model

### localStorage keys

```
gzclp_current_week      → number 1–6
gzclp_current_session   → "S1" | "S3" | "S5"
gzclp_program_start     → ISO date string
gzclp_prs               → { banca: 125, deadlift: 140, pullups: 6 }
```

### IndexedDB stores

**workout_sessions**
```js
{
  id,           // auto-increment
  date,         // ISO string
  session,      // "S1" | "S3" | "S5"
  week,         // 1–6
  phase,        // "volumen" | "acumulacion" | "intensificacion" | "peak_pr"
  completed,    // bool
  sets: [{
    exercise,   // string key matching workout-data.js
    setNumber,  // int
    reps,       // int (actual performed)
    weightKg,   // number
    rpe,        // number | null
    completed   // bool
  }]
}
```

**nutrition_logs**
```js
{
  id,           // auto-increment
  date,         // ISO string YYYY-MM-DD (unique)
  water_ml,     // number
  protein_g,    // computed on read (never persisted — legumbre expansion happens at read time)
  meals: [{
    slot,       // "desayuno" | "colacion_am" | "almuerzo" | "colacion_pm" | "cena"
    portions: [{
      food,     // string label
      type,     // "proteina" | "carbohidrato" | "lipido" | "fruta" | "verdura_general" | "verdura_libre" | "lacteo" | "legumbre"
      quantity  // number (portions count)
    }]
  }]
}
```

**mobility_logs**
```js
{
  id,
  date,         // ISO string
  week,         // 1–12 (independent from 6-week gym cycle)
  phase,        // "rangos_medios" | "rangos_profundos" | "split_pancake"
  completed,    // bool
  duration_min  // number
}
```

### Legume double-portion rule

When `type === "legumbre"`, the portion counts as **1 carbohidrato + 1 proteína simultaneously**. This is enforced at the protein/carb counter computation level, not at storage — legumbre is stored as its own type and expanded on read.

---

## 3. Static Program Data (`workout-data.js`)

The complete GZCLP v6 program lives as a JS constant — no database, no fetch. Structure:

```js
export const PROGRAM = {
  sessions: {
    S1: { name: "Empuje", color: "pink", warmup: [...], T1: {...}, T2: [...], T3: [...] },
    S3: { name: "Tirón", color: "mint", T1: {...}, T2: [...], T3: [...] },
    S5: { name: "Cadena Posterior", color: "gold", T1: {...}, T2: [...], T3: [...] },
    kine: { name: "Kine", color: "cyan", readonly: true, blocks: { rodilla: [...], hombro: [...] } }
  },
  phases: [
    { weeks: [1,2], name: "volumen", t1_pct: [0.70, 0.77], t2_sets: "4-5x10-12", t3_rest_s: 75 },
    { weeks: [3,4], name: "acumulacion", t1_pct: [0.80, 0.88], t2_sets: "3-4x8-10", t3_rest_s: 90 },
    { weeks: [5],   name: "intensificacion", t1_pct: [0.88, 0.93], t2_sets: "3x8-10", t3_rest_s: 90 },
    { weeks: [6],   name: "peak_pr", t1_pct: [0.95, 1.03], t2_sets: "2x8", t3_rest_s: 0 }
  ]
}
```

T1 sets for each session/phase are **fully pre-specified** (exact kg values from the spec). The load calculator reads `current_week + current_prs` and returns the exact set list — no interpolation needed.

---

## 4. T1 Load Calculation Logic

```
getT1Sets(session, week, prs) → Set[]
```

- For weeks 1–5: reads pre-specified percentages/kg from `workout-data.js`, returns warm-up + work sets
- For week 6 (Peak PR): returns the 3-attempt PR sequence with decision gates ("solo si intento anterior fue limpio")
- PR update: stored in localStorage `gzclp_prs`, triggers recalculation for next cycle
- Week advancement: calendar-based (program start date + 7 days per week). App shows the correct week automatically. No manual confirmation needed — reflects real gym usage where not every session is completed every week.

---

## 5. UX Flows

### Navigation

Bottom tab bar (5 tabs, sticky, iPhone safe-area aware):
```
🏠 Dashboard | 💪 Entrena | 🥗 Nutrición | 🧘 Movilidad | 📈 Progreso
```

### Training session flow

1. Dashboard → "Iniciar S1" button
2. Warmup screen (obligatorio, cannot skip for S1)
3. Exercise-by-exercise: calculated load shown → user logs actual reps → rest timer auto-starts
4. Timer: fullscreen countdown, haptic on complete (if supported), skip button
5. Session complete → summary card → "¿Avanzar semana?" prompt (only after S5)
6. Kine sessions: read-only view, badge "PROTOCOLO KINE — no modificar", EVA max 3/10 reminder

### Nutrition flow

1. Day view with 5 meal slots
2. Per slot: tap to add portion → food type picker → quantity
3. Legumbre selector automatically deducts 1 carbo + 1 proteína
4. Live protein progress bar (vs 220g minimum)
5. Water counter: +250ml quick buttons, manual entry
6. Daily summary: macros breakdown at bottom

### Mobility flow

1. Shows today's routine based on `mobility_week` (1–12, independent counter)
2. Exercise list with timer per exercise (active/passive blocks)
3. Mark complete → logs to IndexedDB

---

## 6. Visual Design

Inherit nutrical's existing CSS variables and extend:

```css
:root {
  --bg: #0f0820;
  --card: #1a1030;
  --border: #4a2080;
  --text: #f0e8ff;
  --dim: #c0b0e0;
  --pink: #ff4d94;
  --orange: #ff8c50;
  --gold: #ffd54f;
  --mint: #4dffb8;
  --cyan: #4dd8ff;
  --purple: #cc88ff;
}
```

Session color coding: S1 = pink, S3 = mint, S5 = gold, Kine = cyan (matches the reference HTML exactly).

Typography: Georgia serif for headings/PRs, system sans for body (match reference HTML).

Layout: mobile-first, max-width 480px, bottom tabs with iPhone safe-area padding. WCAG AA contrast on all text.

New component classes to add to `app.css`:
- `.timer` — fullscreen rest timer overlay
- `.progress-bar` — protein/hydration progress
- `.session-card` — workout exercise card with set table
- `.portion-pill` — nutrition portion chip
- `.bottom-nav` — 5-tab bottom navigation

---

## 7. PWA Configuration

**manifest.json**
```json
{
  "name": "Workout — Alejandro",
  "short_name": "Workout",
  "display": "standalone",
  "background_color": "#0f0820",
  "theme_color": "#0f0820",
  "start_url": "/#/dashboard",
  "icons": [{ "src": "icon-192.png", "sizes": "192x192" }, { "src": "icon-512.png", "sizes": "512x512" }]
}
```

**Service worker (`sw.js`):** cache-first strategy. Pre-caches all JS/CSS/HTML on install. Falls back to cache on network failure — full offline support for iPhone Safari.

---

## 8. Constraints & Rules (hard-coded, never overridable by UI)

- Kine sessions: display only, no edit controls rendered
- T1 never cut: no UI option to skip/remove T1 exercises
- T3 flagged as "primer recorte si baja apetito": shown with warning label, deletable
- Face pull: marked OBLIGATORIO, cannot be removed from S1
- Hombro terapéutico in S3: marked as structural, not optional
- EVA max 3/10: shown as persistent reminder in Kine view
- Protein minimum 220g: alert if day ends below target
- Semaglutida note: shown in nutrition header as context

---

## 9. Out of Scope (v1)

- Multi-user / auth layer (needed before selling, not for personal use)
- Push notifications
- Apple Watch / HealthKit sync
- Export / share session
- Custom program editor (GZCLP v6 is hardcoded)
- Mobility exercise videos
