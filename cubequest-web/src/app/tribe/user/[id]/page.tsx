'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function UserSpace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<any>(null);

  useEffect(()=>{fetch(`/api/tribe/users/${id}`).then(r=>r.json()).then(setProfile);},[id]);

  if (!profile) return <div className="flex items-center justify-center min-h-[60vh] text-[var(--color-muted)] text-sm">🌀 加载中...</div>;

  const { user, tier, pbFormatted, subFormatted, ao5, ao12, totalSolves, subRank, pbRank, totalRanked, postCount, totalFlames, posts } = profile;
  const rankPct = subRank > 0 ? Math.round(subRank / totalRanked * 100) : 0;

  return (
    <div className="min-h-screen">
      {/* Cover / Banner */}
      <div className="relative h-48 bg-gradient-to-br from-[var(--color-surface)] via-purple-900/20 to-cyan-900/20 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-purple-500/30 blur-3xl" />
          <div className="absolute bottom-0 right-8 w-48 h-48 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-64 h-16 bg-amber-500/10 blur-2xl" />
        </div>
        <Link href="/tribe" className="absolute top-4 left-4 text-xs text-white/60 hover:text-white z-10">← 部落</Link>
      </div>

      <div className="mx-auto max-w-3xl -mt-16 px-4 relative z-10">
        {/* Avatar + Identity */}
        <div className="flex items-end gap-4 mb-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)] border-4 border-[var(--color-background)] flex items-center justify-center text-5xl shadow-xl shadow-black/30">
            {tier.icon}
          </div>
          <div className="pb-1 flex-1">
            <h1 className="text-2xl font-black">{user.nickname}</h1>
            <div className="flex items-center gap-3 text-sm text-[var(--color-muted)]">
              <span>{tier.name}</span>
              <span>·</span>
              <span>加入 {new Date(user.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            {label:'SUB 均速',v:subFormatted,clr:'text-cyan-400'},
            {label:'PB 单次',v:pbFormatted,clr:'text-amber-400'},
            {label:'Ao5',v:ao5,clr:'text-purple-400'},
            {label:'总还原',v:totalSolves+'次',clr:'text-emerald-400'},
          ].map((s,i)=>(
            <div key={i} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 text-center hover:border-[var(--color-primary)]/30 transition-all">
              <div className={`text-xl font-black ${s.clr}`}>{s.v}</div>
              <div className="text-[10px] text-[var(--color-muted)] mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Ranking Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-4">
            <div className="text-xs text-[var(--color-muted)] mb-1">🏆 SUB 排名</div>
            <div className="text-lg font-black text-amber-400">{subRank > 0 ? `第 ${subRank} 名` : '--'}</div>
            <div className="text-[10px] text-[var(--color-muted)]">共 {totalRanked} 人 · 超越 {100-rankPct}% 魔友</div>
            <div className="mt-2 h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full" style={{width:`${100-rankPct}%`}} />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-4">
            <div className="text-xs text-[var(--color-muted)] mb-1">⚡ PB 排名</div>
            <div className="text-lg font-black text-purple-400">{pbRank > 0 ? `第 ${pbRank} 名` : '--'}</div>
            <div className="text-[10px] text-[var(--color-muted)]">共 {totalRanked} 人</div>
            <div className="mt-2 h-1.5 bg-[var(--color-background)] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full" style={{width:`${pbRank>0?Math.max(2,100-Math.round(pbRank/totalRanked*100)):0}%`}} />
            </div>
          </div>
        </div>

        {/* Community Stats */}
        <div className="flex gap-4 text-sm mb-8 px-1">
          <div className="bg-[var(--color-surface)] rounded-xl px-4 py-2 border border-[var(--color-border)]"><span className="text-[var(--color-muted)]">📝 帖子</span> <span className="font-bold ml-1">{postCount}</span></div>
          <div className="bg-[var(--color-surface)] rounded-xl px-4 py-2 border border-[var(--color-border)]"><span className="text-[var(--color-muted)]">🔥 魔焰</span> <span className="font-bold ml-1">{totalFlames}</span></div>
          <div className="bg-[var(--color-surface)] rounded-xl px-4 py-2 border border-[var(--color-border)]"><span className="text-[var(--color-muted)]">💎 贡献</span> <span className="font-bold ml-1">{Math.floor(profile.contrib)}</span></div>
        </div>

        {/* Latest Posts / Timeline */}
        <h2 className="font-bold text-lg mb-4 border-b border-[var(--color-border)] pb-2">📝 最新动态</h2>
        {posts?.length===0 && <div className="text-center py-12 text-sm text-[var(--color-muted)] bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">还没有发过帖子</div>}
        <div className="space-y-3 pb-16">
          {posts?.map((p:any)=>(
            <Link key={p.id} href={`/tribe/post/${p.id}`} className="block bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/30 transition-all hover:shadow-lg hover:shadow-[var(--color-primary)]/5">
              <p className="text-sm mb-3 leading-relaxed">{p.content.slice(0,150)}{p.content.length>150?'...':''}</p>
              <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                <span>🔥 {p._count?.flamesRel||0}</span>
                <span>💬 {p._count?.comments||0}</span>
                <span className="ml-auto">{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
