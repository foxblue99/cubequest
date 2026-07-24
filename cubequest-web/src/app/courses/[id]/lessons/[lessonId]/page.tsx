'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { api, ApiError } from '@/lib/api';
import type { Course, Lesson } from '@/types';
import { LessonType } from '@/types';

const LESSON_TYPE_ICONS: Record<string, string> = {
  [LessonType.VIDEO]: '🎬',
  [LessonType.ARTICLE]: '📄',
  [LessonType.INTERACTIVE]: '🎮',
  [LessonType.QUIZ]: '📝',
};

interface LessonWithProgress extends Lesson {
  completed?: boolean;
}

export default function LessonPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const lessonId = params.lessonId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<LessonWithProgress | null>(null);
  const [allLessons, setAllLessons] = useState<LessonWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  const fetchData = useCallback(async () => {
    if (!courseId || !lessonId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.getCourse(courseId),
        api.getCourseLessons(courseId),
      ]);

      const courseData = (courseRes as unknown as { course: Course }).course;
      const lessonsData = (lessonsRes as unknown as { lessons: Lesson[] }).lessons ?? [];

      const sorted = lessonsData
        .filter((l) => l.published)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((l) => ({ ...l, completed: false }));

      const currentLesson = sorted.find((l) => l.id === lessonId) ?? null;

      setCourse(courseData);
      setAllLessons(sorted);
      setLesson(currentLesson);

      if (!currentLesson) {
        setError('课时不存在');
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError('内容不存在');
        } else {
          setError(err.message);
        }
      } else {
        setError('加载失败，请稍后重试');
      }
    } finally {
      setIsLoading(false);
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;
  const isLastLesson = currentIndex === allLessons.length - 1;

  const handleComplete = async () => {
    if (!lessonId || isCompleting || completed) return;
    setIsCompleting(true);
    try {
      await api.completeLesson(lessonId);
      setCompleted(true);

      // Navigate to next lesson after short delay
      if (nextLesson) {
        setTimeout(() => {
          router.push(`/courses/${courseId}/lessons/${nextLesson.id}`);
        }, 1200);
      }
    } catch {
      // Silently fail
    } finally {
      setIsCompleting(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <LessonPlayerSkeleton />
      </div>
    );
  }

  // Error
  if (error || !lesson || !course) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-4xl mb-4">😵</span>
          <p className="text-[var(--color-muted)] mb-4">{error || '加载失败'}</p>
          <div className="flex gap-3">
            <button
              onClick={fetchData}
              className="px-4 py-2 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm hover:bg-[var(--color-primary)]/30 transition-colors"
            >
              重试
            </button>
            <Link
              href={`/courses/${courseId}`}
              className="px-4 py-2 rounded-lg bg-[var(--color-surface)] text-[var(--color-muted)] text-sm hover:text-[var(--color-foreground)] transition-colors border border-[var(--color-border)]"
            >
              返回课程
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-[var(--color-muted)] flex-wrap">
        <Link href="/courses" className="hover:text-[var(--color-primary)] transition-colors">
          课程中心
        </Link>
        <span>/</span>
        <Link
          href={`/courses/${courseId}`}
          className="hover:text-[var(--color-primary)] transition-colors truncate max-w-[160px]"
        >
          {course.title}
        </Link>
        <span>/</span>
        <span className="text-[var(--color-foreground)] truncate max-w-[200px]">
          {lesson.title}
        </span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Lesson Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{LESSON_TYPE_ICONS[lesson.type] ?? '📄'}</span>
              <span className="rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-muted)] capitalize">
                {lesson.type}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                第 {currentIndex + 1} / {allLessons.length} 课时
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold">{lesson.title}</h1>
          </div>

          {/* Video */}
          {lesson.type === LessonType.VIDEO && lesson.videoUrl && (
            <div className="mb-8 rounded-xl border border-[var(--color-border)] overflow-hidden bg-black">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full aspect-video"
                poster={course.coverUrl}
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          )}

          {/* Content */}
          {lesson.content && (
            <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div
                className="prose prose-invert max-w-none text-sm leading-relaxed
                  prose-headings:text-[var(--color-foreground)]
                  prose-p:text-[var(--color-muted)]
                  prose-strong:text-[var(--color-foreground)]
                  prose-a:text-[var(--color-primary)]
                  prose-code:text-[var(--color-accent-green)]
                  prose-pre:bg-[var(--color-background)]
                  prose-pre:border prose-pre:border-[var(--color-border)]
                  prose-img:rounded-lg
                  prose-li:text-[var(--color-muted)]"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </div>
          )}

          {/* Formula / Cube Moves */}
          {lesson.cubeMoves && (
            <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">🧊</span>
                公式手法
              </h3>

              {/* Cube moves display */}
              <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-4">
                <p className="font-mono text-lg text-[var(--color-primary)] tracking-wider text-center">
                  {lesson.cubeMoves}
                </p>
              </div>

              {lesson.formulaText && (
                <div className="mt-3 rounded-lg bg-[var(--color-background)]/50 p-3 border border-[var(--color-border)]">
                  <div className="text-xs text-[var(--color-muted)] mb-1">公式说明</div>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {lesson.formulaText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Standalone formula (no cubeMoves) */}
          {!lesson.cubeMoves && lesson.formulaText && (
            <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">📐</span>
                公式
              </h3>
              <div className="rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] p-4">
                <p className="font-mono text-lg text-[var(--color-primary)] tracking-wider">
                  {lesson.formulaText}
                </p>
              </div>
            </div>
          )}

          {/* Navigation & Complete */}
          <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border)]">
            <div>
              {prevLesson ? (
                <Link
                  href={`/courses/${courseId}/lessons/${prevLesson.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-primary)]/40 transition-all"
                >
                  ← 上一课
                </Link>
              ) : (
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-primary)]/40 transition-all"
                >
                  ← 返回课程
                </Link>
              )}
            </div>

            <button
              onClick={handleComplete}
              disabled={isCompleting || completed}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all',
                completed
                  ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] cursor-default'
                  : 'bg-[var(--color-primary)] text-[var(--color-background)] hover:bg-[var(--color-primary-dark)] disabled:opacity-50 shadow-sm'
              )}
            >
              {isCompleting ? (
                <>
                  <span className="inline-block animate-spin">⏳</span>
                  完成中...
                </>
              ) : completed ? (
                <>
                  ✓ 已完成
                  {nextLesson ? '，跳转下一课...' : ' 🎉'}
                </>
              ) : isLastLesson ? (
                '🎉 完成课程'
              ) : (
                '✓ 完成并继续'
              )}
            </button>

            <div>
              {nextLesson ? (
                <Link
                  href={`/courses/${courseId}/lessons/${nextLesson.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:border-[var(--color-primary)]/40 transition-all"
                >
                  下一课 →
                </Link>
              ) : (
                <Link
                  href={`/courses/${courseId}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 px-4 py-2 text-sm text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/20 transition-all"
                >
                  完成课程 🏆
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Lesson List */}
        <div className="w-full lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                📋 课程目录
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {allLessons.length} 课时 · 进度 {currentIndex + 1}/{allLessons.length}
              </p>
            </div>

            <div className="divide-y divide-[var(--color-border)] max-h-[60vh] overflow-y-auto">
              {allLessons.map((l, idx) => {
                const isActive = l.id === lessonId;
                const isFirst = idx === 0;
                const isPassed = idx < currentIndex;

                return (
                  <Link
                    key={l.id}
                    href={`/courses/${courseId}/lessons/${l.id}`}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 text-sm transition-colors',
                      isActive
                        ? 'bg-[var(--color-primary)]/10 border-l-2 border-l-[var(--color-primary)] text-[var(--color-primary)]'
                        : 'hover:bg-[var(--color-background)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]',
                      !isActive && 'border-l-2 border-l-transparent'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold mt-0.5',
                        isActive
                          ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]'
                          : isPassed
                            ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]'
                            : 'bg-[var(--color-background)] text-[var(--color-muted)]'
                      )}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </span>
                    <span className="leading-snug line-clamp-2">{l.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LessonPlayerSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="mb-6 h-4 w-64 rounded bg-[var(--color-surface)]" />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {/* Header */}
          <div className="mb-6 space-y-3">
            <div className="h-5 w-20 rounded bg-[var(--color-surface)]" />
            <div className="h-8 w-3/4 rounded bg-[var(--color-surface)]" />
          </div>

          {/* Content area */}
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-3">
            <div className="h-4 w-full rounded bg-[var(--color-background)]" />
            <div className="h-4 w-5/6 rounded bg-[var(--color-background)]" />
            <div className="h-4 w-4/6 rounded bg-[var(--color-background)]" />
            <div className="h-4 w-full rounded bg-[var(--color-background)]" />
            <div className="h-4 w-3/4 rounded bg-[var(--color-background)]" />
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="w-full lg:w-72">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
            <div className="h-4 w-24 rounded bg-[var(--color-background)]" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-[var(--color-background)]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
