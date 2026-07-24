'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

const STATUS: Record<string, string> = {
  UPCOMING: '即将开始', ONGOING: '🔥 进行中', REVIEW_BUFFER: '审核中', CLOSED: '已结束',
};

export default function ActivitiesPage() {
  const [acts, setActs] = useState<any[]>([]);
  useEffect(() => { api.getActivities().then((r: any) => setActs(r)); }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">🏆 官方赛事</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">参与官方认证赛事，视频验证后上榜</p>

      <div className="grid gap-4">
        {acts.map(a => (
          <Link key={a.id} href={`/activities/${a.id}`}
            className="block bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-cyan-500/30 transition">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                a.status === 'ONGOING' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                a.status === 'UPCOMING' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                'bg-white/[0.04] text-white/30 border border-white/5'
              }`}>{STATUS[a.status] || a.status}</span>
              <h3 className="font-bold text-lg">{a.title}</h3>
            </div>
            {a.description && <p className="text-xs text-white/40 mb-2">{a.description}</p>}
            <div className="flex gap-4 text-[10px] text-white/30">
              <span>开始: {new Date(a.startAt).toLocaleDateString('zh-CN')}</span>
              <span>结束: {new Date(a.endAt).toLocaleDateString('zh-CN')}</span>
              <span>{a.requiresVideo ? '📹 需视频验证' : '无视频要求'}</span>
            </div>
          </Link>
        ))}
        {acts.length === 0 && <p className="text-sm text-white/30 text-center py-12">暂无赛事活动</p>}
      </div>
    </div>
  );
}
