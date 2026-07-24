'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

interface Course { id: string; title: string; summary: string; coverUrl: string; mainCategory: string; category: string; level: string; published: boolean; lessons?: {id:string}[]; }
interface CatInfo { name: string; icon: string; subCategories: string; }

export default function CoursesPage() {
  const [catalog, setCatalog] = useState<CatInfo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeMain, setActiveMain] = useState('全部');
  const [activeSub, setActiveSub] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      api.adminGetCategories().then((d:any)=>setCatalog(Array.isArray(d)?d:[])).catch(()=>{}),
      api.getCourses().then((d:any)=>{const list=Array.isArray(d)?d:(d?.courses||[]);setCourses(list);}).catch((e:any)=>setError(e.message||'加载失败'))
    ]).finally(()=>setLoading(false));
  }, []);

  const mainNames = ['全部', ...catalog.map(c=>c.name)];
  const mainCat = catalog.find(c=>c.name===activeMain);
  const subNames = mainCat ? ['全部', ...( (()=>{try{return JSON.parse(mainCat.subCategories)}catch{return[]}})() )] : ['全部'];

  const filtered = courses.filter(c => {
    if (activeMain!=='全部' && c.mainCategory!==activeMain) return false;
    if (activeSub!=='全部' && c.category!==activeSub) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tighter mb-2">📖 远征课程</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">从入门到竞速，系统化魔方训练</p>

      {/* Main Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {mainNames.map(name=>(
          <button key={name} onClick={()=>{setActiveMain(name);setActiveSub('全部');}}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeMain===name ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}>
            {name}
          </button>
        ))}
      </div>

      {/* Sub Category Chips */}
      {activeMain!=='全部' && subNames.length>2 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {subNames.map(sub=>(
            <button key={sub} onClick={()=>setActiveSub(sub)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeSub===sub ? 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] border border-[var(--color-secondary)]/40' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-secondary)]/30'
              }`}>
              {sub}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] h-48 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-[var(--color-muted)]">{error}</div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-[var(--color-muted)]">该分类暂无课程</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c=>(
            <Link key={c.id} href={`/courses/${c.id}`}
              className="group bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary)]/50 hover:shadow-lg hover:shadow-[var(--color-primary)]/10 transition-all duration-300">
              {c.coverUrl ? (
                <div className="h-40 overflow-hidden"><img src={c.coverUrl} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 flex items-center justify-center text-5xl">
                  {catalog.find(x=>x.name===c.mainCategory)?.icon||'🧊'}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{c.mainCategory}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">{c.category}</span>
                </div>
                <h3 className="font-bold group-hover:text-[var(--color-primary)] transition-colors line-clamp-1">{c.title}</h3>
                <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{c.summary||'暂无简介'}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]">
                  <span className="text-xs text-[var(--color-muted)]">{c.lessons?.length||0} 课时</span>
                  <span className="text-xs text-[var(--color-primary)] font-medium group-hover:translate-x-1 transition-transform">立即学习 →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
