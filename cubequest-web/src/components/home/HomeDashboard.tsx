'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import DailyCoachCard from './DailyCoachCard';
import MorningBrief from './MorningBrief';

const EdgeLines = () => <>
  <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out infinite' }} />
  <div className="absolute top-2 bottom-2 right-0 w-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 0.5s infinite' }} />
  <div className="absolute bottom-0 left-2 right-2 h-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1s infinite' }} />
  <div className="absolute top-2 bottom-2 left-0 w-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1.5s infinite' }} />
  <div className="absolute top-0 left-0 w-2 h-2 bg-cyan-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out infinite'}} />
  <div className="absolute top-0 right-0 w-2 h-2 bg-cyan-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out .7s infinite'}} />
  <div className="absolute bottom-0 right-0 w-2 h-2 bg-cyan-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out 1.3s infinite'}} />
  <div className="absolute bottom-0 left-0 w-2 h-2 bg-cyan-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out .3s infinite'}} />
</>;

function fmtMs(ms: number | null | undefined): string {
  if (!ms) return '--';
  return (ms / 1000).toFixed(2) + 's';
}

export default function HomeDashboard() {
  const [growth, setGrowth] = useState<any>(null);
  const [profile, setProfile] = useState<{pbMs:number|null; avgMs:number|null} | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const auth = getAuth();

  useEffect(()=>{setHydrated(true);if(auth){loadGrowth();loadProfile();}},[]);
  const loadGrowth = async()=>{
    try {
      const r=await fetch('/api/ai/growth',{method:'POST',headers:{'Content-Type':'application/json'}});
      setGrowth(await r.json());
    } catch {}
  };
  const loadProfile = async()=>{
    try {
      const h: Record<string,string> = {'Content-Type':'application/json'};
      if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
      const r=await fetch('/api/ai/profile',{method:'POST',headers:h});
      const d=await r.json();
      if(d?.analysis) setProfile({pbMs:d.analysis.pbMs, avgMs:d.analysis.avgMs});
    } catch {}
  };

  if (!hydrated||!auth) return null;
  const user = auth.user;

  return (
    <div className="flex flex-col gap-2 w-full">
      <MorningBrief />

      <div className="relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] overflow-hidden">
        <EdgeLines />
        <div className="relative z-10 p-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-bold bg-gradient-to-r from-cyan-300 to-purple-400 bg-clip-text text-transparent truncate">
              👋 {user.nickname}
            </span>
            {profile && (
              <span className="flex items-center gap-1.5 ml-auto">
                <span className="text-[9px] text-amber-400/80 font-mono" title="至今PB">
                  🏆 {fmtMs(profile.pbMs)}
                </span>
                <span className="text-[9px] text-white/30 font-mono" title="日常Sub">
                  ⚡ {fmtMs(profile.avgMs)}
                </span>
              </span>
            )}
          </div>
          {growth && (
            <div className="mt-1.5">
              <div className="flex justify-between text-[10px] text-white/40 mb-0.5">
                <span className="font-bold text-cyan-400 text-[10px]">{growth.title}</span>
                <span className="text-white/30 text-[10px]">Lv{growth.level}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{width:`${growth.progress || 0}%`}} />
              </div>
            </div>
          )}
          <div className="flex gap-1 mt-2">
            {[
              {href:'/coach',label:'🧠 私教'},
              {href:'/training/timer',label:'⏱ 训练'},
              {href:'/tribe',label:'🏔 部落'},
            ].map(l=>(
              <Link key={l.href} href={l.href}
                className="flex-1 text-center py-0.5 rounded text-[10px] bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition text-white/50">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <DailyCoachCard />
    </div>
  );
}
