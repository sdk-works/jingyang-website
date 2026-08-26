import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';

const toBackendType = (k) => ({
  'wenlo-glass':    'glass',
  'pc-panel':       'pc',
  'solar-room':     'solar',
  'film-multispan': 'multi-span',
  'single-arch':    'arch',
}[k] || k);

const DEFAULT_PRICES = {
  'wenlo-glass':    500,
  'pc-panel':       350,
  'solar-room':     280,
  'film-multispan': 200,
  'single-arch':    120,
};
const DEFAULT_ADDONS = {
  cooling: 40,
  heating: 30,
  irrigation: 30,
  lighting: 50,
  smart_control: 20,
};

const TYPES = [
  { key:'wenlo-glass',    icon:'🏗️', color:'#1565c0' },
  { key:'pc-panel',       icon:'☀️', color:'#2d6a4f' },
  { key:'solar-room',     icon:'🌱', color:'#558b2f' },
  { key:'film-multispan', icon:'🏛️', color:'#e65100' },
  { key:'single-arch',    icon:'⛺', color:'#6d4c41' },
];

export default function CalculatorPage() {
  const { t } = useTranslation('common');
  const { locale='zh' } = useRouter();

  const [prices,   setPrices]   = useState(DEFAULT_PRICES);
  const [addons,   setAddons]   = useState(DEFAULT_ADDONS);
  const [selType,  setSelType]  = useState('');
  const [area,     setArea]     = useState('');
  const [selAddons,setSelAddons]= useState({ cooling:false, heating:false, irrigation:false, lighting:false, smart_control:false });
  const [result,   setResult]   = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [lead,     setLead]     = useState({ name:'', phone:'', email:'' });
  const [leadSent, setLeadSent] = useState(false);
  const [configItems,setConfigItems]=useState([]);

  useEffect(() => {
    axios.get('/api/calculator/rules').then(res => {
      if(res.data?.items?.length){setConfigItems(res.data.items);const p={},ap={};res.data.items.filter(x=>x.item_type==='base').forEach(x=>p[x.item_key]=Number(x.price_per_sqm));res.data.items.filter(x=>x.item_type==='addon').forEach(x=>ap[x.item_key]=Number(x.price_per_sqm));setPrices(v=>({...v,...p}));setAddons(v=>({...v,...ap}));}
      if (res.data?.base_prices) {
        const bp = res.data.base_prices;
        setPrices(p => ({
          ...p,
          'wenlo-glass':    bp.glass    || p['wenlo-glass'],
          'pc-panel':       bp.pc       || p['pc-panel'],
          'solar-room':     bp.solar    || p['solar-room'],
          'film-multispan': bp['multi-span'] || p['film-multispan'],
          'single-arch':    bp.arch     || p['single-arch'],
        }));
      }
      if (res.data?.addon_prices) {
        const ap = res.data.addon_prices;
        setAddons(a => ({
          cooling:       ap.has_cooling       || a.cooling,
          heating:       ap.has_heating       || a.heating,
          irrigation:    ap.has_irrigation    || a.irrigation,
          lighting:      ap.has_lighting      || a.lighting,
          smart_control: ap.has_smart_control || a.smart_control,
        }));
      }
    }).catch(() => {});
  }, []);

  const calculate = async () => {
    if (!selType) { alert(t('calculator.select_type')); return; }
    if (!area || !/^\d+(?:\.\d+)?$/.test(String(area)) || Number(area) <= 0) { alert(t('calculator.area_placeholder')); return; }
    setLoading(true);
    try {
      const res = await axios.post('/api/calculator/calculate', {
        greenhouse_type: toBackendType(selType),
        area: Number(area),
        has_cooling:       selAddons.cooling,
        has_heating:       selAddons.heating,
        has_irrigation:    selAddons.irrigation,
        has_lighting:      selAddons.lighting,
        has_smart_control: selAddons.smart_control,
        selected_addons:Object.keys(selAddons).filter(k=>selAddons[k]),
        lang: locale,
      });
      setResult(res.data);
    } catch {
      const base = prices[selType] || 300;
      let addonTotal = 0;
      if (selAddons.cooling)       addonTotal += addons.cooling;
      if (selAddons.heating)       addonTotal += addons.heating;
      if (selAddons.irrigation)    addonTotal += addons.irrigation;
      if (selAddons.lighting)      addonTotal += addons.lighting;
      if (selAddons.smart_control) addonTotal += addons.smart_control;
      const ppsm  = base + addonTotal;
      const total = Math.round(ppsm * Number(area));
      setResult({
        greenhouse_type: selType,
        area: Number(area),
        base_price_per_sqm: base,
        addon_price_per_sqm: addonTotal,
        total_price_per_sqm: ppsm,
        total_price: total,
        currency: 'CNY',
        recommendations: [],
      });
    }
    setLoading(false);
  };

  const submitLead = async () => {
    if (!lead.name) { alert(t('contact.error_name')); return; }
    if (!lead.phone && !lead.email) { alert(t('contact.error_contact')); return; }
    try {
      await axios.post('/api/contact', { ...lead, greenhouse_type: selType, area, source: 'calculator' });
      setLeadSent(true);
    } catch (e) { alert(e.response?.data?.message || t('contact.error_server')); }
  };

  const defaultAddonItems = [
    { key:'cooling',       labelKey:'cooling' },
    { key:'heating',       labelKey:'heating' },
    { key:'irrigation',    labelKey:'irrigation' },
    { key:'lighting',      labelKey:'lighting' },
    { key:'smart_control', labelKey:'smart_control' },
  ];
  const localizedLabel=x=>x[`label_${locale}`]||x.label_zh;
  const dynamicTypes=configItems.filter(x=>x.item_type==='base').map(x=>({key:x.item_key,icon:x.icon||'🏗️',label:localizedLabel(x)}));
  const displayTypes=dynamicTypes.length?dynamicTypes:TYPES;
  const dynamicAddons=configItems.filter(x=>x.item_type==='addon').map(x=>({key:x.item_key,label:localizedLabel(x)}));
  const addonItems=dynamicAddons.length?dynamicAddons:defaultAddonItems;
  const typeKeys={glass:'wenlo-glass',pc:'pc-panel',solar:'solar-room','multi-span':'film-multispan',arch:'single-arch'};
  const typeLabel=tp=>typeKeys[tp.key]?t(`calculator.types.${typeKeys[tp.key]}`):(tp.label||t(`calculator.types.${tp.key}`));
  const addonLabel=item=>['cooling','heating','irrigation','lighting','smart_control'].includes(item.key)?t(`calculator.${item.key}`):(item.label||item.key);
  const unit=`${t('common.cny')}/${t('common.sqm')}`;

  return (
    <Layout title={`${t('calculator.title')} - ${t('company.name')}`} description={t('calculator.subtitle')}
      keywords="温室预算计算器,温室造价,大棚报价,温室建设费用">
      <section className="py-14 text-white text-center" style={{ background:'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs tracking-widest uppercase text-green-300 mb-3">{t('calculator.title')}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily:'Noto Serif SC,serif' }}>{t('calculator.title')}</h1>
          <p className="text-white/70">{t('calculator.subtitle')}</p>
        </div>
      </section>

      <section className="py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{t('calculator.type_label')}</label>
                <div className="grid grid-cols-1 gap-2">
                  {displayTypes.map(tp => (
                    <button key={tp.key} onClick={() => setSelType(tp.key)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                        selType === tp.key
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-100 hover:border-gray-200 text-gray-700'
                      }`}
                    >
                      <span className="text-xl">{tp.icon}</span>
                      <span className="flex-1">{typeLabel(tp)}</span>
                      {prices[tp.key] && (
                        <span className="text-xs font-normal text-gray-400">{prices[tp.key]} {unit}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('calculator.area_label')}</label>
                <div className="relative">
                  <input value={area} onChange={e => setArea(e.target.value)} type="number" min="1"
                    placeholder={t('calculator.area_placeholder')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">㎡</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{t('calculator.addons_title')}</label>
                <div className="space-y-2">
                  {addonItems.map(item => (
                    <label key={item.key} className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={selAddons[item.key]}
                          onChange={e => setSelAddons(s => ({ ...s, [item.key]: e.target.checked }))}
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {addonLabel(item)}
                        </span>
                      </div>
                      <span className="text-xs text-gray-400">+{addons[item.key]} {unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button onClick={calculate} disabled={loading}
                className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60"
              >
                {loading ? t('common.loading') : `🧮 ${t('calculator.calculate')}`}
              </button>
            </div>

            <div className="space-y-5">
              {result ? (
                <>
                  <div className="bg-gradient-to-br from-primary-700 to-green-800 rounded-2xl p-7 text-white">
                    <div className="text-sm text-white/70 mb-1">{t('calculator.result_title')}</div>
                    <div className="text-4xl font-bold mb-1" style={{ fontFamily:'Noto Serif SC,serif' }}>
                      ¥{result.total_price.toLocaleString()}
                    </div>
                    <div className="text-xs text-white/60">{t('calculator.currency')}</div>
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">{t('calculator.base_price')}</span>
                        <span className="font-semibold">{result.base_price_per_sqm} {unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/70">{t('calculator.addon_price')}</span>
                        <span className="font-semibold">+{result.addon_price_per_sqm} {unit}</span>
                      </div>
                      <div className="h-px bg-white/20"/>
                      <div className="flex justify-between">
                        <span className="text-white/70">{t('calculator.price_per_sqm')}</span>
                        <span className="font-bold text-lg">{result.total_price_per_sqm} {unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">{t('calculator.area_label')}</span>
                        <span className="font-bold">{Number(result.area).toLocaleString()} {t('common.sqm')}</span>
                      </div>
                    </div>
                  </div>

                  {result.recommendations?.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">{t('calculator.recommendations')}</h4>
                      <ul className="space-y-2">
                        {result.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {!leadSent ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                      <h4 className="text-sm font-semibold text-gray-800 mb-4">{t('calculator.get_quote')}</h4>
                      <div className="space-y-3">
                        <input value={lead.name} onChange={e => setLead(l => ({...l, name:e.target.value}))}
                          placeholder={t('contact.name_placeholder')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"/>
                        <input value={lead.phone} onChange={e => setLead(l => ({...l, phone:e.target.value}))}
                          placeholder={t('contact.phone_placeholder')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"/>
                        <input value={lead.email} onChange={e => setLead(l => ({...l, email:e.target.value}))}
                          placeholder={t('contact.email_placeholder')} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"/>
                        <button onClick={submitLead}
                          className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
                        >{t('calculator.get_quote')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 rounded-2xl border border-green-100 p-5 text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-green-700 font-semibold text-sm">{t('contact.success_desc')}</p>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800 space-y-1.5">
                    <p className="font-semibold text-amber-900">{t('calculator.price_note_title')}</p>
                    <p>{t('calculator.price_includes')}</p>
                    <p>{t('calculator.price_excludes')}</p>
                    <p>⚠️ {t('calculator.disclaimer')}</p>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
                  <div className="text-6xl mb-4">🧮</div>
                  <p className="text-sm">{t('calculator.select_type')}</p>
                  <p className="text-xs mt-1">{t('calculator.area_placeholder')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

// ✅ 最终修复：解决 locale 报错问题
export async function getStaticProps(ctx) {
  const locale = ctx?.locale || 'zh';
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
