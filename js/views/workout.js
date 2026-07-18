// js/views/workout.js
import { SESSIONS, getPhaseForWeek } from '../workout-data.js';
import { getT1Sets, getCurrentWeek } from '../load-calculator.js';
import { saveSession }                from '../db.js';
import { createTimer }                from '../timer.js';
import { getActiveAthleteId, getAthleteWeekOverride } from '../athletes.js';
import { pushSession }                from '../workout-sync.js';

let activeTimer = null;

export function renderWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];
  if (!session) return `<p style="padding:20px;color:var(--dim)">Sesión no encontrada.</p>`;

  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const athleteId = getActiveAthleteId();
  const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athleteId));
  const phase     = getPhaseForWeek(week);

  const body = session.bloque
    ? renderPierna(session)
    : renderTiers(sessionKey, session, week);

  return `
    <div style="padding:14px 14px 20px;" id="workout-view">
      <button class="btn btn-dim" data-back style="margin-bottom:12px;padding:8px 16px;">← Volver</button>

      <div class="phase-banner phase-banner--${phase.color}">
        ◈ ${phase.label} — Semana ${week}
      </div>

      ${body}

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
    </div>
    <div id="timer-overlay" class="timer-overlay" style="display:none;">
      <div class="timer-overlay__label">Descanso</div>
      <div class="timer-overlay__time" id="timer-display">0:00</div>
      <button class="timer-overlay__skip" id="btn-skip-timer">Saltar</button>
    </div>
  `;
}

function renderTiers(sessionKey, session, week) {
  const t1Sets = getT1Sets(sessionKey, week);
  return `
    ${session.warmup ? renderWarmup(session.warmup) : ''}

    <h2 class="sh" style="margin-top:18px;">
      <span class="dot" style="background:var(--${session.color})"></span>T1 — ${session.T1.exercise}
    </h2>
    ${session.T1.note ? `<div style="font-size:12px;color:#ddb0ff;margin-bottom:8px;">${session.T1.note}</div>` : ''}
    ${renderT1Table(t1Sets)}

    <h2 class="sh" style="margin-top:18px;">
      <span class="dot" style="background:var(--mint)"></span>T2 — Hipertrofia
      <span style="font-size:11px;color:var(--dim);font-weight:400;">olas de 5RM · accesorios última serie RPE 9</span>
    </h2>
    ${renderT2List(session.T2, week)}

    ${session.kineBlock ? renderKineBlock(session.kineBlock) : ''}

    <h2 class="sh" style="margin-top:18px;">
      <span class="dot" style="background:var(--orange)"></span>T3 — Aislamiento
    </h2>
    ${renderT3List(session.T3, week)}
  `;
}

function renderPierna(session) {
  return `
    <div class="eva-warning">⚠ EVA máximo ${session.evaMax}/10 — si hay molestia, reducir y reportar al kinesiólogo.</div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <h2 style="font-size:17px;font-weight:800;color:var(--text);">${session.name}</h2>
      <span class="badge-kine">RECETA KINE — carga por RPE</span>
    </div>
    ${session.bloque.map(e => `
      <div class="session-card">
        <div class="session-card__title">
          ${e.num}. ${e.name}
          ${e.video ? '<span style="background:var(--cyan);color:#001020;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;">VIDEO</span>' : ''}
        </div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${e.load}</b> · ${e.setsReps} · ${e.rest || 0}"
          ${e.rest > 0 ? `<button data-rest="${e.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:3px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>` : ''}
        </div>
        ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
      </div>
    `).join('')}
    <div style="font-size:12px;color:var(--dim);margin:14px 0 4px;">Enviar video al kine de los ejercicios marcados VIDEO.</div>
  `;
}

export function bindWorkout(sessionKey) {
  const session = SESSIONS[sessionKey];

  document.querySelector('[data-back]')?.addEventListener('click', () => {
    location.hash = '#/dashboard';
  });
  document.getElementById('btn-print-session')?.addEventListener('click', () => {
    window.print();
  });

  if (!session) return;

  // Clean up any active timer from previous session
  if (activeTimer) { activeTimer.stop(); activeTimer = null; }

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
      const athleteId = getActiveAthleteId();
      const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athleteId));
      const phase     = getPhaseForWeek(week);
      const record = {
        date: new Date().toISOString().slice(0,10),
        session: sessionKey,
        week,
        phase: phase.name,
        completed: true,
        sets: [],
      };
      try {
        await saveSession(record);
        completeBtn.textContent = '✓ ¡Sesión guardada!';
        completeBtn.style.background = 'var(--mint)';
        completeBtn.style.color = '#0a2010';
        completeBtn.disabled = true;
      } catch (err) {
        completeBtn.textContent = 'Error al guardar';
        completeBtn.disabled = false;
        return;
      }
      // Respaldo en Google Sheets — best effort, la sesión ya está guardada localmente
      try {
        const res = await pushSession(record, athleteId);
        completeBtn.textContent = res.pending
          ? '✓ Guardada · ☁ respaldo pendiente'
          : '✓ Guardada · ☁ respaldada';
      } catch { /* queda en cola para el próximo arranque */ }
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
      const plan     = e.byWeek?.[week];
      const setsReps = plan
        ? `${plan.setsReps} @ ${plan.kg} kg`
        : (e.reduceWeeks?.[week] ?? e.setsReps);
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

function renderKineBlock(bloque) {
  return `
    <div style="margin:16px 0 8px;font-size:12px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">
      ${bloque.label}
    </div>
    <div style="font-size:12px;color:var(--dim);margin-bottom:8px;">${bloque.note}</div>
    ${bloque.exercises.map(e => `
      <div class="session-card">
        <div class="session-card__title">${e.name}</div>
        <div class="ex-meta" style="font-size:13px;color:var(--dim);">
          <b style="color:var(--text)">${e.load}</b> · ${e.setsReps}
          ${e.rest > 0 ? `<button data-rest="${e.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:3px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>` : ''}
        </div>
        ${e.note ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${e.note}</div>` : ''}
      </div>
    `).join('')}
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
