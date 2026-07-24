'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';

interface Formula { id: string; name: string; mainCategory: string; category: string; caseCode?: string; moves: string; difficulty: number; description?: string; sortOrder: number; published: boolean; }
interface CatInfo { name: string; icon: string; subCategories: string; }

const empty = (): Formula => ({ id:'',name:'',mainCategory:'三阶魔方',category:'OLL',moves:'',difficulty:1,sortOrder:0,published:true });

export default function AdminFormulas() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [catalog, setCatalog] = useState<CatInfo[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Formula>(empty());

  const load = () => { api.adminGetFormulas().then((d:any)=>setFormulas(Array.isArray(d)?d:[])); api.adminGetCategories().then((d:any)=>setCatalog(Array.isArray(d)?d:[])).catch(()=>{}); };
  useEffect(()=>{load();},[]);

  const mainCat = catalog.find(c=>c.name===editing.mainCategory);
  const subCats: string[] = mainCat ? (()=>{try{return JSON.parse(mainCat.subCategories)}catch{return[]}})() : [];

  const save = async () => {
    try {
      editing.id ? await api.adminUpdateFormula(editing.id,editing) : await api.adminCreateFormula(editing);
      setModal(false); load();
    } catch(e:any) { alert(e.message||'保存失败'); }
  };
  const del = async (id:string) => { if(!confirm('确定删除？'))return; await api.adminDeleteFormula(id); load(); };
  const c = (k:keyof Formula) => (e:any) => setEditing({...editing,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value});

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🔤 公式管理</h1>
        <button onClick={()=>{setEditing(empty());setModal(true);}} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)]">+ 新建公式</button>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-background)]"><tr>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">大类</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">子分类</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">名称</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">公式</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">难度</th>
            <th className="text-right px-4 py-3 text-[var(--color-muted)]">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {formulas.map(f=>(
              <tr key={f.id} className="hover:bg-[var(--color-background)]/50">
                <td className="px-4 py-3 text-[var(--color-muted)] text-xs">{f.mainCategory||'三阶魔方'}</td>
                <td className="px-4 py-3 text-[var(--color-muted)] text-xs">{f.category}</td>
                <td className="px-4 py-3 font-medium">{f.name}</td>
                <td className="px-4 py-3 font-mono text-xs max-w-[300px] truncate">{f.moves}</td>
                <td className="px-4 py-3">{'⭐'.repeat(f.difficulty)}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>{setEditing(f);setModal(true);}} className="text-[var(--color-primary)] hover:underline text-xs">编辑</button>
                  <button onClick={()=>del(f.id)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing.id?'编辑公式':'新建公式'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">大类</label><select value={editing.mainCategory} onChange={e=>setEditing({...editing,mainCategory:e.target.value,category:''})} className={cls}>{catalog.map(v=><option key={v.name}>{v.name}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">子分类</label><select value={editing.category} onChange={c('category')} className={cls}>{subCats.map(v=><option key={v}>{v}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">名称</label><input value={editing.name} onChange={c('name')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">编号</label><input value={editing.caseCode||''} onChange={c('caseCode')} className={cls} /></div>
          </div>
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">公式步骤</label><input value={editing.moves} onChange={c('moves')} className={cls} placeholder="R U R' U'" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">难度</label><input type="number" min={1} max={5} value={editing.difficulty} onChange={e=>setEditing({...editing,difficulty:+e.target.value})} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">排序</label><input type="number" value={editing.sortOrder} onChange={c('sortOrder')} className={cls} /></div>
            <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={editing.published} onChange={c('published')} /><span className="text-sm">发布</span></label>
          </div>
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">说明</label><textarea value={editing.description||''} onChange={c('description')} className={cls} rows={2} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm">保存</button>
            <button onClick={()=>setModal(false)} className="px-6 py-2.5 rounded-lg bg-[var(--color-surface-light)] text-sm">取消</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const cls="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]";
