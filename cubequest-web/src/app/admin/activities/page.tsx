'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function AdminActivitiesPage() {
  const [acts, setActs] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newEndAt, setNewEndAt] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoster, setNewPoster] = useState('');
  const [uploading, setUploading] = useState(false);
  const auth = getAuth();

  useEffect(() => { setHydrated(true); load(); }, []);
  const load = async () => {
    try { setActs(await api.getActivities() as any[]); setPending(await api.adminGetPendingVideos() as any[]); } catch {}
  };

  if (!hydrated || !auth) return null;
  if (auth.user?.role !== 'ADMIN') return <div className="p-6 text-sm text-red-400">仅管理员可访问</div>;

  const create = async () => {
    if (!newTitle || !newEndAt) return;
    await api.adminCreateActivity({
      title: newTitle, startAt: new Date().toISOString(),
      endAt: new Date(newEndAt).toISOString(), requiresVideo: true, reviewBufferDays: 3,
      description: newDesc || undefined, posterUrl: newPoster || undefined,
    });
    setNewTitle(''); setNewEndAt(''); setNewDesc(''); setNewPoster(''); load();
  };

  const uploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', f);
      const res = await fetch('/api/upload/image', {
        method: 'POST',
        headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
        body: fd,
      });
      const d = await res.json();
      if (d?.url) setNewPoster(d.url);
    } catch {}
    setUploading(false);
  };

  const review = async (logId: string, approved: boolean) => {
    await api.adminReviewVideo(logId, approved);
    load();
  };

  const statusColor: Record<string,string> = {
    UPCOMING: 'text-cyan-400', ONGOING: 'text-green-400',
    REVIEW_BUFFER: 'text-amber-400', CLOSED: 'text-white/30',
  };
  const statusLabel: Record<string,string> = {
    UPCOMING: '即将开始', ONGOING: '进行中', REVIEW_BUFFER: '审核缓冲', CLOSED: '已结束',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black mb-6">🏆 赛事管理</h1>

      {/* Create */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-6">
        <h3 className="font-bold text-sm mb-3">新建活动</h3>
        <div className="flex gap-3 mb-3">
          <input className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="活动名称" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <input className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm" type="datetime-local" value={newEndAt} onChange={e => setNewEndAt(e.target.value)} />
          <button className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm" onClick={create}>创建</button>
        </div>
        <div className="flex gap-3 mb-3">
          <input className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="活动描述（可选）" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
        </div>
        <div className="flex gap-3 items-center">
          <input className="flex-1 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm" placeholder="海报URL或点击右侧上传本地图片" value={newPoster} onChange={e => setNewPoster(e.target.value)} />
          <label className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs cursor-pointer hover:bg-purple-500/20 transition shrink-0">
            {uploading ? '⏳' : '📁 上传'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadPoster} />
          </label>
          {newPoster && <img src={newPoster} className="h-10 w-16 object-cover rounded" />}
        </div>
      </div>

      {/* Activities list */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-6">
        <h3 className="font-bold text-sm mb-3">活动列表</h3>
        <div className="space-y-2">
          {acts.map(a => (
            <div key={a.id} className="flex items-center gap-3 text-sm py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-xs text-white/50 w-20 truncate">{a.id.slice(-8)}</span>
              <span className="flex-1 font-bold">{a.title}</span>
              <span className={`text-xs ${statusColor[a.status] || 'text-white/30'}`}>{statusLabel[a.status] || a.status}</span>
              <span className="text-[10px] text-white/25">{new Date(a.endAt).toLocaleDateString('zh-CN')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pending video reviews */}
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
        <h3 className="font-bold text-sm mb-3">视频审核队列 ({pending.length})</h3>
        {pending.length === 0 && <p className="text-xs text-white/30">暂无待审核视频</p>}
        <div className="space-y-2">
          {pending.map(p => (
            <div key={p.id} className="flex items-center gap-3 text-sm py-2 border-b border-white/[0.04] last:border-0">
              <span className="text-[10px] text-white/30 w-20">{p.id.slice(-8)}</span>
              <span className="flex-1 text-xs text-white/50 truncate">{p.user?.nickname || '?'}</span>
              <span className="text-[10px] text-white/25">{p.videoUrl?.slice(-30)}</span>
              <button className="px-2 py-1 rounded text-[10px] bg-green-500/10 border border-green-500/20 text-green-400" onClick={() => review(p.id, true)}>通过</button>
              <button className="px-2 py-1 rounded text-[10px] bg-red-500/10 border border-red-500/20 text-red-400" onClick={() => review(p.id, false)}>拒绝</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
