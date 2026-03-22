// js/views/patient-detail.js
import { getPatients, getConsultations } from '../sheets.js';
import { calcularTodo, calcularEdad } from '../formulas.js';

export async function renderPatientDetail(patientId) {
  const patients    = await getPatients();
  const patient     = patients.find(p => p.id === patientId);
  if (!patient) return '<p>Paciente no encontrado.</p>';

  const consultas   = await getConsultations(patientId);
  const edad        = Math.floor(calcularEdad(new Date().toISOString().slice(0,10), patient.fecha_nacimiento));

  // Build C1–C6 cards
  let cards = '';
  for (let n = 1; n <= 6; n++) {
    const c = consultas.find(x => x.numero_consulta == n);
    if (c) {
      const res = calcularTodo(c, patient.sexo, patient.fecha_nacimiento);
      cards += `
        <a href="#/patients/${patientId}/c/${n}" class="consult-card active">
          <div class="cn">C${n}</div>
          <div class="date">${c.fecha_evaluacion || ''}</div>
          <div class="stats">${c.peso ? c.peso + ' kg' : ''} · ${res.masas?.adiposa ? (res.masas.adiposa.pct * 100).toFixed(1) + '% adip.' : ''}</div>
        </a>`;
    } else {
      cards += `
        <a href="#/patients/${patientId}/c/${n}" class="consult-card empty">
          <div class="cn">C${n}</div>
          <div style="font-size:20px;margin-top:8px">+</div>
        </a>`;
    }
  }

  // Comparison table
  const completedConsultas = consultas.sort((a,b) => a.numero_consulta - b.numero_consulta);
  let compTable = '';
  if (completedConsultas.length > 1) {
    const rows = [
      ['Peso (kg)',    c => c.peso],
      ['Talla (cm)',   c => c.talla],
      ['IMC',         (c, r) => r.imc?.toFixed(2)],
      ['% Adiposa',   (c, r) => r.masas?.adiposa ? (r.masas.adiposa.pct*100).toFixed(1)+'%' : ''],
      ['% Muscular',  (c, r) => r.masas?.muscular ? (r.masas.muscular.pct*100).toFixed(1)+'%' : ''],
      ['% Ósea',      (c, r) => r.masas?.osea ? (r.masas.osea.pct*100).toFixed(1)+'%' : ''],
      ['Endomorfia',  (c, r) => r.soma?.endo?.toFixed(2)],
      ['Mesomorfia',  (c, r) => r.soma?.meso?.toFixed(2)],
      ['Ectomorfia',  (c, r) => r.soma?.ecto?.toFixed(2)],
    ];
    const results = completedConsultas.map(c => ({
      c,
      r: calcularTodo(c, patient.sexo, patient.fecha_nacimiento)
    }));
    const headerCols = completedConsultas.map(c => `<th>C${c.numero_consulta}<br><small>${c.fecha_evaluacion||''}</small></th>`).join('');
    const bodyRows = rows.map(([label, fn]) => {
      const cells = results.map(({c, r}) => `<td>${fn(c, r) ?? '—'}</td>`).join('');
      return `<tr><td><strong>${label}</strong></td>${cells}</tr>`;
    }).join('');
    compTable = `
      <h3 style="font-size:16px;font-weight:600;margin-bottom:12px">Comparativa</h3>
      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>Medición</th>${headerCols}</tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div>`;
  }

  // Charts placeholder — filled in bindPatientDetail
  const chartsHtml = completedConsultas.length > 1 ? `
    <h3 style="font-size:16px;font-weight:600;margin:24px 0 12px">Progresión</h3>
    <canvas id="chart-progress" height="80"></canvas>
  ` : '';

  return `
    <div class="breadcrumb"><a href="#/patients">Pacientes</a><span>›</span>${patient.nombre}</div>

    <div class="card flex-between" style="margin-bottom:20px">
      <div>
        <div style="font-size:20px;font-weight:700">${patient.nombre}</div>
        <div style="color:var(--muted);margin-top:4px">${patient.sexo === 'F' ? 'Femenina' : 'Masculino'} · ${edad} años${patient.deporte ? ' · ' + patient.deporte : ''}</div>
      </div>
      <a href="#/patients/${patientId}/report" class="btn btn-secondary btn-sm no-print">Imprimir informe</a>
    </div>

    <h3 style="font-size:16px;font-weight:600;margin-bottom:12px">Consultas</h3>
    <div class="consult-grid">${cards}</div>

    ${chartsHtml}
    <div id="comparison-section" style="margin-top:24px">${compTable}</div>
  `;
}

export async function bindPatientDetail(patientId) {
  const patients  = await getPatients();
  const patient   = patients.find(p => p.id === patientId);
  const consultas = await getConsultations(patientId);
  const completed = consultas.sort((a,b) => a.numero_consulta - b.numero_consulta);

  if (completed.length < 2) return;

  const results = completed.map(c => calcularTodo(c, patient.sexo, patient.fecha_nacimiento));
  const labels  = completed.map(c => `C${c.numero_consulta}`);

  const canvas = document.getElementById('chart-progress');
  if (!canvas || typeof Chart === 'undefined') return;

  new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Peso (kg)',    data: completed.map(c => c.peso),   borderColor: '#1c1917', tension: .3 },
        { label: '% Adiposa',   data: results.map(r => r.masas?.adiposa ? +(r.masas.adiposa.pct*100).toFixed(1) : null), borderColor: '#78716c', tension: .3 },
        { label: '% Muscular',  data: results.map(r => r.masas?.muscular ? +(r.masas.muscular.pct*100).toFixed(1) : null), borderColor: '#44403c', tension: .3 },
      ],
    },
    options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
  });
}
