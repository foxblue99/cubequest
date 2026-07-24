'use client';

import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

interface Comment { id: string; content: string; createdAt: string; user: { nickname: string } }
interface Tier { name: string; icon: string }
interface Post {
  id: string; content: string; imageUrls: string; videoUrl?: string;
  flames: number; pinned: boolean; createdAt: string;
  user: { id: string; nickname: string }; comments: Comment[];
  _count: { comments: number; flamesRel: number }; authorTier: Tier;
}
interface RankItem { userId: string; nickname: string; pb: string; posts: number; flames: number; tier: Tier }

export default function TribePage() {
  const [hydrated, setHydrated] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [sort, setSort] = useState('latest');
  const [loading, setLoading] = useState(false);
  const [newPost, setNewPost] = useState('');
  const [newVideo, setNewVideo] = useState('');
  const [posting, setPosting] = useState(false);
  const [previewImg, setPreviewImg] = useState<string|null>(null);
  const [commenting, setCommenting] = useState<string|null>(null);
  const [commentText, setCommentText] = useState('');
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [godActivity, setGodActivity] = useState<Post[]>([]);
  const [onlineCount] = useState(()=>Math.floor(Math.random()*50+10));

  useEffect(()=>{setHydrated(true);loadPosts();loadRankings();loadGodActivity();},[]);

  const loadPosts = async (page=1) => {
    setLoading(true);
    const res = await fetch(`/api/tribe/posts?sort=${sort}&page=${page}`);
    const data = await res.json();
    setPosts(prev => page===1 ? data : [...prev, ...data]);
    setLoading(false);
  };
  const loadRankings = async () => {
    const res = await fetch('/api/tribe/rankings');
    setRankings(await res.json());
  };
  const loadGodActivity = async () => {
    // Filter posts from users with PB < 10s (gods) and < 6s (ultra gods)
    const res = await fetch('/api/tribe/posts?sort=latest&page=1');
    const all: Post[] = await res.json();
    setGodActivity(all.filter(p => {
      const tierIdx = ['青铜魔士','白银魔师','黄金魔尊','铂金魔圣','钻石魔皇','传说魔神'].indexOf(p.authorTier.name);
      return tierIdx >= 5; // 钻石魔皇 (Sub-15) and above
    }).slice(0, 5));
  };

  const uploadFile = async (file: File, type: 'image'|'video') => {
    const fd = new FormData(); fd.append('file', file);
    const auth = getAuth();
    const res = await fetch(`/api/upload/${type}`, {
      method:'POST', body:fd,
      headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
    });
    const d = await res.json();
    return d.url;
  };

  const createPost = async () => {
    if (!newPost.trim()) return;
    setPosting(true);
    try {
      const auth = getAuth();
      await fetch('/api/tribe/posts', {
        method:'POST', headers:{'Content-Type':'application/json', ...(auth?.token ? {Authorization:`Bearer ${auth.token}`} : {})},
        body:JSON.stringify({ content:newPost, videoUrl:newVideo||null }),
      });
      setNewPost(''); setNewVideo(''); loadPosts(1);
    } catch {} finally { setPosting(false); }
  };

  const toggleFlame = async (postId: string) => {
    await fetch(`/api/tribe/posts/${postId}/flame`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ userId: getAuth()?.user?.id }),
    });
    loadPosts(1);
  };

  const addComment = async (postId: string) => {
    if (!commentText.trim()) return;
    await fetch(`/api/tribe/posts/${postId}/comments`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ content:commentText, userId: getAuth()?.user?.id }),
    });
    setCommentText(''); setCommenting(null); loadPosts(1);
  };

  if (!hydrated) return null;
  const user = getAuth()?.user;
  const hotPosts = [...posts].sort((a,b)=>b.flames-a.flames).slice(0,5);
  const hasVideo = posts.filter(p=>p.videoUrl).slice(0,3);
  const tierOrder = ['青铜魔士','白银魔师','黄金魔尊','铂金魔圣','钻石魔皇','传说魔神'];
  const godRanks = rankings.filter(r => tierOrder.indexOf(r.tier.name) >= 5);
  const ultraGodRanks = rankings.filter(r => r.tier.name === '传说魔神');

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-3xl font-black tracking-tighter mb-1">🏔️ 魔神大陆</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">魔友交流圈 · 分享心得 · 秀手法 · 晒成绩 · 实时在线 {onlineCount} 人</p>

      <div className="flex gap-5">
        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-4">
          {/* Rankings */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <h3 className="font-bold text-sm mb-3">🏆 魔友排行</h3>
            {rankings.slice(0,5).map((r,i)=>(
              <Link key={i} href={`/tribe/user/${r.userId}`} className="flex items-center gap-2 py-1.5 text-xs border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] rounded px-1 transition-colors">
                <span className="font-bold w-5">{i+1}</span>
                <span>{r.tier.icon}</span>
                <span className="flex-1 truncate">{r.nickname}</span>
                <span className="text-[var(--color-muted)]">{r.pb}</span>
              </Link>
            ))}
          </div>

          {/* Contribution Rank */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <h3 className="font-bold text-sm mb-3">🔥 贡献排行</h3>
            {[...rankings].sort((a,b)=>b.flames-a.flames).slice(0,5).map((r,i)=>(
              <Link key={i} href={`/tribe/user/${r.userId}`} className="flex items-center gap-2 py-1.5 text-xs border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] rounded px-1 transition-colors">
                <span className="font-bold w-5">{i+1}</span>
                <span className="flex-1 truncate">{r.nickname}</span>
                <span className="text-orange-400">🔥{r.flames}</span>
              </Link>
            ))}
          </div>

          {/* Gods & Ultra Gods */}
          {(godRanks.length>0||ultraGodRanks.length>0)&&(
          <div className="bg-gradient-to-br from-yellow-500/10 to-red-500/10 rounded-2xl border border-yellow-500/20 p-4">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-1">👑 大神动向</h3>
            {godActivity.map((p,i)=>(
              <div key={i} className="py-1.5 text-xs border-b border-yellow-500/10 last:border-0">
                <span className="font-medium text-yellow-400">{p.user.nickname}</span>
                <span className="text-[var(--color-muted)] ml-1">{p.content.slice(0,30)}{p.content.length>30?'...':''}</span>
              </div>
            ))}
            {godActivity.length===0&&<div className="text-xs text-[var(--color-muted)]">暂无大神动态</div>}
          </div>
          )}
        </aside>

        {/* ── Main Feed ── */}
        <main className="flex-1 min-w-0">
          {user ? (
            <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-4">
              <textarea value={newPost} onChange={e=>setNewPost(e.target.value)}
                placeholder="分享你的魔方心得、手法、成绩..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm resize-none h-20 focus:outline-none focus:border-[var(--color-primary)]"/>
              <div className="flex items-center gap-2 mt-1">
                <button onClick={async()=>{if(!newPost.trim())return;setPosting(true);
                  try{const r=await fetch('/api/ai/polish',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:newPost})});
                  const d=await r.json();if(d?.result)setNewPost(d.result);}finally{setPosting(false);}}}
                  disabled={posting||!newPost.trim()} className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition disabled:opacity-30">
                  ✨ AI润色
                </button>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <input value={newVideo} onChange={e=>setNewVideo(e.target.value)}
                  placeholder="视频链接或上传" className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs"/>
                <label className="px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs cursor-pointer hover:border-[var(--color-primary)]">
                  🖼️
                  <input type="file" accept="image/*" className="hidden" onChange={async e=>{
                    const f=e.target.files?.[0];if(!f)return;
                    const url=await uploadFile(f,'image');
                    setNewPost(p=>p+'\n![image]('+url+')');
                  }}/>
                </label>
                <label className="px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-xs cursor-pointer hover:border-[var(--color-primary)]">
                  🎬
                  <input type="file" accept="video/*" className="hidden" onChange={async e=>{
                    const f=e.target.files?.[0];if(!f)return;
                    setNewVideo(await uploadFile(f,'video'));
                  }}/>
                </label>
                <button onClick={createPost} disabled={posting||!newPost.trim()}
                  className="px-5 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-50">
                  {posting?'...':'🔥 发魔帖'}
                </button>
              </div>
            </div>
          ):(
            <div className="text-center py-8 text-[var(--color-muted)] text-sm mb-4">请先登录再发帖</div>
          )}

          <div className="flex gap-2 mb-4">
            {[{k:'latest',l:'🕐 最新'},{k:'hot',l:'🔥 最热'}].map(s=>(
              <button key={s.k} onClick={()=>{setSort(s.k);loadPosts(1);}}
                className={`px-3 py-1 rounded-lg text-xs font-medium ${sort===s.k?'bg-[var(--color-primary)] text-white':'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]'}`}>{s.l}</button>
            ))}
          </div>

          {posts.map(p=>{
            const imgRegex = /!\[.*?\]\((.*?)\)/g;
            const images: string[] = [];
            let m; while ((m=imgRegex.exec(p.content))!==null) images.push(m[1]);
            const cleanText = p.content.replace(imgRegex,'').trim();

            return (
            <div key={p.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4 mb-3 hover:border-[var(--color-primary)]/30 transition-colors">
              {p.pinned&&<div className="text-xs text-amber-400 mb-1">📌 置顶</div>}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{p.authorTier.icon}</span>
                <span className="font-bold text-sm">{p.user.nickname}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)]">{p.authorTier.name}</span>
                <span className="text-xs text-[var(--color-muted)] ml-auto">{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              {cleanText&&<p className="text-sm whitespace-pre-wrap mb-2">{cleanText}</p>}
              {images.length>0&&(
                <div className="grid gap-2 mb-2">
                  {images.map((img,i)=>
                    <img key={i} src={img} alt="" onClick={()=>setPreviewImg(img)}
                      className="rounded-xl max-h-64 object-cover w-full cursor-pointer hover:opacity-80 transition-opacity"/>
                  )}
                </div>
              )}
              {p.videoUrl&&(
                <div className="mb-2 rounded-xl overflow-hidden bg-black">
                  <video src={p.videoUrl} controls className="w-full max-h-72" preload="metadata"/>
                </div>
              )}
              <div className="flex items-center gap-4 text-xs text-[var(--color-muted)]">
                <button onClick={()=>toggleFlame(p.id)} className="flex items-center gap-1 hover:text-orange-400">🔥 {p._count?.flamesRel||p.flames}</button>
                <button onClick={()=>setCommenting(commenting===p.id?null:p.id)} className="flex items-center gap-1 hover:text-[var(--color-primary)]">💬 {p._count?.comments||p.comments?.length||0}</button>
              </div>
              {commenting===p.id&&(
                <div className="mt-2 pt-2 border-t border-[var(--color-border)]">
                  {p.comments?.slice(0,5).map(c=><div key={c.id} className="text-xs py-1"><span className="font-medium text-[var(--color-primary)]">{c.user?.nickname}</span>: {c.content}</div>)}
                  <div className="flex gap-2 mt-2">
                    <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="写评论..." className="flex-1 px-2 py-1 rounded bg-[var(--color-background)] border border-[var(--color-border)] text-xs"/>
                    <button onClick={()=>addComment(p.id)} className="px-3 py-1 rounded bg-[var(--color-primary)] text-white text-xs">发送</button>
                  </div>
                </div>
              )}
            </div>
          );})}

          {loading&&<div className="text-center py-6 text-[var(--color-muted)] text-sm">加载中...</div>}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="hidden xl:block w-64 shrink-0 space-y-4">
          {/* Weekly Hot */}
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <h3 className="font-bold text-sm mb-3">🔥 本周热帖</h3>
            {hotPosts.map((p,i)=>(
              <Link key={i} href={`/tribe/post/${p.id}`} className="block py-1.5 text-xs border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] rounded px-1 transition-colors">
                <span className="font-medium truncate block">{p.content.slice(0,25).replace(/!\[.*?\]\(.*?\)/g,'[图]')}{p.content.length>25?'...':''}</span>
                <span className="text-[var(--color-muted)]">{p.user.nickname} · 🔥{p.flames}</span>
              </Link>
            ))}
            {hotPosts.length===0&&<div className="text-xs text-[var(--color-muted)]">暂无热帖</div>}
          </div>

          {/* Hot Videos */}
          {hasVideo.length>0&&(
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <h3 className="font-bold text-sm mb-3">🎬 热门视频</h3>
            {hasVideo.map((p,i)=>(
              <Link key={i} href={`/tribe/post/${p.id}`} className="block py-1.5 text-xs border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-background)] rounded px-1 transition-colors">
                <span className="font-medium">{p.user.nickname}</span>
                <span className="text-[var(--color-muted)] ml-1 truncate block">{p.content.slice(0,20).replace(/!\[.*?\]\(.*?\)/g,'[图]')}</span>
                <span className="text-orange-400">🔥{p.flames}</span>
              </Link>
            ))}
          </div>
          )}

          {/* Gods */}
          <div className="bg-gradient-to-br from-amber-500/10 to-red-500/10 rounded-2xl border border-amber-500/20 p-4">
            <h3 className="font-bold text-sm mb-3">🔮 超神榜 (Sub-6)</h3>
            {ultraGodRanks.slice(0,3).map((r,i)=>(
              <Link key={i} href={`/tribe/user/${r.userId}`} className="flex items-center gap-2 py-1.5 text-xs border-b border-amber-500/10 last:border-0 hover:bg-amber-500/5 rounded px-1 transition-colors">
                <span className="text-lg">🔮</span>
                <span className="flex-1 font-medium">{r.nickname}</span>
                <span className="text-amber-400">PB {r.pb}</span>
              </Link>
            ))}
            {ultraGodRanks.length===0&&<div className="text-xs text-[var(--color-muted)]">虚位以待...</div>}
          </div>

          {/* Hot Images */}
          {posts.filter(p=>/!\[.*?\]/.test(p.content)).slice(0,3).length>0&&(
          <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
            <h3 className="font-bold text-sm mb-3">🖼️ 热门图片</h3>
            {posts.filter(p=>/!\[.*?\]/.test(p.content)).slice(0,3).map((p,i)=>{
              const m=/!\[.*?\]\((.*?)\)/.exec(p.content);
              return m? <Link key={i} href={`/tribe/post/${p.id}`}><img src={m[1]} alt="" className="w-full rounded-lg mb-2 max-h-32 object-cover hover:opacity-80 transition-opacity"/></Link>:null;
            })}
          </div>
          )}
        </aside>
      </div>
      {/* Image preview modal */}
      {previewImg && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={()=>setPreviewImg(null)}>
          <button onClick={()=>setPreviewImg(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors">
            ✕
          </button>
          <img src={previewImg} alt="" className="max-w-full max-h-[90vh] rounded-xl" onClick={e=>e.stopPropagation()}/>
        </div>
      )}
    </div>
  );
}
