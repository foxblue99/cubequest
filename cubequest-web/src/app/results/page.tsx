'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatTime } from '@/lib/scramble';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

interface Stats {
  pb: number | null;
  ao5: number | 'DNF' | null;
  ao12: number | 'DNF' | null;
  totalSolves: number;
  todaySolves: number;
  weekSolves: number;
}

interface SolveResult {
  id: string;
  eventType: string;
  timeMs: number | null;
  penalty: string;
  finalTimeMs: number | null;
  scramble: string;
  isPB: boolean;
  createdAt: string;
}

const EVENT_ICON: Record<string, string> = {
  '333': '🧊', '222': '💎',
  '444': '🔷', '555': '🔶',
  'pyram': '🔺', 'skewb': '💠',
  'cross': '❌', 'f2l': '🔲', 'oll': '🟡', 'pll': '🟣',
};
const EVENT_LABEL: Record<string, string> = {
  '333': '三阶', '222': '二阶',
  'cross': 'Cross', 'f2l': 'F2L', 'oll': 'OLL', 'pll': 'PLL',
};

export default function ResultsPage() {
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [results, setResults] = useState<SolveResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    setHydrated(true);
    const auth = getAuth();
    if (!auth?.token) { setLoading(false); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, r] = await Promise.all([
        api.getMyStats() as unknown as Promise<Stats>,
        api.getMyResults() as Promise<SolveResult[]>,
      ]);
      setStats(s);
      setResults(Array.isArray(r) ? r : []);
    } catch (err: any) {
      if (err?.status === 401) {
        setStats(null); setResults([]);
        setAuthError(true);
        setLoading(false);
        return;
      }
      console.error('[Results]', err);
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) return null;

  const auth = getAuth();
  if (!auth?.token) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">📊</div>
        <h1 className="text-2xl font-bold mb-2">成绩中心</h1>
        <p className="text-[var(--color-muted)] mb-6">登录后查看你的训练数据</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">登录</Link>
      </div>
    );
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><div className="animate-pulse text-[var(--color-muted)]">加载中...</div></div>;

  if (authError) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h1 className="text-2xl font-bold mb-2">登录已过期</h1>
        <p className="text-[var(--color-muted)] mb-6">请重新登录后查看成绩</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">重新登录</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">📊 成绩中心</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="PB" value={formatTime(stats.pb)} color="text-[var(--color-primary)]" />
          <StatCard label="ao5" value={typeof stats.ao5 === 'number' ? formatTime(stats.ao5) : 'DNF'} color="text-[var(--color-accent-green)]" />
          <StatCard label="ao12" value={typeof stats.ao12 === 'number' ? formatTime(stats.ao12) : 'DNF'} color="text-[var(--color-secondary)]" />
          <StatCard label="今日训练" value={`${stats.todaySolves} 次`} color="text-[var(--color-accent-orange)]" />
        </div>
      )}

      <div className="mb-8">
        <Link href="/training/timer"
          className="inline-block px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">
          ⏱️ 开始计时训练
        </Link>
      </div>

      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="font-semibold">训练记录</h2>
          <span className="text-xs text-[var(--color-muted)]">{results.length} 次</span>
        </div>
        {results.length === 0 ? (
          <div className="p-8 text-center text-[var(--color-muted)]">还没有训练记录，开始你的第一次计时吧！</div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {results.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-4 py-3 hover:bg-[var(--color-background)]/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cube type icon */}
                  <span className="text-sm flex-shrink-0" title={r.eventType}>
                    {EVENT_ICON[r.eventType] || '🧊'}
                  </span>
                  {/* Training project label */}
                  <span className="w-12 text-[9px] text-[var(--color-muted)] flex-shrink-0">
                    {EVENT_LABEL[r.eventType] || r.eventType || '三阶'}
                  </span>
                  {/* Time */}
                  <span className={`font-mono text-lg font-bold ${
                    r.penalty === 'DNF' ? 'text-red-400' :
                    r.penalty === 'PLUS_TWO' ? 'text-yellow-400' :
                    'text-[var(--color-foreground)]'
                  }`}>
                    {formatTime(r.finalTimeMs)}
                  </span>
                  {/* Penalty badge */}
                  {r.penalty !== 'NONE' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      r.penalty === 'DNF' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {r.penalty === 'DNF' ? 'DNF' : '+2'}
                    </span>
                  )}
                  {/* PB badge (prominent) */}
                  {r.isPB && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
                      🏆 PB
                    </span>
                  )}
                </div>
                <span className="text-xs text-[var(--color-muted)] truncate ml-3 hidden sm:block max-w-[200px]">{r.scramble}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] text-center">
      <div className="text-xs text-[var(--color-muted)] mb-1">{label}</div>
      <div className={`font-mono text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
