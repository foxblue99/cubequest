'use client';

import { useState } from 'react';

interface Props {
  title: string;
  text: string;
  url?: string;
  compact?: boolean;
}

export default function ShareButton({ title, text, url, compact }: Props) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = `【CubeQuest魔方远征】\n${title}\n${text}\n${fullUrl}`;

  const copy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: shareText });
    } else {
      copy();
    }
  };

  if (compact) {
    return (
      <button onClick={copy} className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition">
        {copied ? '✅ 已复制' : '🔗 分享'}
      </button>
    );
  }

  return (
    <div className="inline-flex gap-2">
      <button onClick={copy} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 transition">
        {copied ? '✅ 已复制' : '🔗 复制分享文案'}
      </button>
      {typeof navigator !== 'undefined' && (navigator as any).share && (
        <button onClick={shareNative} className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
          📤 系统分享
        </button>
      )}
    </div>
  );
}
