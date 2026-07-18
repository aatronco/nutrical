// js/views/dashboard.js
import { getCurrentWeek } from '../load-calculator.js';
import { PROGRAM_WEEKS, getPhaseForWeek } from '../workout-data.js';
import { getAthletes, getActiveAthlete, getActiveAthleteId, setActiveAthlete,
         saveAthlete, deleteAthlete, getAthletePRs, setAthletePRs,
         getAthleteProgramStart, setAthleteProgramStart,
         getAthleteWeekOverride, setAthleteWeekOverride } from '../athletes.js';

function esc(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function renderDashboard() {
  const athlete   = getActiveAthlete();
  const startDate = getAthleteProgramStart(athlete.id);
  const week      = getCurrentWeek(startDate, getAthleteWeekOverride(athlete.id));
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
        <h1>${esc(athlete.icon||'🏋️')} ${esc(athlete.name)} —
          <button class="week-nav-btn" data-week-action="prev" aria-label="Semana anterior" ${week<=1?'disabled':''}>‹</button>
          S${week}/${PROGRAM_WEEKS}
          <button class="week-nav-btn" data-week-action="next" aria-label="Semana siguiente" ${week>=PROGRAM_WEEKS?'disabled':''}>›</button>
        </h1>
        <p class="hero-sub">GZCL The Rippler — ${getPhaseForWeek(week).label}</p>
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
          💪 S1 — Empuje · Banca
        </a>
        <a href="#/workout/S2" style="display:block;padding:16px;background:var(--card);border:1px solid var(--cyan);border-radius:14px;color:var(--cyan);font-weight:800;text-decoration:none;text-align:center;">
          🏔️ S2 — Pierna · Cuádriceps
        </a>
        <a href="#/workout/S3" style="display:block;padding:16px;background:var(--card);border:1px solid var(--mint);border-radius:14px;color:var(--mint);font-weight:800;text-decoration:none;text-align:center;">
          💪 S3 — Tirón · Dominadas
        </a>
        <a href="#/workout/S4" style="display:block;padding:16px;background:var(--card);border:1px solid var(--orange);border-radius:14px;color:var(--orange);font-weight:800;text-decoration:none;text-align:center;">
          🏔️ S4 — Pierna · Glúteo/Posterior
        </a>
        <a href="#/workout/S5" style="display:block;padding:16px;background:var(--card);border:1px solid var(--gold);border-radius:14px;color:var(--gold);font-weight:800;text-decoration:none;text-align:center;">
          💪 S5 — Cadena Posterior · Peso Muerto
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
    ['Olas que perdonan',        'La carga sube "dos pasos adelante, uno atrás" en bloques de 4 semanas. Un mal día no rompe el programa — la ola vuelve a pasar por ahí. Clave en déficit calórico.'],
    ['Intensidad sin desgaste',  'T1 trabaja al 80–95% del 2RM con pocas reps: máximo estímulo neural para retener fuerza mientras bajas de peso, con volumen controlado.'],
    ['Autoregulado',             'Las series AMRAP son "máximas reps con técnica sólida", no al fallo. Y los intentos de 1RM en semana 12 son OPT-IN — si el cuerpo no está, no se hacen.'],
    ['12 semanas de horizonte',  'Tres bloques + peaking dan margen para absorber una semana mala de sueño o estrés sin descarrilar el ciclo completo.'],
  ];
  const CON = [
    ['Requiere RMs decentes',    'Los porcentajes se calculan desde 2RM y 5RM. Con estimados (Epley) las primeras semanas calibran: si una ola se siente @6 o menos, el RM base está bajo.'],
    ['Singles demandantes',      'Desde la semana 8 aparecen singles al 92.5%+. Exigen técnica consolidada y buena entrada en calor — no saltarse la rampa de calentamiento.'],
    ['Testear 1RM en déficit',   'El test de semana 12 en déficit puede quedar corto vs tu fuerza real. Superar el 2RM base ya es progreso; el PR absoluto llegará en mantenimiento.'],
    ['No es hipertrofia pura',   'El volumen total es moderado. La retención muscular en déficit la sostienen los T2/T3 y los días de pierna — no los saltes.'],
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
          <div style="font-size:14px;font-weight:800;color:var(--cyan);font-family:'Orbitron',sans-serif;letter-spacing:.05em">¿Qué es The Rippler?</div>
        </div>
        <span id="gzclp-arrow" style="font-size:18px;color:var(--dim);transition:transform .2s">▸</span>
      </button>

      <div id="gzclp-body" style="display:none;padding:0 16px 20px">

        <!-- Origen -->
        <div style="background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.15);border-radius:10px;padding:14px;margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--cyan);margin-bottom:8px;font-family:'JetBrains Mono',monospace">ORIGEN</div>
          <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:8px">
            <strong style="color:var(--cyan)">GZCL</strong> son las iniciales de <strong>Cody Lefever</strong> (usuario <em>u/gzcl</em> en Reddit), soldado del ejército estadounidense y powerlifter de élite.
            <strong style="color:var(--cyan)">The Rippler</strong> es su programa intermedio (de <em>GZCL Applications &amp; Adaptations</em>, 2016) — el paso siguiente cuando la progresión lineal de GZCLP se estanca.
          </div>
          <div style="font-size:12px;color:var(--text);line-height:1.6">
            El nombre viene del patrón de <em>ondas</em> ("ripples"): la intensidad del T1 sube y baja semana a semana en bloques de 4, acumulando cada vez más alto. T1 se calcula desde tu <strong>2RM</strong> y T2 desde tu <strong>5RM</strong>, en 12 semanas que culminan con 2RM pesados (sem 11) y test de 1RM opcional (sem 12).
          </div>
        </div>

        <!-- Estructura -->
        <div style="background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);margin-bottom:10px;font-family:'JetBrains Mono',monospace">ESTRUCTURA DE TIERS</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
            <div style="background:rgba(255,0,128,.08);border:1px solid rgba(255,0,128,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--pink);font-family:'Orbitron',sans-serif">T1</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Olas de 2RM<br>1–5 reps<br>80–95% 2RM</div>
            </div>
            <div style="background:rgba(0,255,159,.08);border:1px solid rgba(0,255,159,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--mint);font-family:'Orbitron',sans-serif">T2</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Olas de 5RM<br>3–6 reps<br>68–85% 5RM</div>
            </div>
            <div style="background:rgba(255,230,0,.08);border:1px solid rgba(255,230,0,.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:16px;font-weight:900;color:var(--gold);font-family:'Orbitron',sans-serif">T3</div>
              <div style="font-size:10px;color:var(--dim);margin-top:4px;line-height:1.4">Aislamiento<br>reps altas<br>AMRAP flexible</div>
            </div>
          </div>
        </div>

        <!-- Ventajas -->
        <div style="margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--mint);margin-bottom:10px;font-family:'JetBrains Mono',monospace">✓ VENTAJAS</div>
          ${PRO.map(r => row(r,'var(--mint)')).join('')}
        </div>

        <!-- Desventajas -->
        <div style="margin-bottom:16px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--pink);margin-bottom:10px;font-family:'JetBrains Mono',monospace">✗ LIMITACIONES</div>
          ${CON.map(r => row(r,'var(--pink)')).join('')}
        </div>

        <!-- Modificaciones -->
        <div style="background:rgba(160,100,255,.06);border:1px solid rgba(160,100,255,.25);border-radius:10px;padding:14px;margin-bottom:4px">
          <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--purple);margin-bottom:10px;font-family:'JetBrains Mono',monospace">⚡ MODIFICACIONES — RIPPLER × KINE</div>
          <div style="font-size:12px;color:var(--text);line-height:1.6;margin-bottom:12px">
            Esta versión adapta el Rippler clásico de 4 días a una <strong style="color:var(--purple)">semana de 5 días con el programa del kinesiólogo integrado</strong> (actualización julio 2026).
          </div>
          ${[
            ['Pierna por RPE, no por olas',  'S2 (cuádriceps) y S4 (glúteo/posterior) siguen la receta del kine con cargas por RPE y regla EVA ≤3. Reemplazan el día de sentadilla del Rippler clásico.'],
            ['Dominadas como T1',            'En vez de press militar como cuarto T1, S3 usa dominadas con ola de 2RM sobre el peso total (cuerpo + lastre): asistidas en las semanas livianas, lastradas en las pesadas.'],
            ['Hombro terapéutico repartido', 'El bloque de hombro del kine vive en S1 (empuje: chaos push up, serrato, banca inclinada) y S3 (rehabilitación: escapular, isométrico, flexoextensión). Es parte estructural, no accesorio.'],
            ['Bloque E en S5',               'Tras el peso muerto, un mini-bloque de pierna del kine (extensión, prensa, RDL unilateral) suma el tercer estímulo semanal de pierna con carga moderada.'],
          ].map(r => row(r, 'var(--purple)')).join('')}
        </div>

        <div style="font-size:10px;color:rgba(255,255,255,.2);text-align:right;margin-top:12px;font-family:'JetBrains Mono',monospace">
          Fuente: u/gzcl · reddit.com/r/gzcl · Lefever (2016) <em>GZCL Applications &amp; Adaptations</em>
        </div>
      </div>
    </div>`;
}

export function bindDashboard() {
  const athlete = getActiveAthlete();

  // Vaciar cola de respaldo pendiente (sesiones/PRs que no alcanzaron a subir a Sheets)
  import('../workout-sync.js').then(m => m.flushQueue()).catch(() => {});

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
