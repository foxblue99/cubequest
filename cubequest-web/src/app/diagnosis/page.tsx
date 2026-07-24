'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const STAGE_BADGES: Record<string, string> = {
  FOUNDATION: '🌱 地基期',
  GROWTH: '🌿 成长期',
  REFINEMENT: '🧩 精进期',
  MASTERY: '💎 大师期',
  ELITE: '👑 精英期',
};

export default function DiagnosisPage() {
  const [radar, setRadar] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [advice, setAdvice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const auth = getAuth();

  useEffect(() => { setHydrated(true); load(); }, []);

  const load = async () => {
    const h: Record<string, string> = {};
    if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
    // V3.6.1: 全部改用 SkillEngine 的端点，不再调用旧的 /api/ai/ability-score
    // （旧接口和 SkillCard 首页卡片用的不是同一套数据/维度，会导致两处显示不一致、
    //  而且雷达图只画 Cross/F2L/OLL/PLL 四个必须靠手动分段计时才有数据的维度，
    //  绝大多数用户从来不点分段，图会长期"塌"在中心，看起来像坏了）
    const [radarR, diagR, adviceR] = await Promise.all([
      fetch('/api/ai/skill/radar', { headers: h }),
      fetch('/api/ai/skill/diagnosis', { headers: h }),
      fetch('/api/ai/skill/advice', { headers: h }),
    ]);
    setRadar(radarR.ok ? await radarR.json() : null);
    setDiagnosis(diagR.ok ? await diagR.json() : null);
    setAdvice(adviceR.ok ? await adviceR.json() : null);
    setLoading(false);
  };

  if (!hydrated) return null;
  if (!auth) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-[var(--color-muted)]">请先登录</div>;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-sm text-[var(--color-muted)]">加载中...</div>;

  // radar.radarData 已经是后端按"有数据的维度才展示"动态拼好的 [{name,value}] 数组
  // （速度/稳定性/训练量/成长 这几维不需要分段计时也能算，Cross/F2L/OLL/PLL 只有真的做过
  //  分段记录才会被加进来），不需要在前端再自己拼固定的五维数组。
  const hasRadar = !!radar?.radarData?.length;
  const stageLabel = radar?.stage ? (STAGE_BADGES[radar.stage] || radar.stage) : '';

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">🔬 弱项诊断</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">精准定位你的瓶颈，AI 给出针对性训练建议</p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar chart */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">🎯 能力雷达图</h3>
            {radar?.growthScore !== undefined && (
              <span className="text-xs text-[var(--color-muted)]">
                {stageLabel} · Growth Score {radar.growthScore}
                {typeof radar.confidence === 'number' && (
                  <span className="ml-1">
                    · 可信度 {radar.confidence}%
                  </span>
                )}
              </span>
            )}
          </div>

          {hasRadar ? (
            <div style={{ width: '100%', height: 280 }}>
              <ResponsiveContainer>
                <RadarChart data={radar.radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="能力" dataKey="value" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-[var(--color-muted)] text-center px-6">
              完成第一次计时训练后，这里就会显示你的能力雷达图 📊
              <br />
              （Cross / F2L / OLL / PLL 几个维度需要你在计时时手动记录分段，才会额外出现在图上）
            </div>
          )}

          {radar?.weakestSkill?.name && (
            <div className="mt-3 text-xs rounded-lg px-3 py-2" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
              💡 目前相对薄弱的是「{radar.weakestSkill.name}」，看看下面 AI 给出的针对性训练建议
            </div>
          )}
        </div>

        {/* Diagnosis text */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <h3 className="font-bold text-sm mb-3">🧠 诊断结果</h3>
          {diagnosis?.summary ? (
            <>
              <div className="text-sm leading-relaxed mb-3">{diagnosis.summary}</div>
              {diagnosis.stageSummary && (
                <div className="text-xs text-[var(--color-muted)] mb-4">{diagnosis.stageSummary}</div>
              )}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="font-bold mb-1 text-emerald-400">✓ 优势</div>
                  {(diagnosis.strengths || []).map((s: string, i: number) => (
                    <div key={i} className="text-[var(--color-muted)] mb-1">{s}</div>
                  ))}
                </div>
                <div>
                  <div className="font-bold mb-1 text-amber-400">⚠ 待加强</div>
                  {(diagnosis.weaknesses || []).map((s: string, i: number) => (
                    <div key={i} className="text-[var(--color-muted)] mb-1">{s}</div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-[var(--color-muted)]">暂无诊断数据，多练几次再来看看</div>
          )}
        </div>
      </div>

      {/* AI advice / training plan */}
      {advice?.focusArea && (
        <div className="mt-6 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
          <h3 className="font-bold text-sm mb-3">🏋️ 针对性训练建议</h3>
          <div className="text-sm mb-3">
            <span className="font-bold text-cyan-400">专项：{advice.focusArea}</span>
            {advice.aiMessage && <span className="ml-2 text-[var(--color-muted)]">{advice.aiMessage}</span>}
          </div>
          <ul className="text-sm space-y-1 mb-3">
            {(advice.drills || []).map((d: string, i: number) => (
              <li key={i} className="text-[var(--color-muted)]">· {d}</li>
            ))}
          </ul>
          <div className="text-xs text-[var(--color-muted)]">
            {advice.nextMilestone} · 预计 {advice.estimatedWeeks} 周达成
          </div>
        </div>
      )}
    </div>
  );
}
