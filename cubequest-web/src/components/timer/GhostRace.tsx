'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';

interface PBSegments {
  crossAt?: number; f2lAt?: number; ollAt?: number; pllAt?: number; finishAt: number;
}

export default function GhostRace({ isRunning, elapsedMs }: { isRunning: boolean; elapsedMs: number }) {
  const [pb, setPb] = useState<PBSegments|null>(null);
  const auth = getAuth();

  useEffect(()=>{
    if(!auth?.token)return;
    fetch('/api/ai/skill/current',{headers:{Authorization:`Bearer ${auth.token}`}})
      .then(r=>r.json())
      .then((d:any)=>{
        if(d?.pbMs){
          setPb({
            crossAt: d.cross || undefined,
            f2lAt: d.f2l || undefined,
            ollAt: d.oll || undefined,
            pllAt: d.pll || undefined,
            finishAt: d.pbMs,
          });
        }
      });
  },[]);

  if(!pb || !isRunning) return null;

  const sec = (elapsedMs/1000).toFixed(2);
  const pbSec = (pb.finishAt/1000).toFixed(2);
  const diff = pb.finishAt - elapsedMs;
  const ahead = diff > 0;

  return (
    <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-xl p-3 mb-2">
      <div className="flex items-center gap-2">
        <span className="text-sm">👻</span>
        <span className="text-[11px] font-bold text-cyan-400">幽灵对战</span>
        <span className="ml-auto text-[10px] font-mono text-white/50">
          {sec}s vs PB {pbSec}s
        </span>
      </div>
      {/* Progress comparison */}
      <div className="mt-2 h-2 rounded-full bg-white/[0.04] overflow-hidden flex">
        <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
          style={{width:`${Math.min(100,(elapsedMs/pb.finishAt)*100)}%`}}/>
        <div className="h-full w-px bg-amber-400" style={{marginLeft:'-1px'}}/> {/* PB marker */}
      </div>
      <div className="text-[10px] mt-1 text-center">
        {ahead
          ? <span className="text-green-400">🔥 比 PB 快 {(diff/1000).toFixed(1)}s</span>
          : <span className="text-amber-400">比 PB 慢 {(-diff/1000).toFixed(1)}s，冲刺！</span>
        }
      </div>
    </div>
  );
}
