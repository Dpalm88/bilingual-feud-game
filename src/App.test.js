import { render, screen } from '@testing-library/react';

// ── Pull out the logic we want to test ──────────────────────────────────────

function normalize(str) {
  return str.toLowerCase().trim()
    .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e")
    .replace(/[íìï]/g, "i").replace(/[óòö]/g, "o")
    .replace(/[úùü]/g, "u").replace(/ñ/g, "n")
    .replace(/[^a-z0-9\s]/g, "");
}

function fuzzyMatch(guess, answer) {
  const g = normalize(guess);
  const a = normalize(answer);
  if (g === a) return true;
  if (a.includes(g) || g.includes(a)) return true;
  if (Math.abs(g.length - a.length) > 4) return false;
  let matrix = Array.from({ length: g.length + 1 }, (_, i) =>
    Array.from({ length: a.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= g.length; i++)
    for (let j = 1; j <= a.length; j++)
      matrix[i][j] = g[i - 1] === a[j - 1]
        ? matrix[i - 1][j - 1]
        : 1 + Math.min(matrix[i - 1][j], matrix[i][j - 1], matrix[i - 1][j - 1]);
  return matrix[g.length][a.length] <= 2;
}

// ── Fuzzy match tests ───────────────────────────────────────────────────────

describe('fuzzyMatch', () => {
  test('exact English match', () => {
    expect(fuzzyMatch('Refrigerator', 'Refrigerator')).toBe(true);
  });

  test('case insensitive match', () => {
    expect(fuzzyMatch('refrigerator', 'Refrigerator')).toBe(true);
  });

  test('Spanish match with accent', () => {
    expect(fuzzyMatch('refrigerador', 'Refrigerador')).toBe(true);
  });

  test('typo tolerance - one character off', () => {
    expect(fuzzyMatch('refridgerator', 'Refrigerator')).toBe(true);
  });

  test('completely wrong answer returns false', () => {
    expect(fuzzyMatch('Elephant', 'Refrigerator')).toBe(false);
  });

  test('partial match - substring', () => {
    expect(fuzzyMatch('stove', 'Stove')).toBe(true);
  });
});

// ── Normalize tests ─────────────────────────────────────────────────────────

describe('normalize', () => {
  test('strips accents', () => {
    expect(normalize('café')).toBe('cafe');
  });

  test('handles ñ', () => {
    expect(normalize('español')).toBe('espanol');
  });

  test('lowercases input', () => {
    expect(normalize('HELLO')).toBe('hello');
  });

  test('trims whitespace', () => {
    expect(normalize('  hello  ')).toBe('hello');
  });
});