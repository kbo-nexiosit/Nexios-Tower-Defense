import { compareScores } from './run.js';

// Arcade-style top 10, kept in this browser only.
export const KEY = 'upside-defense-scores';
const MAX = 10;

export function loadBoard(storage) {
  try {
    const v = JSON.parse(storage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter(e => e && typeof e.initials === 'string') : [];
  } catch { return []; }
}

export function saveBoard(storage, board) {
  try { storage.setItem(KEY, JSON.stringify(board)); } catch { /* private window etc. */ }
}

export function qualifies(board, score) {
  if (board.length < MAX) return true;
  return compareScores(score, board[board.length - 1]) < 0;
}

const clean = s => (String(s).toUpperCase().replace(/[^A-Z]/g, '') + 'AAA').slice(0, 3);

export function insertScore(board, { initials, bosses, waves }) {
  const entry = { initials: clean(initials), bosses, waves };
  const next = [...board, entry].sort(compareScores).slice(0, MAX);
  return { board: next, rank: next.indexOf(entry) };
}
