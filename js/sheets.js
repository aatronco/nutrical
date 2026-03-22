// js/sheets.js
import { getToken, renewToken, logout } from './auth.js';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

function getSpreadsheetId() {
  return localStorage.getItem('spreadsheet_id');
}

export function saveSpreadsheetId(id) {
  localStorage.setItem('spreadsheet_id', id.trim());
}

function showToast(msg, isError = false) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' error' : '');
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

async function request(url, options = {}) {
  let token = getToken();
  const doFetch = (t) => fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  let res = await doFetch(token);

  if (res.status === 401) {
    try {
      await renewToken();
      token = getToken();
      res = await doFetch(token);
    } catch {
      logout();
      return null;
    }
  }

  if (res.status === 403) { showToast('Sin acceso a la hoja. Verifica permisos.', true); return null; }
  if (res.status === 429) { showToast('Límite de Google Sheets alcanzado. Intenta en un minuto.', true); return null; }
  if (!res.ok) {
    showToast('Error de conexión. Los datos NO se guardaron.', true);
    return null;
  }

  return res.json();
}

// ── Validate spreadsheet on first setup ───────────────────────────────────────
export async function validateSpreadsheet(id) {
  const url = `${BASE}/${id}/values/Pacientes!A1:Z1`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Array.isArray(data.values);
}

// ── Patients ──────────────────────────────────────────────────────────────────
export async function getPatients() {
  const id  = getSpreadsheetId();
  const url = `${BASE}/${id}/values/Pacientes!A2:Z`;
  const data = await request(url);
  if (!data?.values) return [];
  return data.values.map(rowToPatient);
}

function rowToPatient([pid, nombre, sexo, fecha_nacimiento, deporte, recreacion, created_at] = []) {
  return { id: pid, nombre, sexo, fecha_nacimiento, deporte, recreacion, created_at };
}

export async function savePatient(patient) {
  const id  = getSpreadsheetId();
  const all = await getPatients();
  const idx = all.findIndex(p => p.id === patient.id);
  const row = [patient.id, patient.nombre, patient.sexo, patient.fecha_nacimiento,
               patient.deporte || '', patient.recreacion || '', patient.created_at || new Date().toISOString()];

  if (idx === -1) {
    // Append
    await request(`${BASE}/${id}/values/Pacientes!A:A:append?valueInputOption=RAW`, {
      method: 'POST', body: JSON.stringify({ values: [row] }),
    });
  } else {
    // Overwrite row (idx+2 because row 1 is header, arrays are 0-based)
    const range = `Pacientes!A${idx + 2}:G${idx + 2}`;
    await request(`${BASE}/${id}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [row] }),
    });
  }
}

// ── Consultations ─────────────────────────────────────────────────────────────
const CONSULTA_COLS = [
  'id','paciente_id','numero_consulta','fecha_evaluacion',
  'peso','talla','talla_sentado',
  'biacromial','biliocrestideo','torax_transverso','torax_ap','humeral','femoral',
  'cabeza','cuello','brazo_relajado','brazo_flexionado','antebrazo','muneca',
  'torax_mesoesternal','cintura','cadera_maxima','muslo_maximo','muslo_medio',
  'pantorrilla_maxima','tobillo',
  'tricipital','subescapular','bicipital','suprailiaco','supraespinal',
  'abdominal','muslo_medio_pliegue','pantorrilla_pliegue',
  'acromial_radial','radial_estiloidea','est_dactilar','ilioespinal',
  'trocanterea','trocan_tibial_lat','tibial_lat','tibial_maleolar','pie',
];

function rowToConsulta(row) {
  const obj = {};
  CONSULTA_COLS.forEach((col, i) => {
    const v = row[i];
    obj[col] = (i > 2) ? (v ? parseFloat(v) : null) : v; // numeric fields after col index 2
  });
  // Keep date fields as strings
  obj.fecha_evaluacion = row[3] || null;
  return obj;
}

function consultaToRow(c) {
  return CONSULTA_COLS.map(col => c[col] ?? '');
}

export async function getConsultations(pacienteId) {
  const id  = getSpreadsheetId();
  const url = `${BASE}/${id}/values/Consultas!A2:AQ`;
  const data = await request(url);
  if (!data?.values) return [];
  return data.values
    .map(rowToConsulta)
    .filter(c => c.paciente_id === pacienteId);
}

export async function saveConsultation(consulta) {
  const id  = getSpreadsheetId();
  const url = `${BASE}/${id}/values/Consultas!A2:AQ`;
  const data = await request(url);
  const allRows = data?.values || [];
  const idx = allRows.findIndex(r => r[1] === consulta.paciente_id && r[2] == consulta.numero_consulta);
  const row = consultaToRow(consulta);

  if (idx === -1) {
    await request(`${BASE}/${id}/values/Consultas!A:A:append?valueInputOption=RAW`, {
      method: 'POST', body: JSON.stringify({ values: [row] }),
    });
  } else {
    const range = `Consultas!A${idx + 2}:AQ${idx + 2}`;
    await request(`${BASE}/${id}/values/${encodeURIComponent(range)}?valueInputOption=RAW`, {
      method: 'PUT', body: JSON.stringify({ values: [row] }),
    });
  }
  showToast('Guardado correctamente');
}
