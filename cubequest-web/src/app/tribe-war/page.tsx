'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

const POST = async (url: string, body: any = {}) => {
  const auth = getAuth();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
  const r = await fetch(url, { method: 'POST', headers: h, body: JSON.stringify(body) });
  return r.json();
};

export default function TribeWarPage() {
  const [standings, setStandings] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [hydrated, setHydrated] = useState(false);
  const auth = getAuth();

  useEffect(() => { setHydrated(true); loadData(); }, []);

  const loadData = async () => {
    const s = await fetch('/api/tribe/war/standings').then(r => r.json());
    setStandings(Array.isArray(s) ? s : []);
    if (auth?.token) {
      const m = await fetch('/api/tribe/war/my-team', {
        headers: { Authorization: `Bearer ${auth.token}` },
      }).then(r => r.json());
      if (m && m.team) setMyTeam(m);
    }
  };

  const joinTeam = async (teamId: string) => {
    await POST('/api/tribe/war/join', { teamId });
    await loadData();
  };

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">⚔️ 部落战队</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">加入战队，每周积分赛PK！</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {standings.map((s, i) => (
          <div key={s.teamId} className="rounded-2xl border p-5 bg-white/[0.02] backdrop-blur-xl border-white/[0.06]">
            <div className="text-lg font-bold mb-2">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {s.emoji || ''} {s.name}
            </div>
            <div className="text-2xl font-black">{s.score}</div>
            <div className="text-xs text-[var(--color-muted)]">积分</div>
            <div className="flex gap-3 mt-3 text-[10px] text-[var(--color-muted)]">
              <span>👥 {s.members}人</span>
              <span className={s.status === 'CLOSED' ? 'text-green-400' : 'text-amber-400'}>
                {s.status === 'CLOSED' ? '已结算' : '进行中'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {auth ? (
        myTeam ? (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 text-center">
            <div className="text-3xl mb-2">{myTeam.team?.emoji || '⚔️'}</div>
            <div className="font-bold mb-1">你已加入 {myTeam.team?.name}</div>
            <div className="text-sm text-[var(--color-muted)]">
              本周积分: {myTeam.score} · 排名 #{myTeam.rank}
            </div>
          </div>
        ) : (
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
            <h3 className="font-bold text-sm mb-4 text-center">选择你的战队</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {standings.map(s => (
                <button key={s.teamId} onClick={() => joinTeam(s.teamId)}
                  className="rounded-xl border p-4 text-center bg-white/[0.02] border-white/[0.06] hover:scale-105 transition">
                  <div className="text-lg font-bold">{s.emoji || ''} {s.name}</div>
                  <div className="text-[10px] text-[var(--color-muted)] mt-1">{s.members}名战士</div>
                </button>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="text-center py-8 text-sm text-[var(--color-muted)]">
          <Link href="/login" className="text-cyan-400 hover:underline">登录</Link> 后加入战队
        </div>
      )}
    </div>
  );
}
