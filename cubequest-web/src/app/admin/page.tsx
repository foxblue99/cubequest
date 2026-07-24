'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [trend, setTrend] = useState<any>([]);
  const [alerts, setAlerts] = useState<any>([]);
  const [topSolvers, setTopSolvers] = useState<any>([]);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    api.get('/admin/insight/dashboard').then(setStats).catch(console.error);
    api.get('/admin/insight/solve-trend').then(setTrend).catch(console.error);
    api.get('/admin/insight/anomalies').then(setAlerts).catch(console.error);
    api.get('/admin/insight/top-solvers').then(setTopSolvers).catch(console.error);
  }, []);

  const m = stats?.metrics;
  const metrics = m ? [
    { label:'总用户', value:m.totalUsers, icon:'👥', color:'#38bdf8' },
    { label:'周活跃', value:m.activeUsers, icon:'⚡', color:'#a78bfa' },
    { label:'总还原', value:m.totalSolves, icon:'🔄', color:'#f97316' },
    { label:'今日', value:m.todaySolves, icon:'📅', color:'#22c55e' },
    { label:'课程数', value:m.totalCourses, icon:'📖', color:'#facc15' },
    { label:'公式数', value:m.totalFormulas, icon:'🔤', color:'#f472b6' },
    { label:'本周帖', value:m.totalPosts, icon:'📝', color:'#34d399' },
    { label:'赛事', value:m.totalEvents, icon:'🏆', color:'#fb923c' },
  ] : [];

  const trendData = trend.map((d:any) => ({
    ...d,
    avgSec: d.avgMs ? (d.avgMs/1000).toFixed(1) : null,
    bestSec: d.bestMs ? (d.bestMs/1000).toFixed(1) : null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📊 数据洞察</h1>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-1">
          {alerts.map((a:any,i:number)=>(
            <div key={i} className={`text-sm px-4 py-2 rounded-lg border ${
              a.severity==='critical'?'bg-red-500/10 border-red-500/30 text-red-400':
              a.severity==='warning'?'bg-amber-500/10 border-amber-500/30 text-amber-400':
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            }`}>
              {a.severity==='critical'?'🔴':a.severity==='warning'?'⚠️':'ℹ️'} {a.message}
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {metrics.map((m,i)=>(
          <div key={i} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
            <div className="text-xs text-[var(--color-muted)]">{m.icon} {m.label}</div>
            <div className="text-xl font-black mt-1" style={{color:m.color}}>{m.value?.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Solve Trend */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-bold text-sm mb-3">📈 30天还原趋势</h3>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={v=>v.slice(5)} />
                <YAxis tick={{fontSize:10,fill:'#64748b'}} width={40} />
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,fontSize:12}} />
                <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={2} dot={false} name="还原量" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Time Trend */}
        <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-bold text-sm mb-3">⚡ 日均最佳 (秒)</h3>
          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{fontSize:10,fill:'#64748b'}} tickFormatter={v=>v.slice(5)} />
                <YAxis tick={{fontSize:10,fill:'#64748b'}} width={40} />
                <Tooltip contentStyle={{background:'#1e293b',border:'1px solid #334155',borderRadius:8,fontSize:12}} />
                <Line type="monotone" dataKey="bestSec" stroke="#facc15" strokeWidth={2} dot={false} name="最快(s)" />
                <Line type="monotone" dataKey="avgSec" stroke="#64748b" strokeWidth={1} dot={false} name="平均(s)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Solvers */}
      {topSolvers.length > 0 && (
        <div className="mt-4 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-4">
          <h3 className="font-bold text-sm mb-3">🏆 本周训练榜 Top {topSolvers.length}</h3>
          <div className="flex gap-2 flex-wrap">
            {topSolvers.map((s:any,i:number)=>(
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)]">
                <span className="text-lg">{i<3?['🥇','🥈','🥉'][i]:`#${i+1}`}</span>
                <span className="text-sm font-medium">{s.user?.nickname||'--'}</span>
                <span className="text-xs text-[var(--color-muted)]">{s.solves}次</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
