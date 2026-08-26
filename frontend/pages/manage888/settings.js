/**
 * 后台 - 系统设置 /admin/settings
 * 包含：计算器单价配置、公司信息配置
 */
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

export default function AdminSettings() {
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [company,setCompany]=useState({company_name:'山东京阳温室科技有限公司',company_phone:'152-7589-8666',company_phone2:'152-7589-8779',company_contact:'王静',company_email:'jingyangwenshikeji@163.com',company_address:'山东省聊城市莘县工业园区鸿图街8号',working_hours:'周一至周六 08:30 – 17:30',service_area:'山东、河南、河北、东北、山西、陕西、江苏、安徽等全国各地'});
  const [items,setItems]=useState([]),[newItem,setNewItem]=useState({item_type:'addon',item_key:'',label_zh:'',icon:'⚙️',price_per_sqm:0,sort_order:60,is_active:true});

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  useEffect(() => {
    axios.get('/api/calculator/rules').finally(() => setLoading(false));
    axios.get('/api/admin/site-settings',{headers:auth()}).then(r=>setCompany(x=>({...x,...r.data.data}))).catch(()=>{});
    axios.get('/api/admin/calculator-items',{headers:auth()}).then(r=>setItems(r.data.data||[])).catch(()=>{});
  }, []);

  const saveCompany=async()=>{setSaving(true);try{await axios.put('/api/admin/site-settings',company,{headers:auth()});alert('公司信息保存成功');}catch(e){alert(e.response?.data?.error||'保存失败')}setSaving(false)};
  const saveItem=async x=>{const r=await axios.put(`/api/admin/calculator-items/${x.id}`,x,{headers:auth()});setItems(a=>a.map(i=>i.id===x.id?r.data.data:i))};
  const addItem=async()=>{try{const r=await axios.post('/api/admin/calculator-items',newItem,{headers:auth()});setItems(a=>[...a,r.data.data]);setNewItem({...newItem,item_key:'',label_zh:''})}catch(e){alert(e.response?.data?.error||'新增失败')}};
  const delItem=async x=>{if(!confirm(`删除“${x.label_zh}”？`))return;await axios.delete(`/api/admin/calculator-items/${x.id}`,{headers:auth()});setItems(a=>a.filter(i=>i.id!==x.id))};

  if (loading) return <AdminLayout title="系统设置"><div className="py-20 text-center text-gray-400">加载中...</div></AdminLayout>;

  return (
    <AdminLayout title="系统设置">
      <div className="max-w-4xl space-y-8">

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold mb-1">计算器设备与系统管理</h2><p className="text-xs text-gray-400 mb-4">支持新增、修改、启停、排序和删除；基础类型单选，配套系统多选。</p>
          <div className="space-y-3">{items.map(x=><div key={x.id} className="rounded-xl border p-3 space-y-2"><div className="grid grid-cols-1 sm:grid-cols-[52px_1fr_76px_54px_48px_52px_40px] gap-2 items-center"><span className="text-xs font-semibold">{x.item_type==='base'?'温室':'系统'}</span><input value={x.label_zh} placeholder="中文名称" onChange={e=>setItems(a=>a.map(i=>i.id===x.id?{...i,label_zh:e.target.value}:i))} className="border rounded-lg px-2 py-1.5 text-sm"/><input title="元/㎡" type="number" min="0" value={x.price_per_sqm} onChange={e=>setItems(a=>a.map(i=>i.id===x.id?{...i,price_per_sqm:e.target.value}:i))} className="border rounded-lg px-2 py-1.5 text-sm"/><input title="排序" type="number" value={x.sort_order} onChange={e=>setItems(a=>a.map(i=>i.id===x.id?{...i,sort_order:e.target.value}:i))} className="border rounded-lg px-2 py-1.5 text-sm"/><label className="text-xs flex gap-1 items-center"><input type="checkbox" checked={x.is_active} onChange={e=>setItems(a=>a.map(i=>i.id===x.id?{...i,is_active:e.target.checked}:i))}/>启用</label><button onClick={()=>saveItem(x)} className="text-xs bg-blue-50 text-blue-700 rounded-lg py-2">保存</button><button onClick={()=>delItem(x)} className="text-red-500 text-xs">删除</button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-2">{[['label_en','英文'],['label_ru','俄文'],['label_ar','阿文']].map(([key,label])=><input key={key} value={x[key]||''} placeholder={`${label}（留空自动补译）`} onChange={e=>setItems(a=>a.map(i=>i.id===x.id?{...i,[key]:e.target.value}:i))} className="border rounded-lg px-2 py-1.5 text-xs"/>)}</div></div>)}</div>
          <div className="mt-4 pt-4 border-t grid grid-cols-1 sm:grid-cols-[80px_1fr_110px_80px] gap-2"><select value={newItem.item_type} onChange={e=>setNewItem(x=>({...x,item_type:e.target.value}))} className="border rounded-lg p-2 text-sm"><option value="base">温室</option><option value="addon">系统</option></select><input placeholder="名称" value={newItem.label_zh} onChange={e=>setNewItem(x=>({...x,label_zh:e.target.value,item_key:x.item_key||`item_${Date.now()}`}))} className="border rounded-lg p-2 text-sm"/><input type="number" min="0" placeholder="元/㎡" value={newItem.price_per_sqm} onChange={e=>setNewItem(x=>({...x,price_per_sqm:e.target.value}))} className="border rounded-lg p-2 text-sm"/><button onClick={addItem} className="bg-primary-600 text-white rounded-lg p-2 text-sm">新增</button></div>
        </div>

        {/* 公司信息 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">公司基本信息</h2>
          <p className="text-xs text-gray-400 mb-4">保存后联系页会读取最新配置</p>
          <div className="grid sm:grid-cols-2 gap-3">{[['company_name','公司名称'],['company_phone','联系电话1'],['company_phone2','联系电话2'],['company_contact','联系人'],['company_email','电子邮箱'],['company_address','公司地址'],['working_hours','服务时间'],['service_area','服务区域']].map(([k,label])=><label key={k} className={k==='service_area'?'sm:col-span-2':''}><span className="block text-xs text-gray-500 mb-1">{label}</span>{k==='service_area'?<textarea rows={3} value={company[k]||''} onChange={e=>setCompany(x=>({...x,[k]:e.target.value}))} className="w-full px-3 py-2 border rounded-xl text-sm"/>:<input value={company[k]||''} onChange={e=>setCompany(x=>({...x,[k]:e.target.value}))} className="w-full px-3 py-2 border rounded-xl text-sm"/>}</label>)}</div>
          <button onClick={saveCompany} disabled={saving} className="mt-4 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold">保存公司信息</button>
        </div>
      </div>
    </AdminLayout>
  );
}
