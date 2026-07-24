import Link from 'next/link';
import HeroCube from '@/components/hero/HeroCube';
import DailyHeroes from '@/components/tribe/DailyHeroes';
import RecordTicker from '@/components/records/RecordTicker';
import CoachFAB from '@/components/coach/CoachFAB';
import HomeDashboard from '@/components/home/HomeDashboard';
import ActivityCarousel from '@/components/home/ActivityCarousel';

/* ── Reusable decorative cube pieces ── */
const CubeColors = ['#FFFFFF','#FFD500','#B90000','#FF5900','#009B48','#0046AD'];
const CubeFace = ({ color, className, style }: { color: string; className?: string; style?: React.CSSProperties }) => (
  <div className={`absolute rounded-sm ${className||''}`} style={{background:color,width:28,height:28,boxShadow:`0 0 12px ${color}44`,...style}} />
);
const Cubelet3x3 = ({ className, x, y }: { className?: string; x: number; y: number }) => (
  <div className={`absolute grid grid-cols-3 gap-[2px] ${className||''}`} style={{width:88,height:88,left:x,top:y,transform:'rotateX(60deg) rotateZ(-45deg)'}}>
    {CubeColors.map((c,i)=>(<div key={i} className="rounded-[2px]" style={{background:c,boxShadow:`0 0 8px ${c}33`}} />))}
  </div>
);

/* ── Decorative cube faces array (positions, colors, animations) ── */
const scatteredCubes = [
  { x:'5%', y:'15%', c:0, s:.8, d:0 }, { x:'92%', y:'8%', c:1, s:.6, d:.5 },
  { x:'88%', y:'72%', c:2, s:.7, d:1 }, { x:'7%', y:'78%', c:3, s:.5, d:.3 },
  { x:'48%', y:'92%', c:4, s:.9, d:.8 }, { x:'35%', y:'5%', c:5, s:.6, d:1.2 },
  { x:'78%', y:'25%', c:0, s:.5, d:.4 }, { x:'15%', y:'45%', c:3, s:.7, d:.9 },
  { x:'55%', y:'55%', c:1, s:.8, d:.6 }, { x:'25%', y:'70%', c:2, s:.6, d:1.1 },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ── Stars ── */}
      <div className="stars">
        {[...Array(60)].map((_,i) => (
          <div key={i} className="star" style={{left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,animationDelay:`${Math.random()*4}s`,animationDuration:`${2+Math.random()*4}s`,width:`${1+Math.random()*2}px`,height:`${1+Math.random()*2}px`}} />
        ))}
      </div>

      {/* ── Floating cube pieces ── */}
      {scatteredCubes.map((c,i) => (
        <div key={`cube-${i}`} className="absolute pointer-events-none animate-float z-0" style={{left:c.x,top:c.y,transform:`scale(${c.s})`,animationDelay:`${c.d}s`,animationDuration:`${5+Math.random()*4}s`}}>
          <CubeFace color={CubeColors[c.c]} />
        </div>
      ))}

      {/* ════════════ RECORD TICKER ════════════ */}
      <RecordTicker />

      {/* ═══════════════════════ HERO ═══════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">


        {/* Top-right: User status + Daily Coach (absolute, doesn't push hero) */}
        <div className="absolute top-4 right-[3%] z-30 w-[280px]">
          <HomeDashboard />
        </div>      <div className="hero-orb orb-1" /><div className="hero-orb orb-2" /><div className="hero-orb orb-3" />
        <div className="hero-orb orb-4" /><div className="hero-orb orb-5" />

        {/* Hero cube — Crystal floating 3D cube */}
        <div className="absolute top-1/2 left-[3%] -translate-y-1/2 pointer-events-none z-10 hidden lg:block" style={{width:420,height:420}}>
          <HeroCube />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl w-full px-6 lg:px-16 text-center">
          <div className="badge badge-blue badge-pulse mx-auto mb-8 animate-count-in" style={{animationDelay:'.1s'}}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-400">NEXT-GEN SPEEDCUBING</span>
          </div>
          <h1 className="animate-count-in" style={{animationDelay:'.2s'}}>
            <span className="block text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter leading-[.9] text-white">
              解锁<span className="gradient-blue">极速</span>
            </span>
            <span className="block text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[.9] mt-2">
              <span className="gradient-fire">超能潜力</span>
            </span>
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed animate-count-in" style={{animationDelay:'.4s'}}>
            这不是普通的学习平台——这是一场<span className="text-white font-semibold">指尖上的竞速革命</span>
            <br /><span className="gradient-cyber font-semibold">用 WCA 职业级工具，突破人类极限</span>
          </p>
          <div className="mt-10 flex flex-wrap gap-4 justify-center animate-count-in" style={{animationDelay:'.5s'}}>
            <Link href="/training/timer" className="btn-primary text-lg px-10 py-4">⚡ 立即挑战</Link>
            <Link href="/training/timer" className="btn-outline text-lg px-10 py-4">⏱️ 开始计时</Link>
          </div>
          <div className="mt-14 grid grid-cols-3 gap-8 max-w-xl mx-auto animate-count-in" style={{animationDelay:'.6s'}}>
            {[{v:'12,847',l:'注册学员',c:'text-cyan-400'},{v:'328,500',l:'训练次数',c:'text-purple-400'},{v:'5.21s',l:'本站纪录',c:'text-amber-400'}].map((s,i)=>(
              <div key={i} className="text-center" style={{animationDelay:`${.7+i*.1}s`}}>
                <div className={`timer-digit text-2xl sm:text-3xl font-black ${s.c} drop-shadow-lg`}>{s.v}</div>
                <div className="text-[10px] sm:text-xs text-slate-500 mt-1 uppercase tracking-widest">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cube pattern divider ── */}
      <div className="relative h-24 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-10">
          {CubeColors.map((c,i)=>(<div key={i} className="w-8 h-8 rounded-md" style={{background:c,transform:`rotate(${i*15}deg)`}} />))}
          {CubeColors.map((c,i)=>(<div key={`b-${i}`} className="w-8 h-8 rounded-md" style={{background:c,transform:`rotate(${-i*12}deg)`}} />))}
          {CubeColors.map((c,i)=>(<div key={`c-${i}`} className="w-8 h-8 rounded-md" style={{background:c,transform:`rotate(${i*8}deg)`}} />))}
        </div>
      </div>

        {/* Activity Carousel — top-left crystal glass */}
        <div className="absolute top-36 left-[3%] z-50 hidden xl:block">
          <ActivityCarousel />
        </div>

        {/* Daily Heroes — right side, below the user cards */}
        <div className="absolute top-[680px] right-[3%] z-40 hidden xl:block" style={{width:280,height:180}}>
          <DailyHeroes />
        </div>

      {/* ═══════════════════════ WEAPONS ═══════════════════════ */}
      <section className="relative px-6 lg:px-16 py-32">
        <div className="hero-orb" style={{width:500,height:500,background:'radial-gradient(circle,rgba(6,182,212,.15),transparent)',top:'10%',left:'-10%'}} />
        <div className="mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-20 space-y-4">
            <div className="badge badge-blue mx-auto">⚔️ 你的武器库</div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight">
              <span className="gradient-cyber">装备拉满</span><span className="text-white"> · 火力全开</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">职业选手同款工具链，每一件都为速度而生</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {icon:'⏱️',color:'cyan',title:'WCA 计时器',tag:'#竞速',desc:'15秒观察 · 空格触发 · +2/DNF判定 · ao5/ao12实时计算。职业赛场的每一秒。'},
              {icon:'🧊',color:'indigo',title:'3D 魔方实验室',tag:'#视觉',desc:'Three.js 实时渲染 · 公式动画 · 0.5x~2x调速 · 暂停打乱。转动不再抽象。'},
              {icon:'🗺️',color:'purple',title:'远征闯关系统',tag:'#冒险',desc:'八大关卡逐级解锁 · 营地→神殿→竞技场。游戏化进程让你停不下来。'},
              {icon:'📊',color:'emerald',title:'数据指挥中心',tag:'#分析',desc:'PB追踪 · ao5/ao12/ao50/ao100 · 热力图 · 趋势曲线。数据驱动进步。'},
              {icon:'🔤',color:'amber',title:'公式弹药库',tag:'#知识',desc:'F2L×41 · OLL×57 · PLL×21。分类检索+收藏+学习进度。你的记忆外挂。'},
              {icon:'🏆',color:'rose',title:'荣誉殿堂',tag:'#成就',desc:'首次还原→Sub60→Sub30→Sub20。连续7天·首次比赛。每枚徽章都是传奇。'},
            ].map((f,i)=>(
              <div key={i} className={`card-glass group ${['hover:border-cyan-500/40','hover:border-indigo-500/40','hover:border-purple-500/40','hover:border-emerald-500/40','hover:border-amber-500/40','hover:border-rose-500/40'][i]} ${['group-hover:shadow-cyan-500/10','group-hover:shadow-indigo-500/10','group-hover:shadow-purple-500/10','group-hover:shadow-emerald-500/10','group-hover:shadow-amber-500/10','group-hover:shadow-rose-500/10'][i]}`} style={{animationDelay:`${i*.08}s`}}>
                <div className="flex items-start justify-between mb-5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-${f.color}-500/20 to-${f.color}-600/10 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500`}>{f.icon}</div>
                  <span className="text-[10px] font-bold text-slate-600 group-hover:text-slate-400 transition-colors tracking-widest">{f.tag}</span>
                </div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-white transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Cube pattern divider ── */}
      <div className="relative h-16 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-8">
          {[...Array(24)].map((_,i)=>(<div key={i} className="w-6 h-6 rounded-sm" style={{background:CubeColors[i%6],transform:`rotate(${i*20}deg)`,opacity:.08}} />))}
        </div>
      </div>

      {/* ═══════════════════════ RECORDS ═══════════════════════ */}
      <section className="relative px-6 lg:px-16 py-32 overflow-hidden">
        <div className="hero-orb" style={{width:700,height:700,background:'radial-gradient(circle,rgba(245,158,11,.2),transparent)',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}} />
        <div className="hero-orb" style={{width:400,height:400,background:'radial-gradient(circle,rgba(239,68,68,.15),transparent)',bottom:0,right:0}} />
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-16 space-y-4">
            <div className="badge badge-gold mx-auto">🏅 速度纪录墙</div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight"><span className="gradient-gold">极限竞速</span><span className="text-white"> · 谁是最快</span></h2>
          </div>
          <div className="flex items-end justify-center gap-6 sm:gap-12 mb-16">
            {[
              {rank:2,name:'SpeedDemon',time:'8.91s',h:160,w:100,color:'from-slate-400 to-slate-600',medal:'🥈',delay:'.2s'},
              {rank:1,name:'CubeLegend',time:'5.21s',h:220,w:120,color:'from-yellow-300 via-amber-400 to-yellow-600',medal:'👑',delay:'0s'},
              {rank:3,name:'极速少年',time:'9.87s',h:120,w:90,color:'from-orange-400 to-orange-700',medal:'🥉',delay:'.4s'},
            ].map(p=>(
              <div key={p.rank} className="flex flex-col items-center gap-3" style={{animation:`reveal .6s cubic-bezier(.4,0,.2,1) ${p.delay} both`}}>
                <div className="text-3xl sm:text-4xl animate-float" style={{animationDelay:p.delay}}>{p.medal}</div>
                <div className="relative" style={{height:p.h,width:p.w}}>
                  <div className={`absolute bottom-0 w-full rounded-t-2xl bg-gradient-to-b ${p.color} flex items-end justify-center pb-4 shadow-2xl`} style={{height:`${p.h}px`}}>
                    <span className="timer-digit text-base sm:text-xl font-black text-white drop-shadow-lg">{p.time}</span>
                  </div>
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-yellow-500/20 rounded-full blur-xl" />
                </div>
                <div className="text-sm font-semibold text-slate-300">{p.name}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              {icon:'🏆',text:'平台纪录 5.21s WR'},{icon:'⚡',text:'最快 ao5: 6.83'},{icon:'🔥',text:'本月新增 237 条纪录'},{icon:'💪',text:'今日训练 8,420 次'},{icon:'🎯',text:'152 人今日突破 PB'},
            ].map((b,i)=>(
              <div key={i} className="px-5 py-2.5 rounded-full card-glass text-sm font-semibold text-slate-400 hover:text-white hover:border-amber-500/30 transition-all cursor-default flex items-center gap-2" style={{animation:`reveal .4s ease ${.6+i*.1}s both`}}>
                <span>{b.icon}</span> {b.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ STEPS ═══════════════════════ */}
      <section className="relative px-6 lg:px-16 py-32">
        <div className="hero-orb" style={{width:500,height:500,background:'radial-gradient(circle,rgba(139,92,246,.15),transparent)',top:0,right:'-10%'}} />
        {/* Background cube grid */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-[.03] pointer-events-none hidden xl:block">
          <Cubelet3x3 x={-60} y={-20} />
          <Cubelet3x3 x={80} y={100} />
        </div>
        <div className="mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <div className="badge badge-blue mx-auto mb-4">🚀 三步起飞</div>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white">成为<span className="gradient-blue">竞速高手</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {step:'01',icon:'🔐',title:'注册即战力',desc:'30秒注册 · 选择水平 · 自动匹配训练路径。零门槛进入竞速世界。',delay:'.1s'},
              {step:'02',icon:'🎓',title:'CFOP 特训',desc:'从十字到PLL · 3D动画跟练 · 每课5分钟。系统化学习速度翻倍。',delay:'.3s'},
              {step:'03',icon:'🚀',title:'突破极限',desc:'WCA计时 · 数据追踪 · 成就激励。30天从入门到Sub30不是梦想。',delay:'.5s'},
            ].map((s,i)=>(
              <div key={i} className="text-center relative" style={{animation:`reveal .6s ease ${s.delay} both`}}>
                <div className="text-7xl sm:text-8xl font-black text-slate-800 mb-4 group-hover:text-slate-700 transition-colors">{s.step}</div>
                <div className="text-5xl mb-5">{s.icon}</div>
                <h3 className="font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ULTIMATE CTA ═══════════════════════ */}
      <section className="relative px-6 lg:px-16 py-40 overflow-hidden">
        <div className="hero-orb" style={{width:900,height:900,background:'radial-gradient(circle,rgba(245,158,11,.25),transparent)',top:'50%',left:'50%',transform:'translate(-50%,-50%)'}} />
        <div className="hero-orb" style={{width:500,height:500,background:'radial-gradient(circle,rgba(239,68,68,.15),transparent)',top:0,right:0}} />
        <div className="hero-orb" style={{width:400,height:400,background:'radial-gradient(circle,rgba(59,130,246,.2),transparent)',bottom:0,left:0}} />
        {[...Array(20)].map((_,i)=>(
          <div key={i} className="absolute w-1.5 h-1.5 bg-amber-400 rounded-full animate-float pointer-events-none"
            style={{left:`${5+Math.random()*90}%`,top:`${Math.random()*100}%`,animationDelay:`${i*.3}s`,animationDuration:`${3+Math.random()*4}s`,opacity:.2+Math.random()*.5}} />
        ))}
        <div className="relative z-20 mx-auto max-w-4xl text-center">
          <div className="badge badge-gold mx-auto mb-8 badge-pulse"><span>🔥</span> 限时开放</div>
          <h2 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-8">
            <span className="text-white">你离</span><span className="gradient-gold"> Sub20 </span><span className="text-white">只差</span><br />
            <span className="gradient-fire">一次勇敢的开始</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            <span className="text-white font-semibold">Z 世代的速度信仰——</span>系统训练 + 职业工具 + 游戏化激励<br />从今天开始，30 天后让所有人看到你的蜕变
          </p>
          <Link href="/register" className="btn-gold text-xl px-12 py-5 inline-flex">🔥 加入竞速革命 — 永久免费</Link>
          <div className="flex items-center justify-center gap-8 mt-8 text-xs text-slate-500">
            <span>✅ 无需信用卡</span><span>✅ 核心功能永久免费</span><span>✅ 30秒极速注册</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="relative px-6 lg:px-16 py-16 border-t border-white/5">
        {/* Footer cube decor */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[.04] pointer-events-none hidden lg:block" style={{transform:'rotateX(50deg) rotateZ(-35deg)'}}>
          <div className="grid grid-cols-3 gap-1" style={{width:72,height:72}}>
            {CubeColors.map((c,i)=>(<div key={i} className="rounded-sm" style={{background:c}} />))}
          </div>
        </div>
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧊</span>
              <div><div className="font-bold text-white tracking-wide">魔方远征</div><div className="text-[10px] text-slate-600 tracking-[.2em] uppercase">CubeQuest</div></div>
            </div>
            <div className="flex flex-wrap gap-8 text-sm text-slate-500">
              {['课程','公式','计时','赛事','管理'].map(l=>(<Link key={l} href={`/${l==='课程'?'courses':l==='公式'?'formulas':l==='计时'?'training/timer':l==='赛事'?'events':'admin'}`} className="hover:text-white transition-colors">{l}</Link>))}
            </div>
            <div className="text-xs text-slate-600">© 2025 CubeQuest · Built for Speed</div>
          </div>
        </div>
      </footer>
      <CoachFAB />
    </div>
  );
}
