/**
 * Fuzzy matcher for the Command Palette.
 * Pure functions — no DOM, no side effects.
 * Deterministic, stable tie-break.
 */

export function subsequenceScore(haystack, needle) {
  const h = String(haystack || '').toLowerCase();
  const n = String(needle || '').toLowerCase();

  if (!n) return { score: 0, matched: false };
  if (!h) return { score: -Infinity, matched: false };

  let score = 0;
  let hIdx = 0;
  let nIdx = 0;
  let lastMatchIdx = -1;
  let consecutiveMatches = 0;
  let maxConsecutive = 0;

  while (hIdx < h.length && nIdx < n.length) {
    if (h[hIdx] === n[nIdx]) {
      // Base match score
      score += 10;

      // Consecutive character bonus
      if (hIdx === lastMatchIdx + 1) {
        consecutiveMatches += 1;
        score += consecutiveMatches * 5;
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      } else {
        consecutiveMatches = 1;
      }

      // Word boundary bonus (preceded by space, dash, underscore, slash, or start of string)
      const prevChar = hIdx > 0 ? h[hIdx - 1] : '';
      if (hIdx === 0 || /\s|[-_\/]/.test(prevChar)) {
        score += 20;
      }

      lastMatchIdx = hIdx;
      nIdx += 1;
    }
    hIdx += 1;
  }

  const matched = nIdx === n.length;

  if (!matched) {
    return { score: -Infinity, matched: false };
  }

  // Prefix bonus: if needle matches the start of haystack
  if (h.startsWith(n)) {
    score += 50;
  }

  // Word boundary bonus for full word matches
  const words = h.split(/\s|[-_\/]/);
  if (words.some(w => w.startsWith(n))) {
    score += 15;
  }

  // Length penalty: prefer shorter matches for same score
  score -= h.length * 0.1;

  return { score, matched: true };
}

export function scoreRow(row, query) {
  const targets = [];

  // Primary: label
  if (row.label) targets.push({ text: row.label, weight: 1.0 });
  // Secondary: description
  if (row.description) targets.push({ text: row.description, weight: 0.5 });
  // Tertiary: id (for exact command matching)
  if (row.id) targets.push({ text: row.id, weight: 0.3 });
  // Keywords/searchable text
  if (row.keywords) targets.push({ text: row.keywords, weight: 0.4 });

  let bestScore = -Infinity;
  let matched = false;

  for (const { text, weight } of targets) {
    const { score, matched: m } = subsequenceScore(text, query);
    if (m) {
      matched = true;
      bestScore = Math.max(bestScore, score * weight);
    }
  }

  // Tie-break: stable sort key from row id
  const tieBreak = row.id ? hashString(row.id) : 0;

  return { score: matched ? bestScore : -Infinity, matched, tieBreak };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  return Math.abs(hash) / 0xffffffff; // Normalize to [0, 1)
}

export function rankRows(rows, query) {
  if (!query || !query.trim()) {
    return rows.map((row, idx) => ({ row, score: 1000 - idx, matched: true, tieBreak: idx }));
  }

  const scored = rows
    .map(row => {
      const { score, matched, tieBreak } = scoreRow(row, query.trim());
      return { row, score, matched, tieBreak };
    })
    .filter(item => item.matched)
    .sort((a, b) => {
      // Primary: score descending
      if (b.score !== a.score) return b.score - a.score;
      // Secondary: tieBreak ascending (stable)
      return a.tieBreak - b.tieBreak;
    });

  return scored;
}

export function emptyResult() {
  return [];
}

export default {
  subsequenceScore,
  scoreRow,
  rankRows,
  emptyResult,
};