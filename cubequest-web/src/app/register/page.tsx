
'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { setAuth } from '@/lib/auth';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 70 }, (_, i) => CURRENT_YEAR - i);

export default function RegisterPage() {
  const [role, setRole] = useState<'STUDENT'|'PARENT'>('STUDENT');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState<number|undefined>();
  const [city, setCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): string|null => {
    if (!/^\d{11}$/.test(phone.trim())) return '手机号须为 11 位数字';
    if (!password || password.length < 6) return '密码至少 6 位';
    if (!nickname.trim()) return '请输入昵称';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault(); setError('');
    const ve = validate(); if (ve) { setError(ve); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, phone: phone.trim(), password, nickname: nickname.trim(), birthYear: birthYear ?? undefined, city: city.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '注册失败');
      setAuth({ token: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user });
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent pointer-events-none" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3"><span className="text-3xl">🧊</span><span className="text-2xl font-bold gradient-text">魔方远征</span></Link>
          <p className="text-[var(--color-muted)] text-sm">创建账号，开启你的魔方远征</p>
        </div>
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-2">角色</label>
              <div className="grid grid-cols-2 gap-2">
                {[{v:'STUDENT',l:'🧑‍🎓 学生'},{v:'PARENT',l:'👨‍👩‍👧 家长'}].map(r=>(
                  <button key={r.v} type="button" onClick={()=>setRole(r.v as any)}
                    className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${role===r.v?'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]':'bg-[var(--color-background)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)]'}`}>
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
            {[
              {id:'r-p',label:'手机号',type:'tel',val:phone,set:(v:string)=>setPhone(v.replace(/\D/g,'')),pl:'请输入 11 位手机号',max:11},
              {id:'r-pw',label:'密码',type:'password',val:password,set:setPassword,pl:'至少 6 位密码'},
              {id:'r-n',label:'昵称 *',type:'text',val:nickname,set:setNickname,pl:'输入你的昵称'},
            ].map(f=>(
              <div key={f.id}>
                <label htmlFor={f.id} className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">{f.label}</label>
                <input id={f.id} type={f.type as any} inputMode={f.type==='tel'?'numeric':undefined}
                  maxLength={f.max} value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.pl}
                  className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] text-sm"
                  autoComplete={f.type==='tel'?'tel':f.type==='password'?'new-password':'nickname'} />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">出生年份 <span className="text-[var(--color-muted)] text-xs">（选填）</span></label>
              <select value={birthYear??''} onChange={e=>setBirthYear(e.target.value?Number(e.target.value):undefined)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] focus:outline-none focus:border-[var(--color-primary)] text-sm appearance-none cursor-pointer">
                <option value="">选择年份</option>
                {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">所在城市 <span className="text-[var(--color-muted)] text-xs">（选填）</span></label>
              <input type="text" value={city} onChange={e=>setCity(e.target.value)} placeholder="例如：北京"
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] text-sm" />
            </div>
            {error && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-semibold text-sm hover:bg-[var(--color-primary-dark)] transition-colors disabled:opacity-50">
              {loading?'注册中...':'🚀 创建账号'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-[var(--color-muted)] mt-5">已有账号？ <Link href="/login" className="text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] font-medium">立即登录</Link></p>
      </div>
    </div>
  );
}
