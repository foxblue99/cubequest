'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

const STAGE_BADGES: Record<string, string> = {
  FOUNDATION: '🌱 地基期',
  GROWTH: '🌿 成长期',
  REFINEMENT: '🧩 精进期',
  MASTERY: '💎 大师期',
  ELITE: '👑 精英期',
};

export default function SkillCard() {
  const [data, setData] = useState<any>(null);
  const auth = getAuth();

  useEffect(() => {
    if (!auth?.token) return;
    fetch('/api/ai/skill/radar', {
      headers: { Authorization: `Bearer ${auth.token}` },
    }).then(r => r.ok ? r.json() : {}).then((d:any) => { if (d?.growthScore !== undefined) setData(d); }).catch(() => {});
  }, []);

  if (!data) return null;

  const confColor = data.confidence > 80 ? 'text-green-400' : data.confidence > 50 ? 'text-amber-400' : 'text-white/30';
  const stageLabel = STAGE_BADGES[data.stage] || data.stage;

  return (
    <Link href="/diagnosis" className="block">
      <div className="relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] overflow-hidden hover:border-purple-500/20 transition-colors">
        {/* Edge current */}
        <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-70"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)', animation: 'edgeFlow 2s ease-in-out infinite' }} />

        <div className="relative z-10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs">🧬</span>
            <h3 className="font-black text-[10px] tracking-wider bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
              Growth Score
            </h3>
            <span className={`ml-auto text-[9px] font-mono font-bold ${confColor}`}>
              {data.confidence > 80 ? '✓' : data.confidence > 50 ? '⚠' : '·'} {data.confidence}%
            </span>
          </div>

          <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            {data.growthScore}
          </div>

          <div className="flex items-center gap-3 mt-1 text-[9px]">
            <span className="text-white/30">{stageLabel}</span>
            <span className="text-purple-400/70">最强: {data.strongestSkill?.name}</span>
          </div>

          {/* Mini progress bar */}
          <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
              style={{ width: `${data.growthScore}%` }} />
          </div>
        </div>
      </div>
    </Link>
  );
}
