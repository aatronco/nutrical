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
