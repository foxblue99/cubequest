'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

const IMG_EXTS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
const VID_EXTS = /\.(mp4|webm|ogg|mov|avi|mkv)$/i;

export default function AdminUploads() {
  const [files, setFiles] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all'|'image'|'video'|'other'>('all');

  useEffect(()=>{load();},[]);
  const load=async()=>{ const d = await api.get('/admin/uploads'); setFiles(Array.isArray(d)?d:[]); };
  const del=async(name:string)=>{ await api.delete(`/admin/uploads/${name}`); load(); };

  const f = Array.isArray(files) ? files : [];
  const filtered = filter==='all' ? f
    : filter==='image' ? f.filter(x=>IMG_EXTS.test(x.name))
    : filter==='video' ? f.filter(x=>VID_EXTS.test(x.name))
    : f.filter(x=>!IMG_EXTS.test(x.name) && !VID_EXTS.test(x.name));

  const tabs = [
    {k:'all' as const, l:'📁 全部', count: f.length},
    {k:'image' as const, l:'🖼️ 图片', count: f.filter(x=>IMG_EXTS.test(x.name)).length},
    {k:'video' as const, l:'🎬 视频', count: f.filter(x=>VID_EXTS.test(x.name)).length},
    {k:'other' as const, l:'📄 其他', count: f.filter(x=>!IMG_EXTS.test(x.name)&&!VID_EXTS.test(x.name)).length},
  ];

  return <div>
    <h1 className="text-2xl font-black mb-4">📁 上传文件管理</h1>
    <div className="flex gap-2 mb-4">
      {tabs.map(t=>(
        <button key={t.k} onClick={()=>setFilter(t.k)}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${filter===t.k?'bg-[var(--color-primary)] text-white':'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]'}`}>{t.l} ({t.count})</button>
      ))}
    </div>
    {filtered.length===0&&<div className="text-sm text-[var(--color-muted)] py-8 text-center">暂无文件</div>}
    <div className="space-y-2">
      {filtered.map(f=>(
        <div key={f.name} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3 flex items-center gap-3">
          {IMG_EXTS.test(f.name) ? (
            <img src={`/uploads/${f.name}`} className="w-14 h-14 rounded-lg object-cover shrink-0" />
          ): VID_EXTS.test(f.name) ? (
            <div className="w-14 h-14 rounded-lg bg-black flex items-center justify-center shrink-0"><span className="text-xl">🎬</span></div>
          ) : <div className="w-14 h-14 rounded-lg bg-[var(--color-background)] flex items-center justify-center shrink-0"><span className="text-xl">📄</span></div>}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{f.name}</div>
            <div className="text-[10px] text-[var(--color-muted)]">
              {(f.size/1024).toFixed(1)}KB · {new Date(f.mtime).toLocaleString('zh-CN')}
            </div>
            <div className="mt-1">
              <input value={`/uploads/${f.name}`} readOnly className="w-full px-2 py-0.5 text-[10px] bg-[var(--color-background)] rounded border border-[var(--color-border)] text-[var(--color-muted)]" onClick={e=>(e.target as HTMLInputElement).select()} />
            </div>
          </div>
          <button onClick={()=>del(f.name)} className="px-3 py-1 text-xs rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 shrink-0">删除</button>
        </div>
      ))}
    </div>
  </div>;
}
