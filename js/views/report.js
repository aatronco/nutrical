// js/views/report.js
import { getPatients, getConsultations } from '../sheets.js';
import { calcularTodo, calcularEdad } from '../formulas.js';

function bar(pct, label, color = '#1c1917') {
  return `
    <div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span>${label}</span><span>${(pct*100).toFixed(1)}%</span>
      </div>
      <div style="background:#e7e5e4;border-radius:3px;height:8px">
        <div style="width:${(pct*100).toFixed(1)}%;background:${color};height:100%;border-radius:3px"></div>
      </div>
    </div>`;
}

export async function renderReport(patientId) {
  const patients  = await getPatients();
  const patient   = patients.find(p => p.id === patientId);
  if (!patient) return '<p>Paciente no encontrado.</p>';

  const consultas  = await getConsultations(patientId);
  const completed  = consultas.sort((a,b) => a.numero_consulta - b.numero_consulta);
  const latest     = completed[completed.length - 1];
  if (!latest) return '<p>Sin consultas registradas.</p>';

  const edad = Math.floor(calcularEdad(latest.fecha_evaluacion || new Date().toISOString().slice(0,10), patient.fecha_nacimiento));
  const r    = calcularTodo(latest, patient.sexo, patient.fecha_nacimiento);
  const fmt  = (n, d=2) => n != null ? (+n).toFixed(d) : '—';

  // IMC classification
  const imc    = r.imc || 0;
  const imcCls = imc < 18.5 ? 'Bajo peso' : imc < 25 ? 'Normal' : imc < 30 ? 'Sobrepeso' : 'Obesidad';

  // Comparison table
  const headerCols = completed.map(c => `<th>C${c.numero_consulta}<br><small>${c.fecha_evaluacion||''}</small></th>`).join('');
  const results    = completed.map(c => calcularTodo(c, patient.sexo, patient.fecha_nacimiento));
  const rows = [
    ['Peso (kg)',   completed.map(c => c.peso)],
    ['IMC',        results.map(r2 => fmt(r2.imc))],
    ['% Adiposa',  results.map(r2 => r2.masas?.adiposa ? (r2.masas.adiposa.pct*100).toFixed(1)+'%' : '—')],
    ['% Muscular', results.map(r2 => r2.masas?.muscular ? (r2.masas.muscular.pct*100).toFixed(1)+'%' : '—')],
    ['Endomorfia', results.map(r2 => fmt(r2.soma?.endo))],
    ['Mesomorfia', results.map(r2 => fmt(r2.soma?.meso))],
    ['Ectomorfia', results.map(r2 => fmt(r2.soma?.ecto))],
  ];
  const compTable = `
    <div style="overflow-x:auto">
      <table class="data-table" style="font-size:12px">
        <thead><tr><th>Medición</th>${headerCols}</tr></thead>
        <tbody>${rows.map(([label, vals]) =>
          `<tr><td><strong>${label}</strong></td>${vals.map(v => `<td>${v ?? '—'}</td>`).join('')}</tr>`
        ).join('')}</tbody>
      </table>
    </div>`;

  // Somatotype label
  const somaLabel = r.soma ? `${fmt(r.soma.endo,1)}-${fmt(r.soma.meso,1)}-${fmt(r.soma.ecto,1)}` : '—';

  return `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px" class="no-print">
      <a href="#/patients/${patientId}" class="btn btn-secondary btn-sm">← Volver</a>
      <button onclick="window.print()" class="btn btn-primary btn-sm">Imprimir</button>
    </div>

    <!-- Section 1: Patient header -->
    <div class="report-section card">
      <div style="font-size:18px;font-weight:700">${patient.nombre}</div>
      <div style="color:#78716c;margin-top:4px;font-size:14px">
        ${patient.sexo === 'F' ? 'Femenino' : 'Masculino'} · ${edad} años · Consulta ${latest.numero_consulta} · ${latest.fecha_evaluacion || ''}
      </div>
    </div>

    <!-- Section 2: Basics + IMC -->
    <div class="report-section card">
      <h3 style="font-weight:700;margin-bottom:12px">Mediciones básicas</h3>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;font-size:14px">
        <div><div style="color:#78716c;font-size:11px;text-transform:uppercase">Peso</div><div style="font-weight:600">${latest.peso} kg</div></div>
        <div><div style="color:#78716c;font-size:11px;text-transform:uppercase">Talla</div><div style="font-weight:600">${latest.talla} cm</div></div>
        <div><div style="color:#78716c;font-size:11px;text-transform:uppercase">IMC</div><div style="font-weight:600">${fmt(r.imc)}</div></div>
        <div><div style="color:#78716c;font-size:11px;text-transform:uppercase">Clasificación</div><div style="font-weight:600">${imcCls}</div></div>
      </div>
    </div>

    <!-- Section 3: Body composition -->
    <div class="report-section card">
      <h3 style="font-weight:700;margin-bottom:12px">Composición corporal (5 masas)</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          ${r.masas ? [
            ['Adiposa',  r.masas.adiposa.pct,  '#78716c'],
            ['Muscular', r.masas.muscular.pct, '#1c1917'],
            ['Ósea',     r.masas.osea.pct,     '#44403c'],
            ['Residual', r.masas.residual.pct, '#a8a29e'],
            ['Piel',     r.masas.piel.pct,     '#d4d0ca'],
          ].map(([l,p,c]) => bar(p,l,c)).join('') : ''}
        </div>
        <div style="font-size:13px">
          ${r.masas ? `
            <table style="width:100%;border-collapse:collapse">
              <thead><tr><th style="text-align:left;padding:4px 8px;font-size:11px;color:#78716c">Masa</th><th style="text-align:right;padding:4px 8px;font-size:11px;color:#78716c">kg</th><th style="text-align:right;padding:4px 8px;font-size:11px;color:#78716c">%</th></tr></thead>
              <tbody>
                ${['adiposa','muscular','osea','residual','piel'].map(k => `
                  <tr style="border-bottom:1px solid #e7e5e4">
                    <td style="padding:5px 8px;text-transform:capitalize">${k}</td>
                    <td style="text-align:right;padding:5px 8px">${fmt(r.masas[k].kg)}</td>
                    <td style="text-align:right;padding:5px 8px">${(r.masas[k].pct*100).toFixed(1)}%</td>
                  </tr>`).join('')}
              </tbody>
            </table>` : ''}
        </div>
      </div>
    </div>

    <!-- Section 4: Somatotype -->
    <div class="report-section card">
      <h3 style="font-weight:700;margin-bottom:12px">Somatotipo</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;text-align:center">
        <div><div style="font-size:24px;font-weight:700">${fmt(r.soma?.endo,1)}</div><div style="color:#78716c;font-size:12px">Endomorfia</div></div>
        <div><div style="font-size:24px;font-weight:700">${fmt(r.soma?.meso,1)}</div><div style="color:#78716c;font-size:12px">Mesomorfia</div></div>
        <div><div style="font-size:24px;font-weight:700">${fmt(r.soma?.ecto,1)}</div><div style="color:#78716c;font-size:12px">Ectomorfia</div></div>
      </div>
      <div style="text-align:center;margin-top:8px;color:#78716c;font-size:13px">${somaLabel}</div>
    </div>

    <!-- Section 5: Indices -->
    <div class="report-section card page-break">
      <h3 style="font-weight:700;margin-bottom:12px">Índices</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <div>
          <div style="color:#78716c;font-size:11px;text-transform:uppercase;margin-bottom:4px">Muscular / Óseo</div>
          <div style="font-size:22px;font-weight:700">${fmt(r.indices?.muscularOseo)}</div>
        </div>
        <div>
          <div style="color:#78716c;font-size:11px;text-transform:uppercase;margin-bottom:4px">Muscular / Adiposo</div>
          <div style="font-size:22px;font-weight:700">${fmt(r.indices?.muscularAdiposo)}</div>
        </div>
      </div>
    </div>

    <!-- Section 6: Progress chart -->
    ${completed.length > 1 ? `
    <div class="report-section card">
      <h3 style="font-weight:700;margin-bottom:12px">Progresión</h3>
      <canvas id="report-chart" height="80"></canvas>
    </div>` : ''}

    <!-- Section 7: Comparison table -->
    ${completed.length > 1 ? `
    <div class="report-section card">
      <h3 style="font-weight:700;margin-bottom:12px">Comparativa de consultas</h3>
      ${compTable}
    </div>` : ''}
  `;
}

export async function bindReport(patientId) {
  const patients  = await getPatients();
  const patient   = patients.find(p => p.id === patientId);
  const consultas = await getConsultations(patientId);
  const completed = consultas.sort((a,b) => a.numero_consulta - b.numero_consulta);
  if (completed.length < 2) return;

  const results = completed.map(c => calcularTodo(c, patient.sexo, patient.fecha_nacimiento));
  const labels  = completed.map(c => `C${c.numero_consulta}`);
  const canvas  = document.getElementById('report-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Peso (kg)',   data: completed.map(c => c.peso), borderColor: '#1c1917', tension: .3 },
        { label: '% Adiposa',  data: results.map(r => r.masas?.adiposa ? +(r.masas.adiposa.pct*100).toFixed(1) : null), borderColor: '#78716c', tension: .3 },
        { label: '% Muscular', data: results.map(r => r.masas?.muscular ? +(r.masas.muscular.pct*100).toFixed(1) : null), borderColor: '#44403c', tension: .3 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}
