'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';

interface PBData {
  pbMs: number;
  avgCross: number;
  avgF2l: number;
  avgOll: number;
  avgPll: number;
}

export default function GhostIndicator() {
  const [pb, setPb] = useState<PBData|null>(null);
  const auth = getAuth();

  useEffect(()=>{
    if(!auth?.token)return;
    fetch('/api/ai/ability-score',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth.token}`},body:'{}'})
      .then(r=>r.json())
      .then((d:any)=>{
        if(d?.growth?.pbHistory){
          const h = JSON.parse(d.growth.pbHistory);
          if(Array.isArray(h)&&h.length>0){
            const segments=d.score||{};
            setPb({
              pbMs: h[0].timeMs||h[0],
              avgCross: segments.cross?Math.round(segments.cross):0,
              avgF2l: segments.f2l?Math.round(segments.f2l):0,
              avgOll: segments.oll?Math.round(segments.oll):0,
              avgPll: segments.pll?Math.round(segments.pll):0,
            });
          }
        }
      });
  },[]);

  if(!pb) return null;
  const pbSec = (pb.pbMs/1000).toFixed(2);

  return (
    <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">👻</span>
        <span className="text-[11px] font-bold text-cyan-400">幽灵对战</span>
        <span className="text-[10px] text-[var(--color-muted)] ml-auto">目标 PB: {pbSec}s</span>
      </div>
      {pb.avgCross > 0 && (
        <div className="grid grid-cols-4 gap-1 text-center">
          {[
            {label:'Cross',ms:pb.avgCross},
            {label:'F2L',ms:pb.avgF2l},
            {label:'OLL',ms:pb.avgOll},
            {label:'PLL',ms:pb.avgPll},
          ].map(s=>(
            <div key={s.label} className="bg-white/[0.02] rounded-lg py-1 px-1">
              <div className="text-[8px] text-[var(--color-muted)]">{s.label}</div>
              <div className="text-[10px] font-mono text-cyan-300">{(s.ms/1000).toFixed(1)}s</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
