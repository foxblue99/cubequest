'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Hero {
  rank: number; userId: string; nickname: string;
  timeMs: number; timeFormatted: string;
}

export default function DailyHeroes() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);

  useEffect(() => {
    fetch('/api/tribe/daily-heroes').then(r=>r.json()).then(setHeroes);
  }, []);

  useEffect(() => {
    if (!scrollRef.current || heroes.length <= 3) return;
    const el = scrollRef.current;
    const id = setInterval(() => {
      if (paused) return;
      posRef.current += 0.5;
      const max = el.scrollHeight - el.clientHeight;
      if (posRef.current >= max) posRef.current = 0;
      el.scrollTop = posRef.current;
    }, 40);
    return () => clearInterval(id);
  }, [heroes, paused]);

  return (
    <div className="relative w-full h-full"
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>

      <div className="absolute inset-0 rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06]" />

      {/* Edge currents */}
      <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out infinite' }} />
      <div className="absolute bottom-0 left-2 right-2 h-px rounded-full opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1s infinite' }} />

      {/* Inner */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Compact header */}
        <div className="px-3 pt-2 pb-1.5">
          <h3 className="font-black text-[10px] tracking-wider bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
            ⚡ 每日英雄榜 · TOP 10
          </h3>
        </div>

        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        {heroes.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-[10px] text-white/15">🏜️ 等待首位英雄</div>
        ) : (
          <div ref={scrollRef} className="flex-1 overflow-hidden px-2 py-1">
            <div className="space-y-0">
              {heroes.map((h, i) => (
                <Link key={`${h.userId}-${i}`} href={`/tribe/user/${h.userId}`}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md transition-all group hover:bg-white/[0.03]">
                  <span className={`text-[10px] font-black w-4 shrink-0 text-center ${
                    i===0 ? 'text-amber-300' : i===1 ? 'text-slate-300' : i===2 ? 'text-orange-400' : 'text-white/20'
                  }`}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':h.rank}
                  </span>
                  <span className="flex-1 text-[10px] font-medium truncate group-hover:text-amber-300/80 transition-colors">
                    {h.nickname}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/50 shrink-0">
                    {h.timeFormatted}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Fade bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
