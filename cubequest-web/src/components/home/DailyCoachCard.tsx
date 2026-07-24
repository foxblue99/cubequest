'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';

interface Mission { title: string; done: boolean }

/* ── Edge current lines ── */
const EdgeLines = () => <>
  <div className="absolute top-0 left-2 right-2 h-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out infinite' }} />
  <div className="absolute top-2 bottom-2 right-0 w-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 0.5s infinite' }} />
  <div className="absolute bottom-0 left-2 right-2 h-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(90deg, transparent, rgba(168,85,247,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1s infinite' }} />
  <div className="absolute top-2 bottom-2 left-0 w-px rounded-full opacity-70"
    style={{ background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.6), transparent)', animation: 'edgeFlow 2s ease-in-out 1.5s infinite' }} />
  <div className="absolute top-0 left-0 w-2 h-2 bg-purple-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out infinite'}} />
  <div className="absolute top-0 right-0 w-2 h-2 bg-purple-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out .7s infinite'}} />
  <div className="absolute bottom-0 right-0 w-2 h-2 bg-purple-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out 1.3s infinite'}} />
  <div className="absolute bottom-0 left-0 w-2 h-2 bg-purple-400/20 rounded-full blur-sm" style={{animation:'pulse 2s ease-in-out .3s infinite'}} />
</>;

export default function DailyCoachCard() {
  const [missions, setMissions] = useState<Mission[]|null>(null);
  const [aiReason, setAiReason] = useState('');
  const [xpReward, setXpReward] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [hint, setHint] = useState('');
  const [coachMessage, setCoachMessage] = useState('');
  const [completionFeedback, setCompletionFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const auth = getAuth();
  const post = async (url: string, body: any = {}) => {
    const h: Record<string,string> = {'Content-Type':'application/json'};
    if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
    const r = await fetch(url, { method:'POST', headers:h, body:JSON.stringify(body) });
    return r.json();
  };

  useEffect(() => { setHydrated(true); if (auth?.token) loadToday(); }, []);

  const loadToday = async () => {
    try {
      const h: Record<string,string> = {};
      if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
      const r = await fetch('/api/daily-coach/today', { headers: h });
      const d = await r.json();
      if (d.missions) { setMissions(d.missions); setAiReason(d.aiReason); setXpReward(d.xpReward); setCompleted(d.completed); setCoachMessage(d.coachMessage||''); setCompletionFeedback(d.completionFeedback||''); }
      else setHint(d.hint);
    } catch {}
  };

  const generate = async () => {
    setLoading(true);
    const d = await post('/api/daily-coach/generate');
    if (d.missions) { setMissions(d.missions); setAiReason(d.aiReason); setXpReward(d.xpReward); setCompleted(false); setHint(''); setCoachMessage(d.coachMessage||''); }
    setLoading(false);
  };

  const complete = async (index: number) => {
    const d = await post(`/api/daily-coach/${index}/complete`, { done: true });
    if (d.missions) { setMissions(d.missions); setCompleted(d.completed); setCompletionFeedback(d.completionFeedback||''); }
  };

  if (!hydrated || !auth?.token) return null;

  return (
    <div className="relative rounded-2xl bg-white/[0.02] backdrop-blur-2xl border border-white/[0.06] overflow-hidden">
      <EdgeLines />
      <div className="relative z-10 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-sm">🤖</span>
          <h3 className="font-black text-[11px] tracking-wider bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
            神丁 · 每日教练
          </h3>
          {!completed && missions && <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded-full ml-auto">+{xpReward}</span>}
          {completed && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full ml-auto">✅</span>}
        </div>

        {missions ? (
          <>
            {coachMessage && <p className="text-[10px] text-amber-300/80 italic mb-2">💬 {coachMessage}</p>}
            {aiReason && <p className="text-[9px] text-white/30 italic mb-2 border-l-2 border-purple-500/30 pl-2">💡 {aiReason}</p>}
            <div className="space-y-1">
              {missions.map((m, i) => (
                <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded-lg border transition-colors ${m.done ? 'bg-green-500/[0.04] border-green-500/20' : 'hover:bg-white/[0.02] border-transparent'}`}>
                  <button
                    onClick={() => !m.done && complete(i)}
                    disabled={m.done}
                    className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px] flex-shrink-0 transition ${m.done ? 'bg-green-500 border-green-500 text-white' : 'border-white/15 hover:border-purple-400/60'}`}
                  >
                    {m.done ? '✓' : ''}
                  </button>
                  <span className={`text-[11px] flex-1 ${m.done ? 'line-through text-white/20' : 'text-white/70'}`}>{m.title}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-2">
            <p className="text-[10px] text-white/25 mb-2">{hint}</p>
            <button onClick={generate} disabled={loading}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-purple-500/20 text-white text-[11px] font-bold rounded-lg hover:scale-105 hover:border-purple-400/40 transition disabled:opacity-50"
            >
              {loading ? '生成中...' : '✨ 生成今日任务'}
            </button>
          </div>
        )}

        {missions && !completed && (
          <p className="text-[9px] text-white/20 mt-2 text-center">完成全部获得 {xpReward} XP</p>
        )}

        {completionFeedback && (
          <div className="mt-2 p-2 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-[10px] text-green-400">{completionFeedback}</p>
          </div>
        )}
      </div>
    </div>
  );
}
