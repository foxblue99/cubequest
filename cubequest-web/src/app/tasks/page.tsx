
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

interface TaskItem {
  id: string;
  title: string;
  type: string;
  targetValue: number;
  rewardExp: number;
  progress: number;
  completed: boolean;
}

export default function TasksPage() {
  const auth = getAuth(); const isAuthenticated = !!auth?.token;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    api.getTodayTasks().then((data: any) => setTasks(Array.isArray(data) ? data : data.tasks || [])).finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h1 className="text-2xl font-bold mb-2">每日任务</h1>
        <p className="text-[var(--color-muted)] mb-6">登录后查看今日任务</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">登录</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">🎯 每日任务</h1>
      {loading ? <div className="animate-pulse text-[var(--color-muted)]">加载中...</div> : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const pct = Math.min((task.progress / task.targetValue) * 100, 100);
            return (
              <div key={task.id} className={`bg-[var(--color-surface)] rounded-xl p-4 border transition-colors ${task.completed ? 'border-[var(--color-accent-green)]' : 'border-[var(--color-border)]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.completed ? '✅' : '⬜'}</span>
                    <span className="font-medium text-sm">{task.title}</span>
                  </div>
                  <span className="text-xs text-[var(--color-accent-orange)]">+{task.rewardExp} EXP</span>
                </div>
                <div className="h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${task.completed ? 'bg-[var(--color-accent-green)]' : 'bg-[var(--color-primary)]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-1">{task.progress} / {task.targetValue}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
