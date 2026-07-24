/**
 * International standard 3x3 scramble generator
 * Supports: U D L R F B / M E S / r l u d f b / x y z
 * + ' (counter-clockwise) / 2 (double)
 */

// Basic faces
const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const;
// Slice moves
const SLICES = ['M', 'E', 'S'] as const;
// Wide (double-layer) moves  
const WIDES = ['r', 'l', 'u', 'd', 'f', 'b'] as const;
// Cube rotations
const ROTATIONS = ['x', 'y', 'z'] as const;
// All moves
const ALL_MOVES = [...FACES, ...SLICES, ...WIDES, ...ROTATIONS] as const;
const SUFFIXES = ['', "'", '2'] as const;

type Move = (typeof ALL_MOVES)[number];

// Axis groups for scramble validity
const AXIS_MAP: Record<string, string> = {
  U: 'UD', u: 'UD', D: 'UD', d: 'UD', E: 'UD', y: 'UD',
  R: 'RL', r: 'RL', L: 'RL', l: 'RL', M: 'RL', x: 'RL',
  F: 'FB', f: 'FB', B: 'FB', b: 'FB', S: 'FB', z: 'FB',
};

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate a WCA-style scramble with optional extended moves
 */
export function generateScramble(
  length: number = 20, 
  includeExtras: boolean = false
): string {
  const pool = includeExtras ? [...FACES, ...WIDES, ...SLICES] : [...FACES];
  const moves: string[] = [];
  let lastFace = '';
  let lastAxis = '';

  while (moves.length < length) {
    const face = randomItem(pool);
    const axis = AXIS_MAP[face];

    if (face === lastFace) continue;
    if (axis === lastAxis) continue;

    const suffix = randomItem(SUFFIXES);
    moves.push(face + suffix);
    lastFace = face;
    lastAxis = axis;
  }

  return moves.join(' ');
}

/**
 * WCA 2x2 scramble: only R, U, F moves (no D/L/B needed)
 */
export function generate2x2Scramble(length: number = 10): string {
  const FACES2 = ['U', 'R', 'F'] as const;
  const moves: string[] = [];
  let last = '';
  while (moves.length < length) {
    const face = randomItem(FACES2);
    if (face === last) continue;
    const suffix = randomItem(SUFFIXES);
    moves.push(face + suffix);
    last = face;
  }
  return moves.join(' ');
}

export function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return 'DNF';
  if (ms === Infinity) return 'DNF';
  return (ms / 1000).toFixed(2);
}

/**
 * Parse move string to array of tokens
 * Supports: U, D, L, R, F, B, M, E, S, r, l, u, d, f, b, x, y, z
 * With modifiers: ' (prime), 2 (double)
 * Also supports Rw/Lw/Uw/Dw/Fw/Bw aliases -> r/l/u/d/f/b
 */
export function parseMoves(movesStr: string): string[] {
  if (!movesStr) return [];
  // Normalize Rw→r, Lw→l, etc
  const normalized = movesStr
    .replace(/\bRw\b/gi, 'r')
    .replace(/\bLw\b/gi, 'l')
    .replace(/\bUw\b/gi, 'u')
    .replace(/\bDw\b/gi, 'd')
    .replace(/\bFw\b/gi, 'f')
    .replace(/\bBw\b/gi, 'b');
  return normalized.trim().split(/\s+/).filter(Boolean);
}
