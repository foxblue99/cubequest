'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/utils';
import type { Course } from '@/types';
import { CourseCategory } from '@/types';

const CATEGORY_COLORS: Record<string, string> = {
  [CourseCategory.BEGINNER]: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  [CourseCategory.CFOP_BASIC]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [CourseCategory.SUB30]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  [CourseCategory.SUB20]: 'bg-red-500/20 text-red-400 border-red-500/30',
  [CourseCategory.F2L]: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  [CourseCategory.OLL]: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  [CourseCategory.PLL]: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const CATEGORY_ICONS: Record<string, string> = {
  [CourseCategory.BEGINNER]: '🏕️',
  [CourseCategory.CFOP_BASIC]: '🧩',
  [CourseCategory.SUB30]: '⚡',
  [CourseCategory.SUB20]: '🔥',
  [CourseCategory.F2L]: '🌳',
  [CourseCategory.OLL]: '🏛️',
  [CourseCategory.PLL]: '⚔️',
};

const LEVEL_LABELS: Record<string, string> = {
  NEWBIE: '新手',
  BEGINNER: '初级',
  INTERMEDIATE: '中级',
  ADVANCED: '高级',
  EXPERT: '专家',
};

interface CourseCardProps {
  course: Course;
  className?: string;
}

export default function CourseCard({ course, className }: CourseCardProps) {
  const {
    id,
    title,
    summary,
    coverUrl,
    category,
    level,
    lessons,
    progress = 0,
    isPaid,
  } = course;

  const lessonCount = lessons?.length ?? 0;
  const categoryColor = CATEGORY_COLORS[category] ?? CATEGORY_COLORS[CourseCategory.BEGINNER];
  const categoryIcon = CATEGORY_ICONS[category] ?? '📖';
  const levelLabel = level ? (LEVEL_LABELS[level] ?? level) : null;

  return (
    <Link
      href={`/courses/${id}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-[var(--color-border)]',
        'bg-[var(--color-surface)] hover:border-[var(--color-primary)]/40',
        'transition-all duration-200 hover:shadow-lg hover:shadow-[var(--color-primary)]/5',
        'overflow-hidden',
        className
      )}
    >
      {/* Cover Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl opacity-40">
            {categoryIcon}
          </div>
        )}

        {/* Paid Badge */}
        {isPaid && (
          <span className="absolute top-2 right-2 rounded-md bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black">
            PRO
          </span>
        )}

        {/* Category Badge */}
        <span
          className={cn(
            'absolute bottom-2 left-2 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
            categoryColor
          )}
        >
          {getCategoryLabel(category)}
        </span>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-primary)] transition-colors line-clamp-2">
          {title}
        </h3>

        {/* Summary */}
        {summary && (
          <p className="text-xs text-[var(--color-muted)] line-clamp-2 leading-relaxed">
            {summary}
          </p>
        )}

        {/* Meta row */}
        <div className="mt-auto flex items-center gap-3 pt-1">
          {levelLabel && (
            <span className="rounded-md bg-[var(--color-background)] px-2 py-0.5 text-[11px] text-[var(--color-muted)]">
              {levelLabel}
            </span>
          )}
          {lessonCount > 0 && (
            <span className="text-[11px] text-[var(--color-muted)]">
              📚 {lessonCount} 课时
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--color-muted)] mb-1">
            <span>学习进度</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-background)]">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                progress >= 100
                  ? 'bg-[var(--color-accent-green)]'
                  : progress > 0
                    ? 'bg-[var(--color-primary)]'
                    : 'bg-transparent'
              )}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
