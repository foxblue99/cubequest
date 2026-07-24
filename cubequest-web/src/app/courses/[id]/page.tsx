'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getCategoryLabel } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import type { Course, Lesson } from '@/types';
import { LessonType } from '@/types';

const LESSON_TYPE_ICONS: Record<string, string> = {
  [LessonType.VIDEO]: '🎬',
  [LessonType.ARTICLE]: '📄',
  [LessonType.INTERACTIVE]: '🎮',
  [LessonType.QUIZ]: '📝',
};

const LESSON_TYPE_LABELS: Record<string, string> = {
  [LessonType.VIDEO]: '视频',
  [LessonType.ARTICLE]: '文章',
  [LessonType.INTERACTIVE]: '互动',
  [LessonType.QUIZ]: '测验',
};

interface LessonWithProgress extends Lesson {
  completed?: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completingId, setCompletingId] = useState<string | null>(null);

  const fetchCourseData = useCallback(async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.getCourse(courseId),
        api.getCourseLessons(courseId),
      ]);

      const courseData = (courseRes as unknown as { course: Course }).course;
      const lessonsData = (lessonsRes as unknown as { lessons: Lesson[] }).lessons ?? [];

      setCourse(courseData);
      setLessons(
        lessonsData
          .filter((l) => l.published)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((l) => ({ ...l, completed: false }))
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('课程不存在');
        } else {
          setError(err.message);
        }
      } else {
        setError('加载课程失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourseData();
  }, [fetchCourseData]);

  const handleCompleteLesson = async (lessonId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setCompletingId(lessonId);
    try {
      await api.completeLesson(lessonId);
      setLessons((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, completed: true } : l))
      );
    } catch {
      // Silently fail — completion state is optimistic
    } finally {
      setCompletingId(null);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <CourseDetailSkeleton />
      </div>
    );
  }

  // Error
  if (error || !course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">😵</span>
          <p className="text-[var(--color-muted)] mb-4">{error || '课程加载失败'}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchCourseData}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm hover:bg-[var(--color-primary)]/30 transition-colors"
            >
              重试
            </button>
            <Link
              href="/courses"
              className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)] text-sm hover:text-[var(--color-foreground)] transition-colors border border-[var(--color-border)]"
            >
              返回课程列表
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = lessons.filter((l) => l.completed).length;
  const totalCount = lessons.length;
  const overallProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted)]">
        <Link href="/courses" className="hover:text-[var(--color-primary)] transition-colors">
          课程中心
        </Link>
        <span>/</span>
        <span className="text-[var(--color-foreground)] truncate">{course.title}</span>
      </nav>

      {/* Course Hero */}
      <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Cover */}
          <div className="relative aspect-video w-full md:w-80 shrink-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10">
            {course.coverUrl ? (
              <img
                src={course.coverUrl}
                alt={course.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl opacity-30">
                📖
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
                  {getCategoryLabel(course.category)}
                </span>
                {course.level && (
                  <span className="rounded-full bg-[var(--color-background)] px-2.5 py-0.5 text-xs text-[var(--color-muted)]">
                    {course.level}
                  </span>
                )}
                {course.isPaid && (
                  <span className="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs text-amber-400">
                    PRO
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold mb-2">{course.title}</h1>
              {course.summary && (
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">
                  {course.summary}
                </p>
              )}
            </div>

            {/* Progress overview */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted)] mb-1.5">
                <span>
                  已完成 {completedCount} / {totalCount} 课时
                </span>
                <span className="font-mono">{overallProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--color-background)]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    overallProgress >= 100
                      ? 'bg-[var(--color-accent-green)]'
                      : 'bg-[var(--color-primary)]'
                  )}
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons List */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          📚 课程内容
          <span className="text-sm font-normal text-[var(--color-muted)]">
            ({totalCount} 课时)
          </span>
        </h2>

        {lessons.length === 0 ? (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
            <span className="text-3xl mb-3 block">📭</span>
            <p className="text-[var(--color-muted)]">暂无课时内容</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson.id}
                href={`/courses/${courseId}/lessons/${lesson.id}`}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-4 transition-all',
                  'hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5',
                  lesson.completed
                    ? 'border-[var(--color-accent-green)]/30 bg-[var(--color-accent-green)]/5'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                )}
              >
                {/* Number */}
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    lesson.completed
                      ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                      : 'bg-[var(--color-background)] text-[var(--color-muted)]'
                  )}
                >
                  {lesson.completed ? '✓' : index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs">
                      {LESSON_TYPE_ICONS[lesson.type] ?? '📄'}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">
                      {LESSON_TYPE_LABELS[lesson.type] ?? lesson.type}
                    </span>
                  </div>
                  <p className="text-sm font-medium truncate">{lesson.title}</p>
                </div>

                {/* Quick complete */}
                <button
                  onClick={(e) => {
                    if (!lesson.completed) handleCompleteLesson(lesson.id, e);
                  }}
                  disabled={lesson.completed || completingId === lesson.id}
                  className={cn(
                    'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    lesson.completed
                      ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] cursor-default'
                      : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 disabled:opacity-50'
                  )}
                >
                  {completingId === lesson.id ? (
                    <span className="inline-block animate-spin">⏳</span>
                  ) : lesson.completed ? (
                    '已完成 ✓'
                  ) : (
                    '标记完成'
                  )}
                </button>

                {/* Arrow */}
                <span className="shrink-0 text-[var(--color-muted)] text-sm">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero Skeleton */}
      <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="aspect-video w-full md:w-80 bg-[var(--color-background)]" />
          <div className="flex-1 p-6 space-y-3">
            <div className="h-5 w-20 rounded bg-[var(--color-background)]" />
            <div className="h-7 w-3/4 rounded bg-[var(--color-background)]" />
            <div className="h-4 w-full rounded bg-[var(--color-background)]" />
            <div className="h-4 w-2/3 rounded bg-[var(--color-background)]" />
            <div className="h-2 rounded-full bg-[var(--color-background)]" />
          </div>
        </div>
      </div>

      {/* Lessons Skeleton */}
      <div className="h-6 w-32 rounded bg-[var(--color-background)] mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        ))}
      </div>
    </div>
  );
}
