// js/views/patients.js
import { getPatients, savePatient, saveSpreadsheetId, validateSpreadsheet, createSpreadsheet } from '../sheets.js';
import { calcularEdad } from '../formulas.js';

export async function renderPatients() {
  let spreadsheetId = localStorage.getItem('spreadsheet_id');

  if (!spreadsheetId) {
    // Auto-create on first login — show loading state immediately
    return `<div id="auto-creating" style="text-align:center;padding:80px 0;color:var(--muted)">
      <div style="font-size:14px;margin-bottom:8px">Creando tu hoja de Google…</div>
      <div style="font-size:12px;color:var(--muted-2)">Solo toma un momento</div>
    </div>`;
  }

  const patients = await getPatients();

  return `
    <div class="flex-between mt-16">
      <h2 style="font-size:20px;font-weight:700">Pacientes</h2>
      <button class="btn btn-primary btn-sm" id="new-patient-btn">+ Nuevo paciente</button>
    </div>

    <div class="search-wrap mt-16">
      <input type="text" id="search-input" placeholder="Buscar paciente..." autocomplete="off">
    </div>

    <div id="new-patient-form" class="card hidden" style="margin-bottom:16px">
      <h3 style="margin-bottom:16px;font-weight:600">Nuevo paciente</h3>
      <div class="field-grid">
        <div class="field"><label>Nombre completo</label><input id="np-nombre" type="text"></div>
        <div class="field"><label>Sexo</label>
          <select id="np-sexo" style="width:100%;padding:7px 10px;border:1px solid var(--border);border-radius:6px;font-size:14px">
            <option value="F">Femenino</option><option value="M">Masculino</option>
          </select>
        </div>
        <div class="field"><label>Fecha nacimiento</label><input id="np-nacimiento" type="date"></div>
        <div class="field"><label>Deporte</label><input id="np-deporte" type="text"></div>
        <div class="field"><label>Recreación</label><input id="np-recreacion" type="text"></div>
      </div>
      <div style="margin-top:16px;display:flex;gap:8px">
        <button class="btn btn-primary" id="np-save-btn">Guardar</button>
        <button class="btn btn-secondary" id="np-cancel-btn">Cancelar</button>
      </div>
    </div>

    <div id="patient-list">
      ${patients.length === 0 ? '<p style="color:var(--muted);text-align:center;padding:40px 0">Sin pacientes aún.</p>' : patients.map(renderPatientCard).join('')}
    </div>

    <div style="margin-top:40px;text-align:center">
      <button id="change-sheet-btn" style="background:none;border:none;font-size:12px;color:var(--muted-2);cursor:pointer;font-family:var(--font)">
        Usar otra hoja de Google
      </button>
    </div>
  `;
}

function renderPatientCard(p) {
  const edad = p.fecha_nacimiento ? Math.floor(calcularEdad(new Date().toISOString().slice(0,10), p.fecha_nacimiento)) : '?';
  return `
    <a href="#/patients/${p.id}" class="card" style="display:block;text-decoration:none;color:inherit;cursor:pointer">
      <div class="flex-between">
        <div>
          <div style="font-weight:600;font-size:16px">${p.nombre}</div>
          <div style="color:var(--muted);font-size:13px;margin-top:2px">
            ${p.sexo === 'F' ? 'Femenino' : 'Masculino'} · ${edad} años
            ${p.deporte ? '· ' + p.deporte : ''}
          </div>
        </div>
        <span style="color:var(--muted);font-size:20px">›</span>
      </div>
    </a>
  `;
}

function renderChangeSheet() {
  document.getElementById('main').innerHTML = `
    <div style="max-width:480px;margin:60px auto">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:8px">Usar otra hoja</h2>
      <p style="color:var(--muted);margin-bottom:20px;font-size:13px">
        Pega el ID de una hoja existente (la parte de la URL entre /spreadsheets/d/ y /edit).
      </p>
      <div class="field"><label>ID de la hoja</label><input id="sheet-id-input" type="text" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"></div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn btn-primary" id="sheet-id-save">Conectar</button>
        <button class="btn btn-secondary" id="sheet-id-cancel">Cancelar</button>
      </div>
      <div id="sheet-id-error" style="color:#b91c1c;font-size:13px;margin-top:8px;display:none"></div>
    </div>
  `;

  document.getElementById('sheet-id-cancel').addEventListener('click', () => {
    location.hash = '#/patients';
  });

  document.getElementById('sheet-id-save').addEventListener('click', async () => {
    const input = document.getElementById('sheet-id-input').value.trim();
    const errEl = document.getElementById('sheet-id-error');
    if (!input) return;
    const btn = document.getElementById('sheet-id-save');
    btn.disabled = true;
    btn.textContent = 'Verificando...';
    saveSpreadsheetId(input);
    const ok = await validateSpreadsheet(input);
    if (ok) {
      location.hash = '#/patients';
      location.reload();
    } else {
      errEl.style.display = 'block';
      errEl.textContent = 'No se pudo acceder a la hoja. Verifica el ID y los permisos.';
      btn.disabled = false;
      btn.textContent = 'Conectar';
    }
  });
}

export function bindPatients() {
  // Auto-create flow
  if (document.getElementById('auto-creating')) {
    createSpreadsheet().then(id => {
      if (id) {
        location.reload();
      } else {
        document.getElementById('auto-creating').innerHTML =
          '<p style="color:#b91c1c;font-size:14px">No se pudo crear la hoja. Recarga e intenta de nuevo.</p>';
      }
    });
    return;
  }

  // New patient form toggle
  document.getElementById('new-patient-btn')?.addEventListener('click', () => {
    document.getElementById('new-patient-form').classList.remove('hidden');
  });
  document.getElementById('np-cancel-btn')?.addEventListener('click', () => {
    document.getElementById('new-patient-form').classList.add('hidden');
  });

  document.getElementById('np-save-btn')?.addEventListener('click', async () => {
    const nombre = document.getElementById('np-nombre').value.trim();
    if (!nombre) return;
    const btn = document.getElementById('np-save-btn');
    btn.disabled = true;
    btn.textContent = 'Guardando...';
    const patient = {
      id:               crypto.randomUUID(),
      nombre,
      sexo:             document.getElementById('np-sexo').value,
      fecha_nacimiento: document.getElementById('np-nacimiento').value,
      deporte:          document.getElementById('np-deporte').value,
      recreacion:       document.getElementById('np-recreacion').value,
      created_at:       new Date().toISOString(),
    };
    const result = await savePatient(patient);
    if (result !== null) {
      location.hash = `#/patients/${patient.id}`;
    } else {
      btn.disabled = false;
      btn.textContent = 'Guardar';
    }
  });

  // Search filter
  document.getElementById('search-input')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('#patient-list a').forEach(card => {
      const name = card.querySelector('div > div').textContent.toLowerCase();
      card.style.display = name.includes(q) ? '' : 'none';
    });
  });

  // Change sheet
  document.getElementById('change-sheet-btn')?.addEventListener('click', renderChangeSheet);
}
