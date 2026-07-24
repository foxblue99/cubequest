
'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';

interface Event { id: string; title: string; type?: string; city: string; address?: string; startDate: string; endDate?: string; registerStart?: string; registerEnd?: string; registerUrl?: string; officialUrl?: string; status: string; events?: string; description?: string; }

const TYPES = ['COMPETITION','CHAMPIONSHIP','MEETUP','ONLINE'];
const STATUSES = ['UPCOMING','REGISTERING','ONGOING','FINISHED','CANCELLED'];
const empty = (): Event => ({ id:'',title:'',city:'',startDate:new Date().toISOString().slice(0,10),status:'UPCOMING' });

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Event>(empty());

  const fetch = () => api.adminGetEvents().then((d:any)=>setEvents(Array.isArray(d)?d:[]));
  useEffect(()=>{fetch();},[]);

  const save = async () => {
    try {
      editing.id ? await api.adminUpdateEvent(editing.id,editing) : await api.adminCreateEvent(editing);
      setModal(false); fetch();
    } catch(e:any) { alert(e.message||'保存失败'); }
  };

  const del = async (id:string) => { if(!confirm('确定删除？')) return; await api.adminDeleteEvent(id); fetch(); };
  const c = (k:keyof Event) => (e:any) => setEditing({...editing,[k]:e.target.value});

  const fmt = (d:string) => d ? new Date(d).toLocaleDateString('zh-CN') : '-';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🏟️ 赛事管理</h1>
        <button onClick={()=>{setEditing(empty());setModal(true);}} className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)]">+ 新建赛事</button>
      </div>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-background)]"><tr>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">名称</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">城市</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">日期</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">状态</th>
            <th className="text-right px-4 py-3 text-[var(--color-muted)]">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {events.map(e => (
              <tr key={e.id} className="hover:bg-[var(--color-background)]/50">
                <td className="px-4 py-3 font-medium">{e.title}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{e.city}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{fmt(e.startDate)}</td>
                <td className="px-4 py-3 text-xs">{e.status}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={()=>{setEditing(e);setModal(true);}} className="text-[var(--color-primary)] hover:underline text-xs">编辑</button>
                  <button onClick={()=>del(e.id)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={()=>setModal(false)} title={editing.id?'编辑赛事':'新建赛事'}>
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">名称</label><input value={editing.title} onChange={c('title')} className={cls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">类型</label><select value={editing.type||''} onChange={c('type')} className={cls}>{TYPES.map(v=><option key={v}>{v}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">状态</label><select value={editing.status} onChange={c('status')} className={cls}>{STATUSES.map(v=><option key={v}>{v}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">城市</label><input value={editing.city} onChange={c('city')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">地址</label><input value={editing.address||''} onChange={c('address')} className={cls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">开始</label><input type="date" value={editing.startDate?.slice(0,10)||''} onChange={c('startDate')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">结束</label><input type="date" value={editing.endDate?.slice(0,10)||''} onChange={c('endDate')} className={cls} /></div>
          </div>
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">比赛项目</label><input value={editing.events||''} onChange={c('events')} className={cls} placeholder="333, 222, OH" /></div>
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">简介</label><textarea value={editing.description||''} onChange={c('description')} className={cls} rows={2} /></div>
          <div className="flex gap-3 pt-2">
            <button onClick={save} className="flex-1 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm">保存</button>
            <button onClick={()=>setModal(false)} className="px-6 py-2.5 rounded-lg bg-[var(--color-surface-light)] text-sm">取消</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const cls = "w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]";
