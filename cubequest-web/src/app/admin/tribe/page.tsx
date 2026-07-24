'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function AdminTribe() {
  const [tab, setTab] = useState<'posts'|'comments'>('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);

  useEffect(()=>{if(tab==='posts') loadPosts(); else loadComments();},[tab]);
  const loadPosts=()=>api.get('/admin/tribe-posts').then(d=>setPosts(Array.isArray(d)?d:[]));
  const loadComments=()=>api.get('/admin/tribe-comments').then(d=>setComments(Array.isArray(d)?d:[]));
  const delPost=async(id: string)=>{await api.delete(`/admin/tribe-posts/${id}`);loadPosts();};
  const delComment=async(id: string)=>{await api.delete(`/admin/tribe-comments/${id}`);loadComments();};

  return <div>
    <h1 className="text-2xl font-black mb-4">🏔️ 部落管理</h1>
    <div className="flex gap-2 mb-4">
      {[{k:'posts',l:'📝 帖子'},{k:'comments',l:'💬 评论'}].map(t=>(
        <button key={t.k} onClick={()=>setTab(t.k as any)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${tab===t.k?'bg-[var(--color-primary)] text-white':'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]'}`}>{t.l}</button>
      ))}
    </div>
    {tab==='posts'&&(Array.isArray(posts)?posts:[]).map(p=>(
      <div key={p.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 mb-2 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{p.user?.nickname}</span>
            <span className="text-[10px] text-[var(--color-muted)] ml-auto">{new Date(p.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <p className="text-xs text-[var(--color-muted)] truncate">{p.content?.slice(0,80)}</p>
        </div>
        <button onClick={()=>delPost(p.id)} className="px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400">删除</button>
      </div>
    ))}
    {tab==='comments'&&(Array.isArray(comments)?comments:[]).map(c=>(
      <div key={c.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 mb-2 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">{c.user?.nickname}</span>
            <span className="text-[10px] text-[var(--color-muted)] ml-auto">{new Date(c.createdAt).toLocaleString('zh-CN')}</span>
          </div>
          <p className="text-xs">{c.content}</p>
        </div>
        <button onClick={()=>delComment(c.id)} className="px-2 py-1 text-[10px] rounded bg-red-500/10 text-red-400">删除</button>
      </div>
    ))}
  </div>;
}
