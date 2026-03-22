// js/views/consultation.js
import { getPatients, getConsultations, saveConsultation } from '../sheets.js';
import { calcularTodo } from '../formulas.js';

// Field definitions — [fieldKey, label, unit]
const FIELDS = {
  basicos: [
    ['fecha_evaluacion', 'Fecha evaluación', '', 'date'],
    ['peso',            'Peso', 'kg'],
    ['talla',           'Talla', 'cm'],
    ['talla_sentado',   'Talla sentado', 'cm'],
  ],
  diametros: [
    ['biacromial','Biacromial','cm'],['biliocrestideo','Biliocrestídeo','cm'],
    ['torax_transverso','Tórax transverso','cm'],['torax_ap','Tórax AP','cm'],
    ['humeral','Humeral','cm'],['femoral','Femoral','cm'],
  ],
  perimetros: [
    ['cabeza','Cabeza','cm'],['cuello','Cuello','cm'],['brazo_relajado','Brazo relajado','cm'],
    ['brazo_flexionado','Brazo flexionado','cm'],['antebrazo','Antebrazo','cm'],
    ['muneca','Muñeca','cm'],['torax_mesoesternal','Tórax mesoesternal','cm'],
    ['cintura','Cintura','cm'],['cadera_maxima','Cadera máxima','cm'],
    ['muslo_maximo','Muslo máximo','cm'],['muslo_medio','Muslo medio','cm'],
    ['pantorrilla_maxima','Pantorrilla máxima','cm'],['tobillo','Tobillo','cm'],
  ],
  pliegues: [
    ['tricipital','Tricipital','mm'],['subescapular','Subescapular','mm'],
    ['bicipital','Bicipital','mm'],['suprailiaco','Suprailiaco','mm'],
    ['supraespinal','Supraespinal','mm'],['abdominal','Abdominal','mm'],
    ['muslo_medio_pliegue','Muslo medio','mm'],['pantorrilla_pliegue','Pantorrilla','mm'],
  ],
  longitudes: [
    ['acromial_radial','Acromial-radial','mm'],['radial_estiloidea','Radial-estiloidea','mm'],
    ['est_dactilar','Est. estiloidea-dactilar','mm'],['ilioespinal','Ilioespinal','mm'],
    ['trocanterea','Trocantérea','mm'],['trocan_tibial_lat','Trocan.-tibial lat.','mm'],
    ['tibial_lat','Tibial lateral','mm'],['tibial_maleolar','Tibial-maleolar','mm'],
    ['pie','Pie','mm'],
  ],
};

const SCIENCE = {
  imc: { title: 'IMC', formula: 'IMC = Peso (kg) / Talla (m)²', source: 'OMS (1995). Physical status: The use and interpretation of anthropometry.' },
  masas: { title: '5 masas corporales', formula: 'Fraccionamiento de Kerr (1988): Score Z para cada masa a partir de mediciones de referencia normalizadas a 170.18 cm de talla.', source: 'Kerr, D.A. (1988). An anthropometric method for the fractionation of skin, adipose, muscle, bone and residual tissue masses in males and females age 6 to 77 years. M.Sc. Thesis, Simon Fraser University.' },
  soma: { title: 'Somatotipo', formula: 'Método Heath-Carter: Endomorfia (suma 3 pliegues corregida), Mesomorfia (diámetros y perímetros corregidos), Ectomorfia (índice talla/peso³).', source: 'Carter, J.E.L. & Heath, B.H. (1990). Somatotyping — development and applications. Cambridge University Press.' },
  indices: { title: 'Índices M/O y M/A', formula: 'M/Óseo = Masa muscular (kg) / Masa ósea (kg)\nM/Adiposo = Masa muscular (kg) / Masa adiposa (kg)', source: 'Ross, W.D. & Wilson, N.C. (1974). A stratagem for proportional growth assessment.' },
};

function sciencePanel(key) {
  const s = SCIENCE[key];
  return `
    <span class="science-toggle" onclick="this.nextElementSibling.classList.toggle('open')">¿Cómo se calcula? ↓</span>
    <div class="science-panel">
      <strong>${s.title}</strong><br>${s.formula}<br><em style="font-size:11px;opacity:.7">${s.source}</em>
    </div>
  `;
}

function fieldGroup(title, anchor, fields, prevConsulta) {
  const inputs = fields.map(([key, label, unit, type='number']) => `
    <div class="field">
      <label>${label}${unit ? ' ('+unit+')' : ''}
        ${prevConsulta && prevConsulta[key] != null ? `<span style="color:rgba(255,255,255,.35);font-size:10px;margin-left:4px">ant: ${prevConsulta[key]}</span>` : ''}
      </label>
      <input type="${type}" id="f-${key}" step="${type==='number' ? '0.1' : undefined}" ${type==='date' ? '' : 'min="0"'}>
    </div>
  `).join('');
  return `
    <div class="field-group" id="anchor-${anchor}">
      <h3>${title}</h3>
      <div class="field-grid">${inputs}</div>
    </div>
  `;
}

export async function renderConsultation(patientId, num) {
  const patients  = await getPatients();
  const patient   = patients.find(p => p.id === patientId);
  if (!patient) return '<p>Paciente no encontrado.</p>';

  const consultas = await getConsultations(patientId);
  const existing  = consultas.find(c => c.numero_consulta == num) || {};
  const prev      = num > 1 ? consultas.find(c => c.numero_consulta == num - 1) : null;

  return `
    <div class="breadcrumb">
      <a href="#/patients">Pacientes</a><span>›</span>
      <a href="#/patients/${patientId}">${patient.nombre}</a><span>›</span>
      Consulta ${num}
    </div>

    <div class="anchors">
      <a href="#anchor-basicos">Básicos</a>
      <a href="#anchor-diametros">Diámetros</a>
      <a href="#anchor-perimetros">Perímetros</a>
      <a href="#anchor-pliegues">Pliegues</a>
      <a href="#anchor-longitudes">Longitudes</a>
      <a href="#anchor-resultados">Resultados</a>
    </div>

    <form id="consult-form">
      ${fieldGroup('Básicos', 'basicos', FIELDS.basicos, prev)}
      ${fieldGroup('Diámetros (cm)', 'diametros', FIELDS.diametros, prev)}
      ${fieldGroup('Perímetros (cm)', 'perimetros', FIELDS.perimetros, prev)}
      ${fieldGroup('Pliegues (mm)', 'pliegues', FIELDS.pliegues, prev)}
      ${fieldGroup('Longitudes (mm)', 'longitudes', FIELDS.longitudes, prev)}

      <div class="results-block" id="anchor-resultados">
        <h3>Resultados en tiempo real</h3>
        <div id="results-display"><p style="color:rgba(255,255,255,.4);font-size:13px">Completa los campos para ver los cálculos.</p></div>
      </div>

      <div style="margin-top:24px;display:flex;gap:12px">
        <button type="button" class="btn btn-primary" id="save-btn">Guardar consulta</button>
        <a href="#/patients/${patientId}" class="btn btn-secondary">Cancelar</a>
      </div>
    </form>
  `;
}

export function bindConsultation(patientId, num) {
  // Pre-fill existing values
  getPatients().then(patients => {
    const patient = patients.find(p => p.id === patientId);
    getConsultations(patientId).then(consultas => {
      const existing = consultas.find(c => c.numero_consulta == num);
      if (existing) {
        Object.entries(existing).forEach(([key, val]) => {
          const el = document.getElementById('f-' + key);
          if (el && val != null) el.value = val;
        });
      }

      // Track existing ID to avoid generating a new UUID on update
      const existingId = existing?.id || null;

      // Live calculation on every input
      const form = document.getElementById('consult-form');
      form?.addEventListener('input', () => updateResults(patient));

      // Save — pass existingId so readForm preserves it on update
      document.getElementById('save-btn')?.addEventListener('click', async () => {
        const c = readForm(patientId, num, existingId);
        await saveConsultation(c);
      });
    });
  });
}

function readForm(patientId, num, existingId = null) {
  const allFields = [...FIELDS.basicos, ...FIELDS.diametros, ...FIELDS.perimetros, ...FIELDS.pliegues, ...FIELDS.longitudes];
  const c = {
    id:               existingId || crypto.randomUUID(), // preserve existing ID on update
    paciente_id:      patientId,
    numero_consulta:  num,
  };
  allFields.forEach(([key, , , type='number']) => {
    const el = document.getElementById('f-' + key);
    if (!el) return;
    c[key] = type === 'date' ? el.value : (el.value ? parseFloat(el.value) : null);
  });
  return c;
}

function updateResults(patient) {
  const c = readForm('', 0);
  c.fecha_evaluacion = document.getElementById('f-fecha_evaluacion')?.value;
  if (!c.peso || !c.talla) return;

  try {
    const r   = calcularTodo(c, patient.sexo, patient.fecha_nacimiento);
    const fmt = (n) => n != null ? +n.toFixed(2) : '—';
    const pct = (n) => n != null ? (n*100).toFixed(1)+'%' : '—';

    document.getElementById('results-display').innerHTML = `
      <div class="results-grid">
        <div class="result-item"><div class="value">${fmt(r.imc)}</div><div class="label">IMC</div></div>
        <div class="result-item"><div class="value">${pct(r.masas?.adiposa?.pct)}</div><div class="label">% Adiposa</div></div>
        <div class="result-item"><div class="value">${pct(r.masas?.muscular?.pct)}</div><div class="label">% Muscular</div></div>
        <div class="result-item"><div class="value">${pct(r.masas?.osea?.pct)}</div><div class="label">% Ósea</div></div>
        <div class="result-item"><div class="value">${pct(r.masas?.residual?.pct)}</div><div class="label">% Residual</div></div>
        <div class="result-item"><div class="value">${pct(r.masas?.piel?.pct)}</div><div class="label">% Piel</div></div>
      </div>
      <div style="margin-top:16px">${sciencePanel('masas')}</div>

      <div class="results-grid" style="margin-top:20px">
        <div class="result-item"><div class="value">${fmt(r.masas?.adiposa?.kg)}</div><div class="label">Adiposa kg</div></div>
        <div class="result-item"><div class="value">${fmt(r.masas?.muscular?.kg)}</div><div class="label">Muscular kg</div></div>
        <div class="result-item"><div class="value">${fmt(r.masas?.osea?.kg)}</div><div class="label">Ósea kg</div></div>
        <div class="result-item"><div class="value">${fmt(r.masas?.residual?.kg)}</div><div class="label">Residual kg</div></div>
        <div class="result-item"><div class="value">${fmt(r.masas?.piel?.kg)}</div><div class="label">Piel kg</div></div>
      </div>

      <div class="results-grid" style="margin-top:20px">
        <div class="result-item"><div class="value">${fmt(r.soma?.endo)}</div><div class="label">Endomorfia</div></div>
        <div class="result-item"><div class="value">${fmt(r.soma?.meso)}</div><div class="label">Mesomorfia</div></div>
        <div class="result-item"><div class="value">${fmt(r.soma?.ecto)}</div><div class="label">Ectomorfia</div></div>
        <div class="result-item"><div class="value">${fmt(r.indices?.muscularOseo)}</div><div class="label">M/Óseo</div></div>
        <div class="result-item"><div class="value">${fmt(r.indices?.muscularAdiposo)}</div><div class="label">M/Adiposo</div></div>
      </div>
      <div style="margin-top:12px">${sciencePanel('soma')} ${sciencePanel('indices')}</div>
    `;
  } catch(e) {
    // Incomplete form — results not shown yet
  }
}
