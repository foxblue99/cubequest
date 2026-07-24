'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

const post = async (url: string, body: any = {}) => {
  const auth = getAuth();
  const h: Record<string,string> = {'Content-Type':'application/json'};
  if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
  const r = await fetch(url, { method:'POST', headers:h, body:JSON.stringify(body) });
  return r.json();
};

export default function MorningBrief() {
  const [brief, setBrief] = useState<string|null>(null);
  const [ability, setAbility] = useState<any>(null);
  const [remind, setRemind] = useState('');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const auth = getAuth();
    if (!auth?.token) return;
    loadBrief();
    loadRemind();
  }, []);

  const loadRemind = async () => {
    try {
      const d = await post('/api/daily-coach/today');
      if (d?.remindMsg) setRemind(d.remindMsg);
    } catch {}
  };

  const loadBrief = async () => {
    const d = await post('/api/ai/daily-brief');
    if (d?.brief) setBrief(d.brief);
  };
  const loadAbility = async () => {
    const d = await post('/api/ai/ability-score');
    if (d?.score) setAbility(d.score);
  };

  if (!hydrated) return null;
  const auth = getAuth();
  if (!auth?.token) return null;

  const radarData = ability ? [
    { name:'Cross', value:ability.cross||0, fullMark:100 },
    { name:'F2L', value:ability.f2l||0, fullMark:100 },
    { name:'OLL', value:ability.oll||0, fullMark:100 },
    { name:'PLL', value:ability.pll||0, fullMark:100 },
    { name:'预判', value:ability.lookahead||0, fullMark:100 },
  ] : null;

  return (
    <div className="relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] overflow-hidden">
      {/* Edge currents */}
      <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out infinite' }} />
      <div className="absolute bottom-0 left-2 right-2 h-px rounded-full opacity-70"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1s infinite' }} />

      <div className="relative z-10 p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">🌅</span>
          <h3 className="font-black text-[11px] tracking-wider bg-gradient-to-r from-amber-300 to-cyan-300 bg-clip-text text-transparent uppercase">
            今日简报
          </h3>
          <Link href="/daily-challenge" className="ml-auto text-[9px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full hover:bg-amber-500/25 transition">
            🔥 神单
          </Link>
        </div>

        {/* Brief text */}
        {brief ? (
          <p className="text-[11px] text-white/60 leading-relaxed mb-3">{brief}</p>
        ) : (
          <p className="text-[11px] text-white/25 italic mb-3">AI教练正在为你准备今日简报...</p>
        )}

        {remind && (
          <p className="text-[11px] text-amber-300/80 mb-3 bg-amber-500/5 rounded-lg px-2 py-1.5">{remind}</p>
        )}

        {/* Mini radar + CTA row */}
        <div className="flex items-end gap-3">
          {radarData ? (
            <div className="w-24 h-24 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis dataKey="name" tick={{fontSize:7,fill:'rgba(255,255,255,0.3)'}} />
                  <Radar dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
          <div className="flex-1 flex flex-col gap-1.5">
            <Link href="/diagnosis" className="text-[10px] text-cyan-400/70 hover:text-cyan-400 transition">
              🔬 详细诊断 →
            </Link>
            <Link href="/coach" className="text-[10px] text-purple-400/70 hover:text-purple-400 transition">
              🧠 AI私教 →
            </Link>
            <Link href="/training/timer" className="text-[10px] text-amber-400/70 hover:text-amber-400 transition">
              ⏱️ 开始训练 →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
