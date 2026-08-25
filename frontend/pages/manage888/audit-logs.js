/**
 * 后台 - 操作日志 /admin/audit-logs
 */
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const ACTION_LABELS = { create:'新增', update:'修改', delete:'删除', login:'登录', upload:'上传' };
const ACTION_COLORS = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  login:  'bg-gray-100 text-gray-600',
  upload: 'bg-purple-100 text-purple-700',
};
const RESOURCE_LABELS = { products:'产品', cases:'案例', articles:'文章', contacts:'咨询', users:'账号', settings:'设置', media:'媒体' };

export default function AuditLogsPage() {
  const [logs,     setLogs]     = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [resource, setResource] = useState('');
  const [loading,  setLoading]  = useState(true);
  const LIMIT = 30;

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  const load = async (p = page, res = resource) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (res) params.set('resource', res);
      const { data } = await axios.get(`/api/admin/audit-logs?${params}`, { headers: auth() });
      setLogs(data.data || []);
      setTotal(data.total || 0);
    } catch { setLogs([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page, resource]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout title="操作日志">
      {/* 筛选栏 */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <span className="text-sm text-gray-500">共 {total} 条记录</span>
        <select value={resource} onChange={e => { setResource(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 bg-white"
        >
          <option value="">全部模块</option>
          {Object.entries(RESOURCE_LABELS).map(([k,v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button onClick={() => { setResource(''); setPage(1); }}
          className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition-colors"
        >重置</button>
      </div>

      {/* 日志列表 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['操作类型','模块','操作内容','操作人','时间','IP'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">加载中...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">暂无操作记录</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {RESOURCE_LABELS[log.resource] || log.resource || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                    <div className="truncate">{log.detail || '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{log.username || '-'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {log.created_at ? new Date(log.created_at).toLocaleString('zh-CN', {
                      month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'
                    }) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{log.ip_address || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              第 {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,total)} 条 / 共 {total} 条
            </span>
            <div className="flex gap-2">
              <button disabled={page===1} onClick={() => setPage(p=>p-1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >上一页</button>
              <span className="px-3 py-1.5 text-xs text-gray-500">{page} / {totalPages}</span>
              <button disabled={page>=totalPages} onClick={() => setPage(p=>p+1)}
                className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >下一页</button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
