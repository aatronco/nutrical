// tests/formulas.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  calcularIMC,
  calcularEdad,
  calcularAreaSuperficial,
  calcularMasaPiel,
  calcularMasaAdiposa,
  calcularMasaMuscular,
  calcularMasaResidual,
  calcularMasaOsea,
  ajustarMasas,
  calcularSomatotipo,
  calcularIndices,
} from '../js/formulas.js';

const TOLERANCE = 0.001;
const near = (a, b) => Math.abs(a - b) < TOLERANCE;

// ── IMC ──────────────────────────────────────────────────────────────────────
// Excel: =E11/(E12/100)^2 = 62.5/(1.65)^2 = 22.957
test('calcularIMC: 62.5kg 165cm → 22.957', () => {
  const result = calcularIMC(62.5, 165);
  assert.ok(near(result, 22.957), `got ${result}`);
});

// ── Edad ─────────────────────────────────────────────────────────────────────
test('calcularEdad: 2025-03-01 born 1997-05-12 → ~27.8 years', () => {
  const result = calcularEdad('2025-03-01', '1997-05-12');
  assert.ok(result > 27 && result < 28, `got ${result}`);
});

// ── Área Superficial ─────────────────────────────────────────────────────────
// Excel: =(I60*E11^0.425*E12^0.725)/10000, I60=G60=73.074 for F adult
// = (73.074 * 62.5^0.425 * 165^0.725) / 10000 = 1.717
test('calcularAreaSuperficial: F adult 62.5kg 165cm → ~1.717 m²', () => {
  const result = calcularAreaSuperficial(62.5, 165, 'F', 28);
  assert.ok(near(result, 1.717), `got ${result}`);
});

// ── Masa Piel ────────────────────────────────────────────────────────────────
// Excel: =(C66*E60*1.05), E60=1.96 for F
// 1.717 * 1.96 * 1.05 = 3.534
test('calcularMasaPiel: F areaSup=1.717 → ~3.534 kg', () => {
  const result = calcularMasaPiel(1.717, 'F');
  assert.ok(near(result, 3.534), `got ${result}`);
});

// ── Masa Adiposa ─────────────────────────────────────────────────────────────
// suma6=56, talla=165 → ratio=170.18/165=1.03139
// scoreZ=(56*1.03139-116.41)/34.79=(57.758-116.41)/34.79=-1.686
// kg=((−1.686*5.85)+25.6)/1.03139^3=(−9.863+25.6)/1.0972=14.344
test('calcularMasaAdiposa: suma6=56mm talla=165 → scoreZ≈-1.686, kg≈14.344', () => {
  const result = calcularMasaAdiposa(56, 165);
  assert.ok(near(result.scoreZ, -1.686), `scoreZ got ${result.scoreZ}`);
  assert.ok(near(result.kg, 14.344),     `kg got ${result.kg}`);
});

// ── Masa Muscular ────────────────────────────────────────────────────────────
// brazo_corr=29-(12*3.141/10)=29-3.769=25.231
// muslo_corr=53-(14*3.141/10)=53-4.397=48.603
// pant_corr =35-(8*3.141/10)=35-2.513=32.487
// torax_corr=86-(10*3.141/10)=86-3.141=82.859
// suma=25.231+24+48.603+32.487+82.859=213.18
// ratio=170.18/165=1.03139
// scoreZ=(213.18*1.03139-207.21)/13.74=(219.88-207.21)/13.74=0.922
// kg=((0.922*5.4)+24.5)/1.03139^3=(4.979+24.5)/1.0972=26.866
test('calcularMasaMuscular: known inputs → scoreZ≈0.922, kg≈26.866', () => {
  const perimetros = { brazo_relajado: 29, antebrazo: 24, muslo_maximo: 53, pantorrilla_maxima: 35, torax_mesoesternal: 86 };
  const pliegues   = { tricipital: 12, subescapular: 10, muslo_medio_pliegue: 14, pantorrilla_pliegue: 8 };
  const result = calcularMasaMuscular(perimetros, pliegues, 165);
  assert.ok(near(result.scoreZ, 0.922), `scoreZ got ${result.scoreZ}`);
  assert.ok(near(result.kg, 26.866),   `kg got ${result.kg}`);
});

// ── Masa Residual ────────────────────────────────────────────────────────────
// cintura_corr=70-(15*3.141/10)=70-4.712=65.288
// suma=19+27+65.288=111.288
// ratio=89.92/87=1.03356
// scoreZ=(111.288*1.03356-109.35)/7.08=(115.024-109.35)/7.08=0.801
// kg=((0.801*1.24)+6.1)/1.03356^3=(0.993+6.1)/1.1042=6.425
test('calcularMasaResidual: known inputs → scoreZ≈0.801, kg≈6.425', () => {
  const perimetros = { cintura: 70, torax_transverso: 27, torax_ap: 19 };
  const pliegues   = { abdominal: 15 };
  const result = calcularMasaResidual(perimetros, pliegues, 87);
  assert.ok(near(result.scoreZ, 0.801), `scoreZ got ${result.scoreZ}`);
  assert.ok(near(result.kg, 6.425),    `kg got ${result.kg}`);
});

// ── Masa Ósea ────────────────────────────────────────────────────────────────
test('calcularMasaOsea: returns kg_cabeza, kg_cuerpo, kg_total', () => {
  const diametros  = { biacromial: 37, biliocrestideo: 28, humeral: 5.8, femoral: 8.2 };
  const perimetros = { cabeza: 55 };
  const result = calcularMasaOsea(diametros, perimetros, 165);
  assert.ok(result.kg_cabeza > 0);
  assert.ok(result.kg_cuerpo > 0);
  assert.ok(near(result.kg_total, result.kg_cabeza + result.kg_cuerpo));
});

// ── ajustarMasas ─────────────────────────────────────────────────────────────
test('ajustarMasas: sum of adjusted masses equals pesoReal', () => {
  const masas = {
    piel:     { kg: 3.5 },
    adiposa:  { kg: 14.0 },
    muscular: { kg: 25.0 },
    residual: { kg: 8.0 },
    osea:     { kg_cabeza: 1.2, kg_cuerpo: 6.5 },
  };
  const result = ajustarMasas(masas, 62.5);
  const sum = result.piel.kg + result.adiposa.kg + result.muscular.kg + result.residual.kg + result.osea.kg;
  assert.ok(near(sum, 62.5), `sum ${sum} should equal 62.5`);
});

// ── Somatotipo ────────────────────────────────────────────────────────────────
test('calcularSomatotipo: returns endo, meso, ecto, X, Y', () => {
  const pliegues   = { tricipital: 12, subescapular: 10, suprailiaco: 11, pantorrilla_pliegue: 8 };
  const diametros  = { humeral: 5.8, femoral: 8.2 };
  const perimetros = { brazo_flexionado: 30, pantorrilla_maxima: 35 };
  const result = calcularSomatotipo(pliegues, diametros, perimetros, 62.5, 165);
  assert.ok(typeof result.endo === 'number');
  assert.ok(typeof result.meso === 'number');
  assert.ok(typeof result.ecto === 'number');
  assert.ok(near(result.X, result.ecto - result.endo));
});

// ── Índices ───────────────────────────────────────────────────────────────────
test('calcularIndices: M/O and M/A ratios', () => {
  const result = calcularIndices(25, 7, 14);
  assert.ok(near(result.muscularOseo, 25 / 7));
  assert.ok(near(result.muscularAdiposo, 25 / 14));
});
