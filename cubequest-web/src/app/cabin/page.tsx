'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAuth, clearAuth } from '@/lib/auth';
import { formatTime } from '@/lib/scramble';

interface CubeStat { pb: number | null; avg: number | null; count: number }

const CUBE_INFO: Record<string, { icon: string; label: string }> = {
  '333': { icon: '🧊', label: '三阶' },
  '222': { icon: '💎', label: '二阶' },
  '444': { icon: '🔷', label: '四阶' },
  '555': { icon: '🔶', label: '五阶' },
  'pyram': { icon: '🔺', label: '金字塔' },
  'skewb': { icon: '💠', label: '斜转' },
};

export default function CabinPage() {
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);
  const [cubeStats, setCubeStats] = useState<Record<string, CubeStat> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { setAuth(getAuth()); }, []);

  useEffect(() => {
    if (!auth?.token) { setLoading(false); return; }
    fetch('/api/results/cube-stats', { headers: { Authorization: `Bearer ${auth.token}` } })
      .then(r => r.json())
      .then(setCubeStats)
      .finally(() => setLoading(false));
  }, [auth?.token]);

  const user = auth?.user;
  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">🏠</div>
        <h1 className="text-2xl font-bold mb-2">魔方小屋</h1>
        <p className="text-[var(--color-muted)] mb-6">登录后进入你的专属训练空间</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">去登录</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-3xl font-bold shadow-lg">
            {user.nickname?.charAt(0) || '🧊'}
          </div>
          <div>
            <h1 className="text-2xl font-black">{user.nickname} 的魔方小屋</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-[var(--color-muted)]">
              <span>{user.role === 'STUDENT' ? '🎓 学员' : '👨‍👩‍👧 家长'}</span>
              {user.city && <span>📍 {user.city}</span>}
              {user.birthYear && <span>🎂 {user.birthYear}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/training/timer" className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-sm font-semibold text-white">⏱️ 训练</Link>
          <button onClick={clearAuth} className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">退出</button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_,i)=>(<div key={i} className="h-28 rounded-xl bg-[var(--color-surface)] animate-pulse" />))}
        </div>
      ) : cubeStats ? (
        <div className="space-y-4">
          {/* Per-cube stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(cubeStats)
              .filter(([,s]) => s.count > 0)
              .map(([key, s]) => {
                const info = CUBE_INFO[key] || { icon: '🧊', label: key };
                return (
                  <div key={key} className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)]/30 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xl">{info.icon}</span>
                      <span className="text-sm font-bold">{info.label}</span>
                      <span className="text-[10px] text-[var(--color-muted)] ml-auto">{s.count}次</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--color-muted)]">🏆 PB</div>
                        <div className="font-mono text-lg font-bold text-[var(--color-primary)]">{formatTime(s.pb)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-[var(--color-muted)]">⚡ Sub</div>
                        <div className="font-mono text-lg font-bold text-[var(--color-accent-green)]">{formatTime(s.avg)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Empty state for untried cubes */}
          {Object.entries(cubeStats).filter(([,s]) => s.count === 0).length > 0 && (
            <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
              <p className="text-xs text-[var(--color-muted)] mb-2">未尝试的魔方类型：</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(cubeStats).filter(([,s]) => s.count === 0).map(([key]) => (
                  <span key={key} className="text-xs px-2 py-1 rounded bg-[var(--color-background)] text-[var(--color-muted)]">
                    {CUBE_INFO[key]?.icon} {CUBE_INFO[key]?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Link href="/results" className="inline-block text-xs text-[var(--color-primary)] hover:underline">📊 查看全部训练记录 →</Link>
        </div>
      ) : (
        <div className="bg-[var(--color-surface)] rounded-xl p-8 text-center border border-[var(--color-border)]">
          <div className="text-4xl mb-3">⏱️</div>
          <p className="text-[var(--color-muted)]">还没有训练数据，开始你的第一次计时吧！</p>
        </div>
      )}
    </div>
  );
}
