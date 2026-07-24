'use client';

import { useState, useEffect, use } from 'react';
import { getAuth } from '@/lib/auth';
import Link from 'next/link';

export default function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [post, setPost] = useState<any>(null);
  const [commentText, setCommentText] = useState('');

  useEffect(()=>{fetch(`/api/tribe/posts/${id}`).then(r=>r.json()).then(setPost);},[id]);

  const toggleFlame=async()=>{
    await fetch(`/api/tribe/posts/${id}/flame`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:getAuth()?.user?.id})});
    const r=await fetch(`/api/tribe/posts/${id}`);setPost(await r.json());
  };
  const addComment=async()=>{
    if(!commentText.trim())return;
    await fetch(`/api/tribe/posts/${id}/comments`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:commentText,userId:getAuth()?.user?.id})});
    setCommentText('');const r=await fetch(`/api/tribe/posts/${id}`);setPost(await r.json());
  };

  if(!post)return<div className="text-center py-20 text-[var(--color-muted)]">加载中...</div>;

  const imgRegex=/!\[.*?\]\((.*?)\)/g;
  const images:string[]=[];let m;while((m=imgRegex.exec(post.content))!==null)images.push(m[1]);
  const clean=post.content.replace(imgRegex,'').trim();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/tribe" className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] mb-4 inline-block">← 返回部落</Link>
      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/tribe/user/${post.user.id}`} className="flex items-center gap-2 hover:opacity-80">
            <span className="text-xl">{post.authorTier.icon}</span>
            <span className="font-bold">{post.user.nickname}</span>
          </Link>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-muted)]">{post.authorTier.name}</span>
          <span className="text-xs text-[var(--color-muted)] ml-auto">{new Date(post.createdAt).toLocaleString('zh-CN')}</span>
        </div>
        {clean&&<p className="text-sm whitespace-pre-wrap mb-4">{clean}</p>}
        {images.map((img,i)=><img key={i} src={img} className="rounded-xl max-h-96 object-cover w-full mb-4"/>)}
        {post.videoUrl&&<video src={post.videoUrl} controls className="w-full max-h-96 rounded-xl mb-4"/>}
        <div className="flex items-center gap-4 text-sm text-[var(--color-muted)] mb-4">
          <button onClick={toggleFlame} className="flex items-center gap-1 hover:text-orange-400">🔥 {post._count?.flamesRel||post.flames}</button>
          <span>💬 {post._count?.comments||post.comments?.length||0}</span>
        </div>
        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="font-bold text-sm mb-3">评论</h3>
          {post.comments?.map((c:any)=><div key={c.id} className="text-sm py-2 border-b border-[var(--color-border)] last:border-0"><span className="font-medium text-[var(--color-primary)]">{c.user?.nickname}</span>: {c.content}</div>)}
          <div className="flex gap-2 mt-3">
            <input value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="写评论..." className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-sm"/>
            <button onClick={addComment} className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-sm">发送</button>
          </div>
        </div>
      </div>
    </div>
  );
}
