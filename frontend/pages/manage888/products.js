/**
 * 后台 - 产品管理
 * 修复：编辑时正确填充字段（后端已返回直接 name/description/features）
 * 新增：图片上传功能；显示/恢复已下架产品
 */
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const CATS = ['tech','system','parts'];
const CAT_LABELS = { tech:'产品技术', system:'配套系统', parts:'设备配件' };
const EMPTY = { name:'', slug:'', category:'tech', description:'', features:'', price_per_sqm:'', is_active:true, cover_image:'' };

// 图片上传组件
function ImageUploader({ value, onChange, auth }) {
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState(value || '');
  const inputRef = useRef();

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await axios.post('/api/admin/upload', fd, {
        headers: auth()   // 不设置 Content-Type，让浏览器自动添加含 boundary 的 multipart header
      });
      setPreview(data.url);
      onChange(data.url);
    } catch (e) {
      alert(e.response?.data?.error || '上传失败，请检查文件大小（≤8MB）');
    }
    setUploading(false);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        封面图片
        <span className="ml-1 text-gray-400 font-normal">（支持 JPG/PNG/WebP，≤8MB）</span>
      </label>
      <div className="flex gap-3 items-start">
        {/* 预览 */}
        {preview ? (
          <div className="relative w-24 h-20 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
            <img src={preview} alt="预览" className="w-full h-full object-cover"/>
            <button onClick={() => { setPreview(''); onChange(''); }}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center leading-none hover:bg-red-600"
            >✕</button>
          </div>
        ) : (
          <div className="w-24 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center flex-shrink-0 bg-gray-50 text-gray-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          </div>
        )}
        <div className="flex-1 space-y-2">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="w-full py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
          >{uploading ? '上传中...' : '📁 选择图片上传'}</button>
          <input type="text" value={value || ''} onChange={e => { onChange(e.target.value); setPreview(e.target.value); }}
            placeholder="或直接输入图片URL"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-400 text-gray-500"
          />
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])}/>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [products,        setProducts]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [showInactive,    setShowInactive]     = useState(false);
  const [modal,           setModal]           = useState(null);
  const [form,            setForm]            = useState(EMPTY);
  const [saving,          setSaving]          = useState(false);
  const [err,             setErr]             = useState('');

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/products?include_inactive=${showInactive}`, { headers: auth() });
      setProducts(data.data || []);
    } catch { setProducts([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [showInactive]);

  const openAdd  = () => { setForm(EMPTY); setErr(''); setModal('add'); };
  const openEdit = (p) => {
    // 修复：后端现在直接返回 name/description/features，不再需要从 translations 数组解析
    const feats = Array.isArray(p.features) ? p.features.join('\n') : (p.features || '');
    setForm({ ...p, features: feats, price_per_sqm: p.price_per_sqm || '' });
    setErr('');
    setModal('edit');
  };
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name?.trim()) { setErr('请填写产品名称'); return; }
    setSaving(true); setErr('');
    try {
      const featureArr = form.features ? form.features.split('\n').filter(l => l.trim()) : [];
      const payload = {
        category: form.category,
        price_per_sqm: form.price_per_sqm ? Number(form.price_per_sqm) : 0,
        cover_image: form.cover_image || '',
        is_active: form.is_active,
        translations: [{ lang:'zh', name: form.name, description: form.description||'', features: featureArr }],
      };
      if (modal === 'add') {
        payload.slug = form.name.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9\u4e00-\u9fa5-]/g,'').toLowerCase() + '-' + Date.now();
        await axios.post('/api/admin/products', payload, { headers: auth() });
      } else {
        await axios.put(`/api/admin/products/${form.id}`, payload, { headers: auth() });
      }
      await load();
      setModal(null);
    } catch (e) { setErr(e.response?.data?.error || '保存失败，请重试'); }
    setSaving(false);
  };

  const restore = async (p) => {
    if (!confirm('确认恢复上架该产品？')) return;
    try {
      await axios.put(`/api/admin/products/${p.id}`, {
        category: p.category,
        price_per_sqm: p.price_per_sqm || 0,
        cover_image: p.cover_image || '',
        is_active: true,
        translations: [{ lang:'zh', name: p.name||'', description: p.description||'',
          features: Array.isArray(p.features) ? p.features : [] }],
      }, { headers: auth() });
      await load();
    } catch { alert('操作失败'); }
  };

  const del = async (id) => {
    if (!confirm('确认下架该产品？（数据保留，可恢复）')) return;
    try { await axios.delete(`/api/admin/products/${id}`, { headers: auth() }); await load(); }
    catch { alert('操作失败'); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

  return (
    <AdminLayout title="产品管理">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">共 {products.length} 个产品</span>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-primary-600"/>
            显示已下架
          </label>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
        >+ 新增产品</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['产品名称','分类','单价(元/㎡)','状态','操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-16 text-center text-gray-400">加载中...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="py-16 text-center text-gray-400">暂无产品</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${p.is_active === false ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.cover_image && (
                      <img src={p.cover_image} alt={p.name} className="w-10 h-8 object-cover rounded-lg flex-shrink-0"/>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{p.name || <span className="text-gray-300">（无名称）</span>}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.slug}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                    {CAT_LABELS[p.category] || p.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{p.price_per_sqm || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.is_active !== false ? '已上架' : '已下架'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5 flex-wrap">
                    <button onClick={() => openEdit(p)} className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                    {p.is_active !== false ? (
                      <button onClick={() => del(p.id)} className="px-3 py-1.5 text-xs font-medium bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100">下架</button>
                    ) : (
                      <button onClick={() => restore(p)} className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-600 rounded-lg hover:bg-green-100">恢复上架</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{modal === 'add' ? '新增产品' : '编辑产品'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">产品名称 *</label>
                  <input value={form.name} onChange={set('name')} placeholder="产品名称" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">分类</label>
                  <select value={form.category} onChange={set('category')} className={inputCls}>
                    {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">单价（元/㎡）</label>
                  <input value={form.price_per_sqm} onChange={set('price_per_sqm')} type="number" placeholder="如：500" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">上架状态</label>
                  <select value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({...f, is_active: e.target.value === 'true'}))} className={inputCls}>
                    <option value="true">已上架</option>
                    <option value="false">已下架</option>
                  </select>
                </div>
              </div>
              {/* 图片上传 */}
              <ImageUploader value={form.cover_image} onChange={v => setForm(f => ({...f, cover_image:v}))} auth={auth}/>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">产品描述</label>
                <textarea value={form.description} onChange={set('description')} rows={4} placeholder="产品详细描述..." className={`${inputCls} resize-y`}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">产品特点 <span className="text-gray-400 font-normal">（每行一条）</span></label>
                <textarea value={form.features} onChange={set('features')} rows={4}
                  placeholder={"热镀锌钢骨架，耐久抗腐\n透光率>97%，采光极佳\n..."}
                  className={`${inputCls} resize-y font-mono text-xs`}/>
              </div>
              {err && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {err}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">取消</button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
