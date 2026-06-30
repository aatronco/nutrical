// js/views/app-select.js — App selector after login

export function renderAppSelect() {
  document.getElementById('topnav').classList.add('hidden');
  const bn = document.getElementById('bottom-nav');
  if (bn) bn.innerHTML = '';

  return `
    <div style="
      display:flex; flex-direction:column; align-items:center;
      justify-content:center; min-height:92vh;
      padding:24px; gap:0; text-align:center; position:relative;
    ">
      <p style="
        font-family:'JetBrains Mono',monospace;
        font-size:10px; letter-spacing:.25em; color:var(--dim);
        text-transform:uppercase; margin-bottom:48px;
      ">> SELECT APPLICATION</p>

      <div style="display:flex; flex-direction:column; gap:16px; width:100%; max-width:340px;">

        <!-- BRUTE -->
        <a href="#/dashboard" style="
          display:block; text-decoration:none;
          background:var(--card); border:1px solid var(--mint);
          padding:28px 24px; position:relative;
          transition:box-shadow .2s, background .2s;
        " id="app-brute">
          <div style="
            position:absolute; top:-1px; left:-1px;
            width:10px; height:10px;
            border-top:2px solid var(--mint); border-left:2px solid var(--mint);
          "></div>
          <div style="
            position:absolute; bottom:-1px; right:-1px;
            width:10px; height:10px;
            border-bottom:2px solid var(--mint); border-right:2px solid var(--mint);
          "></div>
          <div style="
            font-family:'Orbitron',sans-serif; font-weight:900;
            font-size:32px; letter-spacing:.1em;
            color:var(--mint);
            text-shadow: 0 0 16px rgba(0,255,159,.6);
            margin-bottom:8px;
          ">BRUTE</div>
          <div style="
            font-family:'JetBrains Mono',monospace;
            font-size:11px; color:var(--dim); letter-spacing:.08em;
          ">GZCLP v6 // ENTRENAMIENTO</div>
        </a>

        <!-- NUTRICAL -->
        <a href="#/patients" style="
          display:block; text-decoration:none;
          background:var(--card); border:1px solid var(--cyan);
          padding:28px 24px; position:relative;
          transition:box-shadow .2s, background .2s;
        " id="app-nutrical">
          <div style="
            position:absolute; top:-1px; left:-1px;
            width:10px; height:10px;
            border-top:2px solid var(--cyan); border-left:2px solid var(--cyan);
          "></div>
          <div style="
            position:absolute; bottom:-1px; right:-1px;
            width:10px; height:10px;
            border-bottom:2px solid var(--cyan); border-right:2px solid var(--cyan);
          "></div>
          <div style="
            font-family:'Orbitron',sans-serif; font-weight:900;
            font-size:32px; letter-spacing:.1em;
            color:var(--cyan);
            text-shadow: 0 0 16px rgba(0,212,255,.6);
            margin-bottom:8px;
          ">NUTRICAL</div>
          <div style="
            font-family:'JetBrains Mono',monospace;
            font-size:11px; color:var(--dim); letter-spacing:.08em;
          ">COMPOSICIÓN CORPORAL // CLÍNICA</div>
        </a>

      </div>
    </div>
  `;
}

export function bindAppSelect() {
  const brute = document.getElementById('app-brute');
  const nutrical = document.getElementById('app-nutrical');

  brute?.addEventListener('mouseenter', () => {
    brute.style.background = 'rgba(0,255,159,.05)';
    brute.style.boxShadow = '0 0 24px rgba(0,255,159,.2)';
  });
  brute?.addEventListener('mouseleave', () => {
    brute.style.background = 'var(--card)';
    brute.style.boxShadow = 'none';
  });

  nutrical?.addEventListener('mouseenter', () => {
    nutrical.style.background = 'rgba(0,212,255,.05)';
    nutrical.style.boxShadow = '0 0 24px rgba(0,212,255,.2)';
  });
  nutrical?.addEventListener('mouseleave', () => {
    nutrical.style.background = 'var(--card)';
    nutrical.style.boxShadow = 'none';
  });
}
