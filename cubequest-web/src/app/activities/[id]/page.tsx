'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [act, setAct] = useState<any>(null);
  const [lb, setLb] = useState<any[]>([]);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    api.getActivity(id).then(setAct).catch(() => setAct(null));
    api.getActivityLeaderboard(id).then((r: any) => setLb(r)).catch(() => setLb([]));
  }, [id]);

  if (!act) return <div className="p-6 text-sm text-[var(--color-muted)]">活动不存在或加载中...</div>;

  const statusLabel: Record<string,string> = {
    UPCOMING: '即将开始', ONGOING: '🔥 进行中', REVIEW_BUFFER: '审核中', CLOSED: '已结束',
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          act.status === 'ONGOING' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/[0.04] text-white/30'
        }`}>{statusLabel[act.status]}</span>
        <h1 className="text-3xl font-black">{act.title}</h1>
      </div>
      {act.description && <p className="text-sm text-white/40 mb-4">{act.description}</p>}
      {act.posterUrl && (
        <img src={act.posterUrl} alt={act.title} onClick={() => setPreview(true)}
          className="w-full max-h-72 object-cover rounded-xl mb-6 border border-white/[0.06] cursor-pointer hover:opacity-90 transition" />
      )}

      {/* Fullscreen poster preview */}
      {preview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreview(false)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white text-lg hover:bg-white/20 transition" onClick={() => setPreview(false)}>✕</button>
          <img src={act.posterUrl} alt={act.title} className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
      <div className="flex gap-4 text-xs text-white/30 mb-6">
        <span>📅 {new Date(act.startAt).toLocaleString('zh-CN')} — {new Date(act.endAt).toLocaleString('zh-CN')}</span>
        <span>{act.requiresVideo ? '📹 需视频验证' : '无视频要求'}</span>
      </div>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
        <h3 className="font-bold text-sm mb-4">🏅 排行榜</h3>
        {lb.length === 0 ? (
          <p className="text-xs text-white/30">暂无审核通过的成绩</p>
        ) : (
          <div className="space-y-2">
            {lb.map((e: any, i: number) => (
              <div key={i} className="flex items-center gap-4 py-2 border-b border-white/[0.04] last:border-0">
                <span className="w-6 text-center font-bold text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                <span className="flex-1 text-sm font-bold">{e.user?.nickname || '?'}</span>
                <span className="text-sm font-mono text-cyan-400">{(e.finalTimeMs / 1000).toFixed(2)}s</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
