'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-foreground)] p-6">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">出错了</h2>
          <p className="text-[var(--color-muted)]">
            {error.message || '页面加载时发生未知错误'}
          </p>
          {error.digest && (
            <p className="text-xs text-[var(--color-muted)]">{error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-medium"
          >
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
