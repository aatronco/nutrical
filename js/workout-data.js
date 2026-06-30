// js/workout-data.js
// Complete GZCLP v6 program data — static, never modified by the app.
// All load values are exact kg from the spec for Alejandro's PRs:
//   Press Banca base: 125 kg | DL Convencional base: 140 kg | Pullups: 6 reps

export const PHASES = [
  { weeks: [1,2], name: 'volumen',         label: 'Volumen',        color: 'pink',   t2Sets: '4-5×10-12', t3Rest: 75 },
  { weeks: [3,4], name: 'intensificacion_prog', label: 'Intens. Progresiva', color: 'orange', t2Sets: '3-4×8-10', t3Rest: 90 },
  { weeks: [5],   name: 'intensificacion', label: 'Intensificación',color: 'gold',   t2Sets: '3×8-10',    t3Rest: 90 },
  { weeks: [6],   name: 'peak_pr',         label: 'Peak PR ★',      color: 'purple', t2Sets: '2×8',       t3Rest: 0  },
];

export function getPhaseForWeek(week) {
  return PHASES.find(p => p.weeks.includes(week)) ?? PHASES[0];
}

// ── S1: Empuje ──────────────────────────────────────────────────────────────
export const S1 = {
  name: 'S1 — Empuje',
  color: 'pink',
  dayLabel: 'Lunes',

  warmup: [
    { name: 'Retracción escapular colgado',        load: 'Peso corporal', sets: 2, reps: '10',    rest: 30 },
    { name: 'Rotación externa mancuerna',          load: '3–5 kg',        sets: 2, reps: '12/lado', rest: 30 },
    { name: 'Deadbug con disco',                   load: '10 kg',         sets: 2, reps: '8/lado', rest: 30 },
    { name: 'Elevaciones laterales activación',    load: '4–5 kg',        sets: 2, reps: '15',    rest: 30 },
  ],

  T1: {
    exercise: 'Press Banca',
    prBase: 125,
    byWeek: {
      1: {
        warmup: [
          { label: '1a', reps: 8,  kg: 52,  rest: 90, type: 'warmup' },
          { label: '1b', reps: 6,  kg: 68,  rest: 90, type: 'warmup' },
          { label: '1c', reps: 4,  kg: 79,  rest: 120, type: 'warmup' },
        ],
        work: [
          { label: '1d', reps: 10, kg: 88,  rest: 180, type: 'work', note: 'excéntrica 3 seg' },
          { label: '1e', reps: 10, kg: 88,  rest: 180, type: 'work' },
          { label: '1f', reps: 8,  kg: 94,  rest: 0,   type: 'work', note: 'RPE 7 máximo' },
        ],
      },
      2: {
        warmup: [
          { label: '1a', reps: 8,  kg: 52,  rest: 90, type: 'warmup' },
          { label: '1b', reps: 6,  kg: 70,  rest: 90, type: 'warmup' },
          { label: '1c', reps: 4,  kg: 81,  rest: 120, type: 'warmup' },
        ],
        work: [
          { label: '1d', reps: 10, kg: 91,  rest: 180, type: 'work' },
          { label: '1e', reps: 10, kg: 91,  rest: 180, type: 'work' },
          { label: '1f', reps: 8,  kg: 97,  rest: 0,   type: 'work' },
        ],
      },
      3: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 104, rest: 240, type: 'work', note: '3×3' },
        ],
      },
      4: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3,  kg: 109, rest: 240, type: 'work', note: '3×3' },
          { label: 'Backoff',reps: 5,  kg: 91,  rest: 180, type: 'work', note: '2×5' },
        ],
      },
      5: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 114, rest: 300, type: 'work', note: '112–116 kg' },
        ],
      },
      6: {
        warmup: [],
        work: [
          { label: 'Intento 1', reps: 1, kg: 119, rest: 300, type: 'pr', note: '95% — sólido y rápido' },
          { label: 'Intento 2', reps: 1, kg: 124, rest: 300, type: 'pr', note: '99% — solo si intento 1 limpio' },
          { label: 'PR ★',      reps: 1, kg: 129, rest: 0,   type: 'pr', note: '127–131 kg' },
        ],
      },
    },
  },

  T2: [
    {
      name: 'Press militar barra',
      setsReps: '4×8-12', rest: 120,
      note: 'Agarre más ancho. Codos adelante. Última serie RPE 9.',
      removeWeeks: [6],
    },
    {
      name: 'Press inclinado mancuerna',
      setsReps: '4×8-12', rest: 90,
      note: 'Rango completo. Bajada 2–3 seg.',
      reduceWeeks: { 3: '3×8-12', 4: '3×8-12', 5: '3×8-12' },
      removeWeeks: [6],
    },
    {
      name: 'Fondos en paralelas',
      setsReps: '3×8-12', rest: 90,
      note: 'Peso corporal o +5 kg.',
      removeWeeks: [5, 6],
    },
    {
      name: 'Face pull polea',
      setsReps: '3×15', rest: 60,
      note: 'OBLIGATORIO — salud escapular.',
      obligatorio: true,
    },
  ],

  T3: [
    { name: 'Tríceps francés polea',   setsReps: '3×12-15', reduceWeek5: '2×10' },
    { name: 'Tríceps pushdown',         setsReps: '3×12-15', removeWeeks: [5, 6] },
    { name: 'Elevaciones laterales',    setsReps: '3×12-15', note: 'Pausa 1 seg posición baja.', reduceWeek5: '2×12' },
    { name: 'Abdominal oblicuo polea',  setsReps: '3×12-15/lado', removeWeeks: [5, 6] },
    { name: 'Plancha abdominal',        setsReps: '3×45"', reduceWeek5: '2×60"' },
  ],
};

// ── S3: Tirón ───────────────────────────────────────────────────────────────
export const S3 = {
  name: 'S3 — Tirón',
  color: 'mint',
  dayLabel: 'Miércoles',

  T1: {
    exercise: 'Pullups',
    note: 'Protocolo de dos frentes',
    frente1: {
      label: 'Frente 1 — Fuerza',
      warmup: { name: 'Escapulares', reps: 10, rest: 30, type: 'warmup' },
      description: '5 series al fallo controlado (sem 1-4) / 3 series sem 5-6 — calidad sobre cantidad.',
      sets: 5, setsByWeek: { 5: 3, 6: 3 }, rest: 180, type: 'bodyweight',
    },
    frente2: {
      label: 'Frente 2 — Volumen Asistido',
      description: '4 series asistidas, agarre prono. RPE 8.',
      sets: 4, reps: [8, 10], rest: 90, type: 'assisted',
      progressionNote: 'Reducir asistencia cada semana',
    },
    prTarget: { week6Reps: [10, 12], note: 'PR de reps, no de carga. 5 min descanso antes del intento.' },
  },

  T2: [
    { name: 'Remo con barra (Pendlay)',     setsReps: '5×5',      rest: 120, note: 'Espalda plana. Transferencia al DL.' },
    { name: 'Remo mancuerna unilateral',    setsReps: '4×8-12/lado', rest: 90, reduceWeeks: { 3: '3×8-12', 4: '3×8-12' } },
    { name: 'Chin up supinado',             setsReps: '4×8-12',   rest: 90, note: 'Palmas hacia ti. Bíceps activo. Rango completo.', isNew: true, reduceWeeks: { 3: '3×8-12', 4: '3×8-12' } },
  ],

  T3: [
    { name: 'Curl bíceps mancuerna 45°',  setsReps: '3×10-12', note: 'Supinación completa.' },
    { name: 'Curl martillo',               setsReps: '3×10-12', note: 'Braquial y braquiorradial.' },
    { name: 'Curl concentrado mancuerna', setsReps: '3×10/lado', note: 'Contracción peak.' },
    { name: 'Gemelos en Smith',            setsReps: '3×15-20', note: 'Frecuencia 2×. Rango completo.', isNew: true },
    { name: 'Curl inverso con barra',      setsReps: '2×12-15', note: 'Agarre prono. Antebrazo extensor.', isNew: true },
  ],

  hombroTerapeutico: {
    label: '— Hombro Terapéutico —',
    note: 'PARTE ESTRUCTURAL DEL PROGRAMA — no es accesorio opcional',
    exercises: [
      { name: 'Press landmine unilateral',        load: '25 kg',         setsReps: '2×12/lado' },
      { name: 'Chaos push up (pelota)',            load: 'Bandas gruesas', setsReps: '2×máx' },
      { name: 'Press serrato unilateral',          load: '@8',            setsReps: '2×20' },
      { name: 'Press banca inclinado con barra',   load: '@7',            setsReps: '3×8-10', note: 'Con barra, NO multipower.' },
    ],
  },
};

// ── S5: Cadena Posterior ────────────────────────────────────────────────────
export const S5 = {
  name: 'S5 — Cadena Posterior',
  color: 'gold',
  dayLabel: 'Viernes / Sábado',

  T1: {
    exercise: 'Peso Muerto Convencional',
    prBase: 140,
    technicalCues: [
      'Pies a ancho de cadera, barra sobre mediopiés',
      'Caderas atrás, espalda neutra',
      'Empuja el suelo — no jales la barra',
      'Si la espalda baja se redondea, para la serie',
    ],
    byWeek: {
      1: {
        warmup: [
          { label: '1a', reps: 5, kg: 60,  rest: 90,  type: 'warmup' },
          { label: '1b', reps: 4, kg: 90,  rest: 90,  type: 'warmup' },
          { label: '1c', reps: 3, kg: 115, rest: 120, type: 'warmup' },
          { label: '1d', reps: 2, kg: 130, rest: 120, type: 'warmup' },
        ],
        work: [
          { label: 'Top set', reps: 6, kg: 140, rest: 240, type: 'work', note: '3×5-6 — foco en técnica' },
        ],
      },
      2: {
        warmup: [
          { label: '1a', reps: 5, kg: 60,  rest: 90,  type: 'warmup' },
          { label: '1b', reps: 4, kg: 95,  rest: 90,  type: 'warmup' },
          { label: '1c', reps: 3, kg: 120, rest: 120, type: 'warmup' },
          { label: '1d', reps: 2, kg: 135, rest: 120, type: 'warmup' },
        ],
        work: [
          { label: 'Top set', reps: 6, kg: 140, rest: 240, type: 'work', note: 'Top set fijo — técnica' },
        ],
      },
      3: {
        warmup: [],
        work: [
          { label: 'Top ×5', reps: 5, kg: 145, rest: 240, type: 'work', note: 'Transición — técnica sólida' },
        ],
      },
      4: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 152, rest: 270, type: 'work', note: '3×3' },
          { label: 'Backoff', reps: 5, kg: 132, rest: 180, type: 'work', note: '2×5' },
        ],
      },
      5: {
        warmup: [],
        work: [
          { label: 'Top ×3', reps: 3, kg: 163, rest: 300, type: 'work', note: '162–165 kg' },
        ],
      },
      6: {
        warmup: [],
        work: [
          { label: 'Intento 1', reps: 1, kg: 170, rest: 300, type: 'pr', note: 'OPT-IN — evalúa rodilla antes. Rápido y limpio.' },
          { label: 'Intento 2', reps: 1, kg: 175, rest: 300, type: 'pr', note: 'Solo si intento 1 impecable y rodilla OK' },
          { label: 'PR ★',      reps: 1, kg: 180, rest: 0,   type: 'pr', note: '178–182 kg ★' },
        ],
      },
    },
  },

  T2: [
    {
      name: 'Leg curl acostado',
      setsReps: '4×8-12', rest: 90,
      note: 'Bajada 3 seg. Isquiotibial en elongación.',
      reduceWeeks: { 4: '3×8-12', 5: '3×8-10' },
    },
    {
      name: 'Gemelos en Smith',
      setsReps: '4×15-20', rest: 75,
      note: 'Rango completo. Pausa arriba y abajo.',
      reduceWeeks: { 4: '3×12', 5: '3×12' },
    },
  ],

  T3: [
    { name: 'Push ups con protracción',  setsReps: '3×máx', note: 'Empuje horizontal 2×. Empuja un poco más al final.', isNew: true },
    { name: 'Remo en polea sentado',     setsReps: '3×8-12', rest: 90, note: 'Tirón horizontal 2×. Codo pegado.', isNew: true },
    { name: 'Back extension',            setsReps: '3×12-15', note: 'Erector espinal directo.' },
    { name: 'Pallof press en polea',     setsReps: '3×12/lado', note: 'Antirrotación.' },
    { name: 'Plancha abdominal',         setsReps: '3×45"', removeWeeks: [5, 6] },
    { name: 'Elevación de rodillas',     setsReps: '3×10', removeWeeks: [5, 6] },
    { name: 'Curl inverso con barra',    setsReps: '3×12-15', note: 'Agarre prono. Braquiorradial.' },
    { name: 'Farmer carry',             setsReps: '3×30m', rest: 90, note: 'Grip al límite. Sube cuando 30m se sienten fáciles.' },
  ],
};

// ── Kine: S2 y S4 ───────────────────────────────────────────────────────────
export const KINE = {
  name: 'Kine — S2 y S4',
  color: 'cyan',
  readonly: true,
  evaMax: 3,
  videosRequired: [1, 2, 3, 5, 7],
  bloqueRodilla: [
    { num: 1, name: 'Bulgarian pogos',                     load: 'Barra 20 kg',    sets: 3, reps: '15',       rest: 30, video: true },
    { num: 2, name: 'Lateral hop + salto lateral 1:1',     load: '10 kg opcional', sets: 2, reps: '8/pierna', rest: 30, video: true },
    { num: 3, name: 'Squat frontal (back bar)',             load: '@8',             sets: 3, reps: '8',        rest: 60, video: true },
    { num: 4, name: 'Hip thrust bilateral',                 load: 'RPE 9',          sets: 3, reps: '10',       rest: 60 },
    { num: 5, name: 'High step con barra',                  load: '60 kg',          sets: 2, reps: '15',       rest: 120, video: true },
    { num: 6, name: 'Single leg RDL',                       load: '45 kg totales',  sets: 2, reps: '12/pierna', rest: 30 },
    { num: 7, name: 'Pistol SQ asistido con banda',         load: 'Sin peso',       sets: 2, reps: '8/pierna', rest: 60, video: true },
    { num: 8, name: 'Búlgaras unilaterales',                load: '12→28→30 kg',   reps: '12-15/pierna',       rest: 60 },
    { num: 9, name: 'Pata de glúteo en polea',              load: 'RPE 10',         sets: 3, reps: '12-15',    rest: 0 },
  ],
  bloqueHombro: [
    { num: 1, name: 'Retracción + depresión escapular',     load: 'Peso corporal', sets: 2, reps: '10',       rest: 30 },
    { num: 2, name: 'Isométrico acostado o en pared',       load: '5 kg (progresar)', sets: 3, reps: '12',    rest: 60 },
    { num: 3, name: 'Press landmine',                       load: '25 kg',         sets: 2, reps: '12',       rest: 60 },
    { num: 4, name: 'Deadbug con disco',                    load: '25 kg',         sets: 2, reps: '10/lado',  rest: 30 },
    { num: 5, name: 'Chaos push up (pelota)',                load: 'Bandas gruesas', sets: 2, reps: 'máx',     rest: 30 },
    { num: 6, name: 'Press serrato unilateral',              load: '@8',            sets: 2, reps: '20',       rest: 30 },
    { num: 7, name: 'Press banca inclinado con barra',       load: '@7',            sets: 3, reps: '8-10',     rest: 60, note: 'Con barra, NO multipower.' },
    { num: 8, name: 'Nadador con bandas',                    load: 'Banda tensa',   reps: '12/brazo',         rest: 60 },
  ],
};

export const SESSIONS = { S1, S3, S5, kine: KINE };
