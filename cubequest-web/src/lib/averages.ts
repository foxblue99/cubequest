/**
 * ao5 / ao12 Calculator
 *
 * WCA Rules:
 * - ao5: last 5 results, drop best & worst, average remaining 3
 * - ao12: last 12 results, drop best & worst, average remaining 10
 * - DNF counts as Infinity (worst possible)
 * - +2 adds 2000ms before any calculation
 */

import type { SolveResult } from '@/types';
import { Penalty } from '@/types';

export interface AvgInput {
  timeMs: number | null;
  penalty: Penalty;
}

function getEffectiveTime(r: AvgInput): number {
  if (r.penalty === Penalty.DNF || r.timeMs === null) return Infinity;
  if (r.penalty === Penalty.PLUS_TWO) return r.timeMs + 2000;
  return r.timeMs;
}

export function calcAverage(
  results: AvgInput[],
  count: number
): number | 'DNF' | null {
  if (results.length < count) return null;

  const recent = results.slice(0, count);
  const values = recent.map(getEffectiveTime);

  // Sort ascending
  const sorted = [...values].sort((a, b) => a - b);

  // Drop best and worst (first and last)
  const trimmed = sorted.slice(1, -1);

  if (trimmed.includes(Infinity)) return 'DNF';

  const sum = trimmed.reduce((a, b) => a + b, 0);
  return Math.round(sum / trimmed.length);
}

export function calcAo5(results: AvgInput[]): number | 'DNF' | null {
  return calcAverage(results, 5);
}

export function calcAo12(results: AvgInput[]): number | 'DNF' | null {
  return calcAverage(results, 12);
}

/**
 * Calculate all stats from a list of results
 */
export function calcStats(
  results: AvgInput[]
): {
  best: number | null;
  ao5: number | 'DNF' | null;
  ao12: number | 'DNF' | null;
  count: number;
} {
  const validResults = results
    .filter((r) => r.penalty !== Penalty.DNF && r.timeMs !== null)
    .map(getEffectiveTime);

  return {
    best: validResults.length > 0 ? Math.min(...validResults) : null,
    ao5: calcAo5(results),
    ao12: calcAo12(results),
    count: results.length,
  };
}
