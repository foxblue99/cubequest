'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';

/* ── Types ── */
interface Lesson { id?: string; title: string; type: string; content: string; videoUrl?: string; formulaText?: string; cubeMoves?: string; sortOrder: number; published: boolean; }
interface Course { id: string; title: string; summary: string; coverUrl: string; mainCategory: string; category: string; level: string; sortOrder: number; published: boolean; lessons?: Lesson[]; }
interface CatInfo { id: string; name: string; icon: string; subCategories: string; sortOrder: number; active: boolean; parentId?: string | null; }

const LEVELS = ['NEWBIE','BEGINNER','SUB30','SUB20'];
const LT = [{v:'ARTICLE',l:'📝 图文'},{v:'VIDEO',l:'🎬 视频'},{v:'INTERACTIVE',l:'🧊 公式'},{v:'QUIZ',l:'❓ 测试'}];
const emptyCourse = (): Course => ({ id:'',title:'',summary:'',coverUrl:'',mainCategory:'三阶魔方',category:'',level:'NEWBIE',sortOrder:0,published:true,lessons:[] });
const emptyLesson = (): Lesson => ({ title:'',type:'ARTICLE',content:'',videoUrl:'',formulaText:'',cubeMoves:'',sortOrder:0,published:true });

export default function AdminCourses() {
  const [tab, setTab] = useState<'cats'|'courses'>('cats');
  const [catalog, setCatalog] = useState<CatInfo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Course>(emptyCourse());
  const [ctab, setCtab] = useState<'info'|'lessons'>('info');
  const [loading, setLoading] = useState(false);

  // Category editing state
  const [catModal, setCatModal] = useState(false);
  const [catEd, setCatEd] = useState<CatInfo>({ id:'',name:'',icon:'🧊',subCategories:'[]',sortOrder:0,active:true });
  const [subs, setSubs] = useState('');

  const load = () => { api.adminGetCategories().then((d:any)=>setCatalog(Array.isArray(d)?d:[])); api.adminGetCourses().then((d:any)=>setCourses(Array.isArray(d)?d:[])); };
  useEffect(()=>{load();},[]);

  const mainCat = catalog.find(c=>c.name===editing.mainCategory);
  const subCats: string[] = mainCat ? (()=>{try{return JSON.parse(mainCat.subCategories)}catch{return[]}})() : [];

  /* ── Course CRUD ── */
  const saveCourse = async () => {
    if (!editing.title.trim()) return alert('请输入课程标题');
    setLoading(true);
    try {
      const payload = { title:editing.title, summary:editing.summary, coverUrl:editing.coverUrl, mainCategory:editing.mainCategory, category:editing.category, level:editing.level, sortOrder:+editing.sortOrder, published:editing.published };
      let cid = editing.id;
      if (editing.id) { await api.adminUpdateCourse(editing.id,payload); } else { const cr:any=await api.adminCreateCourse(payload); cid=cr.id; }
      if (cid && editing.lessons) for (const l of editing.lessons) { const lp={...l,content:l.content||'',videoUrl:l.videoUrl||null,formulaText:l.formulaText||null,cubeMoves:l.cubeMoves||null,courseId:cid}; l.id?await api.adminUpdateLesson(l.id,lp):await api.adminCreateLesson(lp); }
      setModal(false); load();
    } catch(e:any) { alert(e.message||'保存失败'); } finally { setLoading(false); }
  };
  const delCourse = async (id:string) => { if(!confirm('确定删除？'))return; await api.adminDeleteCourse(id); load(); };
  const openNew = () => { setEditing({...emptyCourse(),lessons:[]}); setCtab('info'); setModal(true); };
  const openEdit = (c:Course) => { setEditing({...c,lessons:c.lessons||[]}); setCtab('info'); setModal(true); };
  const c = (k:keyof Course) => (e:any) => setEditing({...editing,[k]:e.target.value});

  /* ── Category CRUD ── */
  const saveCat = async () => {
    try {
      const d = { ...catEd, subCategories: JSON.stringify(subs.split(',').map(s=>s.trim()).filter(Boolean)) };
      catEd.id ? await api.adminUpdateCategory(catEd.id,d) : await api.adminCreateCategory(d);
      setCatModal(false); load();
    } catch(e:any) { alert(e.message||'保存失败'); }
  };
  const delCat = async (id:string) => { if(!confirm('确定删除分类及其子分类？'))return; await api.adminDeleteCategory(id); load(); };
  const openCatNew = () => { setCatEd({id:'',name:'',icon:'🧊',subCategories:'[]',sortOrder:catalog.length,active:true}); setSubs(''); setCatModal(true); };
  const openCatEdit = (c:CatInfo) => { setCatEd(c); setSubs((()=>{try{return JSON.parse(c.subCategories).join(', ')}catch{return''}})()); setCatModal(true); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">📖 课程 & 分类管理</h1>
        <div className="flex gap-2">
          <button onClick={()=>{setTab('cats');openCatNew()}} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">+ 新建分类</button>
          <button onClick={()=>{setTab('courses');openNew()}} className="px-4 py-2 rounded-lg bg-[var(--color-secondary)] text-white text-sm font-semibold hover:bg-[var(--color-secondary-dark)] transition-colors">+ 新建课程</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-[var(--color-border)] pb-2">
        {[{k:'cats',l:'📂 分类管理'},{k:'courses',l:'📚 课程列表'}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${tab===t.k?'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]':'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── Category Tab ── */}
      {tab==='cats' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-background)]"><tr>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">图标</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">分类名</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">子分类</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">排序</th>
              <th className="text-right px-4 py-3 text-[var(--color-muted)]">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {catalog.map(c=>(
                <tr key={c.id} className="hover:bg-[var(--color-background)]/50">
                  <td className="px-4 py-3 text-xl">{c.icon}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)] text-xs">{(()=>{try{return JSON.parse(c.subCategories).join(', ')}catch{return c.subCategories}})()}</td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">{c.sortOrder}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>openCatEdit(c)} className="text-[var(--color-primary)] hover:underline text-xs">编辑</button>
                    <button onClick={()=>delCat(c.id)} className="text-red-400 hover:underline text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Courses Tab ── */}
      {tab==='courses' && (
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-background)]"><tr>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">大类</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">子分类</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">标题</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">课时</th>
              <th className="text-left px-4 py-3 text-[var(--color-muted)]">状态</th>
              <th className="text-right px-4 py-3 text-[var(--color-muted)]">操作</th>
            </tr></thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {courses.map(c=>(
                <tr key={c.id} className="hover:bg-[var(--color-background)]/50">
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{c.mainCategory||'三阶魔方'}</td>
                  <td className="px-4 py-3 text-xs text-[var(--color-muted)]">{c.category}</td>
                  <td className="px-4 py-3 font-medium">{c.title}</td>
                  <td className="px-4 py-3">{c.lessons?.length||0} 课</td>
                  <td className="px-4 py-3 text-xs">{c.published?'✅':'⬜'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={()=>openEdit(c)} className="text-[var(--color-primary)] hover:underline text-xs">编辑</button>
                    <button onClick={()=>delCourse(c.id)} className="text-red-400 hover:underline text-xs">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Category Modal ── */}
      <Modal open={catModal} onClose={()=>setCatModal(false)} title={catEd.id?'编辑分类':'新建分类'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <F l="名称"><input value={catEd.name} onChange={e=>setCatEd({...catEd,name:e.target.value})} className={cls} placeholder="三阶魔方" /></F>
            <F l="图标"><input value={catEd.icon} onChange={e=>setCatEd({...catEd,icon:e.target.value})} className={cls} placeholder="🧊" /></F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F l="排序"><input type="number" value={catEd.sortOrder} onChange={e=>setCatEd({...catEd,sortOrder:+e.target.value})} className={cls} /></F>
            <div>
              <label className="block text-xs font-medium text-[var(--color-muted)] mb-1">上级分类</label>
              <select value={catEd.parentId||''} onChange={e=>setCatEd({...catEd,parentId:e.target.value||null})} className={cls}>
                <option value="">无 (顶级分类)</option>
                {catalog.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>
          <F l="子分类 (逗号分隔)"><input value={subs} onChange={e=>setSubs(e.target.value)} className={cls} placeholder="入门基础, CFOP基础, F2L, OLL, PLL" /></F>
          <div className="flex gap-3 pt-2">
            <button onClick={saveCat} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm">保存分类</button>
            <button onClick={()=>setCatModal(false)} className="px-6 py-2.5 rounded-lg bg-[var(--color-surface-light)] text-sm">取消</button>
          </div>
        </div>
      </Modal>

      {/* ── Course Modal ── */}
      <Modal open={modal} onClose={()=>setModal(false)} title={editing.id?'编辑课程':'新建课程'}>
        <div className="flex gap-1 mb-5 border-b border-[var(--color-border)] pb-2">
          {[{k:'info',l:'📋 基本信息'},{k:'lessons',l:'📚 课时管理'}].map(t=>(
            <button key={t.k} onClick={()=>setCtab(t.k as any)}
              className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${ctab===t.k?'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]':'text-[var(--color-muted)] hover:text-[var(--color-foreground)]'}`}>
              {t.l} {t.k==='lessons'&&`(${editing.lessons?.length||0})`}
            </button>
          ))}
        </div>

        {ctab==='info' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <F l="大类"><select value={editing.mainCategory} onChange={e=>setEditing({...editing,mainCategory:e.target.value,category:''})} className={cls}>{catalog.map(v=><option key={v.name}>{v.name}</option>)}</select></F>
              <F l="子分类"><select value={editing.category} onChange={c('category')} className={cls}>{subCats.map(v=><option key={v}>{v}</option>)}</select></F>
            </div>
            <div className="grid grid-cols-2 gap-3"><F l="标题 *"><input value={editing.title} onChange={c('title')} className={cls} /></F><F l="封面 URL"><input value={editing.coverUrl} onChange={c('coverUrl')} className={cls} placeholder="https://..." /></F></div>
            <F l="简介"><textarea value={editing.summary} onChange={c('summary')} className={cls} rows={2} /></F>
            <div className="grid grid-cols-3 gap-3">
              <F l="水平"><select value={editing.level} onChange={c('level')} className={cls}>{LEVELS.map(v=><option key={v}>{v}</option>)}</select></F>
              <F l="排序"><input type="number" value={editing.sortOrder} onChange={c('sortOrder')} className={cls} /></F>
              <label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={editing.published} onChange={e=>setEditing({...editing,published:e.target.checked})} /><span className="text-sm">已发布</span></label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {editing.lessons?.map((l,i)=>(
              <div key={i} className="bg-[var(--color-background)] rounded-xl p-4 border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[var(--color-muted)]">课时 {i+1}</span>
                  <div className="flex gap-2">
                    <select value={l.type} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],type:e.target.value};setEditing({...editing,lessons:ls});}} className="text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-2 py-1">{LT.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}</select>
                    <button onClick={()=>setEditing({...editing,lessons:editing.lessons!.filter((_,j)=>j!==i)})} className="text-xs text-red-400">✕</button>
                  </div>
                </div>
                <F l="标题"><input value={l.title} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],title:e.target.value};setEditing({...editing,lessons:ls});}} className={cls} /></F>
                {l.type==='VIDEO'&&<div className="mt-2"><F l="视频URL"><input value={l.videoUrl||''} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],videoUrl:e.target.value};setEditing({...editing,lessons:ls});}} className={cls} /></F></div>}
                {l.type==='INTERACTIVE'&&<div className="mt-2 grid grid-cols-2 gap-2"><F l="公式"><input value={l.formulaText||''} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],formulaText:e.target.value};setEditing({...editing,lessons:ls});}} className={cls} /></F><F l="步骤"><input value={l.cubeMoves||''} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],cubeMoves:e.target.value};setEditing({...editing,lessons:ls});}} className={cls} /></F></div>}
                <div className="mt-2"><F l="内容"><textarea value={l.content||''} onChange={e=>{const ls=[...editing.lessons!];ls[i]={...ls[i],content:e.target.value};setEditing({...editing,lessons:ls});}} className={cls} rows={3} /></F>
                <div className="flex gap-2 mt-1">
                  <label className="px-2 py-1 text-[10px] rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)]">🖼️ 插图片<input type="file" accept="image/*" className="hidden" onChange={async e=>{
                    const f=e.target.files?.[0];if(!f)return;const fd=new FormData();fd.append('file',f);
                    const r=await fetch('/api/upload/image',{method:'POST',body:fd});const d=await r.json();
                    const ls=[...editing.lessons!];ls[i]={...ls[i],content:(l.content||'')+'\n![image]('+'http://localhost:3333'+d.url+')'};setEditing({...editing,lessons:ls});
                  }}/></label>
                  <label className="px-2 py-1 text-[10px] rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] cursor-pointer hover:border-[var(--color-primary)]">🎬 插视频<input type="file" accept="video/*" className="hidden" onChange={async e=>{
                    const f=e.target.files?.[0];if(!f)return;const fd=new FormData();fd.append('file',f);
                    const r=await fetch('/api/upload/video',{method:'POST',body:fd});const d=await r.json();
                    const ls=[...editing.lessons!];ls[i]={...ls[i],videoUrl:'http://localhost:3333'+d.url};setEditing({...editing,lessons:ls});
                  }}/></label>
                </div></div>
              </div>
            ))}
            <button onClick={()=>{setEditing({...editing,lessons:[...(editing.lessons||[]),{...emptyLesson(),sortOrder:(editing.lessons?.length||0)}]});}} className="w-full py-2.5 border-2 border-dashed border-[var(--color-border)] rounded-xl text-sm text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">+ 添加课时</button>
          </div>
        )}

        <div className="flex gap-3 pt-4 mt-4 border-t border-[var(--color-border)]">
          <button onClick={saveCourse} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-dark)]">{loading?'保存中...':'💾 保存全部'}</button>
          <button onClick={()=>setModal(false)} className="px-6 py-2.5 rounded-lg bg-[var(--color-surface-light)] text-sm">取消</button>
        </div>
      </Modal>
    </div>
  );
}

function F({l,children}:{l:string;children:React.ReactNode}){return<div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">{l}</label>{children}</div>;}
const cls="w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]";
