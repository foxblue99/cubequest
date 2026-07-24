'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';

type Tab = 'coach' | 'formulas' | 'predict' | 'chat';

export default function AiPage() {
  const [tab, setTab] = useState<Tab>('coach');
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  // Separate state per tab
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState('');
  const [formulaLoading, setFormulaLoading] = useState(false);
  const [formulaResult, setFormulaResult] = useState('');
  const [predLoading, setPredLoading] = useState(false);
  const [predResult, setPredResult] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([]);
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState(20);

  const apiCall = async (endpoint: string, body: any, setLoad: (v: boolean) => void) => {
    setLoad(true);
    try {
      const userId = getAuth()?.user?.id;
      const res = await fetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, userId }),
      });
      return await res.json();
    } finally { setLoad(false); }
  };

  const tabs = [
    { key: 'coach' as Tab, icon: '🧠', label: 'AI 教练' },
    { key: 'formulas' as Tab, icon: '🔤', label: '公式推荐' },
    { key: 'predict' as Tab, icon: '🔮', label: '进度预测' },
    { key: 'chat' as Tab, icon: '💬', label: '阿拉魔神丁' },
  ];

  if (!hydrated) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tighter mb-2">🤖 AI 智能中心</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">AI 教练分析 · 智能推荐 · 进度预测 · 阿拉魔神丁对话</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              tab === t.key ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
        {/* ── AI 教练 ── */}
        {tab === 'coach' && (
          <div>
            <h2 className="text-lg font-bold mb-3">🧠 AI 智能教练</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">基于你的训练数据，AI 教练会给出个性化分析报告和训练建议。</p>
            <button onClick={async () => {
              const d = await apiCall('coach', {}, setCoachLoading);
              if (d?.advice) setCoachResult(d.advice);
            }} disabled={coachLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
              {coachLoading ? '⏳ AI 分析中...' : '🚀 生成训练报告'}
            </button>
            {coachResult && <div className="mt-4 p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{coachResult}</div>}
          </div>
        )}

        {/* ── 公式推荐 ── */}
        {tab === 'formulas' && (
          <div>
            <h2 className="text-lg font-bold mb-3">🔤 AI 公式推荐</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">AI 会根据你的水平和已有公式库，智能推荐下一步该学的公式。</p>
            <button onClick={async () => {
              const d = await apiCall('recommend-formulas', {}, setFormulaLoading);
              if (d?.recommendation) setFormulaResult(d.recommendation);
            }} disabled={formulaLoading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
              {formulaLoading ? '⏳ 分析中...' : '🎯 推荐公式'}
            </button>
            {formulaResult && <div className="mt-4 p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{formulaResult}</div>}
          </div>
        )}

        {/* ── 进度预测 ── */}
        {tab === 'predict' && (
          <div>
            <h2 className="text-lg font-bold mb-3">🔮 进度预测</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">基于你的训练频率和 PB 趋势，预测达到目标时间需要多久。</p>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm">目标：Sub</span>
              <input type="number" value={target} onChange={e => setTarget(+e.target.value)}
                className="w-20 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm text-center" />
              <span className="text-sm">秒</span>
              <button onClick={async () => {
                const d = await apiCall('predict', { targetSeconds: target }, setPredLoading);
                if (d?.prediction) setPredResult(d.prediction);
              }} disabled={predLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">
                {predLoading ? '⏳' : '🔮 预测'}
              </button>
            </div>
            {predResult && <div className="p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{predResult}</div>}
          </div>
        )}

        {/* ── 阿拉魔神丁 ── */}
        {tab === 'chat' && (
          <div>
            <h2 className="text-lg font-bold mb-3">💬 阿拉魔神丁</h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">任何魔方问题都可以问神丁：手法、公式、比赛、调试...</p>
            {chatHistory.map((msg, i) => (
              <div key={i} className={`mb-3 p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-[var(--color-primary)]/10 ml-8' : 'bg-[var(--color-background)] mr-8'}`}>
                <span className="text-xs text-[var(--color-muted)]">{msg.role === 'user' ? '你' : '🧞 阿拉魔神丁'}</span>
                <p className="mt-1 whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <input value={message} onChange={e => setMessage(e.target.value)}
                onKeyDown={async e => { if (e.key === 'Enter' && message.trim()) {
                  const um = message.trim(); setChatHistory(p => [...p, { role: 'user', content: um }]); setMessage('');
                  const d = await apiCall('chat', { message: um }, setChatLoading);
                  setChatHistory(p => [...p, { role: 'assistant', content: d?.reply || '...' }]);
                }}}
                placeholder="问阿拉魔神丁任何魔方问题..."
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
              <button onClick={async () => {
                if (!message.trim()) return;
                const um = message.trim(); setChatHistory(p => [...p, { role: 'user', content: um }]); setMessage('');
                const d = await apiCall('chat', { message: um }, setChatLoading);
                setChatHistory(p => [...p, { role: 'assistant', content: d?.reply || '...' }]);
              }} disabled={chatLoading}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm disabled:opacity-50">
                {chatLoading ? '...' : '发送'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
