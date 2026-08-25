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

  const auth = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}` });

  useEffect(() => {
    axios.get('/api/calculator/rules').then(res => {
      if (res.data?.base_prices)  setBasePrices(p  => ({ ...p,  ...res.data.base_prices  }));
      if (res.data?.addon_prices) setAddonPrices(p => ({ ...p,  ...res.data.addon_prices }));
    }).catch(() => {}).finally(() => setLoading(false));
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

        {/* 公司信息（只读提示） */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-bold text-gray-900 mb-1">公司基本信息</h2>
          <p className="text-xs text-gray-400 mb-4">以下为当前展示的公司信息，如需修改请联系技术人员更新数据库</p>
          <div className="space-y-3 text-sm">
            {[
              ['公司名称', '山东京阳温室科技有限公司'],
              ['联系电话', '152-7589-8666 / 152-7589-8779（王静）'],
              ['电子邮箱', 'jingyangwenshikeji@163.com'],
              ['公司地址', '山东省聊城市莘县工业园区鸿图街8号'],
              ['服务时间', '周一至周六 08:30 – 17:30'],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 w-20 flex-shrink-0 font-medium">{k}</span>
                <span className="text-gray-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
