// js/athletes.js
// Multi-athlete management for the GZCLP workout app.
// Each athlete has their own program start date and PR records in localStorage.

const STORE_KEY = 'gzclp_athletes';
const ACTIVE_KEY = 'gzclp_active_athlete';

export const DEFAULT_ATHLETES = [
  {
    id: 'alejandro',
    name: 'Alejandro',
    icon: '🏋️',
    prBase: { banca: 125, deadlift: 140, pullups: 6 },
  },
];

export function getAthletes() {
  const stored = localStorage.getItem(STORE_KEY);
  if (!stored) {
    localStorage.setItem(STORE_KEY, JSON.stringify(DEFAULT_ATHLETES));
    return DEFAULT_ATHLETES;
  }
  return JSON.parse(stored);
}

export function getActiveAthleteId() {
  return localStorage.getItem(ACTIVE_KEY) || DEFAULT_ATHLETES[0].id;
}

export function getActiveAthlete() {
  const id = getActiveAthleteId();
  return getAthletes().find(a => a.id === id) || getAthletes()[0];
}

export function setActiveAthlete(id) {
  localStorage.setItem(ACTIVE_KEY, id);
}

export function saveAthlete(athlete) {
  const athletes = getAthletes();
  const idx = athletes.findIndex(a => a.id === athlete.id);
  if (idx >= 0) athletes[idx] = athlete;
  else athletes.push(athlete);
  localStorage.setItem(STORE_KEY, JSON.stringify(athletes));
}

export function deleteAthlete(id) {
  const athletes = getAthletes().filter(a => a.id !== id);
  localStorage.setItem(STORE_KEY, JSON.stringify(athletes));
  if (getActiveAthleteId() === id) setActiveAthlete(athletes[0]?.id || '');
}

// Per-athlete localStorage keys (prefix with athlete ID)
export function athleteKey(athleteId, suffix) {
  return `gzclp_${athleteId}_${suffix}`;
}

export function getAthletePRs(athleteId) {
  const stored = localStorage.getItem(athleteKey(athleteId, 'prs'));
  if (stored) return JSON.parse(stored);
  const athlete = getAthletes().find(a => a.id === athleteId);
  return athlete?.prBase || {};
}

export function setAthletePRs(athleteId, prs) {
  localStorage.setItem(athleteKey(athleteId, 'prs'), JSON.stringify(prs));
  // Keep legacy key in sync for the active athlete
  if (athleteId === getActiveAthleteId()) {
    localStorage.setItem('gzclp_prs', JSON.stringify(prs));
  }
}

export function getAthleteProgramStart(athleteId) {
  return localStorage.getItem(athleteKey(athleteId, 'start'))
    || localStorage.getItem('gzclp_program_start')
    || new Date().toISOString().slice(0,10);
}

export function setAthleteProgramStart(athleteId, date) {
  localStorage.setItem(athleteKey(athleteId, 'start'), date);
  if (athleteId === getActiveAthleteId()) {
    localStorage.setItem('gzclp_program_start', date);
  }
}
