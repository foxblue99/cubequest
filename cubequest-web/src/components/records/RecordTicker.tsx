'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RecordTicker() {
  const [records, setRecords] = useState<any[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(()=>{fetch('/api/records').then(r=>r.json()).then(d=>{if(d.length)setRecords(d);});},[]);

  const display = records.length ? records : [
    {id:'t1',cubeType:'三阶',timeFormatted:'3.47s',holderName:'王艺衡',nation:'🇨🇳'},
    {id:'t2',cubeType:'二阶',timeFormatted:'0.43s',holderName:'T. Zajder',nation:'🇵🇱'},
    {id:'t3',cubeType:'四阶',timeFormatted:'16.96s',holderName:'Max Park',nation:'🇺🇸'},
    {id:'t4',cubeType:'三阶均',timeFormatted:'4.54s',holderName:'Max Park',nation:'🇺🇸'},
    {id:'t5',cubeType:'金字塔',timeFormatted:'0.70s',holderName:'S. Kellum',nation:'🇺🇸'},
    {id:'t6',cubeType:'斜转',timeFormatted:'0.86s',holderName:'C. Kucala',nation:'🇺🇸'},
    {id:'t7',cubeType:'五阶',timeFormatted:'33.42s',holderName:'Max Park',nation:'🇺🇸'},
    {id:'t8',cubeType:'SQ1',timeFormatted:'3.53s',holderName:'R. Pilat',nation:'🇺🇸'},
  ];

  // Triple the list for seamless loop
  const items = [...display, ...display, ...display];

  return (
    <Link href="/records" className="block w-full"
      onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)}>
      <div className="relative overflow-hidden py-3" style={{animation:'heroFloat 4s ease-in-out infinite'}}>
        {/* Glass background strip */}
        <div className="absolute inset-0 bg-white/[0.01] backdrop-blur-xl border-y border-white/[0.04]" />
        
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />
        
        {/* Bottom glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />

        {/* Scrolling content */}
        <div className="relative flex" style={{animation:`tickerMarquee ${display.length*4}s linear infinite`,animationPlayState:paused?'paused':'running'}}>
          {items.map((r,i)=>(
            <div key={`${r.id}-${i}`} className="flex items-center gap-3 px-6 shrink-0">
              <span className="text-[10px] font-bold text-cyan-400/60">{r.cubeType}</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">{r.nation}</span>
                <span className="text-sm font-black bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_4px_rgba(251,191,36,0.3)]">
                  {r.timeFormatted}
                </span>
                <span className="text-xs text-white/60 font-medium">{r.holderName}</span>
              </div>
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
