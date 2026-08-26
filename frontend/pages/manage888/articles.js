/**
 * 后台 - 内容管理（新闻/文章）
 * 修复：编辑时字段正确填充；图片上传；简易富文本（Markdown 风格工具栏）
 */
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';
import TranslationPanel from '../../components/admin/TranslationPanel';
import TranslationEditor from '../../components/admin/TranslationEditor';

const EMPTY = { title:'', category:'industry', summary:'', content:'', cover_image:'', video_url:'', is_published:true, translations:{} };

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
        {value && <img src={value} alt="预览" className="w-24 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"/>}
        <div className="flex-1 space-y-1.5">
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="w-full py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 disabled:opacity-60"
          >{uploading ? '上传中...' : '📁 上传封面图'}</button>
          <input type="text" value={value||''} onChange={e => onChange(e.target.value)}
            placeholder="或输入图片URL" className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-primary-400"/>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => upload(e.target.files[0])}/>
        </div>
      </div>
    </div>
  );
}

// 简易富文本工具栏 - 在 textarea 光标处插入 Markdown 标记
function RichTextarea({ value, onChange, rows = 12, placeholder }) {
  const ref = useRef();

  const insert = (before, after = '') => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart, end = el.selectionEnd;
    const sel = value.slice(start, end);
    const newVal = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + sel.length);
    }, 0);
  };

  const tools = [
    { label: 'B',   title:'加粗',    action: () => insert('**','**'),   cls:'font-bold' },
    { label: 'H2',  title:'二级标题', action: () => insert('\n## ',''), cls:'text-xs' },
    { label: 'H3',  title:'三级标题', action: () => insert('\n### ',''), cls:'text-xs' },
    { label: '—',   title:'分割线',   action: () => insert('\n---\n'),   cls:'' },
    { label: '• 列', title:'无序列表', action: () => insert('\n- '),     cls:'text-xs' },
  ];

  const [preview, setPreview] = useState(false);

  // 简单 Markdown 预览渲染
  const renderPreview = (text) => {
    if (!text) return <p className="text-gray-400 text-sm">（正文为空）</p>;
    return text.split('\n').map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-2"/>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-bold text-gray-900 mt-3 mb-1">{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-bold text-gray-800 mt-2">{line.slice(4)}</h3>;
      if (line.trim() === '---') return <hr key={i} className="border-gray-200 my-2"/>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4 text-sm text-gray-700 list-disc">{line.slice(2)}</li>;
      // **粗体** 处理
      const parts = line.split(/\*\*(.+?)\*\*/g);
      return <p key={i} className="text-sm text-gray-700 leading-relaxed">
        {parts.map((p, j) => j%2===1 ? <strong key={j}>{p}</strong> : p)}
      </p>;
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100">
      {/* 工具栏 */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-100 flex-wrap">
        {!preview && tools.map(t => (
          <button key={t.label} type="button" onClick={t.action} title={t.title}
            className={`px-2.5 py-1 text-sm rounded text-gray-600 hover:bg-gray-200 transition-colors ${t.cls}`}
          >{t.label}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{preview ? '预览模式' : '编辑模式 · 支持 Markdown'}</span>
          <button type="button" onClick={() => setPreview(v => !v)}
            className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${preview ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
          >{preview ? '✏️ 编辑' : '👁 预览'}</button>
        </div>
      </div>
      {preview ? (
        <div className="w-full px-4 py-3 min-h-[200px] space-y-1 bg-white">
          {renderPreview(value)}
        </div>
      ) : (
        <textarea
          ref={ref}
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-4 py-3 text-sm resize-y focus:outline-none leading-relaxed font-mono"
        />
      )}
    </div>
  );
}

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState('');

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/admin/articles', { headers: auth() });
      setArticles(data.data || []);
    } catch { setArticles([]); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd  = () => { setForm(EMPTY); setErr(''); setModal('add'); };
  const openEdit = (a) => {
    setForm({ ...EMPTY, ...a });
    setErr(''); setModal('edit');
  };
  const set = k => v => setForm(f => ({...f, [k]: typeof v === 'object' ? v.target.value : v}));

  const save = async () => {
    if (!form.title?.trim()) { setErr('请填写文章标题'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        cover_image:  form.cover_image || '',
        video_url:    form.video_url   || '',
        category:     form.category,
        is_published: form.is_published,
        translations: [
          { lang:'zh', title: form.title, summary: form.summary||'', content: form.content||'' },
          ...['en','ru','ar'].filter(lang => form.translations?.[lang]).map(lang => ({lang,...form.translations[lang]}))
        ],
      };
      if (modal === 'add') {
        payload.slug = form.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g,'-').toLowerCase().slice(0,50)+'-'+Date.now();
        await axios.post('/api/admin/articles', payload, { headers: auth() });
      } else {
        await axios.put(`/api/admin/articles/${form.id}`, payload, { headers: auth() });
      }
      await load(); setModal(null);
    } catch (e) { setErr(e.response?.data?.error || '保存失败'); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!confirm('确认永久删除这篇文章？')) return;
    try { await axios.delete(`/api/admin/articles/${id}`, { headers: auth() }); await load(); }
    catch { alert('删除失败'); }
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400';

  return (
    <AdminLayout title="内容管理">
      <TranslationPanel entityType="article" auth={auth}/>
      <div className="flex items-center justify-between mb-5">
        <span className="text-sm text-gray-500">共 {articles.length} 篇文章</span>
        <button onClick={openAdd} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700">+ 发布新文章</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['文章标题','分类','状态','发布时间','操作'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400">加载中...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-gray-400">暂无文章</td></tr>
              ) : (
                articles.map(a => (
                  <tr key={a.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {a.cover_image && <img src={a.cover_image} alt={a.title} className="w-10 h-8 object-cover rounded flex-shrink-0"/>}
                        <div>
                          <div className="font-medium text-gray-900 text-sm line-clamp-1">{a.title || <span className="text-gray-300">（无标题）</span>}</div>
                          {a.summary && <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.summary}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.category==='tech' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        {a.category==='tech' ? '技术文章' : '行业资讯'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {a.is_published ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{a.published_at?.slice(0,10) || a.created_at?.slice(0,10) || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(a)} className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">编辑</button>
                        <button onClick={() => del(a.id)} className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100">删除</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[94vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{modal==='add' ? '发布新文章' : '编辑文章'}</h3>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">文章标题 *</label>
                <input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="文章标题" className={inputCls}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">分类</label>
                  <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="industry">行业资讯</option>
                    <option value="tech">技术文章</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">发布状态</label>
                  <select value={form.is_published?'true':'false'} onChange={e => setForm(f=>({...f,is_published:e.target.value==='true'}))} className={inputCls}>
                    <option value="true">立即发布</option>
                    <option value="false">存为草稿</option>
                  </select>
                </div>
              </div>
              <ImageUploader value={form.cover_image} onChange={v => setForm(f=>({...f,cover_image:v}))} auth={auth}/>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">文章摘要 <span className="text-gray-400 font-normal">（显示在列表页）</span></label>
                <textarea value={form.summary} onChange={e => setForm(f=>({...f,summary:e.target.value}))} rows={2} placeholder="简短描述，约100字以内" className={`${inputCls} resize-none`}/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  正文内容
                  <span className="ml-2 text-gray-400 font-normal">（支持 Markdown：**加粗** ## 标题 - 列表）</span>
                </label>
                <RichTextarea
                  value={form.content||''}
                  onChange={v => setForm(f=>({...f,content:v}))}
                  rows={14}
                  placeholder={"在此输入文章正文...\n\n## 小标题\n\n正文段落内容\n\n- 列表项一\n- 列表项二"}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">视频链接 <span className="text-gray-400 font-normal">（可选，填入视频URL）</span></label>
                <input value={form.video_url||''} onChange={e => setForm(f=>({...f,video_url:e.target.value}))} placeholder="https://..." className={inputCls}/>
              </div>
              <TranslationEditor value={form.translations} onChange={translations=>setForm(f=>({...f,translations}))}
                fields={[{key:'title',label:'文章标题'},{key:'summary',label:'摘要',multiline:true},{key:'content',label:'正文',multiline:true,rows:8}]}/>
              {err && <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {err}</div>}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50">取消</button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 disabled:opacity-60">
                  {saving ? '保存中...' : (modal==='add' ? '发布文章' : '保存修改')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
