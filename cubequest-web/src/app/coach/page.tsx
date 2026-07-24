'use client';

import { useState, useEffect, useRef } from 'react';
import { getAuth } from '@/lib/auth';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function CoachPage() {
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<'chat'|'diagnose'|'plan'|'tasks'>('chat');
  const [chatHistory, setChatHistory] = useState<{role:string;content:string}[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [growth, setGrowth] = useState<any>(null);
  const [abilities, setAbilities] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({age:'',experience:'',goal:'',mainCube:'',trainFreq:'',persona:'gentle'});
  const chatRef = useRef<HTMLDivElement>(null);

  const auth = getAuth();
  const user = auth?.user;
  const userId = user?.id;

  const post = async (url: string, body: any = {}) => {
    const h: Record<string,string> = {'Content-Type':'application/json'};
    if (auth?.token) h.Authorization = `Bearer ${auth.token}`;
    const res = await fetch(url, { method:'POST', headers:h, body: JSON.stringify(body) });
    return res.json();
  };

  useEffect(()=>{setHydrated(true);},[]);
  useEffect(()=>{chatRef.current?.scrollTo(0,chatRef.current.scrollHeight);},[chatHistory]);

  useEffect(()=>{
    if(!hydrated||!userId)return;
    post('/api/ai/coach/notifications').then((d:any)=>{if(d?.notifications)setNotifications(d.notifications);if(d?.stats)setStats(d.stats);});
    post('/api/ai/growth').then(setGrowth);
    post('/api/ai/profile').then((d:any)=>{if(d?.profile)setProfileForm({age:d.profile.age||'',experience:d.profile.experience||'',goal:d.profile.goal||'',mainCube:d.profile.mainCube||'',trainFreq:d.profile.trainFreq||'',persona:d.profile.bio||'gentle'});});
  },[hydrated,userId]);

  const saveProfile = async()=>{await post('/api/ai/profile/update',{...profileForm,age:profileForm.age?parseInt(profileForm.age):undefined});};

  const call = async (endpoint: string, body: any) => {setLoading(true);setResult('');try{return await post(`/api/ai/coach/${endpoint}`,body);}finally{setLoading(false);}};

  if (!hydrated) return null;
  if (!user) return <div className="flex items-center justify-center min-h-[60vh] text-[var(--color-muted)] text-sm">请先登录</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">🧠 AI 私教 · 阿拉魔神丁</h1>
      <p className="text-[var(--color-muted)] mb-4 text-sm">7×24 专属魔方教练 · 瓶颈诊断 · 定制训练计划</p>

      {growth && (
        <div className="mb-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold">{growth.title}</span>
            <span className="text-[10px] text-[var(--color-muted)]">Lv{growth.level} · {growth.xp}XP</span>
          </div>
          <div className="h-2 bg-[var(--color-background)] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all" style={{width:`${growth.progress}%`}} />
          </div>
          <div className="text-[9px] text-[var(--color-muted)] mt-1">下级需要 {growth.nextLevelXp}XP</div>
        </div>
      )}

      {notifications.length>0&&(
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {notifications.map((n,i)=>(
            <div key={i} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-xs">
              <span>{n.icon}</span><span className="text-amber-300 whitespace-nowrap">{n.text}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-5">
        <div className="flex-1 min-w-0 flex flex-col bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden" style={{minHeight:520}}>
          <div className="flex border-b border-[var(--color-border)] px-4 pt-3 gap-1">
            {[{k:'chat',l:'💬 对话'},{k:'diagnose',l:'🔍 诊断'},{k:'plan',l:'📝 计划'},{k:'tasks',l:'📋 任务'}].map(t=>(
              <button key={t.k} onClick={()=>setTab(t.k as any)} className={`px-4 py-2 rounded-t-lg text-sm font-medium transition ${tab===t.k?'bg-[var(--color-background)] text-[var(--color-foreground)]':'text-[var(--color-muted)]'}`}>{t.l}</button>
            ))}
          </div>

          {tab==='chat'&&(<>
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatHistory.length===0&&(
                <div className="text-center py-12 text-[var(--color-muted)]">
                  <div className="text-5xl mb-3">🧠</div>
                  <div className="text-sm font-bold mb-1">你的专属私教已上线</div>
                  <div className="text-xs mb-4">问任何魔方问题，教练会根据你的数据给出个性化建议</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['我的瓶颈在哪？','今天练什么？','F2L怎么提速？'].map(q=>(
                      <button key={q} onClick={async()=>{setChatHistory(p=>[...p,{role:'user',content:q}]);const d=await call('chat',{message:q});setChatHistory(p=>[...p,{role:'assistant',content:d?.reply||'...'}]);}} className="text-[10px] px-3 py-1.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]">{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((m,i)=>(
                <div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm ${m.role==='user'?'bg-[var(--color-primary)]/20':'bg-[var(--color-background)]'}`}>
                    <div className="text-[10px] text-[var(--color-muted)] mb-0.5">{m.role==='user'?user.nickname:'🧠 私教'}</div>
                    <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                  </div>
                </div>
              ))}
              {loading&&<div className="text-center text-xs text-[var(--color-muted)]">教练思考中...</div>}
            </div>
            <div className="p-3 border-t border-[var(--color-border)]">
              <div className="flex gap-2">
                <input value={message} onChange={e=>setMessage(e.target.value)}
                  onKeyDown={async e=>{if(e.key==='Enter'&&message.trim()){setChatHistory(p=>[...p,{role:'user',content:message.trim()}]);setMessage('');const d=await call('chat',{message:message.trim()});setChatHistory(p=>[...p,{role:'assistant',content:d?.reply||'...'}]);}}}
                  placeholder="问教练任何魔方问题..." className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm" />
                <button onClick={async()=>{if(!message.trim())return;setChatHistory(p=>[...p,{role:'user',content:message.trim()}]);setMessage('');const d=await call('chat',{message:message.trim()});setChatHistory(p=>[...p,{role:'assistant',content:d?.reply||'...'}]);}} disabled={loading} className="px-5 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-50">发送</button>
              </div>
            </div>
          </>)}

          {tab==='diagnose'&&(
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">🔍</div><h3 className="font-bold mb-2">AI 瓶颈诊断</h3>
              <p className="text-sm text-[var(--color-muted)] mb-6">基于你的计时数据，精准定位最弱环节</p>
              <button onClick={async()=>{const d=await call('diagnose',{});if(d?.diagnosis){setResult(d.diagnosis);setStats(d.data);}}} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">{loading?'⏳ 诊断中...':'🚀 开始诊断'}</button>
              {result&&<div className="mt-6 w-full text-left"><div className="p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{result}</div></div>}
            </div>
          )}

          {tab==='plan'&&(
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">📝</div><h3 className="font-bold mb-2">AI 训练计划</h3>
              <p className="text-sm text-[var(--color-muted)] mb-6">根据你的水平和瓶颈，生成本周个性化训练方案</p>
              <button onClick={async()=>{const d=await call('training-plan',{});if(d?.plan)setResult(d.plan);}} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">{loading?'⏳ 生成中...':'📋 生成计划'}</button>
              {result&&<div className="mt-6 w-full text-left p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{result}</div>}
            </div>
          )}

          {tab==='tasks'&&(
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
              <div className="text-5xl mb-4">📋</div><h3 className="font-bold mb-2">AI 每日任务</h3>
              <p className="text-sm text-[var(--color-muted)] mb-6">教练根据你的等级和弱点，定制今日训练任务</p>
              <button onClick={async()=>{const d=await call('daily-tasks',{});if(d?.tasks)setResult(d.tasks);}} disabled={loading} className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm hover:opacity-90 disabled:opacity-50">{loading?'⏳ 生成中...':'📋 生成任务'}</button>
              {result&&<div className="mt-6 w-full text-left p-4 bg-[var(--color-background)] rounded-xl whitespace-pre-wrap text-sm leading-relaxed">{result}</div>}
            </div>
          )}
        </div>

        <aside className="hidden lg:block w-72 shrink-0 space-y-4">
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="font-bold text-sm mb-3">👤 我的画像</h3>
            <div className="space-y-2">
              {[{k:'age',l:'年龄',ph:'12',t:'number'},{k:'experience',l:'经验',ph:'如: 刚学会'},{k:'goal',l:'目标',ph:'如: Sub-60'},{k:'mainCube',l:'主力魔方',ph:'如: 三阶'},{k:'trainFreq',l:'训练频率',ph:'如: 每天'}].map(f=>(
                <div key={f.k} className="flex items-center gap-2">
                  <label className="text-[10px] text-[var(--color-muted)] w-14 shrink-0">{f.l}</label>
                  <input type={f.t||'text'} value={(profileForm as any)[f.k]} placeholder={f.ph} onChange={e=>setProfileForm({...profileForm,[f.k]:e.target.value})} className="flex-1 px-2 py-1 rounded text-xs bg-[var(--color-background)] border border-[var(--color-border)]" />
                </div>
              ))}
              <button onClick={saveProfile} className="w-full mt-2 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-400 hover:bg-purple-500/30 transition">💾 保存画像</button>
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="font-bold text-sm mb-4">📊 我的数据</h3>
            {stats?(
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">PB</span><span className="font-mono font-bold text-amber-400">{stats.pb?(stats.pb/1000).toFixed(2)+'s':'--'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">均速</span><span className="font-mono font-bold">{stats.avg?(stats.avg/1000).toFixed(2)+'s':'--'}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--color-muted)]">总还原</span><span className="font-mono font-bold">{stats.totalSolves}次</span></div>
                <button onClick={async()=>{setAbilities(null);const d=await post('/api/ai/ability-score');if(d?.score)setAbilities(d.score);}} className="w-full mt-1 py-1.5 rounded-lg text-[10px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 transition">⚡ 刷新能力雷达</button>
              </div>
            ):<div className="text-center py-4 text-xs text-[var(--color-muted)]">点击"诊断"查看数据</div>}

            {/* Radar chart */}
            {abilities && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <div className="text-[10px] text-[var(--color-muted)] mb-1">五维能力</div>
                <div style={{width:'100%',height:160}}>
                  <ResponsiveContainer>
                    <RadarChart data={[
                      {name:'Cross',v:abilities.cross},{name:'F2L',v:abilities.f2l},{name:'OLL',v:abilities.oll},{name:'PLL',v:abilities.pll},{name:'预判',v:abilities.lookahead}
                    ]}>
                      <PolarGrid stroke="#1e293b" />
                      <PolarAngleAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}} />
                      <Radar name="能力" dataKey="v" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Persona selector */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="font-bold text-sm mb-3">🎭 AI 人格</h3>
            <div className="space-y-1.5">
              {[{k:'gentle',l:'🍃 温柔学姐',d:'耐心鼓励，适合新手'},{k:'strict',l:'⚔️ 严格教练',d:'直接犀利，适合进阶'},{k:'bro',l:'😎 损友吐槽',d:'轻松幽默，像朋友'}].map(p=>(
                <button key={p.k} onClick={async()=>{setProfileForm({...profileForm,persona:p.k});await post('/api/ai/persona',{persona:p.k});}}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${profileForm.persona===p.k?'bg-purple-500/10 border border-purple-500/30 text-purple-400':'text-[var(--color-muted)] hover:bg-[var(--color-background)]'}`}>
                  <div className="font-medium">{p.l}</div><div className="text-[10px]">{p.d}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5">
            <h3 className="font-bold text-sm mb-3">⚡ 快捷入口</h3>
            <div className="space-y-2">
              <a href="/training/timer" className="block text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] p-2 rounded-lg hover:bg-[var(--color-background)]">⏱️ 去计时训练</a>
              <a href="/formulas" className="block text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] p-2 rounded-lg hover:bg-[var(--color-background)]">🔤 公式宝典</a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
