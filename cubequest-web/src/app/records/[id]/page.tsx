'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function RecordDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [record, setRecord] = useState<any>(null);

  useEffect(()=>{
    fetch(`/api/records/${id}`)
      .then(r=>r.ok?r.json():null)
      .then(d=>{if(d) setRecord(d); else setError(true);})
      .catch(()=>setError(true));
  },[id]);
  const [error, setError] = useState(false);

  if (!record && !error) return <div className="flex items-center justify-center min-h-[60vh] text-[var(--color-muted)]">加载中...</div>;
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="text-5xl mb-4">🔮</div>
        <div className="text-[var(--color-muted)] mb-2">该纪录详情暂未收录</div>
        <Link href="/records" className="text-sm text-cyan-400 hover:text-cyan-300">← 返回纪录墙</Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/records" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] mb-6 inline-block">← 返回记录墙</Link>

      {/* Hero Card */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent p-8 text-center">
          <div className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/20 flex items-center justify-center text-5xl mb-4 overflow-hidden border-2 border-amber-500/20">
            {record.holderAvatar ? <img src={record.holderAvatar} className="w-full h-full object-cover" /> : record.nation}
          </div>
          <h1 className="text-2xl font-black">{record.holderName}</h1>
          <div className="text-sm text-[var(--color-muted)] mt-1">{record.nation}</div>
          <div className="mt-4">
            <span className="font-mono text-4xl font-black text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">{record.timeFormatted}</span>
          </div>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-xs px-3 py-1 rounded-full bg-amber-500/10 text-amber-400">{record.cubeType}</span>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">{record.eventName}</span>
          </div>
          <div className="text-[10px] text-[var(--color-muted)] mt-3">{new Date(record.setDate).toLocaleDateString('zh-CN')}</div>
        </div>
      </div>

      {/* Bio */}
      {record.holderBio && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
          <h3 className="font-bold mb-3">📖 创造者介绍</h3>
          <p className="text-sm leading-relaxed text-[var(--color-muted)]">{record.holderBio}</p>
        </div>
      )}

      {/* Video */}
      {record.videoUrl && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
          <h3 className="font-bold mb-3">🎬 记录视频</h3>
          <div className="rounded-xl overflow-hidden bg-black">
            <video src={record.videoUrl} controls className="w-full max-h-96" preload="metadata" />
          </div>
        </div>
      )}

      {/* Formula Review */}
      {record.formulaReview && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
          <h3 className="font-bold mb-3">🧩 公式复盘</h3>
          <div className="bg-[var(--color-background)] rounded-xl p-4 font-mono text-sm text-amber-400 whitespace-pre-wrap">
            {record.formulaReview}
          </div>
        </div>
      )}
    </div>
  );
}
