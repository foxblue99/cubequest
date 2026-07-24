'use client';

import TimerPanel from '@/components/timer/TimerPanel';
import GhostIndicator from '@/components/timer/GhostIndicator';

export default function TimerPageClient() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="px-4 pt-10 pb-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            <span className="gradient-text">⏱️ 计时训练</span>
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            WCA 风格计时 · 15 秒观察 · ao5 / ao12 统计
          </p>
          <div className="mt-2">
            <GhostIndicator />
          </div>
        </div>
      </section>

      {/* Timer */}
      <section className="px-4 pb-16">
        <TimerPanel />
      </section>
    </div>
  );
}
