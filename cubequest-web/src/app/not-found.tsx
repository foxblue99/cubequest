import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 text-center">
      <h2 className="text-4xl font-bold mb-4">404</h2>
      <p className="text-[var(--color-muted)] mb-6">页面未找到</p>
      <Link
        href="/"
        className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-background)] font-medium"
      >
        返回首页
      </Link>
    </div>
  );
}
