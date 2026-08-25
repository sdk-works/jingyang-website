/**
 * 后台控制台
 * 修复：stats 字段对齐；新增本月/本周咨询数；操作日志展示
 */
import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const QUICK_LINKS = [
  { href:'/manage888/contacts',  icon:'📨', label:'查看咨询' },
  { href:'/manage888/products',  icon:'🏗️', label:'管理产品' },
  { href:'/manage888/cases',     icon:'🗂️', label:'管理案例' },
  { href:'/manage888/articles',  icon:'📰', label:'发布文章' },
  { href:'/manage888/users',     icon:'👥', label:'账号管理' },
  { href:'/manage888/settings',  icon:'⚙️', label:'系统设置' },
];

const ACTION_LABELS = { create:'新增', update:'修改', delete:'删除', login:'登录', upload:'上传' };
const ACTION_COLORS = { create:'bg-green-100 text-green-700', update:'bg-blue-100 text-blue-700', delete:'bg-red-100 text-red-700', login:'bg-gray-100 text-gray-600', upload:'bg-purple-100 text-purple-700' };

export default function Dashboard() {
  const [stats,    setStats]    = useState(null);
  const [contacts, setContacts] = useState([]);
  const [logs,     setLogs]     = useState([]);
  const [loading,  setLoading]  = useState(true);

  // 读取正确的后端地址
  const API = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      axios.get(`${API}/api/admin/stats`,       { headers }).catch(() => ({ data: {} })),
      axios.get(`${API}/api/admin/audit-logs?limit=15`, { headers }).catch(() => ({ data: { data: [] } })),
    ]).then(([statsRes, logsRes]) => {
      setStats(statsRes.data);
      setContacts(statsRes.data.recentContacts || []);
      setLogs(logsRes.data?.data || []);
    }).finally(() => setLoading(false));
  }, []);

  // 完全对齐后端返回结构 + 修复跳转地址
  const statCards = [
    { label:'待处理咨询',  value: stats?.contacts?.new      ?? '-', sub: `本周 ${stats?.contacts?.weekly ?? '-'}`,  icon:'📬', color:'bg-blue-50',   textColor:'text-blue-600',   href:'/manage888/contacts?status=new' },
    { label:'本月新增咨询', value: stats?.contacts?.monthly  ?? '-', sub: `累计 ${stats?.contacts?.total  ?? '-'}`,  icon:'📈', color:'bg-green-50',  textColor:'text-green-600',  href:'/manage888/contacts' },
    { label:'在架产品',    value: stats?.products           ?? '-', sub: '点击管理',                                  icon:'🏗️', color:'bg-orange-50', textColor:'text-orange-600', href:'/manage888/products' },
    { label:'发布案例',    value: stats?.cases              ?? '-', sub: '点击管理',                                  icon:'🗂️', color:'bg-purple-50', textColor:'text-purple-600', href:'/manage888/cases' },
  ];

  const statusColors = { new:'bg-blue-100 text-blue-700', contacted:'bg-yellow-100 text-yellow-700', closed:'bg-green-100 text-green-700', spam:'bg-gray-100 text-gray-500', in_progress:'bg-orange-100 text-orange-700' };
  const statusLabels = { new:'新咨询', contacted:'已联系', in_progress:'跟进中', closed:'已完成', spam:'垃圾' };

  return (
    <AdminLayout title="控制台">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => (
          <Link key={card.label} href={card.href}
            className={`${card.color} rounded-2xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
              </svg>
            </div>
            <div className={`text-3xl font-bold ${card.textColor} leading-none`}>
              {loading ? '...' : card.value}
            </div>
            <div className="text-xs text-gray-500 mt-1.5">{card.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">最新咨询</h2>
            <Link href="/manage888/contacts" className="text-xs text-primary-600 font-medium hover:underline">查看全部 →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {loading ? (
              <div className="py-12 text-center text-gray-400 text-sm">加载中...</div>
            ) : contacts.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">暂无咨询记录</div>
            ) : contacts.map((c, i) => (
              <div key={c.id||i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600 flex-shrink-0">
                  {(c.name||'?').slice(0,1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{c.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusColors[c.status]||'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[c.status]||c.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {c.phone||c.email||''}{c.greenhouse_type ? ` · ${c.greenhouse_type}` : ''}
                  </div>
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {c.created_at ? new Date(c.created_at).toLocaleDateString('zh-CN',{month:'2-digit',day:'2-digit'}) : ''}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">快速入口</h2>
            </div>
            <div className="p-3 grid grid-cols-2 gap-2">
              {QUICK_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all text-center group"
                >
                  <span className="text-xl">{link.icon}</span>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">最近操作记录</h2>
              <Link href="/manage888/audit-logs" className="text-xs text-primary-600 font-medium hover:underline">查看全部 →</Link>
            </div>
            <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-xs">加载中...</div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">暂无操作记录</div>
              ) : logs.map((log, i) => (
                <div key={log.id||i} className="px-4 py-2.5 flex items-start gap-2.5">
                  <span className={`flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${ACTION_COLORS[log.action]||'bg-gray-100 text-gray-500'}`}>
                    {ACTION_LABELS[log.action]||log.action}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-700 truncate">{log.detail || `${log.resource}`}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">
                      {log.username} · {log.created_at ? new Date(log.created_at).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}) : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
