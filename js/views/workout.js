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
      ${t1Sets.length === 0 && session.T1.frente1
          ? renderT1Frentes(session.T1, week)
          : renderT1Table(t1Sets)}

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
      const week      = getCurrentWeek(startDate);
      const phase     = getPhaseForWeek(week);
      try {
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
      } catch (err) {
        completeBtn.textContent = 'Error al guardar';
        completeBtn.disabled = false;
      }
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

function renderT1Frentes(t1, week) {
  const { frente1, frente2 } = t1;
  const fmtRest = s => (s >= 60 && s % 60 === 0) ? `${s / 60} min` : `${s} s`;
  const f2Reps  = Array.isArray(frente2.reps) ? frente2.reps.join('-') : frente2.reps;
  const f1Sets  = frente1.setsByWeek?.[week] ?? frente1.sets;
  return `
    <div class="session-card">
      <div class="session-card__title">${frente1.label}</div>
      <div class="ex-meta" style="font-size:13px;color:var(--dim);">
        <b style="color:var(--text)">${f1Sets} series al fallo controlado</b> · descanso ${fmtRest(frente1.rest)}
        <button data-rest="${frente1.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>
      </div>
    </div>
    <div class="session-card">
      <div class="session-card__title">${frente2.label}</div>
      <div class="ex-meta" style="font-size:13px;color:var(--dim);">
        <b style="color:var(--text)">${frente2.sets} series × ${f2Reps} reps asistidas</b> · descanso ${fmtRest(frente2.rest)}
        <button data-rest="${frente2.rest}" style="background:var(--purple);border:none;border-radius:8px;padding:4px 10px;color:#fff;font-size:11px;cursor:pointer;margin-left:8px;">▶</button>
      </div>
      ${frente2.progressionNote ? `<div style="font-size:12px;color:#ddb0ff;margin-top:5px;">${frente2.progressionNote}</div>` : ''}
    </div>
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
      <div class="eva-warning">⚠ EVA máximo ${session.evaMax}/10 — si hay molestia, reducir y reportar al kinesiólogo.</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <h2 style="font-size:17px;font-weight:800;color:var(--text);">Sentadilla — S2 / S4</h2>
        <span class="badge-kine">PROTOCOLO RODILLA — solo lectura</span>
      </div>
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin:12px 0 8px;padding-left:10px;border-left:3px solid var(--cyan);">Bloque Rodilla</h3>
      ${session.bloqueRodilla.map(e => `
        <div class="session-card">
          <div class="session-card__title">
            ${e.num}. ${e.name}
            ${e.video ? '<span style="background:var(--cyan);color:#001020;font-size:9px;font-weight:800;padding:2px 7px;border-radius:8px;">VIDEO</span>' : ''}
          </div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${e.load}</b> · ${e.sets ? `${e.sets}×${e.reps}` : (e.reps ?? '—')} · ${e.rest || 0}"
          </div>
        </div>
      `).join('')}
      <h3 style="font-size:14px;font-weight:700;color:var(--text);margin:18px 0 8px;padding-left:10px;border-left:3px solid var(--purple);">Bloque Hombro</h3>
      ${session.bloqueHombro.map(e => `
        <div class="session-card">
          <div class="session-card__title">${e.num}. ${e.name}</div>
          <div class="ex-meta" style="font-size:13px;color:var(--dim);">
            <b style="color:var(--text)">${e.load}</b> · ${e.sets ? `${e.sets}×${e.reps}` : (e.reps ?? '—')} · ${e.rest || 0}"
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
