'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function ActivityCarousel() {
  const [acts, setActs] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.getActivities('ONGOING').then((r: any) => {
      const arr = Array.isArray(r) ? r : [];
      setActs([...arr, ...([] as any[])]);
    });
  }, []);

  useEffect(() => {
    if (acts.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % acts.length), 4000);
    return () => clearInterval(t);
  }, [acts.length]);

  if (acts.length === 0) return null;
  const act = acts[idx];

  return (
    <div className="relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] overflow-hidden group hover:border-cyan-500/20 transition-colors" style={{width:220}}>
      {/* Edge lines */}
      <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-60" style={{background:'linear-gradient(90deg,transparent,rgba(56,189,248,.5),transparent)'}} />
      <div className="absolute top-2 bottom-2 right-0 w-px rounded-full opacity-60" style={{background:'linear-gradient(180deg,transparent,rgba(56,189,248,.5),transparent)'}} />
      <div className="absolute bottom-0 left-2 right-2 h-px rounded-full opacity-60" style={{background:'linear-gradient(90deg,transparent,rgba(168,85,247,.5),transparent)'}} />
      <div className="absolute top-2 bottom-2 left-0 w-px rounded-full opacity-60" style={{background:'linear-gradient(180deg,transparent,rgba(168,85,247,.5),transparent)'}} />
      {/* Corner glows */}
      <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-cyan-400/30 rounded-full blur-sm" />
      <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-purple-400/30 rounded-full blur-sm" />

      <Link href={`/activities/${act.id}`} className="relative z-10 block p-3">
        {act.posterUrl && (
          <img src={act.posterUrl} alt={act.title} className="w-full h-24 object-cover rounded-lg mb-2 opacity-80 group-hover:opacity-100 transition" />
        )}
        <span className="text-[10px] text-amber-400/90 font-bold">
          🏆 官方活动
        </span>
        <h4 className="text-xs font-bold text-white/80 mt-0.5 line-clamp-2">{act.title}</h4>
        {act.description && (
          <p className="text-[10px] text-white/40 mt-0.5 line-clamp-1">{act.description}</p>
        )}
        <div className="flex gap-2 mt-1.5">
          <span className="text-[9px] text-white/25">
            {new Date(act.endAt).toLocaleDateString('zh-CN')} 截止
          </span>
          <span className="text-[9px] text-cyan-400/70 ml-auto">查看详情 →</span>
        </div>
      </Link>

      {/* Dot indicators */}
      {acts.length > 1 && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20">
          {acts.map((_:any, i:number) => (
            <span key={i} onClick={() => setIdx(i)}
              className={`w-1 h-1 rounded-full cursor-pointer transition-all ${i === idx ? 'bg-cyan-400 w-2.5' : 'bg-white/20'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
