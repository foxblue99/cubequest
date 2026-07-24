'use client';

const LINKS = [
  { title: 'WCA 官方', url: 'https://www.worldcubeassociation.org/', icon: '🏛️', desc: '世界魔方协会官网，查看全球排名和赛事' },
  { title: 'CubeSkills', url: 'https://www.cubeskills.com/', icon: '🎓', desc: 'Feliks Zemdegs 的魔方教程平台' },
  { title: 'J Perm', url: 'https://jperm.net/', icon: '🧩', desc: '精选算法库 + 3D 可视化' },
  { title: 'SpeedCubeDB', url: 'https://speedcubedb.com/', icon: '📊', desc: '速拧算法数据库' },
  { title: 'CubeDB', url: 'https://www.cubedb.net/', icon: '🔄', desc: '在线魔方还原演示' },
  { title: 'alg.cubing.net', url: 'https://alg.cubing.net/', icon: '🔬', desc: '算法可视化 + 动画演示' },
];

const VIDEOS = [
  { title: '【J Perm】10个提速关键技巧', url: 'https://www.youtube.com/watch?v=W8WmC6S4KeM', icon: '▶️' },
  { title: '【CubeHead】F2L 终极指南', url: 'https://www.youtube.com/watch?v=ZZfrJ8VtdgM', icon: '▶️' },
  { title: '【Tingman】魔方初学者完全指南', url: 'https://www.youtube.com/watch?v=R-R0KrXvWbc', icon: '▶️' },
];

export default function LinksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-2">🔗 魔方资源</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">精选全球魔方学习资源</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        {LINKS.map(l=>(
          <a key={l.url} href={l.url} target="_blank" rel="noopener"
            className="block bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4 hover:border-cyan-500/30 transition group">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{l.icon}</span>
              <span className="font-bold text-sm group-hover:text-cyan-400 transition-colors">{l.title}</span>
            </div>
            <p className="text-xs text-[var(--color-muted)]">{l.desc}</p>
          </a>
        ))}
      </div>

      <h2 className="font-bold mb-3">📺 推荐视频</h2>
      <div className="space-y-2">
        {VIDEOS.map(v=>(
          <a key={v.url} href={v.url} target="_blank" rel="noopener"
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] hover:border-purple-500/30 transition text-sm">
            <span>{v.icon}</span> {v.title}
          </a>
        ))}
      </div>
    </div>
  );
}
