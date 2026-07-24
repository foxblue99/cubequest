'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, clearAuth } from '@/lib/auth';

const ADMIN_NAV = [
  { href: '/admin', label: '📊 仪表盘', exact: true },
  { href: '/admin/users', label: '👥 用户' },
  { href: '/admin/courses', label: '📖 课程' },
  { href: '/admin/formulas', label: '🔤 公式' },
  { href: '/admin/events', label: '🏟️ 赛事' },
  { href: '/admin/activities', label: '🏆 活动' },
  { href: '/admin/tribe', label: '🏔️ 部落' },
  { href: '/admin/uploads', label: '📁 文件' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Allow /admin/login without auth check
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const auth = getAuth();
    if (!isLoginPage) {
      if (!auth) { router.replace('/admin/login'); return; }
      if (auth.user.role !== 'ADMIN' && auth.user.role !== 'SUPER_ADMIN') {
        clearAuth(); router.replace('/admin/login'); return;
      }
    }
    setReady(true);
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (!ready) return <div className="flex items-center justify-center min-h-screen text-[var(--color-muted)]">验证中...</div>;

  const user = getAuth()?.user;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-4 flex-shrink-0 hidden md:flex md:flex-col">
        <Link href="/" className="text-lg font-bold mb-4 px-2">
          <span className="gradient-text">CubeQuest</span>
          <span className="text-xs text-[var(--color-muted)] block">管理后台</span>
        </Link>
        <nav className="space-y-1 flex-1">
          {ADMIN_NAV.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-background)]'
                }`}>{item.label}</Link>
            );
          })}
        </nav>
        {user && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2 px-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-[10px] font-bold">{user.nickname?.charAt(0)}</span>
              <span className="text-xs text-[var(--color-muted)]">{user.nickname}</span>
            </div>
            <button onClick={clearAuth} className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:text-red-300 rounded-lg hover:bg-red-500/10 transition-colors">🚪 退出</button>
          </div>
        )}
      </aside>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-50">
        <div className="flex">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex-1 text-center py-2 text-xs ${pathname.startsWith(item.href) ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}>
              {item.label.split(' ')[0]}
            </Link>
          ))}
        </div>
      </div>

      <main className="flex-1 p-6 pb-16 md:pb-6">{children}</main>
    </div>
  );
}
