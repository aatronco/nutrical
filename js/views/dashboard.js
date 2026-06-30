// js/views/dashboard.js
import { getCurrentWeek } from '../load-calculator.js';
import { getAthletes, getActiveAthlete, getActiveAthleteId, setActiveAthlete,
         saveAthlete, deleteAthlete, getAthletePRs, setAthletePRs,
         getAthleteProgramStart, setAthleteProgramStart } from '../athletes.js';

export function renderDashboard() {
  const athlete   = getActiveAthlete();
  const startDate = getAthleteProgramStart(athlete.id);
  const week      = getCurrentWeek(startDate);
  const prs       = getAthletePRs(athlete.id);
  const athletes  = getAthletes();

  const athleteSwitcher = athletes.length > 1 ? `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;overflow-x:auto;padding-bottom:4px">
      ${athletes.map(a => `
        <button data-switch="${a.id}"
          style="padding:6px 14px;border-radius:20px;border:1px solid ${a.id===athlete.id?'var(--cyan)':'var(--border)'};
                 background:${a.id===athlete.id?'rgba(0,212,255,.12)':'transparent'};
                 color:${a.id===athlete.id?'var(--cyan)':'var(--dim)'};
                 font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap">
          ${a.icon||'🏋️'} ${a.name}
        </button>`).join('')}
      <button id="add-athlete-btn"
        style="padding:6px 14px;border-radius:20px;border:1px dashed var(--border);background:transparent;color:var(--dim);font-size:12px;cursor:pointer">
        + Atleta
      </button>
    </div>` : `
    <div style="display:flex;justify-content:flex-end;margin-bottom:8px">
      <button id="add-athlete-btn"
        style="padding:5px 12px;border-radius:20px;border:1px dashed var(--border);background:transparent;color:var(--dim);font-size:11px;cursor:pointer">
        + Agregar atleta
      </button>
    </div>`;

  return `
    <div style="padding:20px 14px;">
      ${athleteSwitcher}

      <div class="hero" style="border-radius:14px;margin-bottom:16px;">
        <div class="hero-eyebrow">▸ PRIDE EDITION ▸</div>
        <h1>${athlete.icon||'🏋️'} ${athlete.name} — S${week}/6</h1>
        <p class="hero-sub">GZCLP v6 — ${phaseLabel(week)}</p>
      </div>

      <div class="pr-strip" style="padding:0;margin-bottom:16px;">
        <div class="pr-card">
          <div class="pr-lbl">Press Banca</div>
          <div class="pr-val">${prs.banca||'—'} ${prs.banca?'kg':''}</div>
        </div>
        <div class="pr-card">
          <div class="pr-lbl">DL Conv.</div>
          <div class="pr-val">${prs.deadlift||'—'} ${prs.deadlift?'kg':''}</div>
        </div>
        <div class="pr-card">
          <div class="pr-lbl">Pullups</div>
          <div class="pr-val">${prs.pullups||'—'} ${prs.pullups?'reps':''}</div>
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
        <a href="#/progress" style="display:block;padding:16px;background:var(--card);border:1px solid var(--purple);border-radius:14px;color:var(--purple);font-weight:800;text-decoration:none;text-align:center;">
          📈 Ver Progresión
        </a>
      </div>

      <!-- Add athlete modal (hidden) -->
      <div id="add-athlete-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:200;padding:40px 16px;overflow-y:auto">
        <div style="max-width:380px;margin:0 auto;background:var(--card);border:1px solid var(--border);border-radius:16px;padding:24px">
          <h3 style="font-size:16px;font-weight:800;color:var(--text);margin-bottom:16px">Nuevo Atleta</h3>
          <div style="margin-bottom:12px">
            <label style="font-size:11px;color:var(--dim);display:block;margin-bottom:4px">Nombre</label>
            <input id="new-name" type="text" placeholder="Ej: María" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);font-size:14px">
          </div>
          <div style="margin-bottom:12px">
            <label style="font-size:11px;color:var(--dim);display:block;margin-bottom:4px">Emoji</label>
            <input id="new-icon" type="text" placeholder="🏋️" maxlength="2" style="width:80px;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:10px;color:var(--text);font-size:18px;text-align:center">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px">
            <div>
              <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Banca PR (kg)</label>
              <input id="new-banca" type="number" step="0.5" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-size:14px">
            </div>
            <div>
              <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">DL PR (kg)</label>
              <input id="new-dl" type="number" step="0.5" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-size:14px">
            </div>
            <div>
              <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Pullups</label>
              <input id="new-pu" type="number" step="1" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px;color:var(--text);font-size:14px">
            </div>
          </div>
          <div style="display:flex;gap:10px">
            <button id="save-new-athlete" style="flex:1;padding:12px;background:var(--cyan);border:none;border-radius:10px;color:#001020;font-size:14px;font-weight:800;cursor:pointer">Guardar</button>
            <button id="cancel-new-athlete" style="flex:1;padding:12px;background:transparent;border:1px solid var(--border);border-radius:10px;color:var(--dim);font-size:14px;cursor:pointer">Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function bindDashboard() {
  // Athlete switcher
  document.querySelectorAll('[data-switch]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.switch;
      setActiveAthlete(id);
      // Sync legacy keys
      const prs = getAthletePRs(id);
      localStorage.setItem('gzclp_prs', JSON.stringify(prs));
      const start = getAthleteProgramStart(id);
      localStorage.setItem('gzclp_program_start', start);
      location.reload();
    });
  });

  // Add athlete modal
  const modal  = document.getElementById('add-athlete-modal');
  document.getElementById('add-athlete-btn')?.addEventListener('click', () => {
    modal.style.display = 'block';
  });
  document.getElementById('cancel-new-athlete')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  document.getElementById('save-new-athlete')?.addEventListener('click', () => {
    const name = document.getElementById('new-name')?.value.trim();
    if (!name) return;
    const icon    = document.getElementById('new-icon')?.value.trim() || '🏋️';
    const banca   = parseFloat(document.getElementById('new-banca')?.value);
    const dl      = parseFloat(document.getElementById('new-dl')?.value);
    const pullups = parseInt(document.getElementById('new-pu')?.value);
    const id      = name.toLowerCase().replace(/[^a-z0-9]/g,'_') + '_' + Date.now();
    const athlete = { id, name, icon, prBase: {} };
    if (!isNaN(banca))   athlete.prBase.banca    = banca;
    if (!isNaN(dl))      athlete.prBase.deadlift = dl;
    if (!isNaN(pullups)) athlete.prBase.pullups  = pullups;
    saveAthlete(athlete);
    setAthletePRs(id, athlete.prBase);
    setAthleteProgramStart(id, new Date().toISOString().slice(0,10));
    setActiveAthlete(id);
    location.reload();
  });
}

function phaseLabel(week) {
  if (week <= 2) return 'Fase Volumen';
  if (week <= 4) return 'Intens. Progresiva';
  if (week === 5) return 'Intensificación';
  return 'Peak PR ★';
}
