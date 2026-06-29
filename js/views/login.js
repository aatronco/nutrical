// js/views/login.js
import { triggerLogin } from '../auth.js';

export function renderLogin() {
  document.getElementById('topnav').classList.add('hidden');

  return `
    <div style="
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 92vh; gap: 0; text-align: center;
      padding: 24px;
    ">
      <div style="
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 10px; font-weight: 400; letter-spacing: 4px;
        color: var(--cyan); text-transform: uppercase;
        margin-bottom: 24px; opacity: .7;
      ">GZCLP v6 — Sistema de entrenamiento</div>

      <h1 style="
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: clamp(64px, 20vw, 96px);
        font-weight: 800; letter-spacing: -3px; line-height: 1;
        color: var(--cyan);
        text-shadow: 0 0 20px rgba(0,229,255,.6), 0 0 60px rgba(0,229,255,.2);
        margin-bottom: 8px;
      ">BRUTE</h1>

      <p style="
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 11px; letter-spacing: 2px;
        color: var(--dim); margin-bottom: 56px;
      ">[ CARGA // PROGRESIÓN // RÉCORDS ]</p>

      <button id="login-btn" style="
        display: inline-flex; align-items: center; gap: 10px;
        padding: 14px 28px; border-radius: 6px;
        border: 1.5px solid var(--cyan);
        background: rgba(0,229,255,.06);
        color: var(--cyan);
        font-family: 'JetBrains Mono', ui-monospace, monospace;
        font-size: 12px; font-weight: 700; letter-spacing: 2px;
        text-transform: uppercase; cursor: pointer;
        transition: box-shadow .2s, background .2s;
      " onmouseover="this.style.boxShadow='0 0 16px rgba(0,229,255,.4)';this.style.background='rgba(0,229,255,.12)'"
         onmouseout="this.style.boxShadow='none';this.style.background='rgba(0,229,255,.06)'">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style="flex-shrink:0">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#00e5ff"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#00e5ff" opacity=".7"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#00e5ff" opacity=".4"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#00e5ff" opacity=".9"/>
        </svg>
        Entrar con Google
      </button>
    </div>
  `;
}

export function bindLogin() {
  document.getElementById('login-btn')?.addEventListener('click', triggerLogin);
}
