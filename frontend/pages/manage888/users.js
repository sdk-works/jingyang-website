/**
 * 后台 - 账号权限管理 /admin/users
 * 修复：superadmin 完整增删改查；显示/隐藏密码；自己不能删自己
 */
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const ROLES = [
  { value:'superadmin', label:'超级管理员', desc:'全部权限，含账号管理', color:'bg-red-100 text-red-700' },
  { value:'admin',      label:'管理员',     desc:'内容增删改查，不含账号管理', color:'bg-orange-100 text-orange-700' },
  { value:'editor',     label:'编辑员',     desc:'仅新增和修改，不可删除', color:'bg-blue-100 text-blue-700' },
  { value:'viewer',     label:'只读用户',   desc:'仅查看数据', color:'bg-gray-100 text-gray-600' },
];

const roleInfo = (role) => ROLES.find(r => r.value === role) || { label: role, color: 'bg-gray-100 text-gray-600' };
const EMPTY = { username:'', email:'', password:'', role:'editor', is_active:true };

export default function AdminUsers() {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'add' | {user}
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');
  const [showPass, setShowPass] = useState(false);
  const [myId,     setMyId]     = useState('');
  const [myRole,   setMyRole]   = useState('');

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/users', { headers: auth() });
      setUsers(data.data || []);
    } catch { setUsers([]); }
    setLoading(false);
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : '';
    if (token) {
      try {
        const p = JSON.parse(atob(token.split('.')[1]));
        setMyId(p.userId || '');
        setMyRole(p.role || '');
      } catch {}
    }
    load();
  }, []);

  const openAdd = () => { setForm(EMPTY); setErr(''); setShowPass(false); setModal('add'); };
  const openEdit = (u) => { setForm({ ...u, password: '' }); setErr(''); setShowPass(false); setModal(u); };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const isSuperAdmin = myRole === 'superadmin';

  const save = async () => {
    if (!form.username?.trim()) { setErr('请填写用户名'); return; }
    if (!form.email?.trim())    { setErr('请填写邮箱');   return; }
    if (modal === 'add' && !form.password?.trim()) { setErr('新账号必须设置密码'); return; }
    if (form.password && form.password.length < 8) { setErr('密码至少8位'); return; }
    setSaving(true); setErr('');
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password; // 不修改密码时不传
      if (modal === 'add') {
        await axios.post('/api/admin/users', payload, { headers: auth() });
      } else {
        await axios.put(`/api/admin/users/${form.id}`, payload, { headers: auth() });
      }
      await load(); setModal(null);
    } catch (e) {
      setErr(e.response?.data?.error || '保存失败，用户名或邮箱可能重复');
    }
    setSaving(false);
  };

  const toggleActive = async (user) => {
    if (user.id === myId) { alert('不能禁用当前登录账号'); return; }
    try {
      await axios.put(`/api/admin/users/${user.id}`,
        { ...user, is_active: !user.is_active }, { headers: auth() });
      await load();
    } catch (e) { alert(e.response?.data?.error || '操作失败'); }
  };

  const del = async (user) => {
    if (user.id === myId) { alert('不能删除当前登录账号'); return; }
    if (!confirm(`确认删除账号「${user.username}」？此操作不可恢复！`)) return;
    try {
      await axios.delete(`/api/admin/users/${user.id}`, { headers: auth() });
      await load();
    } catch (e) { alert(e.response?.data?.error || '删除失败'); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <AdminLayout title="账号权限管理">
      {!isSuperAdmin && (
        <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-center gap-2">
          ⚠️ 账号管理功能仅超级管理员可操作，您当前为「{roleInfo(myRole).label}」权限。
        </div>
      )}

      {/* 权限说明卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.value} className="p-3 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-1.5 ${r.color}`}>{r.label}</span>
            <p className="text-xs text-gray-500 leading-relaxed">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">共 <strong>{users.length}</strong> 个账号</span>
        {isSuperAdmin && (
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
          >+ 新建账号</button>
        )}
      </div>

      {/* 用户列表 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['用户名','邮箱','角色','状态','最后登录','操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="py-16 text-center text-gray-400">暂无账号</td></tr>
            ) : users.map(u => {
              const ri = roleInfo(u.role);
              const isSelf = u.id === myId;
              return (
                <tr key={u.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${isSelf ? 'bg-primary-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                        {(u.username || 'A').slice(0,1).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{u.username}</div>
                        {isSelf && <div className="text-[10px] text-primary-500 font-medium">当前登录账号</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ri.color}`}>{ri.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {u.is_active ? '正常' : '已禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('zh-CN') : '从未登录'}
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin ? (
                      <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => openEdit(u)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                        >编辑</button>
                        <button onClick={() => toggleActive(u)}
                          className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            u.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                          }`}
                          disabled={isSelf}
                        >{u.is_active ? '禁用' : '启用'}</button>
                        <button onClick={() => del(u)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40"
                          disabled={isSelf}
                        >删除</button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">无权限</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 新增/编辑弹窗 */}
      {modal && isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">
                {modal === 'add' ? '新建账号' : `编辑账号：${modal.username}`}
              </h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">用户名 *</label>
                  <input value={form.username} onChange={set('username')} placeholder="登录用户名" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">邮箱 *</label>
                  <input value={form.email} onChange={set('email')} type="email" placeholder="邮箱地址" className={inputCls}/>
                </div>
              </div>

              {/* 密码 + 显示/隐藏 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-600">
                    {modal === 'add' ? '初始密码 *（至少8位）' : '新密码（留空则不修改）'}
                  </label>
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    {showPass ? '🙈 隐藏' : '👁 显示'}
                  </button>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password} onChange={set('password')}
                  placeholder={modal === 'add' ? '至少8位，含字母和数字' : '留空则保持不变'}
                  className={inputCls}
                />
              </div>

              {/* 角色选择 */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">角色权限</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map(r => (
                    <label key={r.value}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        form.role === r.value ? 'border-primary-500 bg-primary-50' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <input type="radio" name="role" value={r.value}
                        checked={form.role === r.value}
                        onChange={() => setForm(f => ({ ...f, role: r.value }))}
                        className="mt-0.5 accent-primary-600"
                      />
                      <div>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${r.color}`}>{r.label}</span>
                        <p className="text-[11px] text-gray-400 mt-1 leading-tight">{r.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 启用状态 */}
              <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl cursor-pointer">
                <input type="checkbox" checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 accent-primary-600"
                />
                <div>
                  <span className="text-sm text-gray-700 font-medium">账号启用</span>
                  <p className="text-xs text-gray-400">禁用后该账号无法登录</p>
                </div>
              </label>

              {err && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                  ⚠️ {err}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(null)}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >取消</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
                >{saving ? '保存中...' : (modal === 'add' ? '创建账号' : '保存修改')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
