// js/views/app-select.js — App selector after login

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
      glowHover:'rgba(0,255,159,.2)',
      fillHover:'rgba(0,255,159,.05)',
      name:     'EJERCICIO',
      sub:      'GZCLP v6 // ENTRENAMIENTO DE FUERZA',
    },
    {
      id:       'app-nutricion',
      href:     '#/patients',
      color:    'var(--cyan)',
      glow:     'rgba(0,212,255,.6)',
      glowHover:'rgba(0,212,255,.2)',
      fillHover:'rgba(0,212,255,.05)',
      name:     'NUTRICIÓN',
      sub:      'COMPOSICIÓN CORPORAL // CLÍNICA',
    },
    {
      id:       'app-progreso',
      href:     '#/progress',
      color:    'var(--purple)',
      glow:     'rgba(160,100,255,.6)',
      glowHover:'rgba(160,100,255,.2)',
      fillHover:'rgba(160,100,255,.05)',
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
    " id="${a.id}">
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
    </div>
  `;
}

export function bindAppSelect() {
  const hovers = [
    { id:'app-ejercicio', fill:'rgba(0,255,159,.05)',  shadow:'0 0 24px rgba(0,255,159,.2)' },
    { id:'app-nutricion', fill:'rgba(0,212,255,.05)',  shadow:'0 0 24px rgba(0,212,255,.2)' },
    { id:'app-progreso',  fill:'rgba(160,100,255,.05)',shadow:'0 0 24px rgba(160,100,255,.2)' },
  ];
  hovers.forEach(({ id, fill, shadow }) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('mouseenter', () => { el.style.background = fill; el.style.boxShadow = shadow; });
    el.addEventListener('mouseleave', () => { el.style.background = 'var(--card)'; el.style.boxShadow = 'none'; });
  });
}
