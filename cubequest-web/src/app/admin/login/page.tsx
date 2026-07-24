'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { setAuth } from '@/lib/auth';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    if (!/^\d{11}$/.test(phone.trim())) { setError('手机号须为 11 位数字'); return; }
    if (!password || password.length < 6) { setError('密码至少 6 位'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '登录失败');
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        throw new Error('该账号没有管理员权限');
      }
      setAuth({ token: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🛡️</span>
            <span className="text-2xl font-bold gradient-text">CubeQuest</span>
          </Link>
          <p className="text-[var(--color-muted)] text-sm">管理员登录</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">手机号</label>
              <input type="tel" inputMode="numeric" maxLength={11} value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="请输入 11 位手机号"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">密码</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] text-sm" />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50">
              {loading ? '验证中...' : '🛡️ 管理员登录'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--color-muted)] mt-5">
          <Link href="/login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium">← 普通用户登录</Link>
        </p>
      </div>
    </div>
  );
}
