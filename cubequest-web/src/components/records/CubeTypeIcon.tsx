'use client';

/** Mini cube icon for record cards — 2x2/3x3/4x4/5x5 etc. */
const CUBE_ICONS: Record<string, number[][]> = {
  '二阶魔方': [[1,1],[1,1]],
  '三阶魔方': [[1,1,1],[1,1,1],[1,1,1]],
  '四阶魔方': [[1,1,1,1],[1,1,1,1],[1,1,1,1],[1,1,1,1]],
  '五阶魔方': [[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1],[1,1,1,1,1]],
  '金字塔':  [[0,0,1,0,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,1,1,1,1]],
  '斜转':    [[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0],[1,0,1,0,1],[0,1,0,1,0]],
  'SQ1':     [[1,1,1,1],[0,1,1,0],[0,1,1,0],[1,1,1,1]],
};

const COLORS = ['#FFD500','#B90000','#FF5900','#009B48','#0046AD','#FFFFFF','#FF8C00'];

export default function CubeTypeIcon({ cubeType, size=48 }: { cubeType: string; size?: number }) {
  const grid = CUBE_ICONS[cubeType];
  if (!grid) return <span className="text-2xl">🧊</span>;

  const rows = grid.length;
  const cols = grid[0].length;
  const cellSize = size / Math.max(rows, cols);

  // Use deterministic color seeding
  const seed = cubeType.split('').reduce((a,c)=>a+c.charCodeAt(0),0);

  return (
    <div className="relative shrink-0" style={{width:size,height:size}}>
      {/* Glow behind */}
      <div className="absolute -inset-1 bg-cyan-400/10 rounded-lg blur-sm" />
      <div className="relative rounded-lg overflow-hidden border border-white/10" style={{width:size,height:size}}>
        <div className="grid" style={{gridTemplateColumns:`repeat(${cols},1fr)`}}>
          {grid.flat().map((cell,i)=>{
            if (!cell) return <div key={i} style={{width:cellSize,height:cellSize}} />;
            const ci = (i+seed) % COLORS.length;
            return (
              <div key={i} style={{
                width:cellSize, height:cellSize,
                background:COLORS[ci],
                border:'0.5px solid rgba(0,0,0,0.3)',
              }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}
