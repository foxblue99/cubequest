// Use rubiks-cube-solver (works on Node 24)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const solver = require('rubiks-cube-solver');

/** Convert rubiks-cube-solver output notation to WCA standard */
function toWcaNotation(moves: string): string {
  if (!moves) return '';
  return moves
    .replace(/prime/gi, "'")
    .replace(/\b([FRLUDBfrludb])2\b/gi, "$12");
}

export function solveCube(faceString: string): { solution: string; error?: string } {
  try {
    if (faceString.length !== 54) {
      return { solution: '', error: `需要54个字符，收到${faceString.length}个` };
    }
    const result = solver(faceString);
    if (!result) return { solution: '', error: '求解器未返回结果' };
    const wcaMoves = toWcaNotation(result);
    return { solution: wcaMoves };
  } catch (e: any) {
    console.error('[CubeSolver] Solve failed:', e?.message || e);
    return { solution: '', error: e?.message || '求解失败' };
  }
}
