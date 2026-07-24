'use client';

import { useEffect, useRef, useState } from 'react';
import { getAuth } from '@/lib/auth';

interface PBShareProps {
  pbMs: number;
  nickname?: string;
}

export default function PBShareCard({ pbMs, nickname }: PBShareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState('');
  const [radarData, setRadarData] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) return;
    fetch('/api/ai/skill/radar', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json()).then(d => setRadarData(d));
  }, []);

  useEffect(() => {
    if (!radarData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d')!;

    // BG
    const bg = ctx.createLinearGradient(0, 0, 400, 300);
    bg.addColorStop(0, '#020617');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 400, 300);

    // Border glow
    ctx.strokeStyle = 'rgba(56,189,248,0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 380, 280);
    ctx.strokeStyle = 'rgba(168,85,247,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(15, 15, 370, 270);

    // Title
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('🧊 CubeQuest PB 高光时刻', 30, 45);

    // Nickname
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(nickname || '速拧少年', 30, 70);

    // PB time
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 42px monospace';
    const sec = (pbMs / 1000).toFixed(2);
    ctx.fillText(`${sec}s`, 30, 130);

    // Stats row
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    const skills = radarData?.radarData?.slice(0, 4) || [];
    skills.forEach((s: any, i: number) => {
      ctx.fillText(`${s.name}: ${s.value}`, 30 + i * 85, 165);
    });

    // Verification badge
    if (radarData?.confidence > 60) {
      ctx.fillStyle = 'rgba(34,197,94,0.15)';
      ctx.fillRect(290, 40, 80, 22);
      ctx.fillStyle = '#22c55e';
      ctx.font = '10px sans-serif';
      ctx.fillText('✓ 已认证', 300, 55);
    }

    // Growth Score
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`Growth Score: ${radarData?.growthScore || '--'}`, 30, 200);

    // Footer
    ctx.fillStyle = '#475569';
    ctx.font = '9px sans-serif';
    ctx.fillText('cubequest.app · 你的魔方成长伙伴', 30, 250);

    setDataUrl(canvas.toDataURL('image/png'));
  }, [radarData, pbMs, nickname]);

  const download = () => {
    const a = document.createElement('a');
    a.download = `cubequest-pb-${nickname||'solver'}.png`;
    a.href = dataUrl;
    a.click();
  };

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <canvas ref={canvasRef} className="hidden" />
      {dataUrl ? (
        <>
          <img src={dataUrl} alt="PB Share" className="rounded-xl w-64 border border-white/10" />
          <button onClick={download} className="px-4 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/30 transition">
            📥 下载分享卡片
          </button>
        </>
      ) : (
        <div className="text-[10px] text-[var(--color-muted)]">生成中...</div>
      )}
    </div>
  );
}

export function PBShareTrigger() {
  const [pbMs, setPbMs] = useState<number|null>(null);
  useEffect(() => {
    const auth = getAuth();
    if (!auth?.token) return;
    fetch('/api/ai/skill/current', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json()).then((d: any) => { if (d?.pbMs) setPbMs(d.pbMs); });
  }, []);

  if (!pbMs) return null;
  return <PBShareCard pbMs={pbMs} />;
}
