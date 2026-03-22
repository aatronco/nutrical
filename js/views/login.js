// js/views/login.js
import { triggerLogin } from '../auth.js';

export function renderLogin() {
  document.getElementById('topnav').classList.add('hidden');

  return `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:80vh;gap:16px">
      <h1 style="font-size:28px;font-weight:700;letter-spacing:-0.5px">Nutrical</h1>
      <p style="color:var(--muted);font-size:15px">Evaluación antropométrica clínica</p>
      <button class="btn btn-primary mt-16" id="login-btn" style="padding:12px 32px;font-size:15px">
        Entrar con Google
      </button>
    </div>
  `;
}

export function bindLogin() {
  document.getElementById('login-btn')?.addEventListener('click', triggerLogin);
}
