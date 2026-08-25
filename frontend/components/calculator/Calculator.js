import { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';

const GREENHOUSE_TYPES = [
  { value: 'glass', icon: '🏛️', priceHint: '500 CNY/㎡' },
  { value: 'film', icon: '🏕️', priceHint: '120 CNY/㎡' },
  { value: 'pc', icon: '🏠', priceHint: '350 CNY/㎡' },
  { value: 'multi-span', icon: '🏭', priceHint: '280 CNY/㎡' },
  { value: 'smart', icon: '🤖', priceHint: '650 CNY/㎡' }
];

export default function Calculator() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  
  const [form, setForm] = useState({
    greenhouse_type: '',
    area: '',
    has_smart_control: false,
    has_irrigation: false,
    has_lighting: false,
    has_cooling: false
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('form'); // form | result | contact

  const handleCalculate = async () => {
    if (!form.greenhouse_type) return toast.error(t('common.select_type'));
    if (!form.area || parseFloat(form.area) <= 0) return toast.error(t('calculator.area_placeholder'));
    
    setLoading(true);
    try {
      const { data } = await axios.post('/api/calculator/calculate', { ...form, lang: locale });
      setResult(data);
      setStep('result');
    } catch (err) {
      toast.error(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (num) => {
    return new Intl.NumberFormat('zh-CN').format(num);
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl overflow-hidden">
      {step === 'form' && (
        <div className="p-8">
          {/* Type Selection */}
          <div className="mb-8">
            <label className="block text-white font-semibold text-sm mb-4">{t('calculator.type_label')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {GREENHOUSE_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setForm(f => ({ ...f, greenhouse_type: type.value }))}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    form.greenhouse_type === type.value
                      ? 'border-primary-400 bg-primary-600/30 text-white'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                  }`}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{t(`products.categories.${type.value}`)}</div>
                  <div className="text-xs text-primary-300 mt-0.5">{type.priceHint}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Area */}
          <div className="mb-8">
            <label className="block text-white font-semibold text-sm mb-3">{t('calculator.area_label')}</label>
            <input
              type="number"
              placeholder={t('calculator.area_placeholder')}
              value={form.area}
              onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
              className="w-full bg-white/10 border border-white/20 text-white placeholder-gray-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              min="1"
            />
          </div>

          {/* Addons */}
          <div className="mb-8">
            <label className="block text-white font-semibold text-sm mb-4">{t('calculator.addons_title')}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'has_smart_control', label: t('calculator.smart_control'), price: '+20 CNY/㎡', icon: '🤖' },
                { key: 'has_irrigation', label: t('calculator.irrigation'), price: '+30 CNY/㎡', icon: '💧' },
                { key: 'has_lighting', label: t('calculator.lighting'), price: '+50 CNY/㎡', icon: '💡' },
                { key: 'has_cooling', label: t('calculator.cooling'), price: '+40 CNY/㎡', icon: '❄️' }
              ].map(addon => (
                <label key={addon.key} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  form[addon.key] ? 'border-primary-400 bg-primary-600/20' : 'border-white/20 hover:border-white/30'
                }`}>
                  <input
                    type="checkbox"
                    checked={form[addon.key]}
                    onChange={e => setForm(f => ({ ...f, [addon.key]: e.target.checked }))}
                    className="w-4 h-4 accent-primary-500"
                  />
                  <span className="text-xl">{addon.icon}</span>
                  <div className="flex-1">
                    <div className="text-white text-sm font-medium">{addon.label}</div>
                    <div className="text-primary-300 text-xs">{addon.price}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={handleCalculate}
            disabled={loading}
            className="w-full py-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-primary-900/50"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {t('common.loading')}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {t('calculator.calculate')}
              </>
            )}
          </button>
        </div>
      )}

      {step === 'result' && result && (
        <div className="p-8 result-animate">
          <div className="text-center mb-8">
            <div className="text-green-400 text-5xl mb-3">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">{t('calculator.result_title')}</h3>
          </div>

          {/* Price Display */}
          <div className="bg-primary-600/20 border border-primary-500/30 rounded-2xl p-6 mb-6 text-center">
            <div className="text-gray-300 text-sm mb-2">{t('calculator.total_price')}</div>
            <div className="text-5xl font-bold text-white mb-1">
              ¥{new Intl.NumberFormat('zh-CN').format(result.total_price)}
            </div>
            <div className="text-primary-300 text-sm">{t('calculator.currency')}</div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{t('calculator.price_per_sqm')}</span>
              <span className="text-white font-medium">¥{result.total_price_per_sqm}/㎡</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">建设面积</span>
              <span className="text-white font-medium">{result.area} ㎡</span>
            </div>
            {result.addon_details?.map(addon => (
              <div key={addon.key} className="flex justify-between text-sm">
                <span className="text-primary-300">+ {addon.key}</span>
                <span className="text-primary-300">¥{addon.price}/㎡</span>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          {result.recommendations?.length > 0 && (
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="text-white font-semibold text-sm mb-3">💡 {t('calculator.recommendations')}</div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center mb-6">{t('calculator.disclaimer')}</p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setStep('form'); setResult(null); }}
              className="py-3 border border-white/20 text-white rounded-xl text-sm font-medium hover:bg-white/10 transition-colors"
            >
              ← {t('common.back')}
            </button>
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '8613888888888'}?text=我刚使用了预算计算器，计划建设${result.area}㎡${result.greenhouse_type}温室，预算约¥${formatPrice(result.total_price)}，希望获取详细方案`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 bg-[#25D366] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {t('calculator.get_quote')}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
