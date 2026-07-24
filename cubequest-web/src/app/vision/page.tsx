'use client';

import { useState, useRef, useEffect } from 'react';
import Cube3D from '@/components/cube/Cube3D';

const FACES = ['U','R','F','D','L','B'] as const;
const FACE_LABELS: Record<string,string> = {U:'顶面黄',R:'右面红',F:'前面绿',D:'底面白',L:'左面橙',B:'后面蓝'};

const TARGET_COLORS: Record<string,[number,number,number]> = {
  W: [255,255,255], Y: [255,213,0], R: [185,0,0], O: [255,89,0], G: [0,155,72], B: [0,70,173],
};

/** Classify an RGB pixel to the closest cube color */
function classifyColor(r: number, g: number, b: number): string {
  let best = 'W', bestDist = Infinity;
  for (const [key, [tr, tg, tb]] of Object.entries(TARGET_COLORS)) {
    const dist = (r-tr)**2 + (g-tg)**2 + (b-tb)**2;
    if (dist < bestDist) { bestDist = dist; best = key; }
  }
  return best;
}

/** Sample a 3x3 grid from a canvas image region */
function sampleGrid(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): string[][] {
  const grid: string[][] = [];
  const cellSize = size / 3;
  const offset = cellSize * 0.35;
  for (let row = 0; row < 3; row++) {
    const rowColors: string[] = [];
    for (let col = 0; col < 3; col++) {
      const px = Math.floor(x + col * cellSize + offset);
      const py = Math.floor(y + row * cellSize + offset);
      const [r, g, b] = ctx.getImageData(px, py, 1, 1).data;
      rowColors.push(classifyColor(r, g, b));
    }
    grid.push(rowColors);
  }
  return grid;
}

export default function VisionPage() {
  const [image, setImage] = useState<string | null>(null);
  const [faces, setFaces] = useState<Record<string,string[][]>>({});
  const [currentFace, setCurrentFace] = useState<string>('U');
  const [solution, setSolution] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0); // 0=select, 1=scanning, 2=result
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleImage = (file: File) => {
    const url = URL.createObjectURL(file);
    setImage(url);
    setError('');
  };

  const captureFace = () => {
    if (!image || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const size = Math.min(imgRef.current.width, imgRef.current.height);
    canvas.width = size; canvas.height = size;
    ctx.drawImage(imgRef.current, 0, 0, size, size);
    const grid = sampleGrid(ctx, 0, 0, size);
    setFaces(prev => ({...prev, [currentFace]: grid}));
    // Next face
    const idx = FACES.indexOf(currentFace as any);
    if (idx < 5) {
      setCurrentFace(FACES[idx + 1]);
    } else {
      setStep(1);
    }
  };

  const solve = async () => {
    setLoading(true); setError('');
    try {
      // Build cube string in rubiks-cube-solver format (face order: front right up down left back)
      // Colors: f=green, r=red, u=white, d=yellow, l=orange, b=blue
      const colorMap: Record<string,string> = {W:'u', Y:'d', R:'r', O:'l', G:'f', B:'b'};
      // Face order for rubiks-cube-solver: front, right, up, down, left, back
      const faceOrder = ['F','R','U','D','L','B'];
      let cubeStr = '';
      for (const f of faceOrder) {
        const grid = faces[f];
        if (!grid) { setError(`缺少${FACE_LABELS[f]}面数据`); setLoading(false); return; }
        for (const row of grid) for (const c of row) cubeStr += colorMap[c] || 'W';
      }

      // Call backend cubejs solver
      const res = await fetch('/api/records/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cubeStr }),
      });
      const data = await res.json();
      if (data.solution) {
        setSolution(data.solution);
        setStep(2);
      } else {
        setError(data.error || '求解失败');
      }
    } catch (e: any) {
      setError(e?.message || '求解失败');
    }
    setLoading(false);
  };

  const reset = () => {
    setImage(null); setFaces({}); setCurrentFace('U'); setSolution(''); setStep(0); setError('');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tighter mb-2">📸 魔方视觉</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">拍照识别魔方 → AI 求解 → 3D 动画演示</p>

      {/* Step 0: Upload & scan */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="p-8 border-2 border-dashed border-[var(--color-border)] rounded-2xl text-center cursor-pointer hover:border-cyan-400/40 transition-colors"
            onClick={()=>document.getElementById('fileInput')?.click()}>
            {!image ? (
              <div>
                <div className="text-4xl mb-2">📷</div>
                <div className="font-bold mb-1">点击或拖拽上传魔方照片</div>
                <div className="text-xs text-[var(--color-muted)]">依次拍摄 6 个面</div>
              </div>
            ) : (
              <div>
                <img ref={imgRef} src={image} onLoad={()=>{}} className="max-h-64 mx-auto rounded-xl" alt="Cube face" />
                <div className="mt-3 font-bold text-cyan-400">{FACE_LABELS[currentFace]}</div>
                <div className="text-xs text-[var(--color-muted)]">{Object.keys(faces).length}/6 面已采集</div>
              </div>
            )}
          </div>
          <input id="fileInput" type="file" accept="image/*" className="hidden"
            onChange={e=>{const f=e.target.files?.[0];if(f)handleImage(f);}} />
          <canvas ref={canvasRef} className="hidden" />

          {image && (
            <div className="flex gap-3">
              <button onClick={captureFace} className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-bold text-sm hover:bg-cyan-400 transition">
                📸 采集当前面 ({Object.keys(faces).length}/6)
              </button>
              <button onClick={()=>setImage(null)} className="py-3 px-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">重选</button>
            </div>
          )}

          {/* Face preview dots */}
          {Object.keys(faces).length > 0 && (
            <div className="flex gap-2 justify-center">
              {FACES.map(f=>(<div key={f} className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border ${faces[f]?'bg-cyan-500/20 border-cyan-500/40 text-cyan-400':'border-[var(--color-border)] text-[var(--color-muted)]'}`}>{f}</div>))}
            </div>
          )}
        </div>
      )}

      {/* Step 1: Solving */}
      {step === 1 && (
        <div className="text-center py-12 space-y-4">
          <div className="text-5xl mb-4">🧩</div>
          <h3 className="font-bold">6 面采集完成</h3>
          <div className="text-sm text-[var(--color-muted)]">请检查色块识别结果</div>

          {/* Color grid preview */}
          <div className="flex flex-wrap gap-4 justify-center">
            {FACES.map(f=>(
              <div key={f} className="text-center">
                <div className="text-[10px] text-[var(--color-muted)] mb-1">{FACE_LABELS[f]}</div>
                <div className="grid grid-cols-3 gap-0.5">
                  {(faces[f]||[]).flat().map((c,i)=>(
                    <div key={i} className="w-5 h-5 rounded-sm" style={{background: {W:'#fff',Y:'#facc15',R:'#dc2626',O:'#f97316',G:'#16a34a',B:'#2563eb'}[c]||'#333'}}/>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={solve} disabled={loading} className="px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
              {loading?'⏳ 求解中...':'🚀 开始求解'}
            </button>
            <button onClick={reset} className="px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm">重来</button>
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </div>
      )}

      {/* Step 2: Show solution */}
      {step === 2 && solution && (
        <div className="text-center space-y-6">
          <div className="text-5xl mb-2">✅</div>
          <h3 className="font-bold">最优解法</h3>
          <div className="font-mono text-lg bg-[var(--color-background)] rounded-xl py-4 px-6 border border-[var(--color-border)] inline-block">
            {solution}
          </div>
          <div className="text-xs text-[var(--color-muted)]">共 {solution.split(' ').length} 步</div>

          {/* 3D Player */}
          <div style={{width:280,height:280,margin:'0 auto'}}>
            <Cube3D moves={solution} autoPlay showControls={false} />
          </div>

          <button onClick={reset} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:opacity-90">
            🔄 重新识别
          </button>
        </div>
      )}
    </div>
  );
}
