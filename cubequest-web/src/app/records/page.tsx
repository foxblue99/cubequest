'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CubeTypeIcon from '@/components/records/CubeTypeIcon';

interface WR {
  id: string; cubeType: string; eventName: string; timeFormatted: string;
  holderName: string; holderAvatar?: string; nation: string;
  pbFormatted?: string; subFormatted?: string;
}

// Static showcase records
const SHOWCASE: WR[] = [
  { id:'1', cubeType:'三阶魔方', eventName:'单次WR', timeFormatted:'3.47s', holderName:'王艺衡', nation:'🇨🇳', pbFormatted:'3.47s', subFormatted:'5.12s' },
  { id:'2', cubeType:'二阶魔方', eventName:'单次WR', timeFormatted:'0.43s', holderName:'Teodor Zajder', nation:'🇵🇱', pbFormatted:'0.43s', subFormatted:'1.05s' },
  { id:'3', cubeType:'四阶魔方', eventName:'单次WR', timeFormatted:'16.96s', holderName:'Max Park', nation:'🇺🇸', pbFormatted:'16.96s', subFormatted:'20.11s' },
  { id:'4', cubeType:'三阶魔方', eventName:'平均WR', timeFormatted:'4.54s', holderName:'Max Park', nation:'🇺🇸', pbFormatted:'3.89s', subFormatted:'4.54s' },
  { id:'5', cubeType:'金字塔', eventName:'单次WR', timeFormatted:'0.70s', holderName:'Simon Kellum', nation:'🇺🇸', pbFormatted:'0.70s', subFormatted:'1.50s' },
  { id:'6', cubeType:'斜转', eventName:'单次WR', timeFormatted:'0.86s', holderName:'Carter Kucala', nation:'🇺🇸', pbFormatted:'0.86s', subFormatted:'1.89s' },
  { id:'7', cubeType:'五阶魔方', eventName:'单次WR', timeFormatted:'33.42s', holderName:'Max Park', nation:'🇺🇸', pbFormatted:'33.42s', subFormatted:'37.56s' },
  { id:'8', cubeType:'SQ1', eventName:'单次WR', timeFormatted:'3.53s', holderName:'Ryan Pilat', nation:'🇺🇸', pbFormatted:'3.53s', subFormatted:'5.67s' },
];

const CUBE_COLORS = ['#FFD500','#B90000','#FF5900','#009B48','#0046AD','#FFFFFF'];

export default function RecordsPage() {
  const [records, setRecords] = useState<WR[]>(SHOWCASE);
  const [hovered, setHovered] = useState<string|null>(null);
  const [ready, setReady] = useState(false);

  useEffect(()=>{
    setReady(true);
    fetch('/api/records').then(r=>r.json()).then(d=>{if(d.length)setRecords(d);});
  },[]);

  if (!ready) return null;

  const len = records.length;

  return (
    <div className="min-h-screen relative overflow-hidden" style={{background:'radial-gradient(ellipse at center, #0a0e27 0%, #020617 70%)'}}>
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({length:60}).map((_,i)=>(
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width:Math.random()*3+1+'px', height:Math.random()*3+1+'px',
              left:Math.random()*100+'%', top:Math.random()*100+'%',
              opacity:Math.random()*0.5+0.2,
              animation:`twinkle ${Math.random()*3+2}s ease-in-out ${Math.random()*2}s infinite`,
            }} />
        ))}
      </div>

      {/* Blue Crystal Planet */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{animation:'planetSpin 40s linear infinite'}}>
        <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-500/10 via-cyan-400/5 to-purple-500/10 blur-sm"
          style={{boxShadow:'0 0 120px rgba(56,189,248,0.1), 0 0 240px rgba(56,189,248,0.05), inset 0 0 120px rgba(56,189,248,0.05)'}} />
        {/* Planet rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[80px] rounded-full border border-cyan-400/10"
          style={{transform:'rotateX(75deg)'}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[60px] rounded-full border border-blue-400/5"
          style={{transform:'rotateX(75deg)'}} />
      </div>

      {/* Header */}
      <div className="relative z-20 text-center pt-16 pb-8">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(56,189,248,0.3)]">
          🏆 魔神之巅
        </h1>
        <p className="text-cyan-400/50 mt-3 text-sm tracking-widest">THE HALL OF SPEED GODS</p>
      </div>

      {/* Crystal Cards Orbit */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 pb-24">
        {/* Orbit ring label */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-xs text-cyan-400/60">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            世界纪录殿堂
          </div>
        </div>

        {/* Cards Grid with float animation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {records.map((r,i) => {
            const color = CUBE_COLORS[i % CUBE_COLORS.length];
            const delay = i * 0.15;
            return (
              <Link key={r.id} href={`/records/${r.id}`}
                className="group relative"
                onMouseEnter={()=>setHovered(r.id)} onMouseLeave={()=>setHovered(null)}
                style={{animation:`cardFloat ${3+i*0.3}s ease-in-out ${delay}s infinite`}}>
                
                {/* Crystal frame glow */}
                <div className="absolute -inset-[1px] rounded-2xl opacity-40 transition-opacity duration-500 group-hover:opacity-80"
                  style={{background:`linear-gradient(135deg, ${color}40, transparent 40%, ${color}20 60%, transparent)`}} />
                
                {/* Card body */}
                <div className="relative rounded-2xl bg-[#0a0e27]/80 backdrop-blur-xl border border-white/5 p-5 transition-all duration-300 group-hover:scale-[1.02] group-hover:border-white/10"
                  style={{boxShadow:'0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)'}}>
                  
                  {/* Top accent bar */}
                  <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xl overflow-hidden border border-white/5">
                        <img src={`https://api.dicebear.com/9.x/avataaars/svg?seed=${r.holderName}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-br from-cyan-400/30 to-transparent -z-10 blur-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate group-hover:text-cyan-300 transition-colors">{r.holderName}</div>
                      <div className="text-[10px] text-white/30">{r.nation} · {r.cubeType}</div>
                    </div>
                    <CubeTypeIcon cubeType={r.cubeType} size={36} />
                  </div>

                  {/* Record display */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-white/30">{r.eventName}</span>
                      <span className="font-mono text-lg font-black text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)] group-hover:drop-shadow-[0_0_16px_rgba(251,191,36,0.5)] transition-all">
                        {r.timeFormatted}
                      </span>
                    </div>
                    {r.pbFormatted && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/20">个人PB</span>
                        <span className="font-mono text-xs text-white/50">{r.pbFormatted}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom cube type badge */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-white/30">{r.cubeType}</span>
                    <div className="flex gap-1">
                      {CUBE_COLORS.slice(0,3).map((c,j)=>(
                        <div key={j} className="w-1.5 h-1.5 rounded-sm" style={{background:c, opacity:0.4}} />
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom planet orbit line */}
        <div className="mt-16 flex justify-center">
          <div className="w-64 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />
        </div>
        <p className="text-center text-[10px] text-white/10 mt-4 tracking-widest">RECORDS ARE MADE TO BE BROKEN</p>
      </div>

      <style>{`
        @keyframes planetSpin { 0%{transform:translate(-50%,-50%) rotate(0deg)} 100%{transform:translate(-50%,-50%) rotate(360deg)} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}
