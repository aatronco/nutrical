// js/load-calculator.js
import { SESSIONS, PROGRAM_WEEKS } from './workout-data.js';

export function getT1Sets(session, week) {
  const s = SESSIONS[session];
  if (!s || !s.T1 || !s.T1.byWeek) return [];
  const weekData = s.T1.byWeek[week];
  if (!weekData) return [];
  return [...(weekData.warmup || []), ...(weekData.work || [])];
}

export function getCurrentWeek(programStartDate, weekOverride) {
  if (weekOverride != null) {
    return Math.min(Math.max(parseInt(weekOverride, 10), 1), PROGRAM_WEEKS);
  }
  const start = new Date(programStartDate);
  const now   = new Date();
  const days  = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  const week  = Math.floor(days / 7) + 1;
  return Math.min(Math.max(week, 1), PROGRAM_WEEKS);
}
