// js/formulas.js
// Pure functions — no DOM, no side effects.
// All formulas sourced from origin/eldocumento.xlsm CONSULTA 1 rows 60–115.
// Measurements arrive in their stored units: talla/diameters/perimeters in cm,
// skinfolds/lengths in mm, peso in kg. Conversions are local to each function.

const PI = 3.141; // Match Excel's literal value for numeric parity

// ── IMC ──────────────────────────────────────────────────────────────────────
// Source: Excel CONSULTA 1 Q9: =E11/(E12/100)^2
export function calcularIMC(peso, talla) {
  return peso / Math.pow(talla / 100, 2);
}

// ── Edad (decimal years) ──────────────────────────────────────────────────────
// Source: Excel E10: =(E8-E9)/365
export function calcularEdad(fechaEval, fechaNac) {
  const ms = new Date(fechaEval) - new Date(fechaNac);
  return ms / (365 * 24 * 60 * 60 * 1000);
}

// ── Área Superficial (m²) ─────────────────────────────────────────────────────
// Source: Excel C66: =(I60*E11^0.425*E12^0.725)/10000
// I60 = const depending on sex/age (F60=68.308 M, G60=73.074 F, H60=70.691 <12)
export function calcularAreaSuperficial(peso, talla, sexo, edad) {
  const k = edad < 12 ? 70.691 : (sexo === 'M' ? 68.308 : 73.074);
  return (k * Math.pow(peso, 0.425) * Math.pow(talla, 0.725)) / 10000;
}

// ── Masa Piel (kg) ────────────────────────────────────────────────────────────
// Source: Excel D66: =(C66*E60*1.05)  E60 = grosor (M=2.07, F=1.96)
export function calcularMasaPiel(areaSup, sexo) {
  const grosor = sexo === 'M' ? 2.07 : 1.96;
  return areaSup * grosor * 1.05;
}

// ── Masa Adiposa ──────────────────────────────────────────────────────────────
// Source: Excel C71,D71,E71
// suma6 = tricipital+subescapular+supraespinal+abdominal+muslo_medio_pliegue+pantorrilla_pliegue
// scoreZ = (suma6*(170.18/talla)-116.41)/34.79
// kg    = ((scoreZ*5.85)+25.6)/(170.18/talla)^3
export function calcularMasaAdiposa(suma6, talla) {
  const ratio = 170.18 / talla;
  const scoreZ = (suma6 * ratio - 116.41) / 34.79;
  const kg = ((scoreZ * 5.85) + 25.6) / Math.pow(ratio, 3);
  return { kg, scoreZ };
}

// ── Masa Muscular ─────────────────────────────────────────────────────────────
// Source: Excel C76–J76
// Corrected perimeters: brazo = brazo_relajado - (tricipital*PI/10)
//                       muslo = muslo_maximo   - (muslo_medio_pliegue*PI/10)
//                       pant  = pantorrilla_maxima - (pantorrilla_pliegue*PI/10)
//                       torax = torax_mesoesternal - (subescapular*PI/10)
//                       anteb = antebrazo (uncorrected)
// suma = brazo+anteb+muslo+pant+torax
// scoreZ = (suma*(170.18/talla)-207.21)/13.74
// kg     = ((scoreZ*5.4)+24.5)/(170.18/talla)^3
export function calcularMasaMuscular(perimetros, pliegues, talla) {
  const { brazo_relajado, antebrazo, muslo_maximo, pantorrilla_maxima, torax_mesoesternal } = perimetros;
  const { tricipital, subescapular, muslo_medio_pliegue, pantorrilla_pliegue } = pliegues;
  const brazo = brazo_relajado - (tricipital * PI / 10);
  const muslo = muslo_maximo   - (muslo_medio_pliegue * PI / 10);
  const pant  = pantorrilla_maxima - (pantorrilla_pliegue * PI / 10);
  const torax = torax_mesoesternal - (subescapular * PI / 10);
  const suma  = brazo + antebrazo + muslo + pant + torax;
  const ratio  = 170.18 / talla;
  const scoreZ = (suma * ratio - 207.21) / 13.74;
  const kg     = ((scoreZ * 5.4) + 24.5) / Math.pow(ratio, 3);
  return { kg, scoreZ };
}

// ── Masa Residual ──────────────────────────────────────────────────────────────
// Source: Excel C81–F81  (uses talla_sentado, NOT talla)
// cintura_corr = cintura - (abdominal*PI/10)
// suma = torax_ap + torax_transverso + cintura_corr
// scoreZ = (suma*(89.92/talla_sentado)-109.35)/7.08
// kg     = ((scoreZ*1.24)+6.1)/(89.92/talla_sentado)^3
export function calcularMasaResidual(perimetros, pliegues, talla_sentado) {
  if (!talla_sentado) return { kg: 0, scoreZ: 0 };
  const { cintura, torax_transverso, torax_ap } = perimetros;
  const { abdominal } = pliegues;
  const cintura_corr = cintura - (abdominal * PI / 10);
  const suma  = torax_ap + torax_transverso + cintura_corr;
  const ratio  = 89.92 / talla_sentado;
  const scoreZ = (suma * ratio - 109.35) / 7.08;
  const kg     = ((scoreZ * 1.24) + 6.1) / Math.pow(ratio, 3);
  return { kg, scoreZ };
}

// ── Masa Ósea ──────────────────────────────────────────────────────────────────
// Source: Excel C86–N86
// HEAD: scoreZ_cabeza=(cabeza-56)/1.44  kg_cabeza=(scoreZ*0.18)+1.2
// BODY: suma_diam=biacromial+biliocrestideo+(humeral*2)+(femoral*2)
//       scoreZ_cuerpo=(suma*(170.18/talla)-98.88)/5.33
//       kg_cuerpo=((scoreZ*1.34)+6.7)/(170.18/talla)^3
export function calcularMasaOsea(diametros, perimetros, talla) {
  const { biacromial, biliocrestideo, humeral, femoral } = diametros;
  const { cabeza } = perimetros;
  // Head
  const scoreZ_cabeza = (cabeza - 56) / 1.44;
  const kg_cabeza     = (scoreZ_cabeza * 0.18) + 1.2;
  // Body
  const suma_diam     = biacromial + biliocrestideo + (humeral * 2) + (femoral * 2);
  const ratio         = 170.18 / talla;
  const scoreZ_cuerpo = (suma_diam * ratio - 98.88) / 5.33;
  const kg_cuerpo     = ((scoreZ_cuerpo * 1.34) + 6.7) / Math.pow(ratio, 3);
  return { kg_cabeza, kg_cuerpo, kg_total: kg_cabeza + kg_cuerpo };
}

// ── Ajuste de masas ──────────────────────────────────────────────────────────
// Source: Excel C91–H101
// peso_estructurado = sum of all raw kg
// Each mass adjusted proportionally so total = pesoReal
export function ajustarMasas(masas, pesoReal) {
  const { piel, adiposa, muscular, residual, osea } = masas;
  const osea_total = osea.kg_total ?? (osea.kg_cabeza + osea.kg_cuerpo);
  const pesoEstructurado = piel.kg + adiposa.kg + muscular.kg + residual.kg + osea_total;
  const diferencia = pesoEstructurado - pesoReal;

  const pct = {
    piel:     piel.kg     / pesoEstructurado,
    adiposa:  adiposa.kg  / pesoEstructurado,
    muscular: muscular.kg / pesoEstructurado,
    residual: residual.kg / pesoEstructurado,
    osea:     osea_total  / pesoEstructurado,
  };

  const adj = {
    piel:     { kg: piel.kg     - (diferencia * pct.piel),     pct: pct.piel },
    adiposa:  { kg: adiposa.kg  - (diferencia * pct.adiposa),  pct: pct.adiposa },
    muscular: { kg: muscular.kg - (diferencia * pct.muscular), pct: pct.muscular },
    residual: { kg: residual.kg - (diferencia * pct.residual), pct: pct.residual },
    osea:     { kg: osea_total  - (diferencia * pct.osea),     pct: pct.osea },
  };

  return { ...adj, pesoEstructurado, diferencia };
}

// ── Somatotipo (Heath-Carter) ──────────────────────────────────────────────────
// Source: Excel C111–G111
// Endomorfia: sumaPliegues3 = (tricipital+subescapular+suprailiaco)*170.18/talla
// Mesomorfia: uses brazo_flexionado and pantorrilla_maxima with corrected skinfolds
// Ectomorfia: HWR = talla / peso^(1/3)
export function calcularSomatotipo(pliegues, diametros, perimetros, peso, talla) {
  const { tricipital, subescapular, suprailiaco, pantorrilla_pliegue } = pliegues;
  const { humeral, femoral } = diametros;
  const { brazo_flexionado, pantorrilla_maxima } = perimetros;

  const SP3  = (tricipital + subescapular + suprailiaco) * 170.18 / talla;
  const endo = -0.7182 + (0.1451 * SP3) - (0.00068 * Math.pow(SP3, 2)) + (0.0000014 * Math.pow(SP3, 3));
  const meso = (0.858 * humeral) + (0.601 * femoral)
             + (0.188 * (brazo_flexionado - tricipital / 10))
             + (0.161 * (pantorrilla_maxima - pantorrilla_pliegue / 10))
             - (talla * 0.131) + 4.5;

  const hwr  = talla / Math.pow(peso, 1 / 3);
  const ecto = hwr >= 40.75 ? (0.732 * hwr - 28.58)
             : hwr >= 38.25 ? (0.463 * hwr - 17.63)
             : 0.1;

  return { endo, meso, ecto, X: ecto - endo, Y: (2 * meso) - (endo + ecto) };
}

// ── Índices ────────────────────────────────────────────────────────────────────
// Source: Excel H106, I106
export function calcularIndices(muscularKg, oseaKg, adiposaKg) {
  return {
    muscularOseo:    oseaKg    > 0 ? muscularKg / oseaKg    : null,
    muscularAdiposo: adiposaKg > 0 ? muscularKg / adiposaKg : null,
  };
}

// ── Helper: compute all results from a raw consultation object ─────────────────
// Use this in consultation.js and report.js to avoid duplicating logic.
// `c` is a consultation object with fields matching the Consultas sheet columns.
export function calcularTodo(c, sexo, fechaNac) {
  const edad     = calcularEdad(c.fecha_evaluacion, fechaNac);
  const imc      = calcularIMC(c.peso, c.talla);
  const areaSup  = calcularAreaSuperficial(c.peso, c.talla, sexo, edad);
  const piel     = { kg: calcularMasaPiel(areaSup, sexo) };

  const suma6    = (c.tricipital || 0) + (c.subescapular || 0) + (c.supraespinal || 0)
                 + (c.abdominal || 0) + (c.muslo_medio_pliegue || 0) + (c.pantorrilla_pliegue || 0);
  const adiposa  = calcularMasaAdiposa(suma6, c.talla);

  const muscular = calcularMasaMuscular(
    { brazo_relajado: c.brazo_relajado, antebrazo: c.antebrazo,
      muslo_maximo: c.muslo_maximo, pantorrilla_maxima: c.pantorrilla_maxima,
      torax_mesoesternal: c.torax_mesoesternal },
    { tricipital: c.tricipital, subescapular: c.subescapular,
      muslo_medio_pliegue: c.muslo_medio_pliegue, pantorrilla_pliegue: c.pantorrilla_pliegue },
    c.talla
  );

  const residual = calcularMasaResidual(
    { cintura: c.cintura, torax_transverso: c.torax_transverso, torax_ap: c.torax_ap },
    { abdominal: c.abdominal },
    c.talla_sentado
  );

  const osea = calcularMasaOsea(
    { biacromial: c.biacromial, biliocrestideo: c.biliocrestideo,
      humeral: c.humeral, femoral: c.femoral },
    { cabeza: c.cabeza },
    c.talla
  );

  const masasRaw = { piel, adiposa, muscular, residual, osea };
  const masas    = ajustarMasas(masasRaw, c.peso);

  const soma = calcularSomatotipo(
    { tricipital: c.tricipital, subescapular: c.subescapular,
      suprailiaco: c.suprailiaco, pantorrilla_pliegue: c.pantorrilla_pliegue },
    { humeral: c.humeral, femoral: c.femoral },
    { brazo_flexionado: c.brazo_flexionado, pantorrilla_maxima: c.pantorrilla_maxima },
    c.peso, c.talla
  );

  const indices = calcularIndices(masas.muscular.kg, masas.osea.kg, masas.adiposa.kg);

  return { edad, imc, areaSup, masas, soma, indices };
}
