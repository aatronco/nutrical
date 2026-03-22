// js/router.js
import { isLoggedIn } from './auth.js';
import { renderLogin, bindLogin }                   from './views/login.js';
import { renderPatients, bindPatients }             from './views/patients.js';
import { renderPatientDetail, bindPatientDetail }   from './views/patient-detail.js';
import { renderConsultation, bindConsultation }     from './views/consultation.js';
import { renderReport, bindReport }                 from './views/report.js';

const main = () => document.getElementById('main');
const nav  = () => document.getElementById('topnav');

function renderNav(patientName) {
  const n = nav();
  n.classList.remove('hidden');
  n.innerHTML = `
    <span class="brand">Nutrical</span>
    ${patientName ? `<span style="color:rgba(255,255,255,.6);font-size:13px">${patientName}</span>` : ''}
    <button id="logout-btn">Cerrar sesión</button>
  `;
  document.getElementById('logout-btn').addEventListener('click', () => {
    import('./auth.js').then(m => m.logout());
  });
}

async function route() {
  const hash = location.hash || '#/login';

  if (!isLoggedIn() && hash !== '#/login') {
    location.hash = '#/login';
    return;
  }

  const parts = hash.replace('#/', '').split('/');

  if (parts[0] === 'login' || !isLoggedIn()) {
    main().innerHTML = renderLogin();
    bindLogin();
    return;
  }

  if (parts[0] === 'patients' && !parts[1]) {
    renderNav();
    main().innerHTML = await renderPatients();
    bindPatients();
    return;
  }

  if (parts[0] === 'patients' && parts[1] && !parts[2]) {
    renderNav();
    main().innerHTML = await renderPatientDetail(parts[1]);
    await bindPatientDetail(parts[1]);
    return;
  }

  if (parts[0] === 'patients' && parts[2] === 'c' && parts[3]) {
    renderNav();
    main().innerHTML = await renderConsultation(parts[1], parseInt(parts[3]));
    bindConsultation(parts[1], parseInt(parts[3]));
    return;
  }

  if (parts[0] === 'patients' && parts[2] === 'report') {
    renderNav();
    main().innerHTML = await renderReport(parts[1]);
    bindReport(parts[1]);
    return;
  }

  location.hash = '#/patients';
}

export function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
