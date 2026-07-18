// js/workout-data.js
// GZCL: The Rippler — programa de 12 semanas, 5 días. Static, never modified by the app.
// T1: olas de % sobre 2RM · T2: olas de % sobre 5RM (Cody Lefever, GZCL Applications & Adaptations).
// Días de pierna (S2/S4) y bloques kine: receta del kinesiólogo (julio 2026), por RPE — sin olas.
//
// Bases estimadas (Epley, julio 2026, en déficit — PC 105 kg):
//   Press Banca   2RM 110 kg   (de 3×5 @ 100)      → e1RM ~117
//   Peso Muerto   2RM 177.5 kg (de 4 @ 170)         → e1RM ~190
//   Dominadas     2RM 115 kg TOTAL (de 5 @ PC 105)  → e1RM total ~122
//   Press Militar 5RM 42.5 kg  (de 8 @ 40)
//   Remo Pendlay  5RM 65 kg    (de 5×5 @ 60)

export const PROGRAM_WEEKS = 12;

export const PHASES = [
  { weeks: [1, 2, 3, 4], name: 'bloque1', label: 'Bloque 1 — Base',       color: 'pink'   },
  { weeks: [5, 6, 7, 8], name: 'bloque2', label: 'Bloque 2 — Intensidad', color: 'orange' },
  { weeks: [9, 10],      name: 'bloque3', label: 'Bloque 3 — Máximos',    color: 'gold'   },
  { weeks: [11, 12],     name: 'peaking', label: 'Peaking ★',             color: 'purple' },
];

export function getPhaseForWeek(week) {
  return PHASES.find(p => p.weeks.includes(week)) ?? PHASES[0];
}

// ── Recetas Rippler ─────────────────────────────────────────────────────────
// T1: % del 2RM. amrap = serie extra a máximas reps con técnica sólida (no fallo).
const T1_WAVE = [
  { week: 1,  pct: 0.80,  sets: 3, reps: 5 },
  { week: 2,  pct: 0.85,  sets: 3, reps: 3, amrap: true },
  { week: 3,  pct: 0.825, sets: 3, reps: 4 },
  { week: 4,  pct: 0.875, sets: 5, reps: 2 },
  { week: 5,  pct: 0.85,  sets: 2, reps: 4, amrap: true },
  { week: 6,  pct: 0.90,  sets: 4, reps: 2 },
  { week: 7,  pct: 0.875, sets: 3, reps: 3 },
  { week: 8,  pct: 0.925, sets: 8, reps: 1, amrap: true },
  { week: 9,  pct: 0.90,  sets: 2, reps: 2, amrap: true },
  { week: 10, pct: 0.95,  sets: 1, reps: 1 },
  { week: 11, pct: 0.85,  sets: 3, reps: 2, amrap: true },
  { week: 12, pct: 0.95,  sets: 1, reps: 1 },
];

// T2: % del 5RM en 3 olas de 3 semanas + semana 10 pesada. Se elimina en semanas 11-12.
const T2_WAVE = [
  { week: 1,  pct: 0.68, scheme: '5×6' },
  { week: 2,  pct: 0.72, scheme: '5×5' },
  { week: 3,  pct: 0.76, scheme: '4×4 + 1×4+' },
  { week: 4,  pct: 0.70, scheme: '4×6' },
  { week: 5,  pct: 0.74, scheme: '4×5' },
  { week: 6,  pct: 0.78, scheme: '3×4 + 1×4+' },
  { week: 7,  pct: 0.72, scheme: '3×6' },
  { week: 8,  pct: 0.76, scheme: '3×5' },
  { week: 9,  pct: 0.80, scheme: '2×4 + 1×4+' },
  { week: 10, pct: 0.85, scheme: '4×3 + 1×3+' },
];

const r1  = kg => Math.round(kg);
const r25 = kg => Math.round(kg / 2.5) * 2.5;

// Genera byWeek para un T1 con barra: calentamiento en rampa + trabajo según la ola.
function barbellByWeek(base2RM, { warmupReps = [8, 5, 2], prAttempts = [] } = {}) {
  const byWeek = {};
  for (const w of T1_WAVE) {
    const kg = r1(base2RM * w.pct);
    const warmup = [0.5, 0.7, 0.85].map((pct, i) => ({
      label: `C${i + 1}`, reps: warmupReps[i], kg: r25(kg * pct),
      rest: i === 2 ? 120 : 90, type: 'warmup',
    }));
    const work = [{
      label: `${w.sets}×${w.reps}`, reps: w.reps, kg,
      rest: w.pct >= 0.90 ? 240 : 180, type: 'work',
      note: `${Math.round(w.pct * 1000) / 10}% del 2RM`,
    }];
    if (w.amrap) work.push({
      label: 'AMRAP', reps: `${w.reps}+`, kg, rest: 0, type: 'work',
      note: 'Serie extra a máximas reps con técnica sólida — no al fallo',
    });
    byWeek[w.week] = { warmup, work };
  }
  byWeek[12].work.push(...prAttempts); // Peaking: intentos 1RM OPT-IN tras el single al 95%
  return byWeek;
}

// Dominadas: el % se aplica al peso TOTAL (cuerpo + lastre). Bajo el PC → asistida.
const PULLUP = { total2RM: 115, bodyweight: 105 };

function pullupLoad(pct) {
  const diff = PULLUP.total2RM * pct - PULLUP.bodyweight;
  if (Math.abs(diff) < 2.5) return 'Peso corporal';
  return diff < 0 ? `Asistida −${Math.abs(r25(diff))} kg` : `Lastre +${r25(diff)} kg`;
}

function pullupByWeek() {
  const byWeek = {};
  for (const w of T1_WAVE) {
    byWeek[w.week] = {
      warmup: [
        { label: 'Escapulares', reps: 10, kg: 'Peso corporal', rest: 30, type: 'warmup' },
      ],
      work: (() => {
        const work = [{
          label: `${w.sets}×${w.reps}`, reps: w.reps, kg: pullupLoad(w.pct),
          rest: w.pct >= 0.90 ? 240 : 180, type: 'work',
          note: `${Math.round(w.pct * 1000) / 10}% del 2RM total (${PULLUP.total2RM} kg)`,
        }];
        if (w.amrap) work.push({
          label: 'AMRAP', reps: `${w.reps}+`, kg: pullupLoad(w.pct), rest: 0, type: 'work',
          note: 'Serie extra a máximas reps con técnica sólida — no al fallo',
        });
        return work;
      })(),
    };
  }
  byWeek[12].work.push({
    label: 'PR 1RM ★', reps: 1, kg: 'Lastre +15 kg', rest: 0, type: 'pr',
    note: 'OPT-IN — solo si el single anterior subió sólido',
  });
  return byWeek;
}

// T2 con ola Rippler: {semana: {setsReps, kg}}
function t2ByWeek(base5RM) {
  const byWeek = {};
  for (const w of T2_WAVE) {
    byWeek[w.week] = { setsReps: w.scheme, kg: r1(base5RM * w.pct) };
  }
  return byWeek;
}

// ── S1: Empuje — T1 Press Banca ─────────────────────────────────────────────
export const S1 = {
  name: 'S1 — Empuje',
  color: 'pink',
  dayLabel: 'Día 1',

  T1: {
    exercise: 'Press Banca',
    base2RM: 110,
    prBase: 117,
    byWeek: barbellByWeek(110, {
      warmupReps: [8, 5, 2],
      prAttempts: [
        { label: 'Intento 1RM', reps: 1, kg: 112, rest: 300, type: 'pr', note: 'OPT-IN — solo si el single al 95% subió rápido y limpio' },
        { label: 'PR ★',        reps: 1, kg: 117, rest: 0,   type: 'pr', note: 'e1RM actual — en déficit, superar 110×2 ya es progreso' },
      ],
    }),
  },

  T2: [
    {
      name: 'Press militar barra',
      byWeek: t2ByWeek(42.5), rest: 120,
      note: 'Ola Rippler sobre 5RM 42.5 kg. Codos adelante, agarre más ancho.',
      removeWeeks: [11, 12],
    },
    {
      name: 'Fondos en paralelas',
      setsReps: '3×8-12', rest: 90,
      note: 'Peso corporal o +5 kg.',
      removeWeeks: [11, 12],
    },
    {
      name: 'Face pull polea',
      setsReps: '3×15', rest: 60,
      note: 'OBLIGATORIO — salud escapular.',
      obligatorio: true,
    },
  ],

  kineBlock: {
    label: '— Hombro Kine · Empuje —',
    note: 'PARTE ESTRUCTURAL DEL PROGRAMA — actualización kine julio 2026',
    exercises: [
      { name: 'Chaos push up (pelota)',          load: 'Bandas gruesas',       setsReps: '2×máx',    rest: 30 },
      { name: 'Press serrato unilateral',        load: 'Barra o mancuerna @8', setsReps: '2×20',     rest: 30 },
      { name: 'Press banca inclinado con barra', load: '@7',                   setsReps: '3×8-10',   rest: 60, note: 'Con barra, NO multipower.' },
      { name: 'Dead bug con disco',              load: '25 kg',                setsReps: '2×10/lado', rest: 30 },
    ],
  },

  T3: [
    { name: 'Tríceps francés polea',   setsReps: '3×12-15', removeWeeks: [11, 12] },
    { name: 'Tríceps pushdown',        setsReps: '3×12-15', removeWeeks: [11, 12] },
    { name: 'Elevaciones laterales',   setsReps: '3×12-15', note: 'Pausa 1 seg posición baja.', removeWeeks: [11, 12] },
    { name: 'Abdominal oblicuo polea', setsReps: '3×12-15/lado', removeWeeks: [11, 12] },
    { name: 'Plancha abdominal',       setsReps: '3×45"', removeWeeks: [11, 12] },
  ],
};

// ── S2: Pierna · Cuádriceps — receta kine (RPE, sin olas) ───────────────────
export const S2 = {
  name: 'S2 — Pierna · Cuádriceps',
  color: 'cyan',
  dayLabel: 'Día 2',
  evaMax: 3,
  bloque: [
    { num: 1, name: 'Extensión de cuádriceps', load: '@8',             setsReps: '3×15',        rest: 30, video: true },
    { num: 2, name: 'Prensa',                  load: '180–200 kg',     setsReps: '2×8/pierna',  rest: 30, video: true },
    { num: 3, name: 'Squat low back bar',      load: '@8',             setsReps: '3×8',         rest: 60, video: true },
    { num: 7, name: 'Pistol SQ excéntrico',    load: 'Sin peso',       setsReps: '2×8/pierna',  rest: 60, video: true },
  ],
};

// ── S3: Tirón — T1 Dominadas (ola sobre 2RM total) ──────────────────────────
export const S3 = {
  name: 'S3 — Tirón',
  color: 'mint',
  dayLabel: 'Día 3',

  T1: {
    exercise: 'Dominadas (ola 2RM)',
    base2RMTotal: PULLUP.total2RM,
    bodyweight: PULLUP.bodyweight,
    note: `Ola sobre 2RM total (cuerpo + lastre) = ${PULLUP.total2RM} kg con PC ${PULLUP.bodyweight} kg. ` +
          'Al bajar de peso en el déficit, reduce la asistencia ~2.5 kg por cada 2 kg de PC perdidos.',
    byWeek: pullupByWeek(),
  },

  T2: [
    {
      name: 'Remo con barra (Pendlay)',
      byWeek: t2ByWeek(65), rest: 120,
      note: 'Ola Rippler sobre 5RM 65 kg. Espalda plana, desde el suelo.',
      removeWeeks: [11, 12],
    },
    {
      name: 'Remo mancuerna unilateral',
      setsReps: '3×8-12/lado', rest: 90,
      removeWeeks: [11, 12],
    },
  ],

  kineBlock: {
    label: '— Hombro Kine · Rehabilitación —',
    note: 'PARTE ESTRUCTURAL DEL PROGRAMA — actualización kine julio 2026',
    exercises: [
      { name: 'Retracción y depresión escapular colgado en barra', load: 'Peso corporal',      setsReps: '2×10',      rest: 30 },
      { name: 'Isométrico de hombro acostado o en pared',          load: '5 kg (progresar)',   setsReps: '3×12',      rest: 60 },
      { name: 'Flexoextensión + rotación interna de hombro',       load: '7,5–10 → 15 kg',     setsReps: '2×12',      rest: 60 },
      { name: 'Nadador con bandas',                                load: 'Banda tensa',        setsReps: '2×12/brazo', rest: 60, note: 'Visto en consulta.' },
      { name: 'Péndulo de Codman',                                 load: 'Sin carga',          setsReps: '30-60"',    note: 'Descarga articular entre ejercicios o al finalizar.' },
    ],
  },

  T3: [
    { name: 'Curl bíceps mancuerna 45°',  setsReps: '3×10-12', note: 'Supinación completa.', removeWeeks: [11, 12] },
    { name: 'Curl martillo',              setsReps: '3×10-12', note: 'Braquial y braquiorradial.', removeWeeks: [11, 12] },
    { name: 'Curl concentrado mancuerna', setsReps: '3×10/lado', note: 'Contracción peak.', removeWeeks: [11, 12] },
    { name: 'Gemelos en Smith',           setsReps: '3×15-20', note: 'Frecuencia 2×. Rango completo.', removeWeeks: [11, 12] },
    { name: 'Curl inverso con barra',     setsReps: '2×12-15', note: 'Agarre prono. Antebrazo extensor.', removeWeeks: [11, 12] },
  ],
};

// ── S4: Pierna · Glúteo/Posterior — receta kine (RPE, sin olas) ─────────────
export const S4 = {
  name: 'S4 — Pierna · Glúteo/Posterior',
  color: 'orange',
  dayLabel: 'Día 4',
  evaMax: 3,
  bloque: [
    { num: 4, name: 'Hip thrust bilateral',    load: 'RPE 9',          setsReps: '3×10',          rest: 60, note: '3ª serie unilateral RPE 9.' },
    { num: 5, name: 'High step con barra',     load: '70 kg',          setsReps: '2×15',          rest: 120, video: true },
    { num: 6, name: 'Single leg RDL',          load: '45 kg totales',  setsReps: '2×12/pierna',   rest: 30 },
    { num: 8, name: 'Búlgaras unilaterales',   load: '50 kg +',        setsReps: '12-15/pierna',  rest: 60 },
    { num: 9, name: 'Pata de glúteo en polea', load: 'RPE 10',         setsReps: '3×12-15',       rest: 0, note: 'A la fatiga.' },
  ],
};

// ── S5: Cadena Posterior — T1 Peso Muerto ───────────────────────────────────
export const S5 = {
  name: 'S5 — Cadena Posterior',
  color: 'gold',
  dayLabel: 'Día 5',

  T1: {
    exercise: 'Peso Muerto Convencional',
    base2RM: 177.5,
    prBase: 190,
    technicalCues: [
      'Pies a ancho de cadera, barra sobre mediopiés',
      'Caderas atrás, espalda neutra',
      'Empuja el suelo — no jales la barra',
      'Si la espalda baja se redondea, para la serie',
    ],
    byWeek: barbellByWeek(177.5, {
      warmupReps: [5, 3, 2],
      prAttempts: [
        { label: 'Intento 1RM', reps: 1, kg: 182, rest: 300, type: 'pr', note: 'OPT-IN — evalúa rodilla antes. Rápido y limpio.' },
        { label: 'PR ★',        reps: 1, kg: 190, rest: 0,   type: 'pr', note: 'e1RM actual — solo si el intento anterior fue impecable y rodilla OK' },
      ],
    }),
  },

  T2: [
    {
      name: 'Leg curl acostado',
      setsReps: '4×8-12', rest: 90,
      note: 'Bajada 3 seg. Isquiotibial en elongación.',
      removeWeeks: [11, 12],
    },
    {
      name: 'Gemelos en Smith',
      setsReps: '4×15-20', rest: 75,
      note: 'Rango completo. Pausa arriba y abajo.',
      removeWeeks: [11, 12],
    },
  ],

  kineBlock: {
    label: '— Pierna Kine · Bloque E —',
    note: 'Tercer estímulo de pierna de la semana — cargas moderadas, no busca fatiga máxima.',
    exercises: [
      { name: 'Extensión de cuádriceps', load: '@8',            setsReps: '3×15',       rest: 30 },
      { name: 'Prensa',                  load: '180–200 kg',    setsReps: '2×8/pierna', rest: 30 },
      { name: 'Single leg RDL',          load: '45 kg totales', setsReps: '2×12/pierna', rest: 30 },
    ],
  },

  T3: [
    { name: 'Push ups con protracción', setsReps: '3×máx', note: 'Empuje horizontal 2×.', removeWeeks: [11, 12] },
    { name: 'Remo en polea sentado',    setsReps: '3×8-12', rest: 90, note: 'Tirón horizontal 2×. Codo pegado.', removeWeeks: [11, 12] },
    { name: 'Back extension',           setsReps: '3×12-15', note: 'Erector espinal directo.', removeWeeks: [11, 12] },
    { name: 'Pallof press en polea',    setsReps: '3×12/lado', note: 'Antirrotación.', removeWeeks: [11, 12] },
    { name: 'Farmer carry',             setsReps: '3×30m', rest: 90, note: 'Grip al límite.', removeWeeks: [11, 12] },
  ],
};

// Reglas kine (aplican a S2, S4 y bloques kine):
//   · Dolor máximo 3/10 en escala EVA — si supera, reducir y reportar.
//   · Enviar videos de los ejercicios marcados VIDEO (pierna 1, 2, 3, 5 y 7).
export const SESSIONS = { S1, S2, S3, S4, S5 };
