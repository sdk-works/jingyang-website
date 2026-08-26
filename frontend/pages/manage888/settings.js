/**
 * 后台 - 系统设置 /admin/settings
 * 包含：计算器单价配置、公司信息配置
 */
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import axios from 'axios';

const BASE_PRICE_LABELS = {
  glass:       '玻璃温室（文洛型）',
  pc:          'PC板温室（阳光板）',
  solar:       '日光温室',
  'multi-span':'薄膜连栋温室',
  arch:        '单体拱棚',
};
const ADDON_LABELS = {
  has_cooling:       '降温系统',
  has_heating:       '升温系统',
  has_irrigation:    '水肥一体化',
  has_lighting:      '补光系统',
  has_smart_control: '智能控制',
};

export default function AdminSettings() {
  const [basePrices, setBasePrices] = useState({ glass:500, pc:350, solar:280, 'multi-span':200, arch:120 });
  const [addonPrices, setAddonPrices] = useState({ has_cooling:40, has_heating:30, has_irrigation:30, has_lighting:50, has_smart_control:20 });
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [loading, setLoading] = useState(true);
  const [company,setCompany]=useState({company_name:'山东京阳温室科技有限公司',company_phone:'152-7589-8666',company_phone2:'152-7589-8779',company_contact:'王静',company_email:'jingyangwenshikeji@163.com',company_address:'山东省聊城市莘县工业园区鸿图街8号',working_hours:'周一至周六 08:30 – 17:30',service_area:'山东、河南、河北、东北、山西、陕西、江苏、安徽等全国各地'});

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  useEffect(() => {
    axios.get('/api/calculator/rules').then(res => {
      if (res.data?.base_prices)  setBasePrices(p  => ({ ...p,  ...res.data.base_prices  }));
      if (res.data?.addon_prices) setAddonPrices(p => ({ ...p,  ...res.data.addon_prices }));
    }).catch(() => {}).finally(() => setLoading(false));
    axios.get('/api/admin/site-settings',{headers:auth()}).then(r=>setCompany(x=>({...x,...r.data.data}))).catch(()=>{});
  }, []);

  const saveRules = async () => {
    setSaving(true); setSaved(false);
    try {
      await axios.put('/api/admin/calculator-rules', {
        base_prices:  basePrices,
        addon_prices: addonPrices,
      }, { headers: auth() });
      setSaved(true); // 保持显示，直到下次保存操作
    } catch (e) {
      alert(e.response?.data?.error || '保存失败，请检查后端是否支持该接口');
    }
    setSaving(false);
  };

  const setBase  = (k, v) => setBasePrices(p  => ({ ...p,  [k]: Number(v) || 0 }));
  const setAddon = (k, v) => setAddonPrices(p => ({ ...p,  [k]: Number(v) || 0 }));
  const saveCompany=async()=>{setSaving(true);try{await axios.put('/api/admin/site-settings',company,{headers:auth()});alert('公司信息保存成功');}catch(e){alert(e.response?.data?.error||'保存失败')}setSaving(false)};

  if (loading) return <AdminLayout title="系统设置"><div className="py-20 text-center text-gray-400">加载中...</div></AdminLayout>;

  return (
    <AdminLayout title="系统设置">
      <div className="max-w-2xl space-y-8">

        {/* 计算器单价配置 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">预算计算器单价配置</h2>
          <p className="text-xs text-gray-400 mb-5">修改后前台计算器将实时使用新单价（元/㎡）</p>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">🏗️ 温室基础单价</h3>
              <div className="space-y-2">
                {Object.entries(BASE_PRICE_LABELS).map(([k, label]) => (
                  <div key={k} className="flex items-center gap-4">
                    <label className="flex-1 text-sm text-gray-700">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number" min="0" value={basePrices[k] || 0}
                        onChange={e => setBase(k, e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:border-primary-400"
                      />
                      <span className="text-xs text-gray-400 w-12">元/㎡</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">⚙️ 配套系统加价</h3>
              <div className="space-y-2">
                {Object.entries(ADDON_LABELS).map(([k, label]) => (
                  <div key={k} className="flex items-center gap-4">
                    <label className="flex-1 text-sm text-gray-700">{label}</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">+</span>
                      <input
                        type="number" min="0" value={addonPrices[k] || 0}
                        onChange={e => setAddon(k, e.target.value)}
                        className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm text-right focus:outline-none focus:border-primary-400"
                      />
                      <span className="text-xs text-gray-400 w-12">元/㎡</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-100">
            <button onClick={saveRules} disabled={saving}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
            >{saving ? '保存中...' : '保存单价配置'}</button>
            {saved && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                ✅ 保存成功！前台计算器已使用新单价
              </div>
            )}
          </div>
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
