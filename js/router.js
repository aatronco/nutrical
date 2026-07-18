// js/router.js
import { isLoggedIn }                                   from './auth.js';
import { renderLogin, bindLogin }                       from './views/login.js';
import { renderPatients, bindPatients }                 from './views/patients.js';
import { renderPatientDetail, bindPatientDetail }       from './views/patient-detail.js';
import { renderConsultation, bindConsultation }         from './views/consultation.js';
import { renderReport, bindReport }                     from './views/report.js';
import { renderDashboard, bindDashboard }               from './views/dashboard.js';
import { renderWorkout, bindWorkout }                   from './views/workout.js';
import { renderProgress, bindProgress }                 from './views/progress.js';
import { renderAppSelect, bindAppSelect }               from './views/app-select.js';

// Declaraciones function (izadas) — con el import circular auth.js ⇄ router.js,
// route() puede ejecutarse antes de que el cuerpo de este módulo se evalúe;
// una const arrow quedaría en TDZ y rompería la carga directa de una ruta.
function main()      { return document.getElementById('main'); }
function nav()       { return document.getElementById('topnav'); }
function bottomNav() { return document.getElementById('bottom-nav'); }

const WORKOUT_ROUTES = ['dashboard', 'workout', 'nutrition', 'mobility', 'progress'];

function renderTopNav(patientName) {
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

function hideBottomNav() {
  const bn = bottomNav();
  if (bn) bn.innerHTML = '';
}

async function route() {
  const hash  = location.hash || '#/login';
  const parts = hash.replace('#/', '').split('/');
  const root  = parts[0];

  if (!isLoggedIn() && root !== 'login') {
    location.hash = '#/login';
    return;
  }

  // Login
  if (root === 'login' || !isLoggedIn()) {
    hideBottomNav();
    main().innerHTML = renderLogin();
    bindLogin();
    return;
  }

  // App selector
  if (root === 'select') {
    nav().classList.add('hidden');
    hideBottomNav();
    main().innerHTML = renderAppSelect();
    bindAppSelect();
    return;
  }

  // Workout app routes
  if (root === 'dashboard') {
    nav().classList.add('hidden');
    hideBottomNav();
    main().innerHTML = renderDashboard();
    bindDashboard();
    return;
  }

  if (root === 'workout' && parts[1]) {
    nav().classList.add('hidden');
    hideBottomNav();
    main().innerHTML = renderWorkout(parts[1]);
    bindWorkout(parts[1]);
    return;
  }

  if (root === 'progress') {
    nav().classList.add('hidden');
    hideBottomNav();
    main().innerHTML = renderProgress();
    bindProgress();
    return;
  }

  // Nutrical legacy routes
  if (root === 'patients' && !parts[1]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderPatients();
    bindPatients();
    return;
  }

  if (root === 'patients' && parts[1] && !parts[2]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderPatientDetail(parts[1]);
    await bindPatientDetail(parts[1]);
    return;
  }

  if (root === 'patients' && parts[2] === 'c' && parts[3]) {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderConsultation(parts[1], parseInt(parts[3]));
    bindConsultation(parts[1], parseInt(parts[3]));
    return;
  }

  if (root === 'patients' && parts[2] === 'report') {
    hideBottomNav();
    renderTopNav();
    main().innerHTML = await renderReport(parts[1]);
    bindReport(parts[1]);
    return;
  }

  location.hash = '#/select';
}

export function initRouter() {
  window.addEventListener('hashchange', route);
  route();
}
