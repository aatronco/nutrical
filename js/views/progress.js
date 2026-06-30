// js/views/progress.js
// Strength progression dashboard — shows planned vs actual PR targets per week.
import { SESSIONS, PHASES, getPhaseForWeek } from '../workout-data.js';
import { getCurrentWeek } from '../load-calculator.js';

const LIFTS = [
  { key: 'S1', name: 'Press Banca', color: 'var(--pink)',   icon: '🏋️' },
  { key: 'S5', name: 'Deadlift',    color: 'var(--gold)',   icon: '⛓️'  },
];
// Squat tracked separately — kine session uses RPE, no byWeek targets
const SQUAT_KEY = 'sentadilla';

function getPRTargets(sessionKey) {
  const session = SESSIONS[sessionKey];
  if (!session?.T1?.byWeek) return [];
  return [1,2,3,4,5,6].map(week => {
    const sets = session.T1.byWeek[week];
    if (!sets) return { week, top: null };
    const topWork = [...(sets.warmup||[]), ...(sets.work||[])].filter(s => s.type !== 'warmup');
    const pr     = topWork.find(s => s.type === 'pr');
    const topSet = pr || topWork.reduce((a,b) => (b.kg > (a?.kg||0) ? b : a), null);
    return { week, top: topSet?.kg||null, reps: topSet?.reps||null, label: topSet?.label||'' };
  });
}

function miniChart(lifts, targets, currentWeek, prs) {
  const W=360, H=130, PAD={t:16,r:12,b:32,l:40};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;
  const weeks=[1,2,3,4,5,6];

  const allVals=targets.flatMap(t=>t.filter(x=>x.top).map(x=>x.top));
  const minV=Math.min(...allVals)*0.95, maxV=Math.max(...allVals)*1.02;
  const range=maxV-minV||1;

  const xOf=i=>PAD.l+(i/5)*cW;
  const yOf=v=>PAD.t+(1-(v-minV)/range)*cH;

  let s='';

  // Phase background bands
  PHASES.forEach(ph=>{
    const x1=xOf(ph.weeks[0]-1), x2=xOf(ph.weeks[ph.weeks.length-1]-1)+cW/5;
    s+=`<rect x="${x1.toFixed(1)}" y="${PAD.t}" width="${(x2-x1).toFixed(1)}" height="${cH}" fill="rgba(255,255,255,.02)"/>`;
  });

  // Grid
  [0,.5,1].forEach(f=>{
    const y=PAD.t+f*cH;
    const v=maxV-f*range;
    s+=`<line x1="${PAD.l}" y1="${y.toFixed(1)}" x2="${W-PAD.r}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;
    s+=`<text x="${PAD.l-4}" y="${(y+4).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,.3)" font-size="8" font-family="JetBrains Mono, monospace">${Math.round(v)}</text>`;
  });

  // Lines per lift
  lifts.forEach((lift, li) => {
    const pts=targets[li].filter(t=>t.top!=null);
    if (pts.length < 2) return;
    const path=pts.map((t,i)=>`${i===0?'M':'L'}${xOf(t.week-1).toFixed(1)},${yOf(t.top).toFixed(1)}`).join(' ');
    s+=`<path d="${path}" fill="none" stroke="${lift.color}" stroke-width="1.8" stroke-dasharray="4,3" opacity=".6"/>`;
  });

  // Actual PR points
  lifts.forEach(lift=>{
    const actual=prs[lift.key];
    if (!actual) return;
    const x=xOf(currentWeek-1), y=yOf(Math.min(actual,maxV));
    s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${lift.color}" opacity=".9"/>`;
    s+=`<text x="${(x+8).toFixed(1)}" y="${(y+4).toFixed(1)}" fill="${lift.color}" font-size="9" font-weight="700" font-family="JetBrains Mono, monospace">${actual} kg</text>`;
  });

  // X axis labels
  weeks.forEach((w,i)=>{
    const ph=getPhaseForWeek(w);
    s+=`<text x="${xOf(i).toFixed(1)}" y="${(PAD.t+cH+14).toFixed(1)}" text-anchor="middle" fill="${w===currentWeek?'#fff':'rgba(255,255,255,.4)'}" font-size="${w===currentWeek?9:8}" font-weight="${w===currentWeek?'700':'400'}" font-family="JetBrains Mono, monospace">S${w}</text>`;
  });

  // Current week line
  const cx2=xOf(currentWeek-1);
  s+=`<line x1="${cx2.toFixed(1)}" y1="${PAD.t}" x2="${cx2.toFixed(1)}" y2="${PAD.t+cH}" stroke="rgba(255,255,255,.2)" stroke-width="1" stroke-dasharray="2,3"/>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;max-width:100%;overflow:visible">${s}</svg>`;
}

export function renderProgress() {
  const startDate = localStorage.getItem('gzclp_program_start') || new Date().toISOString().slice(0,10);
  const week      = getCurrentWeek(startDate);
  const storedPRs = JSON.parse(localStorage.getItem('gzclp_prs') || '{}');
  const actualPRs = {
    S1: storedPRs.banca    || SESSIONS.S1?.T1?.prBase,
    S5: storedPRs.deadlift || SESSIONS.S5?.T1?.prBase,
  };

  const targets = LIFTS.map(l => getPRTargets(l.key));

  // Per-lift tables
  const liftCards = LIFTS.map((lift, li) => {
    const t = targets[li];
    const rows = t.map(({ week: w, top, reps, label }) => {
      const ph    = getPhaseForWeek(w);
      const isCur = w === week;
      return `
        <tr style="${isCur ? 'background:rgba(255,255,255,.04)' : ''}">
          <td style="padding:7px 10px;font-size:12px;font-weight:${isCur?'700':'400'};color:${isCur?'#fff':'rgba(255,255,255,.6)'}">
            ${isCur ? '▸ ' : ''}S${w}
          </td>
          <td style="padding:7px 10px;font-size:10px;color:rgba(255,255,255,.4)">${ph.label}</td>
          <td style="padding:7px 10px;font-size:12px;font-weight:700;color:${lift.color}">${top ? top+' kg' : '—'}</td>
          <td style="padding:7px 10px;font-size:11px;color:rgba(255,255,255,.4)">${reps ? '×'+reps : '—'}</td>
          <td style="padding:7px 10px;font-size:10px;color:rgba(255,255,255,.35)">${label}</td>
        </tr>`;
    }).join('');

    const currentTarget = t.find(x => x.week === week);
    const pct = actualPRs[lift.key] && currentTarget?.top
      ? Math.round((actualPRs[lift.key] / currentTarget.top) * 100)
      : null;

    return `
      <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;overflow:hidden;margin-bottom:16px">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:14px;font-weight:800;color:${lift.color}">${lift.icon} ${lift.name}</div>
            <div style="font-size:11px;color:var(--dim);margin-top:2px">Semana actual: S${week} — ${getPhaseForWeek(week).label}</div>
          </div>
          ${pct != null ? `<div style="text-align:center">
            <div style="font-size:20px;font-weight:800;color:${lift.color}">${pct}%</div>
            <div style="font-size:9px;color:var(--dim)">vs target</div>
          </div>` : ''}
        </div>
        <div style="overflow-x:auto;padding:12px 16px">
          ${miniChart([lift], [targets[li]], week, actualPRs)}
        </div>
        <table style="width:100%;border-collapse:collapse;font-family:'JetBrains Mono',monospace">
          <thead>
            <tr style="border-bottom:1px solid var(--border)">
              <th style="padding:6px 10px;font-size:9px;letter-spacing:.1em;color:var(--dim);text-align:left">SEM</th>
              <th style="padding:6px 10px;font-size:9px;letter-spacing:.1em;color:var(--dim);text-align:left">FASE</th>
              <th style="padding:6px 10px;font-size:9px;letter-spacing:.1em;color:var(--dim);text-align:left">CARGA</th>
              <th style="padding:6px 10px;font-size:9px;letter-spacing:.1em;color:var(--dim);text-align:left">REPS</th>
              <th style="padding:6px 10px;font-size:9px;letter-spacing:.1em;color:var(--dim);text-align:left">SERIE</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  // Squat card (kine session, RPE-based — no weekly targets)
  const squatPR = storedPRs[SQUAT_KEY];
  const squatCard = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div>
          <div style="font-size:14px;font-weight:800;color:var(--cyan)">🏔️ Sentadilla Frontal</div>
          <div style="font-size:11px;color:var(--dim);margin-top:2px">Sesión S2/S4 — carga por RPE, sin objetivos semanales fijos</div>
        </div>
        ${squatPR ? `<div style="text-align:center">
          <div style="font-size:22px;font-weight:800;color:var(--cyan)">${squatPR} kg</div>
          <div style="font-size:9px;color:var(--dim)">PR actual</div>
        </div>` : `<div style="font-size:11px;color:var(--dim)">Sin PR registrado</div>`}
      </div>
      <div style="font-size:11px;color:rgba(255,255,255,.3);font-family:'JetBrains Mono',monospace;border-top:1px solid var(--border);padding-top:10px">
        Squat frontal (back bar) · 3×8 · Progresa cuando se siente @7 o menos · Video requerido
      </div>
    </div>`;

  // Pull-up progression
  const s3 = SESSIONS.S3;
  const pullupCard = s3?.T1?.frente1 ? `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="font-size:14px;font-weight:800;color:var(--mint);margin-bottom:8px">🔝 Pull-ups</div>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        ${[1,2,3,4,5,6].map(w => {
          const sets = s3.T1.frente1.setsByWeek?.[w] ?? s3.T1.frente1.sets;
          const ph = getPhaseForWeek(w);
          return `
            <div style="flex:1;min-width:80px;background:${w===week?'rgba(0,255,159,.08)':'rgba(255,255,255,.03)'};border:1px solid ${w===week?'var(--mint)':'var(--border)'};border-radius:10px;padding:10px;text-align:center">
              <div style="font-size:9px;color:var(--dim)">S${w}</div>
              <div style="font-size:18px;font-weight:800;color:var(--mint)">${sets}</div>
              <div style="font-size:9px;color:var(--dim)">series</div>
            </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Update PRs form
  const updateForm = `
    <div style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:16px">
      <div style="font-size:13px;font-weight:700;color:var(--text);margin-bottom:12px">◈ Actualizar PRs reales</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <div style="flex:1;min-width:120px">
          <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Press Banca (kg)</label>
          <input id="pr-banca" type="number" value="${storedPRs.banca||''}" step="0.5" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font-size:14px;font-family:'JetBrains Mono',monospace">
        </div>
        <div style="flex:1;min-width:120px">
          <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Deadlift (kg)</label>
          <input id="pr-deadlift" type="number" value="${storedPRs.deadlift||''}" step="0.5" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font-size:14px;font-family:'JetBrains Mono',monospace">
        </div>
        <div style="flex:1;min-width:120px">
          <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Sentadilla (kg)</label>
          <input id="pr-sentadilla" type="number" value="${storedPRs[SQUAT_KEY]||''}" step="0.5" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font-size:14px;font-family:'JetBrains Mono',monospace">
        </div>
        <div style="flex:1;min-width:120px">
          <label style="font-size:10px;color:var(--dim);display:block;margin-bottom:4px">Pullups (reps)</label>
          <input id="pr-pullups" type="number" value="${storedPRs.pullups||''}" step="1" style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:8px 10px;color:var(--text);font-size:14px;font-family:'JetBrains Mono',monospace">
        </div>
      </div>
      <button id="save-prs" style="width:100%;padding:12px;background:var(--purple);border:none;border-radius:10px;color:#fff;font-size:14px;font-weight:800;cursor:pointer">Guardar PRs</button>
    </div>`;

  return `
    <div style="padding:14px 14px 20px">
      <h2 style="font-size:18px;font-weight:900;color:var(--text);margin-bottom:4px">📈 Progresión GZCLP v6</h2>
      <div style="font-size:12px;color:var(--dim);margin-bottom:20px">Semana ${week} de 6 — ${getPhaseForWeek(week).label}</div>
      ${updateForm}
      ${liftCards}
      ${squatCard}
      ${pullupCard}
    </div>`;
}

export function bindProgress() {
  document.getElementById('save-prs')?.addEventListener('click', () => {
    const banca      = parseFloat(document.getElementById('pr-banca')?.value);
    const deadlift   = parseFloat(document.getElementById('pr-deadlift')?.value);
    const sentadilla = parseFloat(document.getElementById('pr-sentadilla')?.value);
    const pullups    = parseInt(document.getElementById('pr-pullups')?.value);
    const prs = {};
    if (!isNaN(banca))      prs.banca      = banca;
    if (!isNaN(deadlift))   prs.deadlift   = deadlift;
    if (!isNaN(sentadilla)) prs[SQUAT_KEY] = sentadilla;
    if (!isNaN(pullups))    prs.pullups    = pullups;
    localStorage.setItem('gzclp_prs', JSON.stringify(prs));
    const btn = document.getElementById('save-prs');
    btn.textContent = '✓ Guardado';
    btn.style.background = 'var(--mint)';
    btn.style.color = '#001a0a';
    setTimeout(() => location.reload(), 800);
  });
}
