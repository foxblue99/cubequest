
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';
import { formatTime } from '@/lib/scramble';

interface ChildInfo {
  id: string;
  nickname: string;
  avatarUrl?: string;
  studentProfile?: {
    bestSingleMs?: number;
    bestAo5Ms?: number;
    streakDays: number;
  };
}

export default function ParentPage() {
  const auth = getAuth(); const isAuthenticated = !!auth?.token; const user = auth?.user;
  const [bindCode, setBindCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) { setLoading(false); return; }
    if (user.role === 'PARENT') {
      api.getChildren().then((data: any) => setChildren(Array.isArray(data) ? data : [])).finally(() => setLoading(false));
    } else if (user.role === 'STUDENT') {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const handleGenerateCode = async () => {
    try {
      const res: any = await api.generateBindCode();
      setBindCode(res.bindCode);
      setMessage('');
    } catch { setMessage('生成失败'); }
  };

  const handleBind = async () => {
    try {
      await api.bindChild(inputCode);
      setMessage('绑定成功！');
      setInputCode('');
      const data: any = await api.getChildren();
      setChildren(Array.isArray(data) ? data : []);
    } catch { setMessage('绑定失败，请检查绑定码'); }
  };

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <div className="text-6xl mb-4">👨‍👩‍👧</div>
        <h1 className="text-2xl font-bold mb-2">家长中心</h1>
        <p className="text-[var(--color-muted)] mb-6">登录后使用家长功能</p>
        <Link href="/login" className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold">登录</Link>
      </div>
    );
  }

  if (loading) return <div className="mx-auto max-w-7xl px-4 py-8"><div className="animate-pulse text-[var(--color-muted)]">加载中...</div></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">👨‍👩‍👧 家长中心</h1>

      {user?.role === 'STUDENT' && (
        <div className="bg-[var(--color-surface)] rounded-xl p-6 border border-[var(--color-border)] max-w-md">
          <h2 className="font-semibold mb-3">生成绑定码</h2>
          <p className="text-sm text-[var(--color-muted)] mb-3">让家长输入此绑定码即可关注你的训练进度</p>
          {bindCode ? (
            <div className="bg-[var(--color-background)] rounded-lg p-4 text-center">
              <div className="text-3xl font-mono font-bold text-[var(--color-primary)]">{bindCode}</div>
              <p className="text-xs text-[var(--color-muted)] mt-1">将此码发送给家长</p>
            </div>
          ) : (
            <button onClick={handleGenerateCode} className="px-6 py-3 rounded-xl bg-[var(--color-primary)] text-[var(--color-background)] font-semibold text-sm">
              生成绑定码
            </button>
          )}
        </div>
      )}

      {user?.role === 'PARENT' && (
        <div className="space-y-6">
          {/* Bind child */}
          <div className="bg-[var(--color-surface)] rounded-xl p-5 border border-[var(--color-border)] max-w-md">
            <h2 className="font-semibold mb-3">绑定孩子</h2>
            <div className="flex gap-2">
              <input value={inputCode} onChange={e => setInputCode(e.target.value)} placeholder="输入绑定码"
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
              <button onClick={handleBind} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] text-sm font-semibold">绑定</button>
            </div>
            {message && <p className="text-sm mt-2">{message}</p>}
          </div>

          {/* Children list */}
          <div>
            <h2 className="font-semibold mb-3">我的孩子</h2>
            {children.length === 0 ? (
              <p className="text-[var(--color-muted)] text-sm">还没有绑定孩子</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {children.map((c: any) => (
                  <div key={c.id} className="bg-[var(--color-surface)] rounded-xl p-4 border border-[var(--color-border)]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center font-bold text-sm">
                        {c.nickname?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium">{c.nickname}</div>
                        <div className="text-xs text-[var(--color-muted)]">连续训练 {c.studentProfile?.streakDays || 0} 天 🔥</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center text-sm">
                      <div className="bg-[var(--color-background)] rounded-lg p-2">
                        <div className="text-xs text-[var(--color-muted)]">PB</div>
                        <div className="font-mono text-[var(--color-primary)]">{formatTime(c.studentProfile?.bestSingleMs)}</div>
                      </div>
                      <div className="bg-[var(--color-background)] rounded-lg p-2">
                        <div className="text-xs text-[var(--color-muted)]">ao5</div>
                        <div className="font-mono text-[var(--color-accent-green)]">{formatTime(c.studentProfile?.bestAo5Ms)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
