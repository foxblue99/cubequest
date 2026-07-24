'use client';

import Link from 'next/link';

interface UserStatusCardProps {
  nickname?: string;
  level?: string;
  pb?: number | null;
  ao5?: number | 'DNF' | null;
  streakDays?: number;
  todayTasksCompleted?: number;
  todayTasksTotal?: number;
}

function formatMs(ms: number | 'DNF' | null | undefined): string {
  if (ms === null || ms === undefined || ms === 'DNF') return '--';
  return (ms / 1000).toFixed(2) + 's';
}

const LEVEL_MAP: Record<string, string> = {
  NEWBIE: '🏕️ 新手营地',
  CROSS: '✨ 十字遗迹',
  F2L: '🌳 F2L 森林',
  OLL: '🏛️ OLL 神殿',
  PLL: '⚔️ PLL 竞技场',
  ADVANCED: '🏆 高手殿堂',
};

export default function UserStatusCard({
  nickname,
  level = 'NEWBIE',
  pb,
  ao5,
  streakDays = 0,
  todayTasksCompleted = 0,
  todayTasksTotal = 0,
}: UserStatusCardProps) {
  return (
    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-lg font-bold">
            {nickname?.charAt(0) || '🧊'}
          </div>
          <div>
            <div className="font-semibold text-sm">{nickname || '魔方勇士'}</div>
            <div className="text-xs text-[var(--color-muted)]">
              {LEVEL_MAP[level] || level}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-[var(--color-muted)]">连续训练</div>
          <div className="text-lg font-bold text-[var(--color-accent-orange)]">
            {streakDays} 天 🔥
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatBlock label="PB" value={formatMs(pb)} color="text-[var(--color-primary)]" />
        <StatBlock label="ao5" value={formatMs(ao5)} color="text-[var(--color-accent-green)]" />
        <StatBlock
          label="今日任务"
          value={`${todayTasksCompleted}/${todayTasksTotal}`}
          color="text-[var(--color-accent-orange)]"
        />
      </div>

      <Link
        href="/training/timer"
        className="block w-full text-center py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors"
      >
        ⏱️ 开始计时
      </Link>
    </div>
  );
}

function StatBlock({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-[var(--color-background)] rounded-lg p-2 text-center">
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
      <div className={`font-mono font-bold text-sm ${color}`}>{value}</div>
    </div>
  );
}
