'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Formula, FormulaStatus } from '@/types';
import { getFormulaCategoryLabel, cn } from '@/lib/utils';
import { parseMoves } from '@/lib/scramble';

interface FormulaCardProps {
  formula: Formula;
  onFavoriteToggle?: (id: string, favorite: boolean) => void;
}

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

export default function FormulaCard({
  formula,
  onFavoriteToggle,
}: FormulaCardProps) {
  const [isFavorite, setIsFavorite] = useState(formula.isFavorite ?? false);
  const [favAnimating, setFavAnimating] = useState(false);

  const moves = parseMoves(formula.moves);
  const status = formula.status ?? 'NOT_LEARNED';
  const statusConfig = STATUS_CONFIG[status];
  const catColor =
    CATEGORY_COLORS[formula.category] ??
    'bg-slate-500/20 text-slate-400';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isFavorite;
    setIsFavorite(next);
    setFavAnimating(true);
    setTimeout(() => setFavAnimating(false), 300);
    onFavoriteToggle?.(formula.id, next);
  };

  return (
    <Link
      href={`/formulas/${formula.id}`}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] p-4 transition-all duration-200',
        'hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:shadow-[var(--color-primary)]/5',
        'hover:-translate-y-0.5'
      )}
    >
      {/* Header row: name + favorite */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate group-hover:text-[var(--color-primary)] transition-colors">
            {formula.name}
          </h3>
          {formula.caseCode && (
            <span className="text-xs text-[var(--color-muted)] font-mono">
              {formula.caseCode}
            </span>
          )}
        </div>
        <button
          onClick={handleFavoriteClick}
          aria-label={isFavorite ? '取消收藏' : '收藏'}
          className={cn(
            'shrink-0 p-1 rounded-lg transition-all duration-200',
            'hover:bg-red-500/10',
            favAnimating && 'scale-125'
          )}
        >
          <span
            className={cn(
              'text-lg transition-colors duration-200',
              isFavorite ? 'text-red-400' : 'text-[var(--color-muted)]'
            )}
          >
            {isFavorite ? '❤️' : '🤍'}
          </span>
        </button>
      </div>

      {/* Moves preview */}
      <div className="flex flex-wrap gap-1">
        {moves.slice(0, 8).map((move, i) => (
          <span
            key={i}
            className="px-1.5 py-0.5 rounded text-xs font-mono bg-[var(--color-background)] text-[var(--color-muted)]"
          >
            {move}
          </span>
        ))}
        {moves.length > 8 && (
          <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-[var(--color-background)] text-[var(--color-muted)]">
            +{moves.length - 8}
          </span>
        )}
      </div>

      {/* Bottom row: category badge, difficulty stars, status */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn(
            'px-2 py-0.5 rounded-md text-[10px] font-medium',
            catColor
          )}
        >
          {getFormulaCategoryLabel(formula.category)}
        </span>

        <span className="flex items-center gap-0.5 text-xs" title={`难度 ${formula.difficulty}/5`}>
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
            'ml-auto px-2 py-0.5 rounded-md text-[10px] font-medium border',
            statusConfig.className
          )}
        >
          {statusConfig.label}
        </span>
      </div>
    </Link>
  );
}
