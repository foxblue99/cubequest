'use client';

import dynamic from 'next/dynamic';

const Cube3D = dynamic(() => import('@/components/cube/Cube3D'), { ssr: false });

const MOVE_REFERENCE: Record<string, string> = {
  'U': '顶层顺', "U'": '顶层逆', 'U2': '顶层180°',
  'D': '底层顺', "D'": '底层逆', 'D2': '底层180°',
  'R': '右层顺', "R'": '右层逆', 'R2': '右层180°',
  'L': '左层顺', "L'": '左层逆', 'L2': '左层180°',
  'F': '前层顺', "F'": '前层逆', 'F2': '前层180°',
  'B': '后层顺', "B'": '后层逆', 'B2': '后层180°',
  'M': '中层(RL间)', "M'": '中层逆', 'M2': '中层180°',
  'E': '赤道层(UD间)', "E'": '赤道层逆', 'E2': '赤道层180°',
  'S': '站立层(FB间)', "S'": '站立层逆', 'S2': '站立层180°',
  'r': '右双层顺', "r'": '右双层逆', 'r2': '右双层180°',
  'l': '左双层顺', "l'": '左双层逆', 'l2': '左双层180°',
  'u': '上双层顺', "u'": '上双层逆', 'u2': '上双层180°',
  'd': '下双层顺', "d'": '下双层逆', 'd2': '下双层180°',
  'f': '前双层顺', "f'": '前双层逆', 'f2': '前双层180°',
  'b': '后双层顺', "b'": '后双层逆', 'b2': '后双层180°',
  'x': '魔方绕R轴转', "x'": '绕R轴逆转', 'x2': '绕R轴180°',
  'y': '魔方绕U轴转', "y'": '绕U轴逆转', 'y2': '绕U轴180°',
  'z': '魔方绕F轴转', "z'": '绕F轴逆转', 'z2': '绕F轴180°',
};

export default function CubeLabPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tighter mb-2">🧊 3D 魔方实验室</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">
        WCA 标准 3x3 随机打乱（U D L R F B）。
        手动输入支持全部标记：中层 M E S · 宽转 r l u d f b · 整体旋转 x y z。
      </p>
      <Cube3D moves="R U R' U'" showControls={true} />

      {/* Notation Reference */}
      <details className="mt-8 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-5">
        <summary className="font-bold cursor-pointer select-none">📖 完整标记参考表</summary>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(MOVE_REFERENCE).map(([notation, desc]) => (
            <div key={notation} className="flex items-center gap-2 text-sm">
              <code className="bg-[var(--color-background)] px-2 py-0.5 rounded font-mono text-xs text-[var(--color-primary)] w-8 text-center">{notation}</code>
              <span className="text-[var(--color-muted)]">{desc}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
