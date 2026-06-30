// js/views/dashboard.js
import { getCurrentWeek } from '../load-calculator.js';
import { getAthletes, getActiveAthlete, getActiveAthleteId, setActiveAthlete,
         saveAthlete, deleteAthlete, getAthletePRs, setAthletePRs,
         getAthleteProgramStart, setAthleteProgramStart } from '../athletes.js';

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

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
          ${esc(a.icon||'🏋️')} ${esc(a.name)}
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
        <h1>${esc(athlete.icon||'🏋️')} ${esc(athlete.name)} — S${week}/6</h1>
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

      ${gzclpInfo()}

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

function gzclpInfo() {
  const PRO = [
    ['Estructura en 3 niveles',  'T1 (fuerza máxima) → T2 (hipertrofia) → T3 (aislamiento). Cada sesión trabaja las tres adaptaciones simultáneamente, sin que compitan entre sí por intensidad.'],
    ['Progresión lineal simple', 'El peso sube semana a semana basado en porcentajes del PR. No hay que pensar — el programa decide la carga. Ideal para consolidar la técnica bajo fatiga acumulada.'],
    ['Autoregulado',             'Las semanas de Peak PR son optativos (OPT-IN). Si el cuerpo no está listo, se omite el intento y se vuelve a acumular. Reduce el riesgo de lesión por ego.'],
    ['Alta frecuencia de press', 'Banca aparece en S1 y como T2 en S3. La frecuencia 2×/semana con volúmenes distintos acelera la adaptación neuromotora en patrones de empuje.'],
  ];
  const CON = [
    ['Poco volumen de pierna',   'Deadlift y sentadilla se trabajan en S5 y S2 respectivamente con baja frecuencia semanal. Para hipertrofia de cuádriceps puede ser insuficiente sin T2/T3 complementarios.'],
    ['No es un programa de hipertrofia pura', 'El foco en T1 pesado reduce el volumen total. Si el objetivo es volumen máximo de músculo, bloques de hipertrofia dedicados son más eficientes.'],
    ['Requiere historial de PRs', 'Los porcentajes de carga se calculan desde un 1RM conocido. Sin datos previos sólidos, las primeras semanas pueden ser demasiado conservadoras o agresivas.'],
    ['Mesociclo corto (6 sem)',  'Un pico de 6 semanas no da margen para corregir una semana mala de sueño, estrés o lesión menor. Un bloque de 8-12 semanas sería más robusto para la mayoría.'],
  ];

  const row = ([title, text], color) => `
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <div style="flex-shrink:0;margin-top:3px;width:6px;height:6px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color}"></div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:2px">${title}</div>
        <div style="font-size:11px;color:var(--dim);line-height:1.55">${text}</div>
      </div>
    </div>`;

  return `
    <div style="margin-top:20px;border:1px solid var(--border);border-radius:14px;overflow:hidden">
      <button id="gzclp-toggle" style="width:100%;background:transparent;border:none;padding:14px 16px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;text-align:left">
        <div>
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);font-family:'JetBrains Mono',monospace;margin-bottom:3px">MÉTODO</div>
          <div style="font-size:14px;font-weight:800;color:var(--cyan);font-family:'Orbitron',sans-serif;letter-spacing:.05em">¿Qué es GZCLP?</div>
        </div>
        <span id="gzclp-arrow" style="font-size:18px;color:var(--dim);transition:transform .2s">▸</span>
      </button>

      <div id="gzclp-body" style="display:none;padding:0 16px 20px">

        <!-- Origen -->
        <div style="background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.15);border-radius:10px;padding:14px;margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--cyan);margin-bottom:8px;font-family:'JetBrains Mono',monospace">ORIGEN</div>
          <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:8px">
            <strong style="color:var(--cyan)">GZCL</strong> son las iniciales de <strong>Cody Lefever</strong> (usuario <em>u/gzcl</em> en Reddit), soldado del ejército estadounidense y powerlifter de élite.
            Desarrolló el <strong>Método GZCL</strong> (~2012) mientras entrenaba en condiciones de despliegue militar, donde el acceso al gimnasio era irregular y necesitaba un sistema adaptable y eficiente.
          </div>
          <div style="font-size:12px;color:var(--text);line-height:1.6">
            <strong style="color:var(--cyan)">GZCLP</strong> = <strong>GZCL Linear Progression</strong>. Es la versión de progresión lineal del método, diseñada para el rango <em>intermedio-avanzado</em>: atletas que ya superaron los programas de novato (5×5, StrongLifts) pero que aún no requieren periodización compleja por bloques.
          </div>
        </div>

        <!-- Estructura -->
        <div style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:10px;font-family:'JetBrains Mono',monospace">ESTRUCTURA DE TIERS</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <div style="background:rgba(255,0,128,.08);border:1px solid rgba(255,0,128,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--pink);font-family:'Orbitron',sans-serif">T1</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Fuerza máxima<br>1–5 reps<br>85–100% 1RM</div>
            </div>
            <div style="background:rgba(0,255,159,.08);border:1px solid rgba(0,255,159,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--mint);font-family:'Orbitron',sans-serif">T2</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Hipertrofia<br>8–12 reps<br>65–80% 1RM</div>
            </div>
            <div style="background:rgba(255,230,0,.08);border:1px solid rgba(255,230,0,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--gold);font-family:'Orbitron',sans-serif">T3</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Aislamiento<br>15–25 reps<br>40–60% 1RM</div>
            </div>
          </div>
        </div>

        <!-- Ventajas -->
        <div style="margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--mint);margin-bottom:10px;font-family:'JetBrains Mono',monospace">✓ VENTAJAS</div>
          ${PRO.map(r => row(r,'var(--mint)')).join('')}
        </div>

        <!-- Desventajas -->
        <div style="margin-bottom:4px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--pink);margin-bottom:10px;font-family:'JetBrains Mono',monospace">✗ LIMITACIONES</div>
          ${CON.map(r => row(r,'var(--pink)')).join('')}
        </div>

        <div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-top:12px;font-family:'JetBrains Mono',monospace">
          Fuente: u/gzcl · reddit.com/r/gzcl · Lefever (2014) <em>GZCL Method</em>
        </div>
      </div>
    </div>`;
}

export function bindDashboard() {
  // GZCLP info toggle
  document.getElementById('gzclp-toggle')?.addEventListener('click', () => {
    const body  = document.getElementById('gzclp-body');
    const arrow = document.getElementById('gzclp-arrow');
    const open  = body.style.display === 'none';
    body.style.display  = open ? 'block' : 'none';
    arrow.textContent   = open ? '▾' : '▸';
    arrow.style.transform = open ? 'rotate(0deg)' : '';
  });

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
