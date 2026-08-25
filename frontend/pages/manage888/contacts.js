import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

// 咨询状态定义（与后端 contacts.status 字段值完全对应）
// 修改此处时同步更新 dashboard.js 中的 statusLabels
const STATUS_MAP = {
  new:         { label:'新咨询', color:'#1565c0', bg:'#e3f2fd' },  // 刚提交，未处理
  contacted:   { label:'已联系', color:'#f57c00', bg:'#fff3e0' },  // 已电话/邮件联系
  in_progress: { label:'跟进中', color:'#e65100', bg:'#fbe9e7' },  // 正在洽谈
  closed:      { label:'已完成', color:'#2e7d32', bg:'#e8f5e9' },  // 成交或关闭
  spam:        { label:'垃圾',   color:'#9e9e9e', bg:'#f5f5f5' },  // 无效咨询
};

export default function ContactsAdmin() {
  const [contacts, setContacts] = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('admin_token')}` });

  const fetchContacts = async (p = page) => {
    setLoading(true);
    try {
      const params = { page: p, limit: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const { data } = await axios.get('/api/admin/contacts', { headers: headers(), params });
      setContacts(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, [page, statusFilter]);

  const exportExcel = async () => {
    try {
      const res = await axios.get('/api/admin/contacts/export', {
        headers: headers(), responseType: 'blob'
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `咨询记录_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请重试');
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`/api/admin/contacts/${id}/status`, { status: newStatus }, { headers: headers() });
      setContacts(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c));
    } catch {
      alert('状态更新失败');
    }
  };

  const deleteContact = async (id) => {
    if (!confirm('确认删除这条咨询记录？此操作不可恢复。')) return;
    try {
      await axios.delete(`/api/admin/contacts/${id}`, { headers: headers() });
      setContacts(cs => cs.filter(c => c.id !== id));
      setTotal(t => t - 1);
      if (selected?.id === id) setSelected(null);
    } catch {
      alert('删除失败，请重试');
    }
  };

  const handleSearch = () => { setPage(1); fetchContacts(1); };

  return (
    <AdminLayout title="客户咨询管理">
      {/* 操作栏 */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <input
            placeholder="搜索姓名 / 电话 / 邮箱"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{ padding:'8px 13px', border:'1px solid #ddd', borderRadius:8, fontSize:13, width:220, outline:'none' }}
          />
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding:'8px 12px', border:'1px solid #ddd', borderRadius:8, fontSize:13, background:'#fff', outline:'none' }}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button onClick={handleSearch}
            style={{ padding:'8px 16px', background:'#2d6a4f', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
            搜索
          </button>
          <button onClick={() => { setSearch(''); setStatusFilter(''); setPage(1); fetchContacts(1); }}
            style={{ padding:'8px 12px', background:'#f5f5f5', color:'#555', border:'none', borderRadius:8, cursor:'pointer', fontSize:13 }}>
            重置
          </button>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <span style={{ fontSize:13, color:'#888' }}>共 {total} 条记录</span>
          <button onClick={exportExcel}
            style={{ padding:'8px 16px', background:'#1565c0', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:500 }}>
            📥 导出 Excel
          </button>
        </div>
      </div>

      {/* 状态筛选快捷标签 */}
      <div style={{ display:'flex', gap:6, marginBottom:14, flexWrap:'wrap' }}>
        <button
          onClick={() => { setStatusFilter(''); setPage(1); }}
          style={{ padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background: statusFilter===''?'#1a3d2b':'#f0f0f0', color: statusFilter===''?'#fff':'#555' }}>
          全部
        </button>
        {Object.entries(STATUS_MAP).map(([k, v]) => (
          <button key={k}
            onClick={() => { setStatusFilter(k); setPage(1); }}
            style={{ padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background: statusFilter===k ? v.bg:'#f0f0f0', color: statusFilter===k ? v.color:'#555' }}>
            {v.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div style={{ background:'#fff', borderRadius:12, border:'1px solid #eee', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.04)' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
            <thead>
              <tr style={{ background:'#f9f9f9' }}>
                {['客户姓名','联系方式','咨询类型','面积(㎡)','留言','状态','时间','操作'].map(h => (
                  <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:12, color:'#888', fontWeight:600, whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ padding:'60px', textAlign:'center', color:'#ccc', fontSize:14 }}>加载中...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:'60px', textAlign:'center', color:'#ccc', fontSize:14 }}>
                  {search || statusFilter ? '没有找到匹配的咨询记录' : '暂无咨询记录，客户提交联系表单后会在这里显示'}
                </td></tr>
              ) : contacts.map(c => (
                <tr key={c.id}
                  style={{ borderTop:'1px solid #f5f5f5', cursor:'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ fontWeight:600, fontSize:14, color:'#1a1a1a' }}>{c.name}</div>
                    {c.country && <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>📍 {c.country}</div>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:13 }}>
                    {c.phone && <div><a href={`tel:${c.phone}`} style={{ color:'#2d6a4f', textDecoration:'none', fontWeight:500 }}>📞 {c.phone}</a></div>}
                    {c.email && <div style={{ color:'#888', fontSize:12, marginTop:2 }}>✉️ {c.email}</div>}
                    {!c.phone && !c.email && <span style={{ color:'#ccc' }}>-</span>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'#555', maxWidth:120 }}>
                    {c.greenhouse_type || <span style={{ color:'#ccc' }}>-</span>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:13, color:'#555' }}>
                    {c.area ? `${Number(c.area).toLocaleString()}` : <span style={{ color:'#ccc' }}>-</span>}
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#888', maxWidth:160 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
                      {c.message || <span style={{ color:'#ccc' }}>-</span>}
                    </div>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <select
                      value={c.status || 'new'}
                      onChange={e => { e.stopPropagation(); updateStatus(c.id, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize:12, padding:'4px 8px', border:'none', borderRadius:100, cursor:'pointer', outline:'none', background:STATUS_MAP[c.status]?.bg || '#f5f5f5', color:STATUS_MAP[c.status]?.color || '#555', fontWeight:600 }}>
                      {Object.entries(STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'#aaa', whiteSpace:'nowrap' }}>
                    {new Date(c.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={e => { e.stopPropagation(); setSelected(c); }}
                        style={{ padding:'4px 11px', background:'#e3f2fd', color:'#1565c0', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:500 }}>
                        详情
                      </button>
                      <button onClick={e => { e.stopPropagation(); deleteContact(c.id); }}
                        style={{ padding:'4px 11px', background:'#ffebee', color:'#c62828', border:'none', borderRadius:6, cursor:'pointer', fontSize:12 }}>
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {total > 20 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid #f0f0f0' }}>
            <span style={{ fontSize:13, color:'#888' }}>
              第 {(page-1)*20+1}–{Math.min(page*20, total)} 条 / 共 {total} 条
            </span>
            <div style={{ display:'flex', gap:8 }}>
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                style={{ padding:'6px 14px', border:'1px solid #ddd', borderRadius:7, fontSize:13, cursor:page===1?'not-allowed':'pointer', opacity:page===1?.5:1, background:'#fff' }}>
                上一页
              </button>
              <span style={{ padding:'6px 10px', fontSize:13, color:'#888' }}>
                {page} / {Math.ceil(total/20)}
              </span>
              <button disabled={page >= Math.ceil(total/20)} onClick={() => setPage(p => p + 1)}
                style={{ padding:'6px 14px', border:'1px solid #ddd', borderRadius:7, fontSize:13, cursor:page>=Math.ceil(total/20)?'not-allowed':'pointer', opacity:page>=Math.ceil(total/20)?.5:1, background:'#fff' }}>
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {selected && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{ background:'#fff', borderRadius:16, padding:28, maxWidth:500, width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,.2)', maxHeight:'88vh', overflow:'auto' }}
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头 */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20 }}>
              <div>
                <h3 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1a3d2b' }}>{selected.name}</h3>
                <span style={{ fontSize:12, padding:'3px 10px', borderRadius:100, background:STATUS_MAP[selected.status]?.bg||'#f5f5f5', color:STATUS_MAP[selected.status]?.color||'#555', fontWeight:500, marginTop:6, display:'inline-block' }}>
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </span>
              </div>
              <button onClick={() => setSelected(null)}
                style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'#f5f5f5', cursor:'pointer', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>
                ×
              </button>
            </div>

            {/* 详情字段 */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:20 }}>
              {[
                ['📍 地区',    selected.country],
                ['📞 电话',    selected.phone],
                ['✉️ 邮箱',    selected.email],
                ['🌿 咨询类型', selected.greenhouse_type],
                ['📐 建设面积', selected.area ? `${Number(selected.area).toLocaleString()} ㎡` : null],
                ['📅 提交时间', new Date(selected.created_at).toLocaleString('zh-CN')],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display:'flex', gap:10 }}>
                  <div style={{ width:90, fontSize:12, color:'#888', flexShrink:0, paddingTop:1 }}>{k}</div>
                  <div style={{ fontSize:14, color:'#1a1a1a', fontWeight:500 }}>{v}</div>
                </div>
              ))}
              {selected.message && (
                <div>
                  <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>💬 留言内容</div>
                  <div style={{ padding:'12px 14px', background:'#f9fdf9', borderRadius:8, border:'1px solid rgba(82,183,136,.2)', fontSize:14, color:'#2e4a38', lineHeight:1.7 }}>
                    {selected.message}
                  </div>
                </div>
              )}
            </div>

            {/* 状态更新 */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>跟进状态</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                  <button key={k}
                    onClick={() => { updateStatus(selected.id, k); setSelected(s => ({ ...s, status: k })); }}
                    style={{ padding:'6px 14px', borderRadius:100, fontSize:12, fontWeight:500, border:'none', cursor:'pointer', background:selected.status===k ? v.bg:'#f0f0f0', color:selected.status===k ? v.color:'#555', fontWeight:selected.status===k?700:400 }}>
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div style={{ display:'flex', gap:10 }}>
              {selected.phone && (
                <a href={`tel:${selected.phone}`}
                  style={{ flex:1, padding:'11px', background:'#2d6a4f', color:'#fff', borderRadius:9, textDecoration:'none', textAlign:'center', fontSize:14, fontWeight:600 }}>
                  📞 拨打电话
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`}
                  style={{ flex:1, padding:'11px', background:'#1565c0', color:'#fff', borderRadius:9, textDecoration:'none', textAlign:'center', fontSize:14, fontWeight:600 }}>
                  ✉️ 发送邮件
                </a>
              )}
              <button onClick={() => deleteContact(selected.id)}
                style={{ padding:'11px 16px', background:'#ffebee', color:'#c62828', border:'none', borderRadius:9, cursor:'pointer', fontSize:13 }}>
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
