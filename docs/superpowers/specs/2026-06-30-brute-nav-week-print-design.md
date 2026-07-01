# Brute: back navigation, manual week selector, print session, longer login

## Problem

Four gaps in the "brute" workout app (dashboard/workout/progress views) and its Google login:

1. No way to go back from `workout`/`progress`/`kine` to the dashboard except the OS/browser back gesture — these views hide `#topnav` entirely (`router.js`), so there's no in-app affordance.
2. The training week is derived purely from calendar days since `getAthleteProgramStart()` (`load-calculator.js:getCurrentWeek`). If the athlete finishes week 1 in less than 7 real days, the app still shows week 1 content until the calendar catches up — there is no manual override anywhere.
3. `css/print.css` only targets the Nutrical patient-report views (`.card`, `.science-panel`, `#topnav`). It has no rules for brute's dark-themed components (`.session-card`, `.set-table`, `.phase-banner`), and `workout.js` has no print trigger.
4. Login (`js/auth.js`) uses Google Identity Services' implicit token flow: the access token always expires in ~1 hour (a Google-side limit, not configurable) and is stored in `sessionStorage`, so it's also wiped every time the tab/PWA closes. Net effect: the user is thrown back to the login screen far more often than the underlying Google session (which persists for months) would require.

## Design

### 1. Back button

- Each of `renderWorkout`, `renderKine` (same file), and `renderProgress` prepends a small fixed-position back affordance to their own markup: `<button class="back-btn" data-back>← </button>`.
- `bindWorkout`/`bindProgress` wire `data-back` to `location.hash = '#/dashboard'`.
- No change to `router.js` nav/bottom-nav handling — the button lives inside the view's own render output, consistent with how these views already self-contain their UI.

### 2. Manual week selector

- `athletes.js` gains `getAthleteWeekOverride(athleteId)` / `setAthleteWeekOverride(athleteId, week)`, stored under `athleteKey(id, 'week_override')`.
- `load-calculator.js:getCurrentWeek(startDate, athleteId)`: if a stored override exists for `athleteId`, return it (clamped 1–6); otherwise fall back to the existing date-based calculation (so existing athletes without an override keep working as today).
- `dashboard.js` replaces the static `S${week}/6` label with `‹ S{week}/6 ›` controls that call `setAthleteWeekOverride` and re-render on click, clamped to [1,6].
- Call sites in `workout.js` and `progress.js` that call `getCurrentWeek(startDate)` are updated to pass the active athlete id too.

### 3. Print current session

- `workout.js`: add a "🖶 Imprimir" button next to "✓ Completar sesión" (and in `renderKine`, since kine sessions are equally worth printing). Click handler is just `window.print()`.
- `print.css` gets a new block (alongside the existing Nutrical rules) scoped to brute markup: hides `.back-btn`, `#btn-complete-session`, `#btn-print-session`, `.timer-overlay`; forces white background/black text on `.session-card`, `.set-table`, `.phase-banner`, `.eva-warning` (currently styled for a dark theme only).

### 4. Longer-feeling login session

A literal 6-month token is not possible with the current implicit OAuth2 flow (no refresh token is ever issued). Instead:

- `auth.js` stores the token in `localStorage` instead of `sessionStorage`, plus a separate `gsi_had_session` flag so the app knows the user was previously logged in even after the token itself has expired.
- On boot, before deciding to show the login screen, `initAuth()` attempts one silent `renewToken()` (`prompt:''`) if `gsi_had_session` is set. Only falls back to the login screen if that silent renewal fails (e.g. the user actually revoked access or signed out of Google entirely).
- `renewToken()`'s existing reactive 401 handling in `sheets.js` is unchanged.
- Practical effect: as long as the user's underlying Google browser session stays valid (normally months), they will not see the login screen — the 1-hour token limit becomes invisible to them. If Google's session itself expires or is revoked, they'll still see login once.

## Out of scope

- Printing multiple weeks or the full 6-week program at once.
- Auto-advancing the week when all sessions in a week are marked complete.
- Changing browser-history behavior — only an in-app button, not `history.back()`.
- A backend/refresh-token architecture for a literal, guaranteed 6-month session.
