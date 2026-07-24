'use client';

import { useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface Formula { id: string; name: string; mainCategory: string; category: string; moves: string; difficulty: number; description?: string; }
interface CatInfo { name: string; icon: string; subCategories: string; }

export default function FormulasPage() {
  const [catalog, setCatalog] = useState<CatInfo[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [activeMain, setActiveMain] = useState('全部');
  const [activeSub, setActiveSub] = useState('全部');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    Promise.all([
      api.adminGetCategories().then((d:any)=>setCatalog(Array.isArray(d)?d:[])).catch(()=>{}),
      api.getFormulas().then((d:any)=>{const arr=Array.isArray(d)?d:(d?.formulas||[]);setFormulas(arr);}).catch((e:any)=>setError(e.message||'加载失败'))
    ]).finally(()=>setLoading(false));
  }, []);

  const mainNames = ['全部', ...catalog.map(c=>c.name)];
  const mainCat = catalog.find(c=>c.name===activeMain);
  const subNames = mainCat ? ['全部', ...( (()=>{try{return JSON.parse(mainCat.subCategories)}catch{return[]}})() )] : ['全部'];

  const filtered = formulas.filter(f=>{
    if (activeMain!=='全部' && f.mainCategory!==activeMain) return false;
    if (activeSub!=='全部' && f.category!==activeSub) return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-black tracking-tighter mb-2">🔤 公式宝典</h1>
      <p className="text-[var(--color-muted)] mb-6 text-sm">按魔方类型和子分类浏览公式</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {mainNames.map(name=>(
          <button key={name} onClick={()=>{setActiveMain(name);setActiveSub('全部');}}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeMain===name ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/30' : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]'
            }`}>{name}</button>
        ))}
      </div>

      {activeMain!=='全部' && subNames.length>2 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {subNames.map(sub=>(
            <button key={sub} onClick={()=>setActiveSub(sub)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                activeSub===sub ? 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] border border-[var(--color-secondary)]/40' : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-secondary)]/30'
              }`}>{sub}</button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i=><div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] h-32 animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-[var(--color-muted)]">{error}</div>
      ) : filtered.length===0 ? (
        <div className="text-center py-16"><div className="text-5xl mb-4">🔍</div><p className="text-[var(--color-muted)]">该分类暂无公式</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f=>(
            <div key={f.id} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary)]/40 hover:shadow-lg hover:shadow-[var(--color-primary)]/5 transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{f.mainCategory}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">{f.category}</span>
                  </div>
                  <h3 className="font-bold">{f.name}</h3>
                </div>
                <span className="text-sm">{'⭐'.repeat(f.difficulty)}</span>
              </div>
              <div className="bg-[var(--color-background)] rounded-lg px-3 py-2 font-mono text-sm tracking-wider text-[var(--color-primary)] mb-3 overflow-x-auto whitespace-nowrap">
                {f.moves}
              </div>
              {f.description && <p className="text-xs text-[var(--color-muted)] mt-2">{f.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
