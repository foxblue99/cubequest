import type { Metadata } from 'next';
import TimerPageClient from './TimerPageClient';

export const metadata: Metadata = {
  title: '计时训练 - CubeQuest',
  description: 'WCA 风格计时训练 — 3x3 魔方速拧计时，支持观察倒计时、ao5/ao12 统计',
};

export default function TimerTrainingPage() {
  return <TimerPageClient />;
}
