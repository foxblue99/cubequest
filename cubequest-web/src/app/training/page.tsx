'use client';

import Link from 'next/link';
import { getAuth } from '@/lib/auth';

export default function TrainingPage() {
  const auth = getAuth(); const isAuthenticated = !!auth?.token;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">⏱️ 速拧训练</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Main Timer CTA */}
        <Link
          href="/training/timer"
          className="bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 rounded-xl p-6 border border-[var(--color-primary)]/30 hover:border-[var(--color-primary)] transition-all group"
        >
          <div className="text-4xl mb-3">⏱️</div>
          <h2 className="text-xl font-bold mb-2 group-hover:text-[var(--color-primary)] transition-colors">
            WCA 计时器
          </h2>
          <p className="text-sm text-[var(--color-muted)]">
            标准 WCA 风格计时训练，支持观察倒计时、+2/DNF 判定、自动计算 ao5/ao12
          </p>
        </Link>

        {/* Quick Start */}
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
          <div className="text-4xl mb-3">📊</div>
          <h2 className="text-xl font-bold mb-2">我的数据</h2>
          <p className="text-sm text-[var(--color-muted)] mb-4">查看你的 PB、成绩趋势和训练历史</p>
          <Link
            href={isAuthenticated ? "/results" : "/login"}
            className="inline-block px-4 py-2 rounded-lg bg-[var(--color-surface-light)] text-sm font-medium hover:bg-[var(--color-border)] transition-colors"
          >
            {isAuthenticated ? "查看成绩 →" : "登录查看 →"}
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
        <h3 className="font-semibold mb-3">💡 训练建议</h3>
        <ul className="space-y-2 text-sm text-[var(--color-muted)]">
          <li>• 每次训练前先做 5-10 次慢速还原热身</li>
          <li>• 使用 WCA 标准打乱，保证训练质量</li>
          <li>• 记录每次成绩，关注 ao5/ao12 的进步趋势</li>
          <li>• 遇到瓶颈时回看慢放视频，找到转动延迟</li>
          <li>• 每天坚持 10-20 次计时，比偶尔大量训练更有效</li>
        </ul>
      </div>
    </div>
  );
}
