
'use client';

import { getAuth, clearAuth as clearLibAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function ProfilePage() {
  const auth = getAuth(); const user = auth?.user; const isAuthenticated = !!auth?.token; const logout = () => { clearLibAuth(); window.location.reload(); };
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">👤 个人中心</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-2xl font-bold">
              {user.nickname?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="font-bold text-lg">{user.nickname}</h2>
              <span className="text-sm text-[var(--color-muted)]">{user.role === 'STUDENT' ? '学员' : user.role === 'PARENT' ? '家长' : user.role}</span>
            </div>
          </div>
          <div className="space-y-2 text-sm text-[var(--color-muted)]">
            {user.city && <div>📍 {user.city}</div>}
            {user.birthYear && <div>🎂 {user.birthYear} 年</div>}
            <div>📱 {user.phone?.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
          </div>
        </div>
        <div className="space-y-3">
          <Link href="/results" className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
            <div className="font-medium">📊 我的成绩</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">查看训练统计和记录</div>
          </Link>
          <Link href="/tasks" className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
            <div className="font-medium">🎯 每日任务</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">完成任务获取经验</div>
          </Link>
          <Link href="/achievements" className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
            <div className="font-medium">🏆 成就徽章</div>
            <div className="text-xs text-[var(--color-muted)] mt-1">查看已解锁的成就</div>
          </Link>
          {user.role === 'STUDENT' && (
            <Link href="/parent" className="block bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors">
              <div className="font-medium">👨‍👩‍👧 家长绑定</div>
              <div className="text-xs text-[var(--color-muted)] mt-1">生成绑定码让家长关注你的训练</div>
            </Link>
          )}
          <button
            onClick={() => { logout(); router.push('/'); }}
            className="w-full text-left bg-[var(--color-surface)] rounded-xl p-4 border border-red-500/30 hover:border-red-500 transition-colors text-red-400"
          >
            <div className="font-medium">🚪 退出登录</div>
          </button>
        </div>
      </div>
    </div>
  );
}
