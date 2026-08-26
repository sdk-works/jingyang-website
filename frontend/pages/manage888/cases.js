/**
 * 后台 - 工程案例管理
 * 修复：编辑时字段正确填充；图片上传；显示/恢复已下架案例
 */
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';
import TranslationPanel from '../../components/admin/TranslationPanel';
import TranslationEditor from '../../components/admin/TranslationEditor';

const EMPTY = { title:'', province:'', area:'', greenhouse_type:'', completion_date:'', description:'', is_active:true, cover_image:'', translations:{} };
const TYPES = ['文洛型玻璃温室','阳光板温室（PC板）','日光温室','薄膜连栋温室','单体拱棚'];

function ImageUploader({ value, onChange, auth }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();
  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await axios.post('/api/admin/upload', fd, { headers: auth() });
      onChange(data.url);
    } catch (e) { alert(e.response?.data?.error || '上传失败'); }
    setUploading(false);
  };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">封面图片 <span className="text-gray-400 font-normal">（JPG/PNG，≤8MB）</span></label>
      <div className="flex gap-3 items-center">
        {value && <img src={value} alt="预览" className="w-20 h-14 object-cover rounded-lg border border-gray-200 flex-shrink-0"/>}
        <div className="flex-1 space-y-1.5">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="w-full py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >{uploading ? '上传中...' : '📁 上传图片'}</button>
          <input type="text" value={value||''} onChange={e => onChange(e.target.value)}
            placeholder="或输入图片URL" className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-400"/>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])}/>
        </div>
      </div>
    </div>
  );
}

export default function AdminCases() {
  const [cases,        setCases]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [modal,        setModal]        = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [err,          setErr]          = useState('');

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/admin/cases?include_inactive=${showInactive}`, { headers: auth() });
      setCases(data.data || []);
    } catch { setCases([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [showInactive]);

  const openAdd  = () => { setForm(EMPTY); setErr(''); setModal('add'); };
  const openEdit = (c) => {
    // 修复：后端现在直接返回 title/description，不需要解析 translations 数组
    setForm({ ...c, area: c.area || '', completion_date: c.completion_date?.slice(0,10) || '', cover_image: c.cover_image || '' });
    setErr(''); setModal('edit');
  };
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}));

  const save = async () => {
    if (!form.title?.trim())    { setErr('请填写案例名称'); return; }
    if (!form.province?.trim()) { setErr('请填写所在地区'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        province: form.province, area: form.area ? Number(form.area) : null,
        greenhouse_type: form.greenhouse_type, cover_image: form.cover_image || '',
        completion_date: form.completion_date || null, is_active: form.is_active,
        translations: [
          { lang:'zh', title: form.title, description: form.description||'' },
          ...['en','ru','ar'].filter(lang => form.translations?.[lang]).map(lang => ({lang,...form.translations[lang]}))
        ],
      };
      if (modal === 'add') {
        payload.slug = Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
        await axios.post('/api/admin/cases', payload, { headers: auth() });
      } else {
        await axios.put(`/api/admin/cases/${form.id}`, payload, { headers: auth() });
      }
      await load(); setModal(null);
    } catch (e) { setErr(e.response?.data?.error || '保存失败'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('确认下架该案例？（数据保留，可恢复）')) return;
    try { await axios.delete(`/api/admin/cases/${id}`, { headers: auth() }); await load(); }
    catch { alert('操作失败'); }
  };

  const restore = async (c) => {
    try { await axios.put(`/api/admin/cases/${c.id}`, { ...c, is_active:true, translations:[{lang:'zh',title:c.title,description:c.description||''}] }, { headers:auth() }); await load(); }
    catch { alert('操作失败'); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400';

  return (
    <AdminLayout title="工程案例管理">
      <TranslationPanel entityType="case" auth={auth}/>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">共 {cases.length} 个案例</span>
          <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="accent-primary-600"/>
            显示已下架
          </label>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">+ 新增案例</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {['案例名称','地区','类型','面积','竣工','操作'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="py-16 text-center text-gray-400">加载中...</td></tr>
            : cases.length === 0 ? <tr><td colSpan={6} className="py-16 text-center text-gray-400">暂无案例</td></tr>
            : cases.map(c => (
              <tr key={c.id} className={`border-t border-gray-50 hover:bg-gray-50 ${c.is_active===false ? 'opacity-60':''}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {c.cover_image && <img src={c.cover_image} alt={c.title} className="w-10 h-8 object-cover rounded flex-shrink-0"/>}
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{c.title || <span className="text-gray-300">（无标题）</span>}</div>
                      {c.is_active===false && <span className="text-xs text-orange-500">已下架</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.province}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs bg-primary-50 text-primary-700">{c.greenhouse_type}</span></td>
                <td className="px-4 py-3 text-sm text-gray-600">{c.area ? Number(c.area).toLocaleString()+'㎡' : '-'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{c.completion_date?.slice(0,7)||'-'}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(c)} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                    {c.is_active!==false
                      ? <button onClick={() => del(c.id)} className="px-3 py-1.5 text-xs bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100">下架</button>
                      : <button onClick={() => restore(c)} className="px-3 py-1.5 text-xs bg-green-50 text-green-600 rounded-lg hover:bg-green-100">恢复</button>
                    }
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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">{modal==='add'?'新增案例':'编辑案例'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">案例名称 *</label>
                <input value={form.title} onChange={set('title')} placeholder="客户/项目名称" className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">所在地区 *</label>
                  <input value={form.province} onChange={set('province')} placeholder="如：山东省" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">温室类型</label>
                  <select value={form.greenhouse_type} onChange={set('greenhouse_type')} className={inputCls}>
                    <option value="">请选择</option>
                    {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">建设面积（㎡）</label>
                  <input value={form.area} onChange={set('area')} type="number" placeholder="如：5000" className={inputCls}/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">竣工日期</label>
                  <input value={form.completion_date} onChange={set('completion_date')} type="date" className={inputCls}/>
                </div>
              </div>
              <ImageUploader value={form.cover_image} onChange={v => setForm(f=>({...f,cover_image:v}))} auth={auth}/>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">项目描述</label>
                <textarea value={form.description} onChange={set('description')} rows={4} placeholder="项目详情、建设内容、客户反馈..." className={`${inputCls} resize-y`}/>
              </div>
              <TranslationEditor value={form.translations} onChange={translations=>setForm(f=>({...f,translations}))}
                fields={[{key:'title',label:'案例名称'},{key:'description',label:'案例描述',multiline:true,rows:4}]}/>
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
