'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';

export default function DailyChallengePage() {
  const [data, setData] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState('');
  const auth = getAuth();

  useEffect(()=>{load();},[]);
  const load = async()=>{
    const r = await fetch('/api/daily-challenge');
    setData(await r.json());
  };
  const submit = async()=>{
    if(!auth||!time)return;
    const ms = parseFloat(time)*1000;
    if(isNaN(ms))return;
    await fetch('/api/daily-challenge/submit',{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${auth.token}`},
      body:JSON.stringify({timeMs:Math.round(ms)}),
    });
    setSubmitted(true);
    load();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">🔥 每日神单</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">全站统一打乱，比拼今日最佳</p>

      {data && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-amber-400 font-mono text-lg mb-2">{data.scramble}</div>
            <div className="text-[10px] text-[var(--color-muted)]">{data.date}</div>
          </div>

          {auth ? (
            submitted ? (
              <div className="text-center text-sm text-amber-400">✅ 已提交！刷新查看排名</div>
            ) : (
              <div className="flex gap-2 justify-center">
                <input value={time} onChange={e=>setTime(e.target.value)}
                  placeholder="输入成绩（秒）" className="px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm w-40 text-center" />
                <button onClick={submit} className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm">提交</button>
              </div>
            )
          ) : (
            <div className="text-center text-sm text-[var(--color-muted)]">
              <Link href="/login" className="text-cyan-400 hover:underline">登录</Link> 后参与每日神单
            </div>
          )}
        </div>
      )}

      {data?.leaderboard?.length > 0 && (
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <h2 className="font-bold mb-4">🏆 今日排行榜</h2>
          <div className="space-y-2">
            {data.leaderboard.map((e:any,i:number)=>(
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-background)]/50">
                <span className={`w-6 text-center font-bold text-sm ${i===0?'text-amber-400':i===1?'text-gray-300':i===2?'text-orange-400':'text-[var(--color-muted)]'}`}>
                  {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${e.rank}`}
                </span>
                <span className="flex-1 text-sm">{e.nickname}</span>
                <span className="font-mono text-sm font-bold text-[var(--color-primary)]">{e.best}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
