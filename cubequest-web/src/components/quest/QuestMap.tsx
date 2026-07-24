'use client';

import { useState } from 'react';

interface QuestNodeData {
  id: string;
  label: string;
  icon: string;
  status: 'LOCKED' | 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED';
  href: string;
  description: string;
}

const MAP_NODES: QuestNodeData[] = [
  {
    id: 'camp',
    label: '新手营地',
    icon: '🏕️',
    status: 'COMPLETED',
    href: '/courses?category=BEGINNER',
    description: '零基础入门，学习魔方基础知识',
  },
  {
    id: 'cross',
    label: '十字遗迹',
    icon: '✨',
    status: 'AVAILABLE',
    href: '/formulas?category=CROSS',
    description: '掌握底层十字的快速解法',
  },
  {
    id: 'f2l',
    label: 'F2L 森林',
    icon: '🌳',
    status: 'AVAILABLE',
    href: '/formulas?category=F2L',
    description: '学习 F2L 配对技巧，大幅提速',
  },
  {
    id: 'oll',
    label: 'OLL 神殿',
    icon: '🏛️',
    status: 'AVAILABLE',
    href: '/formulas?category=OLL',
    description: '掌握顶面定向公式',
  },
  {
    id: 'pll',
    label: 'PLL 竞技场',
    icon: '⚔️',
    status: 'LOCKED',
    href: '/formulas?category=PLL',
    description: '完成顶层排列，挑战 Sub30',
  },
  {
    id: 'speed',
    label: '提速训练塔',
    icon: '🗼',
    status: 'LOCKED',
    href: '/training/timer',
    description: '计时训练，突破速度极限',
  },
  {
    id: 'arena',
    label: '赛事广场',
    icon: '🏟️',
    status: 'AVAILABLE',
    href: '/events',
    description: '参加比赛，与高手过招',
  },
  {
    id: 'master',
    label: '高手殿堂',
    icon: '🏆',
    status: 'LOCKED',
    href: '/results',
    description: '达到顶尖水平，记录你的传奇',
  },
];

const STATUS_STYLES: Record<string, string> = {
  LOCKED: 'opacity-40 cursor-not-allowed border-slate-600 bg-slate-800/50',
  AVAILABLE: 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 node-available cursor-pointer hover:bg-[var(--color-primary)]/20',
  IN_PROGRESS: 'border-[var(--color-accent-orange)] bg-[var(--color-accent-orange)]/10 cursor-pointer hover:bg-[var(--color-accent-orange)]/20',
  COMPLETED: 'border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/10 cursor-pointer',
};

const STATUS_BADGE: Record<string, string> = {
  LOCKED: '🔒',
  AVAILABLE: '📍',
  IN_PROGRESS: '⏳',
  COMPLETED: '✅',
};

export default function QuestMap() {
  const [selectedNode, setSelectedNode] = useState<QuestNodeData | null>(null);

  return (
    <div>
      {/* Map Grid - responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MAP_NODES.map((node, i) => (
          <button
            key={node.id}
            disabled={node.status === 'LOCKED'}
            onClick={() => setSelectedNode(node)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${STATUS_STYLES[node.status]}`}
          >
            <span className="text-2xl">{node.icon}</span>
            <span className="text-xs font-medium text-center leading-tight">
              {node.label}
            </span>
            <span className="text-[10px] absolute top-1 right-1.5">
              {STATUS_BADGE[node.status]}
            </span>

            {/* Connection line indicators */}
            {i < MAP_NODES.length - 1 && (
              <div className="hidden sm:block absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-0.5 bg-[var(--color-border)]" />
            )}
          </button>
        ))}
      </div>

      {/* Node Detail */}
      {selectedNode && (
        <div className="mt-4 p-4 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{selectedNode.icon}</span>
            <h3 className="font-semibold">{selectedNode.label}</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface-light)] text-[var(--color-muted)]">
              {STATUS_BADGE[selectedNode.status]}{' '}
              {selectedNode.status === 'LOCKED'
                ? '未解锁'
                : selectedNode.status === 'AVAILABLE'
                  ? '可进入'
                  : selectedNode.status === 'IN_PROGRESS'
                    ? '进行中'
                    : '已完成'}
            </span>
          </div>
          <p className="text-sm text-[var(--color-muted)] mb-2">
            {selectedNode.description}
          </p>
          {selectedNode.status !== 'LOCKED' && (
            <a
              href={selectedNode.href}
              className="inline-block px-3 py-1 rounded-lg bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-sm hover:bg-[var(--color-primary)]/30 transition-colors"
            >
              进入 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
