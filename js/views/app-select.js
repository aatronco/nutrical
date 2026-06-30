// js/views/app-select.js — App selector after login
import { CyberpunkAudio } from '../audio-engine.js';

// Single instance persists across renders so music keeps playing when navigating back
const _audio = new CyberpunkAudio();

export function renderAppSelect() {
  document.getElementById('topnav').classList.add('hidden');
  const bn = document.getElementById('bottom-nav');
  if (bn) bn.innerHTML = '';

  const apps = [
    {
      id:       'app-ejercicio',
      href:     '#/dashboard',
      color:    'var(--mint)',
      glow:     'rgba(0,255,159,.6)',
      name:     'EJERCICIO',
      sub:      'GZCLP v6 // ENTRENAMIENTO DE FUERZA',
    },
    {
      id:       'app-nutricion',
      href:     '#/patients',
      color:    'var(--cyan)',
      glow:     'rgba(0,212,255,.6)',
      name:     'NUTRICIÓN',
      sub:      'COMPOSICIÓN CORPORAL // CLÍNICA',
    },
    {
      id:       'app-progreso',
      href:     '#/progress',
      color:    'var(--purple)',
      glow:     'rgba(160,100,255,.6)',
      name:     'PROGRESO',
      sub:      'PRs // EVOLUCIÓN // ESTADÍSTICAS',
    },
  ];

  const cards = apps.map(a => `
    <a href="${a.href}" style="
      display:block; text-decoration:none;
      background:var(--card); border:1px solid ${a.color};
      padding:24px; position:relative;
      transition:box-shadow .2s, background .2s;
    " id="${a.id}" data-fill="rgba(0,0,0,0)" data-shadow="0 0 24px ${a.glow}">
      <div style="position:absolute;top:-1px;left:-1px;width:10px;height:10px;border-top:2px solid ${a.color};border-left:2px solid ${a.color};"></div>
      <div style="position:absolute;bottom:-1px;right:-1px;width:10px;height:10px;border-bottom:2px solid ${a.color};border-right:2px solid ${a.color};"></div>
      <div style="
        font-family:'Orbitron',sans-serif; font-weight:900;
        font-size:28px; letter-spacing:.1em; color:${a.color};
        text-shadow:0 0 16px ${a.glow}; margin-bottom:6px;
      ">${a.name}</div>
      <div style="
        font-family:'JetBrains Mono',monospace;
        font-size:10px; color:var(--dim); letter-spacing:.08em;
      ">${a.sub}</div>
    </a>`).join('');

  const isPlaying = _audio.playing;

  return `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; min-height:92vh;
      padding:24px; gap:0; text-align:center; position:relative;
    ">
      <p style="
        font-family:'JetBrains Mono',monospace;
        font-size:10px; letter-spacing:.25em; color:var(--dim);
        text-transform:uppercase; margin-bottom:40px;
      ">> SELECCIONAR MÓDULO</p>

      <div style="display:flex; flex-direction:column; gap:14px; width:100%; max-width:340px;">
        ${cards}
      </div>

      <!-- Music toggle -->
      <button id="music-toggle" style="
        margin-top:32px;
        background:transparent;
        border:1px solid ${isPlaying ? 'var(--mint)' : 'rgba(255,255,255,.12)'};
        border-radius:20px;
        padding:7px 18px;
        display:flex; align-items:center; gap:8px;
        cursor:pointer;
        transition:border-color .2s, opacity .2s;
        opacity:${isPlaying ? '1' : '0.5'};
      ">
        <span id="music-icon" style="font-size:14px">${isPlaying ? '◼' : '▶'}</span>
        <span style="
          font-family:'JetBrains Mono',monospace;
          font-size:9px; letter-spacing:.15em; text-transform:uppercase;
          color:${isPlaying ? 'var(--mint)' : 'rgba(255,255,255,.4)'};
        " id="music-label">${isPlaying ? 'AMBIENT ON' : 'AMBIENT OFF'}</span>
        <span id="music-bars" style="display:flex;gap:2px;align-items:flex-end;height:12px;${isPlaying ? '' : 'opacity:0'}">
          ${[4,8,6,10,5].map((h,i) =>
            `<span class="bar-vis" style="width:2px;height:${h}px;background:var(--mint);border-radius:1px;animation:barBounce .6s ${i*0.12}s ease-in-out infinite alternate"></span>`
          ).join('')}
        </span>
      </button>
    </div>

    <style>
      @keyframes barBounce {
        from { transform:scaleY(.3); opacity:.5; }
        to   { transform:scaleY(1);  opacity:1; }
      }
    </style>
  `;
}

export function bindAppSelect() {
  // Card hover effects
  ['app-ejercicio','app-nutricion','app-progreso'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const shadow = el.dataset.shadow;
    el.addEventListener('mouseenter', () => { el.style.background = 'rgba(255,255,255,.03)'; el.style.boxShadow = shadow; });
    el.addEventListener('mouseleave', () => { el.style.background = 'var(--card)'; el.style.boxShadow = 'none'; });
  });

  // Music toggle
  document.getElementById('music-toggle')?.addEventListener('click', () => {
    const playing   = _audio.toggle();
    const btn       = document.getElementById('music-toggle');
    const icon      = document.getElementById('music-icon');
    const label     = document.getElementById('music-label');
    const bars      = document.getElementById('music-bars');

    btn.style.borderColor = playing ? 'var(--mint)' : 'rgba(255,255,255,.12)';
    btn.style.opacity     = playing ? '1' : '0.5';
    icon.textContent      = playing ? '◼' : '▶';
    label.textContent     = playing ? 'AMBIENT ON' : 'AMBIENT OFF';
    label.style.color     = playing ? 'var(--mint)' : 'rgba(255,255,255,.4)';
    bars.style.opacity    = playing ? '1' : '0';
  });

  // Stop music when leaving this screen for a different section
  document.querySelectorAll('#app-ejercicio, #app-nutricion, #app-progreso').forEach(el => {
    el.addEventListener('click', () => _audio.stop());
  });
}
