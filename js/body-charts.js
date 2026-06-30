// js/body-charts.js
// Inline SVG body silhouette and chart functions for the Nutrical report.
// All functions return SVG/HTML strings — no DOM manipulation.

// ── Shared geometry ───────────────────────────────────────────────────────────
function catmullRomPath(pts) {
  const p = [pts[pts.length-1], ...pts, pts[0], pts[1]];
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i=1;i<p.length-2;i++){
    const [x0,y0]=p[i-1],[x1,y1]=p[i],[x2,y2]=p[i+1],[x3,y3]=p[i+2];
    d+=` C${(x1+(x2-x0)/6).toFixed(1)},${(y1+(y2-y0)/6).toFixed(1)},${(x2-(x3-x1)/6).toFixed(1)},${(y2-(y3-y1)/6).toFixed(1)},${x2.toFixed(1)},${y2.toFixed(1)}`;
  }
  return d+'Z';
}
const MONO = 'font-family="JetBrains Mono, monospace"';
const esc = str => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── Reference profiles ────────────────────────────────────────────────────────
const STD_SKIN = { bic:8,   tri:14,  sub:16, sup:16, ili:20, abd:25, mus:17, pan:13 };
const POW_SKIN = { bic:11,  tri:20,  sub:23, sup:24, ili:30, abd:36, mus:22, pan:16 };
const STD_DIAM = { biac:42.0, biil:28.0, torxt:28.5, torxap:20.0, hum:7.0, fem:9.5  };
const POW_DIAM = { biac:46.5, biil:31.0, torxt:33.0, torxap:25.0, hum:7.8, fem:10.5 };

// ── Skinfold silhouette ───────────────────────────────────────────────────────
const SKIN_STATIONS = [
  {yf:0.00,hw:d=>12},{yf:0.04,hw:d=>15},
  {yf:0.12,hw:d=>50+d.sub*0.35},
  {yf:0.22,hw:d=>32+d.sub*0.35+(d.tri+d.bic)*0.42},
  {yf:0.33,hw:d=>16+d.sup*1.30},
  {yf:0.42,hw:d=>14+d.sup*1.10+d.ili*0.50},
  {yf:0.52,hw:d=>10+d.ili*1.50},
  {yf:0.60,hw:d=>8+d.abd*1.20+d.ili*0.30},
  {yf:0.67,hw:d=>12+d.ili*1.00+d.abd*0.30},
  {yf:0.74,hw:d=>8+d.mus*2.00},
  {yf:0.83,hw:d=>6+d.mus*1.20},
  {yf:0.88,hw:d=>14},{yf:0.93,hw:d=>6+d.pan*1.30},{yf:1.00,hw:d=>8},
];

function skinBodyPath(d, cx, bH, NECK_TOP) {
  const r = SKIN_STATIONS.map(s=>[cx+s.hw(d), NECK_TOP+s.yf*bH]);
  const l = [...SKIN_STATIONS].reverse().map(s=>[cx-s.hw(d), NECK_TOP+s.yf*bH]);
  return catmullRomPath([...r,...l]);
}

export function renderSkinfoldSVG(c, patientName = 'Paciente') {
  const pat = {
    bic: c.bicipital||0, tri: c.tricipital||0, sub: c.subescapular||0,
    sup: c.supraespinal||0, ili: c.suprailiaco||0, abd: c.abdominal||0,
    mus: c.muslo_medio_pliegue||0, pan: c.pantorrilla_pliegue||0,
  };

  const BH=400, BW=480, CX=150;
  const HEAD_R=21, HEAD_Y=26, NECK_TOP=HEAD_Y+HEAD_R+2;
  const bH=BH-NECK_TOP-8;

  const profiles=[
    {d:STD_SKIN,color:'#00d4ff',stroke:1.5,dash:'5,4',fill:'none',label:'E',fullLabel:'ESTÁNDAR'},
    {d:POW_SKIN,color:'#ffe600',stroke:1.5,dash:'',   fill:'none',label:'P',fullLabel:'POWERLIFTER'},
    {d:pat,     color:'#00ff9f',stroke:2.5,dash:'',   fill:'rgba(0,255,159,.06)',label:'A',fullLabel:esc(patientName).toUpperCase()},
  ];

  let s=`<defs><filter id="gsk" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></defs>`;

  ['P','E','A'].forEach(lbl=>{
    const p=profiles.find(x=>x.label===lbl);
    const da=p.dash?`stroke-dasharray="${p.dash}"`:'';
    const aW=10+(p.d.tri+p.d.bic)*0.22;
    const sy=NECK_TOP+0.12*bH, ay=NECK_TOP+0.30*bH;
    const aH=(ay-sy+12)*0.55;
    const ax=48+p.d.sub*0.52+aW*0.42;
    s+=`<circle cx="${CX}" cy="${HEAD_Y}" r="${HEAD_R}" fill="${p.fill}" stroke="${p.color}" stroke-width="${p.stroke}" filter="url(#gsk)" ${da}/>`;
    [-1,1].forEach(sg=>{
      s+=`<ellipse cx="${CX+sg*(HEAD_R-2)}" cy="${HEAD_Y+5}" rx="4" ry="5" fill="${p.fill}" stroke="${p.color}" stroke-width="${(p.stroke*.7).toFixed(1)}" ${da}/>`;
      s+=`<ellipse cx="${(CX+sg*ax).toFixed(1)}" cy="${(sy+aH*.9).toFixed(1)}" rx="${aW.toFixed(1)}" ry="${aH.toFixed(1)}" fill="${p.fill}" stroke="${p.color}" stroke-width="${(p.stroke*.8).toFixed(1)}" ${da}/>`;
    });
    s+=`<path d="${skinBodyPath(p.d,CX,bH,NECK_TOP)}" fill="${p.fill}" stroke="${p.color}" stroke-width="${p.stroke}" filter="url(#gsk)" ${da}/>`;
  });

  // Annotation panel
  const AX=278,BAR_X=AX+13,BAR_W=74,VAL_X=BAR_X+BAR_W+4;
  const RH=9,SH=8,ZH=11,IG=5,MAX=50;
  const zones=[
    {yf:0.15,label:'HOMBROS·BRAZO',items:[{k:'sub',sl:'Sub'},{k:'tri',sl:'Tri'}]},
    {yf:0.52,label:'CINTURA·ABDOMEN',items:[{k:'sup',sl:'Sup'},{k:'ili',sl:'Ili'},{k:'abd',sl:'Abd'}]},
    {yf:0.82,label:'PIERNA',items:[{k:'mus',sl:'Mus'},{k:'pan',sl:'Pan'}]},
  ];
  const itemH=()=>SH+3*RH;
  const zoneH=z=>ZH+z.items.length*itemH()+(z.items.length-1)*IG;

  zones.forEach(zone=>{
    const zy=NECK_TOP+zone.yf*bH;
    let y=zy-zoneH(zone)/2;
    s+=`<line x1="6" y1="${zy.toFixed(1)}" x2="${AX-4}" y2="${zy.toFixed(1)}" stroke="rgba(255,255,255,.07)" stroke-width="1" stroke-dasharray="3,4"/>`;
    s+=`<text x="${AX}" y="${(y+ZH-2).toFixed(1)}" text-anchor="start" fill="rgba(255,255,255,.28)" font-size="7" ${MONO} letter-spacing=".1em">${zone.label}</text>`;
    y+=ZH+2;
    zone.items.forEach((item,si)=>{
      if(si>0) y+=IG;
      s+=`<text x="${AX}" y="${(y+SH-3).toFixed(1)}" text-anchor="start" fill="rgba(255,255,255,.55)" font-size="8" font-weight="600" ${MONO}>${item.sl}</text>`;
      y+=SH;
      profiles.forEach((prof,ki)=>{
        const val=prof.d[item.k];
        const bw=Math.max(0,(val/MAX)*BAR_W);
        const ry=y+ki*RH;
        s+=`<text x="${AX}" y="${(ry+RH-3).toFixed(1)}" text-anchor="start" fill="${prof.color}" font-size="8" font-weight="700" ${MONO}>${prof.label}</text>`;
        s+=`<rect x="${BAR_X}" y="${(ry+2).toFixed(1)}" width="${BAR_W}" height="${RH-4}" fill="rgba(255,255,255,.04)"/>`;
        s+=`<rect x="${BAR_X}" y="${(ry+2).toFixed(1)}" width="${bw.toFixed(1)}" height="${RH-4}" fill="${prof.color}" opacity=".7"/>`;
        s+=`<text x="${VAL_X}" y="${(ry+RH-3).toFixed(1)}" text-anchor="start" fill="${prof.color}" font-size="8" font-weight="700" ${MONO}>${val} mm</text>`;
      });
      y+=3*RH;
    });
  });

  // Legend
  const LX=BW-4,LY=12,LR=12;
  s+=`<rect x="${LX-104}" y="${LY-10}" width="104" height="${profiles.length*LR+10}" fill="rgba(10,10,26,.85)" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`;
  profiles.forEach((p,i)=>{
    const ly=LY+i*LR;
    s+=`<rect x="${LX-98}" y="${ly-1}" width="14" height="3" fill="${p.color}"/>`;
    s+=`<text x="${LX-78}" y="${ly+2}" text-anchor="start" fill="rgba(255,255,255,.7)" font-size="8" ${MONO}>${p.label} — ${p.fullLabel}</text>`;
  });

  return `<svg width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="display:block;max-width:100%">${s}</svg>`;
}

// ── Diameter silhouette ───────────────────────────────────────────────────────
const DIAM_STATIONS=[
  {yf:0.00,hw:d=>11},{yf:0.04,hw:d=>15},{yf:0.10,hw:d=>10},
  {yf:0.16,hw:d=>d.biac/2*5.0},
  {yf:0.24,hw:d=>d.torxt/2*5.0},
  {yf:0.31,hw:d=>d.torxt/2*5.0*0.86},
  {yf:0.38,hw:d=>(d.biil*0.69)/2*5.0},
  {yf:0.45,hw:d=>d.biil/2*5.0},
  {yf:0.53,hw:d=>d.biil/2*5.0*0.52},
  {yf:0.64,hw:d=>d.fem*5.0*0.73},
  {yf:0.74,hw:d=>d.fem/2*5.0*1.02},
  {yf:0.82,hw:d=>d.fem/2*5.0*0.84},
  {yf:0.89,hw:d=>13},{yf:0.94,hw:d=>9},{yf:1.00,hw:d=>12},
];

function diamBodyPath(d,cx,bH,NECK_TOP){
  const r=DIAM_STATIONS.map(s=>[cx+s.hw(d),NECK_TOP+s.yf*bH]);
  const l=[...DIAM_STATIONS].reverse().map(s=>[cx-s.hw(d),NECK_TOP+s.yf*bH]);
  return catmullRomPath([...r,...l]);
}

export function renderDiameterSVG(c, patientName = 'Paciente') {
  const pat = {
    biac: c.biacromial||0, biil: c.biliocrestideo||0,
    torxt: c.torax_transverso||0, torxap: c.torax_ap||0,
    hum: c.humeral||0, fem: c.femoral||0,
  };

  const BH=400,BW=520,CX=148;
  const HEAD_R=21,HEAD_Y=26,NECK_TOP=HEAD_Y+HEAD_R+2;
  const bH=BH-NECK_TOP-8;

  const profiles=[
    {d:STD_DIAM,color:'#00d4ff',stroke:1.5,dash:'5,4',fill:'none',label:'E',fullLabel:'ESTÁNDAR'},
    {d:POW_DIAM,color:'#ffe600',stroke:1.5,dash:'',   fill:'none',label:'P',fullLabel:'POWERLIFTER'},
    {d:pat,     color:'#00ff9f',stroke:2.5,dash:'',   fill:'rgba(0,255,159,.06)',label:'A',fullLabel:esc(patientName).toUpperCase()},
  ];

  let s=`<defs><filter id="gdi" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2.5" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter></defs>`;

  ['P','E','A'].forEach(lbl=>{
    const p=profiles.find(x=>x.label===lbl);
    const da=p.dash?`stroke-dasharray="${p.dash}"`:'';
    const shw=p.d.biac/2*5.0;
    const aW=p.d.hum*0.95+2.5;
    const aty=NECK_TOP+0.16*bH;
    const aH=(NECK_TOP+0.34*bH-aty)*0.58;
    const ax=shw+aW*0.35+3;
    s+=`<circle cx="${CX}" cy="${HEAD_Y}" r="${HEAD_R}" fill="${p.fill}" stroke="${p.color}" stroke-width="${p.stroke}" filter="url(#gdi)" ${da}/>`;
    [-1,1].forEach(sg=>{
      s+=`<ellipse cx="${CX+sg*(HEAD_R-2)}" cy="${HEAD_Y+5}" rx="4" ry="5" fill="${p.fill}" stroke="${p.color}" stroke-width="${(p.stroke*.7).toFixed(1)}" ${da}/>`;
      s+=`<ellipse cx="${(CX+sg*ax).toFixed(1)}" cy="${(aty+aH*.9).toFixed(1)}" rx="${aW.toFixed(1)}" ry="${aH.toFixed(1)}" fill="${p.fill}" stroke="${p.color}" stroke-width="${(p.stroke*.8).toFixed(1)}" ${da}/>`;
    });
    s+=`<path d="${diamBodyPath(p.d,CX,bH,NECK_TOP)}" fill="${p.fill}" stroke="${p.color}" stroke-width="${p.stroke}" filter="url(#gdi)" ${da}/>`;
  });

  // Annotation panel
  const AX=270,BAR_X=AX+13,BAR_W=80,VAL_X=BAR_X+BAR_W+4;
  const RH=9,SH=8,ZH=11,IG=5;
  const BAR_SCALE={biac:55,biil:38,torxt:42,torxap:32,hum:10,fem:13};
  const zones=[
    {yf:0.22,label:'HOMBROS·TÓRAX',items:[
      {k:'biac',sl:'Biac'},{k:'torxt',sl:'T-T'},{k:'torxap',sl:'T-AP'}]},
    {yf:0.60,label:'CADERA·HUESO',items:[
      {k:'biil',sl:'Biil'},{k:'fem',sl:'Fem'},{k:'hum',sl:'Hum'}]},
  ];
  const itemH=()=>SH+3*RH;
  const zoneH=z=>ZH+z.items.length*itemH()+(z.items.length-1)*IG;

  zones.forEach(zone=>{
    const zy=NECK_TOP+zone.yf*bH;
    let y=zy-zoneH(zone)/2;
    s+=`<line x1="6" y1="${zy.toFixed(1)}" x2="${AX-4}" y2="${zy.toFixed(1)}" stroke="rgba(255,255,255,.07)" stroke-width="1" stroke-dasharray="3,4"/>`;
    s+=`<text x="${AX}" y="${(y+ZH-2).toFixed(1)}" text-anchor="start" fill="rgba(255,255,255,.28)" font-size="7" ${MONO} letter-spacing=".1em">${zone.label}</text>`;
    y+=ZH+2;
    zone.items.forEach((item,si)=>{
      if(si>0) y+=IG;
      s+=`<text x="${AX}" y="${(y+SH-3).toFixed(1)}" text-anchor="start" fill="rgba(255,255,255,.55)" font-size="8" font-weight="600" ${MONO}>${item.sl}</text>`;
      y+=SH;
      profiles.forEach((prof,ki)=>{
        const val=prof.d[item.k]||0;
        const mx=BAR_SCALE[item.k];
        const bw=Math.max(0,(val/mx)*BAR_W);
        const ry=y+ki*RH;
        s+=`<text x="${AX}" y="${(ry+RH-3).toFixed(1)}" text-anchor="start" fill="${prof.color}" font-size="8" font-weight="700" ${MONO}>${prof.label}</text>`;
        s+=`<rect x="${BAR_X}" y="${(ry+2).toFixed(1)}" width="${BAR_W}" height="${RH-4}" fill="rgba(255,255,255,.04)"/>`;
        s+=`<rect x="${BAR_X}" y="${(ry+2).toFixed(1)}" width="${bw.toFixed(1)}" height="${RH-4}" fill="${prof.color}" opacity=".7"/>`;
        s+=`<text x="${VAL_X}" y="${(ry+RH-3).toFixed(1)}" text-anchor="start" fill="${prof.color}" font-size="8" font-weight="700" ${MONO}>${val.toFixed(1)} cm</text>`;
      });
      y+=3*RH;
    });
  });

  // Legend
  const LX=BW-4,LY=12,LR=12;
  s+=`<rect x="${LX-104}" y="${LY-10}" width="104" height="${profiles.length*LR+10}" fill="rgba(10,10,26,.85)" stroke="rgba(255,255,255,.08)" stroke-width="1"/>`;
  profiles.forEach((p,i)=>{
    const ly=LY+i*LR;
    s+=`<rect x="${LX-98}" y="${ly-1}" width="14" height="3" fill="${p.color}"/>`;
    s+=`<text x="${LX-78}" y="${ly+2}" text-anchor="start" fill="rgba(255,255,255,.7)" font-size="8" ${MONO}>${p.label} — ${p.fullLabel}</text>`;
  });

  return `<svg width="${BW}" height="${BH}" viewBox="0 0 ${BW} ${BH}" style="display:block;max-width:100%">${s}</svg>`;
}

// ── Evolution sparklines ──────────────────────────────────────────────────────
// consultas: [{numero_consulta, fecha_evaluacion, ...fields}]
// metrics: [{key, label, color, extract(c)→number}]
export function renderEvolutionChart(consultas, metrics) {
  if (consultas.length < 2) return '';

  const W=480, H=180, PAD={t:20,r:12,b:36,l:44};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b;

  // Per-metric charts (one SVG each)
  return metrics.map(m => {
    const values = consultas.map(c => m.extract(c));
    const valid  = values.filter(v => v!=null && !isNaN(v));
    if (valid.length < 2) return '';

    const minV = Math.min(...valid) * 0.95;
    const maxV = Math.max(...valid) * 1.05;
    const range = maxV - minV || 1;

    const xOf = i => PAD.l + (i/(consultas.length-1))*cW;
    const yOf = v => PAD.t + (1-(v-minV)/range)*cH;

    // Line path
    const pts = consultas.map((c,i) => {
      const v = m.extract(c);
      return v!=null && !isNaN(v) ? [xOf(i), yOf(v)] : null;
    }).filter(Boolean);

    const linePath = pts.map((p,i) => `${i===0?'M':'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    const areaPath = linePath + ` L${pts[pts.length-1][0].toFixed(1)},${(PAD.t+cH).toFixed(1)} L${pts[0][0].toFixed(1)},${(PAD.t+cH).toFixed(1)} Z`;

    let s = `<defs>
      <linearGradient id="eg-${m.key}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${m.color}" stop-opacity=".25"/>
        <stop offset="100%" stop-color="${m.color}" stop-opacity="0"/>
      </linearGradient>
    </defs>`;

    // Grid lines
    const steps = 4;
    for (let i=0;i<=steps;i++){
      const y = PAD.t + (i/steps)*cH;
      const v = maxV - (i/steps)*range;
      s+=`<line x1="${PAD.l}" y1="${y.toFixed(1)}" x2="${W-PAD.r}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,.06)" stroke-width="1"/>`;
      s+=`<text x="${PAD.l-4}" y="${(y+4).toFixed(1)}" text-anchor="end" fill="rgba(255,255,255,.35)" font-size="8" ${MONO}>${v.toFixed(1)}</text>`;
    }

    // Area + line
    s+=`<path d="${areaPath}" fill="url(#eg-${m.key})"/>`;
    s+=`<path d="${linePath}" fill="none" stroke="${m.color}" stroke-width="1.8"/>`;

    // Dots + labels
    consultas.forEach((c,i)=>{
      const v=m.extract(c);
      if (v==null||isNaN(v)) return;
      const x=xOf(i), y=yOf(v);
      s+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${m.color}"/>`;
      s+=`<text x="${x.toFixed(1)}" y="${(y-6).toFixed(1)}" text-anchor="middle" fill="${m.color}" font-size="8" font-weight="700" ${MONO}>${typeof v==='number'&&v%1!==0?v.toFixed(1):v}</text>`;
      // X axis label
      s+=`<text x="${x.toFixed(1)}" y="${(H-PAD.b+14).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,.4)" font-size="8" ${MONO}>C${c.numero_consulta}</text>`;
      if (c.fecha_evaluacion) {
        s+=`<text x="${x.toFixed(1)}" y="${(H-PAD.b+23).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,.25)" font-size="7" ${MONO}>${c.fecha_evaluacion.slice(5)}</text>`;
      }
    });

    return `
      <div style="margin-bottom:16px">
        <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:${m.color};margin-bottom:6px;font-family:'JetBrains Mono',monospace">${m.label}</div>
        <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="display:block;max-width:100%;overflow:visible">${s}</svg>
      </div>`;
  }).join('');
}

// ── Body composition score ────────────────────────────────────────────────────
// Returns a score card HTML string with 3 gauges.
export function renderCompositionScore(c, r, patientName = 'Paciente') {
  // 1. Frame score: how close are bone diameters to powerlifter reference
  const diamKeys = ['biacromial','biliocrestideo','torax_transverso','torax_ap','humeral','femoral'];
  const powRef   = [POW_DIAM.biac, POW_DIAM.biil, POW_DIAM.torxt, POW_DIAM.torxap, POW_DIAM.hum, POW_DIAM.fem];
  const stdRef   = [STD_DIAM.biac, STD_DIAM.biil, STD_DIAM.torxt, STD_DIAM.torxap, STD_DIAM.hum, STD_DIAM.fem];

  let frameScore = null;
  const frameParts = diamKeys.map((k,i) => {
    const v = c[k]; if (v==null) return null;
    const range = powRef[i] - stdRef[i];
    return Math.min(1, Math.max(0, (v - stdRef[i]) / range));
  }).filter(x=>x!=null);
  if (frameParts.length >= 4) {
    frameScore = Math.round((frameParts.reduce((a,b)=>a+b,0)/frameParts.length)*100);
  }

  // 2. Adipose score: how lean relative to powerlifter (lower is better for sport)
  // Powerlifter reference % adiposa ≈ 18–22% (higher is ok for strength)
  // Score 100 = same as powerlifter, <100 = leaner, >100 = more fat
  let adiposeScore = null;
  if (r?.masas?.adiposa) {
    const pct = r.masas.adiposa.pct * 100;
    const powPct = 20; // typical powerlifter ~20%
    adiposeScore = Math.round(Math.max(0, 100 - Math.abs(pct - powPct) * 3));
  }

  // 3. Muscle:fat ratio score
  let mfScore = null;
  if (r?.indices?.muscularAdiposo) {
    const mf = r.indices.muscularAdiposo;
    const powMF = 3.0; // powerlifter reference
    mfScore = Math.round(Math.min(100, (mf / powMF) * 100));
  }

  function gauge(score, label, color, detail) {
    if (score == null) return '';
    const radius = 32, cx = 44, cy = 44;
    const circ = 2*Math.PI*radius;
    const dash = (score/100)*circ;
    return `
      <div style="text-align:center;min-width:120px">
        <svg width="88" height="88" viewBox="0 0 88 88" style="display:block;margin:0 auto">
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="7"/>
          <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="7"
            stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}"
            stroke-dashoffset="${(circ/4).toFixed(1)}"
            stroke-linecap="round"/>
          <text x="${cx}" y="${cy+5}" text-anchor="middle" fill="${color}" font-size="18" font-weight="700" font-family="JetBrains Mono, monospace">${score}</text>
        </svg>
        <div style="font-size:11px;font-weight:700;color:${color};margin-top:4px;font-family:'JetBrains Mono',monospace">${label}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.4);margin-top:2px;font-family:'JetBrains Mono',monospace">${detail}</div>
      </div>`;
  }

  const hasScores = frameScore!=null || adiposeScore!=null || mfScore!=null;
  if (!hasScores) return '';

  return `
    <div style="background:#0a0a1a;border:1px solid #1a1a3e;padding:20px 16px;margin:0">
      <div style="font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#4a5578;font-family:'JetBrains Mono',monospace;margin-bottom:16px">◈ Score Composición Corporal vs Powerlifter</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center">
        ${gauge(frameScore,   'FRAME', '#00d4ff', 'Estructura ósea')}
        ${gauge(mfScore,      'M/F',   '#00ff9f', 'Músculo / Grasa')}
        ${gauge(adiposeScore, 'LEAN',  '#ffe600', '% Adiposa ideal')}
      </div>
      <div style="font-size:10px;color:rgba(255,255,255,.3);margin-top:14px;text-align:center;font-family:'JetBrains Mono',monospace">
        Referencia powerlifter · 100 = perfil idéntico
      </div>
    </div>`;
}
