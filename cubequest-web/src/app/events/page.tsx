'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function EventsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/events/calendar/list').then((d: any) => setItems(d || [])).finally(() => setLoading(false));
  }, []);

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('zh-CN') : '--';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-6">🏆 赛事日历</h1>

      {loading ? <div className="animate-pulse text-[var(--color-muted)]">加载中...</div> : (
        <div className="space-y-4">
          {items.length === 0 && <div className="text-center text-[var(--color-muted)] py-8">暂无赛事信息</div>}
          {items.map((e: any) => (
            <div key={e.id} className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] hover:border-cyan-500/20 transition">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    {e.type === 'wca' ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">WCA官方</span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">本地资讯</span>
                    )}
                    <h3 className="font-semibold text-lg">{e.nameZh || e.name || e.title}</h3>
                  </div>
                  {e.city && <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted)]">📍 {e.cityZh || e.city}</div>}
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[var(--color-muted)] mb-3">
                <span>📅 {fmtDate(e.startDate)}</span>
                {e.endDate && <span>→ {fmtDate(e.endDate)}</span>}
                {e.eventIds && <span className="text-xs">项目: {e.eventIds.split(',').join(' ')}</span>}
              </div>

              {e.description && <p className="text-xs text-white/40 mb-3">{e.description.slice(0, 200)}</p>}

              <a href={e.wcaUrl || e.externalUrl || '#'} target="_blank" rel="noopener"
                className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition">
                {e.type === 'wca' ? '前往WCA官网报名 ↗' : '查看详情 ↗'}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
