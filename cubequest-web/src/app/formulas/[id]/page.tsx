'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Formula, FormulaStatus } from '@/types';
import { api } from '@/lib/api';
import { getFormulaCategoryLabel, cn } from '@/lib/utils';
import { parseMoves } from '@/lib/scramble';

const STATUS_CONFIG: Record<
  FormulaStatus,
  { label: string; className: string }
> = {
  NOT_LEARNED: {
    label: '未学习',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
  LEARNING: {
    label: '学习中',
    className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  MASTERED: {
    label: '已掌握',
    className: 'bg-green-500/20 text-green-400 border-green-500/30',
  },
  NEED_REVIEW: {
    label: '待复习',
    className: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  },
};

const CATEGORY_COLORS: Record<string, string> = {
  LBL: 'bg-purple-500/20 text-purple-400',
  CROSS: 'bg-cyan-500/20 text-cyan-400',
  F2L: 'bg-emerald-500/20 text-emerald-400',
  OLL: 'bg-yellow-500/20 text-yellow-400',
  PLL: 'bg-pink-500/20 text-pink-400',
  ADVANCED: 'bg-red-500/20 text-red-400',
};

export default function FormulaDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [formula, setFormula] = useState<Formula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favAnimating, setFavAnimating] = useState(false);
  const [practicing, setPracticing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getFormula(params.id);
        const f = (data as unknown as { formula: Formula }).formula;
        if (!f) {
          if (!cancelled) setError('公式不存在');
          return;
        }
        if (!cancelled) {
          setFormula(f);
          setIsFavorite(f.isFavorite ?? false);
        }
      } catch (err) {
        if (!cancelled) {
          if (
            err instanceof Error &&
            (err as { status?: number }).status === 404
          ) {
            setError('公式不存在');
          } else {
            setError(
              err instanceof Error ? err.message : '加载失败，请稍后重试'
            );
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [params.id]);

  const handleFavoriteToggle = useCallback(async () => {
    if (!formula) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 300);
    try {
      await api.toggleFavorite(formula.id, next);
    } catch {
      setIsFavorite(!next);
    }
  }, [formula, isFavorite]);

  const handleStartPractice = useCallback(async () => {
    if (!formula || practicing) return;
    setPracticing(true);
    try {
      await api.updateFormulaProgress(formula.id, { status: 'LEARNING' });
      setFormula((prev) =>
        prev ? { ...prev, status: 'LEARNING' as FormulaStatus } : null
      );
    } catch {
      // Silently fail; user can retry
    } finally {
      setPracticing(false);
    }
  }, [formula, practicing]);

  // ---- Loading State ----
  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-8 animate-pulse">
          <div className="mb-6">
            <div className="h-4 w-20 bg-[var(--color-border)] rounded mb-4" />
            <div className="h-8 w-64 bg-[var(--color-border)] rounded mb-2" />
            <div className="h-5 w-40 bg-[var(--color-border)] rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-40 bg-[var(--color-border)] rounded-xl" />
              <div className="h-32 bg-[var(--color-border)] rounded-xl" />
            </div>
            <div className="h-60 bg-[var(--color-border)] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // ---- Error / Not Found State ----
  if (error || !formula) {
    return (
      <div className="min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <span className="text-5xl block mb-4">🧩</span>
          <h2 className="text-xl font-bold mb-2">
            {error === '公式不存在' ? '公式不存在' : '加载失败'}
          </h2>
          <p className="text-sm text-[var(--color-muted)] mb-6">
            {error === '公式不存在'
              ? '该公式可能已被删除或链接无效'
              : '请检查网络连接后重试'}
          </p>
          <div className="flex items-center justify-center gap-3">
            {error !== '公式不存在' && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-light)] transition-colors text-sm"
              >
                🔄 重新加载
              </button>
            )}
            <Link
              href="/formulas"
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] hover:bg-[var(--color-primary-dark)] transition-colors text-sm font-medium"
            >
              ← 返回公式库
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const moves = parseMoves(formula.moves);
  const status = formula.status ?? 'NOT_LEARNED';
  const statusConfig = STATUS_CONFIG[status];
  const catColor =
    CATEGORY_COLORS[formula.category] ??
    'bg-slate-500/20 text-slate-400';

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            href="/formulas"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors inline-flex items-center gap-1"
          >
            ← 返回公式库
          </Link>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold">
              {formula.name}
            </h1>
            <button
              onClick={handleFavoriteToggle}
              aria-label={isFavorite ? '取消收藏' : '收藏'}
              className={cn(
                'shrink-0 p-1.5 rounded-lg transition-all duration-200',
                'hover:bg-red-500/10',
                favAnimating && 'scale-125'
              )}
            >
              <span
                className={cn(
                  'text-xl transition-colors duration-200',
                  isFavorite ? 'text-red-400' : 'text-[var(--color-muted)]'
                )}
              >
                {isFavorite ? '❤️' : '🤍'}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium',
                catColor
              )}
            >
              {getFormulaCategoryLabel(formula.category)}
            </span>
            {formula.caseCode && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[var(--color-surface)] text-[var(--color-muted)] border border-[var(--color-border)]">
                {formula.caseCode}
              </span>
            )}
            <span className="flex items-center gap-0.5 text-sm">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    i < formula.difficulty
                      ? 'text-yellow-400'
                      : 'text-[var(--color-border)]'
                  )}
                >
                  ★
                </span>
              ))}
            </span>
            <span
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium border',
                statusConfig.className
              )}
            >
              {statusConfig.label}
            </span>
          </div>

          {formula.description && (
            <p className="text-sm text-[var(--color-muted)] leading-relaxed max-w-2xl">
              {formula.description}
            </p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Moves + Mistakes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Moves Section */}
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-4">
                📐 公式步骤
              </h2>
              <div className="flex flex-wrap gap-2">
                {moves.map((move, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg text-sm font-mono font-semibold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                  >
                    {move}
                  </span>
                ))}
              </div>
              {moves.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">
                  暂无步骤信息
                </p>
              )}
            </section>

            {/* Common Mistakes Section */}
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <h2 className="text-sm font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-4">
                ⚠️ 常见错误
              </h2>
              {formula.commonMistakes ? (
                <div className="prose prose-invert max-w-none">
                  {formula.commonMistakes.split('\n').map((line, i) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    return (
                      <p
                        key={i}
                        className="text-sm text-[var(--color-muted)] leading-relaxed mb-2 last:mb-0"
                      >
                        {trimmed}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-muted)]">
                  暂无常见错误记录
                </p>
              )}
            </section>
          </div>

          {/* Right Column: 3D Preview + Actions */}
          <div className="space-y-6">
            {/* 3D Demo Placeholder */}
            <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
              <div className="p-3 border-b border-[var(--color-border)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-[var(--color-muted)] ml-2">
                  3D 演示
                </span>
              </div>
              <div className="aspect-square flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[var(--color-background)] to-[var(--color-surface)]">
                <span className="text-5xl mb-3">🧊</span>
                <p className="text-sm text-[var(--color-muted)] text-center">
                  3D 魔方演示
                </p>
                <p className="text-xs text-[var(--color-muted)]/60 text-center mt-1">
                  即将上线
                </p>
              </div>
            </section>

            {/* Actions */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
              {/* Practice Button */}
              <button
                onClick={handleStartPractice}
                disabled={practicing || status === 'MASTERED'}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200',
                  'flex items-center justify-center gap-2',
                  status === 'MASTERED'
                    ? 'bg-green-500/20 text-green-400 cursor-not-allowed'
                    : status === 'LEARNING'
                      ? 'bg-blue-500/20 text-blue-400 cursor-default'
                      : 'bg-[var(--color-primary)] text-[var(--color-background)] hover:bg-[var(--color-primary-dark)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20'
                )}
              >
                {practicing ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    记录中...
                  </>
                ) : status === 'MASTERED' ? (
                  <>
                    ✅ 已掌握
                  </>
                ) : status === 'LEARNING' ? (
                  <>
                    📖 学习中
                  </>
                ) : (
                  <>
                    🏋️ 开始练习
                  </>
                )}
              </button>

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => router.push('/training/timer')}
                  className="py-2.5 rounded-lg text-sm font-medium bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-light)] border border-[var(--color-border)] transition-colors"
                >
                  ⏱️ 计时训练
                </button>
                <Link
                  href="/courses"
                  className="py-2.5 rounded-lg text-sm font-medium bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-light)] border border-[var(--color-border)] transition-colors text-center"
                >
                  📖 学习课程
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
