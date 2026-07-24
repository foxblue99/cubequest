'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Modal from '@/components/ui/Modal';

interface User {
  id: string; role: string; nickname: string; phone?: string;
  city?: string; birthYear?: number; createdAt: string;
  studentProfile?: { level: string; bestSingleMs?: number; streakDays: number };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [modal, setModal] = useState<'create'|'edit'|'pwd'|null>(null);
  const [editing, setEditing] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const fetch = () => api.adminGetUsers().then((d:any) => setUsers(Array.isArray(d)?d:[]));
  useEffect(() => { fetch(); }, []);

  const c = (k: string) => (e: any) => setEditing({ ...editing, [k]: e.target.value });

  const saveCreate = async () => {
    if (!editing.phone||!editing.nickname) return setMsg('手机号和昵称必填');
    setLoading(true);
    try { await api.adminCreateUser(editing); setModal(null); fetch(); setMsg(''); }
    catch(e:any) { setMsg(e.message||'创建失败'); }
    finally { setLoading(false); }
  };

  const saveEdit = async () => {
    try { await api.adminUpdateUser(editing.id, editing); setModal(null); fetch(); }
    catch(e:any) { setMsg(e.message||'保存失败'); }
  };

  const resetPwd = async () => {
    if (!editing.newPassword||editing.newPassword.length<6) return setMsg('密码至少6位');
    try { await api.adminResetPassword(editing.id, editing.newPassword); setModal(null); setMsg('密码已重置'); setTimeout(()=>setMsg(''),2000); }
    catch(e:any) { setMsg(e.message||'重置失败'); }
  };

  const del = async (id:string) => {
    if (!confirm('确定删除该用户？此操作不可撤销。')) return;
    await api.adminDeleteUser(id); fetch();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">👥 用户管理</h1>
        <button onClick={() => { setEditing({role:'STUDENT',phone:'',nickname:'',password:'123456'}); setModal('create'); setMsg(''); }}
          className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)]">
          + 添加用户
        </button>
      </div>
      {msg && <div className="mb-4 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{msg}</div>}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[var(--color-background)]"><tr>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">昵称</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">角色</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">手机</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">城市</th>
            <th className="text-left px-4 py-3 text-[var(--color-muted)]">注册</th>
            <th className="text-right px-4 py-3 text-[var(--color-muted)]">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[var(--color-background)]/50">
                <td className="px-4 py-3 font-medium">{u.nickname}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${u.role==='ADMIN'?'bg-red-500/20 text-red-400':u.role==='PARENT'?'bg-purple-500/20 text-purple-400':'bg-blue-500/20 text-blue-400'}`}>{u.role}</span></td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{u.phone}</td>
                <td className="px-4 py-3 text-[var(--color-muted)]">{u.city||'-'}</td>
                <td className="px-4 py-3 text-[var(--color-muted)] text-xs">{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                <td className="px-4 py-3 text-right space-x-1.5">
                  <button onClick={()=>{setEditing(u);setModal('edit');}} className="text-[var(--color-primary)] hover:underline text-xs">编辑</button>
                  <button onClick={()=>{setEditing({id:u.id,newPassword:''});setModal('pwd');setMsg('');}} className="text-amber-400 hover:underline text-xs">改密</button>
                  <button onClick={()=>del(u.id)} className="text-red-400 hover:underline text-xs">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      <Modal open={modal==='create'} onClose={()=>setModal(null)} title="添加用户">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">角色</label>
              <select value={editing.role} onChange={c('role')} className={cls}>
                <option value="STUDENT">学员</option><option value="PARENT">家长</option><option value="ADMIN">管理员</option>
              </select></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">手机号 *</label>
              <input value={editing.phone||''} onChange={c('phone')} className={cls} placeholder="11位手机号" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">昵称 *</label>
              <input value={editing.nickname||''} onChange={c('nickname')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">初始密码</label>
              <input value={editing.password||'123456'} onChange={c('password')} className={cls} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">城市</label>
              <input value={editing.city||''} onChange={c('city')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">出生年份</label>
              <input type="number" value={editing.birthYear||''} onChange={c('birthYear')} className={cls} /></div>
          </div>
          {msg && <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{msg}</div>}
          <button onClick={saveCreate} disabled={loading} className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm">{loading?'创建中...':'创建用户'}</button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal open={modal==='edit'} onClose={()=>setModal(null)} title="编辑用户">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">角色</label>
              <select value={editing.role} onChange={c('role')} className={cls}>
                <option value="STUDENT">学员</option><option value="PARENT">家长</option><option value="ADMIN">管理员</option>
              </select></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">手机号</label>
              <input value={editing.phone||''} onChange={c('phone')} className={cls} /></div>
          </div>
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">昵称</label>
            <input value={editing.nickname||''} onChange={c('nickname')} className={cls} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">城市</label>
              <input value={editing.city||''} onChange={c('city')} className={cls} /></div>
            <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">出生年份</label>
              <input type="number" value={editing.birthYear||''} onChange={c('birthYear')} className={cls} /></div>
          </div>
          <button onClick={saveEdit} className="w-full py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm">保存修改</button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={modal==='pwd'} onClose={()=>setModal(null)} title="重置密码">
        <div className="space-y-4">
          <div><label className="block text-xs font-medium text-[var(--color-muted)] mb-1">新密码</label>
            <input value={editing.newPassword||''} onChange={c('newPassword')} type="text" className={cls} placeholder="至少6位" /></div>
          {msg && <div className={`text-sm px-3 py-2 rounded-lg ${msg.includes('已重置')?'bg-green-500/10 border border-green-500/20 text-green-400':'bg-red-400/10 border border-red-400/20 text-red-400'}`}>{msg}</div>}
          <button onClick={resetPwd} className="w-full py-2.5 rounded-lg bg-amber-500 text-white font-semibold text-sm">确认重置</button>
        </div>
      </Modal>
    </div>
  );
}

const cls = "w-full px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] text-[var(--color-foreground)] text-sm focus:outline-none focus:border-[var(--color-primary)]";
