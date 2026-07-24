'use client';

import { useState, useMemo, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 70 }, (_, i) => CURRENT_YEAR - i);

export default function SettingsPage() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth?.user;
  const isAuthenticated = !!auth?.token;

  // Derive initial form state from user — avoids cascading setState-in-effect
  const initial = useMemo(() => ({
    nickname: user?.nickname ?? '',
    city: user?.city ?? '',
    birthYear: (user?.birthYear ?? undefined) as number | undefined,
  }), [user]);

  const [nickname, setNickname] = useState(initial.nickname);
  const [city, setCity] = useState(initial.city);
  const [birthYear, setBirthYear] = useState<number | undefined>(initial.birthYear);

  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const validate = (): string | null => {
    if (!nickname.trim()) return '昵称不能为空';
    if (nickname.trim().length > 20) return '昵称最多 20 个字符';
    if (city.trim().length > 50) return '城市名称过长';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      const auth = getAuth();
      const h: Record<string, string> = { 'Content-Type': 'application/json' };
      if (auth?.token) h.Authorization = `Bearer ${auth.token}`;

      // Update account info (nickname/city) via auth endpoint
      const res = await fetch('/api/auth/me', {
        method: 'PATCH', headers: h,
        body: JSON.stringify({ nickname, city }),
      });
      if (!res.ok) throw new Error('保存失败');

      // Sync local auth store so navbar updates immediately
      const updated = await res.json();
      if (updated?.nickname && auth) {
        auth.user = { ...auth.user, nickname: updated.nickname, city: updated.city };
        localStorage.setItem('cq_user', JSON.stringify(auth.user));
      }

      setSuccess('设置已保存 ✅');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : '保存失败，请稍后重试';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  // Don't render form while checking auth or loading user
  if (!isAuthenticated) return null;
  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl">🧊</span>
            <span className="text-2xl font-bold gradient-text">魔方远征</span>
          </Link>
          <p className="text-[var(--color-muted)] text-sm">个人设置</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nickname */}
            <div>
              <label
                htmlFor="settings-nickname"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
              >
                昵称 <span className="text-red-400">*</span>
              </label>
              <input
                id="settings-nickname"
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="输入你的昵称"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-colors text-sm"
                autoComplete="nickname"
              />
            </div>

            {/* Birth Year */}
            <div>
              <label
                htmlFor="settings-birthyear"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
              >
                出生年份{' '}
                <span className="text-[var(--color-muted)] text-xs">（选填）</span>
              </label>
              <select
                id="settings-birthyear"
                value={birthYear ?? ''}
                onChange={(e) =>
                  setBirthYear(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-colors text-sm appearance-none cursor-pointer"
              >
                <option value="">选择年份</option>
                {YEAR_OPTIONS.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label
                htmlFor="settings-city"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5"
              >
                所在城市{' '}
                <span className="text-[var(--color-muted)] text-xs">（选填）</span>
              </label>
              <input
                id="settings-city"
                type="text"
                maxLength={50}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="例如：北京"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/50 transition-colors text-sm"
                autoComplete="address-level2"
              />
            </div>

            {/* Phone (read-only) */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
                手机号
              </label>
              <div className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm">
                {user.phone
                  ? user.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
                  : '未绑定'}
              </div>
            </div>

            {/* Success message */}
            {success && (
              <div className="text-sm text-green-400 bg-green-400/10 border border-green-400/20 rounded-lg px-3 py-2">
                {success}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed glow-primary"
            >
              {saving ? '保存中...' : '💾 保存设置'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div className="flex items-center justify-between mt-5">
          <Link
            href="/profile"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            ← 返回个人中心
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
