'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAuth, clearAuth, onAuthChange } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/courses', label: '📚 课程' },
  { href: '/training', label: '⏱️ 训练' },
  { href: '/formulas', label: '🔤 公式' },
  { href: '/tribe', label: '🏔️ 部落' },
  { href: '/activities', label: '🏆 活动' },
  { href: '/cube-lab', label: '🧊 3D魔方' },
  { href: '/records', label: '🏆 之巅' },
  { href: '/links', label: '🔗 资源' },
  { href: '/coach', label: '🧠 私教' },
  { href: '/events', label: '🏅 赛事' },
  { href: '/daily-challenge', label: '🔥 神单' },
  { href: '/diagnosis', label: '🔬 诊断' },
  { href: '/tribe-war', label: '⚔️ 战队' },
  { href: '/results', label: '📊 成绩' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<ReturnType<typeof getAuth>>(null);

  useEffect(() => {
    setAuth(getAuth());
    return onAuthChange(() => setAuth(getAuth()));
  }, []);

  if (pathname.startsWith('/admin')) return null;
  const user = auth?.user;

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-background)]/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-3">
        {/* Logo — 最左 */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0 mr-1">
          <span className="text-2xl">🧊</span>
          <span className="gradient-text text-base whitespace-nowrap">魔方远征</span>
        </Link>

        {/* Nav items — 中间，自动分配 */}
        <div className="flex items-center gap-0.5 sm:gap-1 flex-1 min-w-0 overflow-x-auto flex-nowrap justify-center">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`shrink-0 px-1.5 sm:px-2 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  isActive ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)]'
                }`}>{item.label}</Link>
            );
          })}
        </div>

        {/* User area — 最右 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {user ? (
            <>
              <Link href="/cabin" className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] whitespace-nowrap">
                <span className="w-6 h-6 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">
                  {user.nickname?.charAt(0) || '🧊'}
                </span>
                <span className="hidden sm:inline">{user.nickname}</span>
              </Link>
              <button onClick={clearAuth} className="text-[10px] text-red-400 hover:text-red-300 whitespace-nowrap shrink-0">退出</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2.5 py-1 rounded-lg text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface)] whitespace-nowrap">登录</Link>
              <Link href="/register" className="px-2.5 py-1 rounded-lg text-xs bg-[var(--color-primary)] text-[var(--color-background)] font-medium whitespace-nowrap">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
