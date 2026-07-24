
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

interface Achievement {
  id: string;
  code: string;
  title: string;
  description?: string;
  iconUrl?: string;
  unlockedAt?: string | null;
}

const ICON_MAP: Record<string, string> = {
  FIRST_SOLVE: '🧊',
  FIRST_SUB60: '⏱️',
  FIRST_SUB30: '⚡',
  FIRST_SUB20: '🔥',
  STREAK_7: '📅',
  FIRST_AO5: '📊',
  LEARN_F2L: '🌳',
  MASTER_PLL: '⚔️',
};

export default function AchievementsPage() {
  const auth = getAuth(); const isAuthenticated = !!auth?.token;
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.getMyAchievements().then((data: any) => setAchievements(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-2xl font-bold mb-2">成就徽章</h1>
        <p className="text-[var(--color-muted)] mb-6">登录后查看你的成就</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">登录</Link>
      </div>
    );
  }

  const unlocked = achievements.filter(a => a.unlockedAt).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold">🏆 成就徽章</h1>
        <span className="text-sm text-[var(--color-muted)]">({unlocked}/{achievements.length} 已解锁)</span>
      </div>
      {loading ? <div className="animate-pulse text-[var(--color-muted)]">加载中...</div> : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl p-4 text-center border transition-all ${
                a.unlockedAt
                  ? 'bg-[var(--color-surface)] border-[var(--color-accent-green)]'
                  : 'bg-[var(--color-surface)]/50 border-[var(--color-border)] opacity-50'
              }`}
            >
              <div className="text-3xl mb-2">{ICON_MAP[a.code] || '🏅'}</div>
              <div className="text-sm font-medium">{a.title}</div>
              <div className="text-xs text-[var(--color-muted)] mt-1">{a.description || a.code}</div>
              {a.unlockedAt && <div className="text-xs text-[var(--color-accent-green)] mt-1">已解锁 ✅</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
