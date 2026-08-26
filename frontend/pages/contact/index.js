/**
 * 联系我们页 /contact
 * 多语言: useTranslation
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';

const COMPANY = {
  address: '山东省聊城市莘县工业园区鸿图街8号',
  phone1:  '152-7589-8666',
  phone2:  '152-7589-8779',
  contact: '王静',
  email:   'jingyangwenshikeji@163.com',
  hours:   '周一至周六 08:30 – 17:30',
  serviceArea: '山东、河南、河北、东北、山西、陕西、江苏、安徽等全国各地',
};

const TYPES = ['文洛型玻璃温室','阳光板温室（PC板）','日光温室','薄膜连栋温室','单体拱棚','配套系统','设备配件','其他咨询'];

const LOCAL_CONTACT = {
  zh: { address: COMPANY.address, contact: '王静', hours: COMPANY.hours, serviceArea: COMPANY.serviceArea,
    types: TYPES },
  en: { address: 'No. 8 Hongtu Street, Shenxian Industrial Park, Liaocheng, Shandong, China', contact: 'Ms. Wang', hours: 'Monday–Saturday 08:30–17:30', serviceArea: 'Serving customers throughout China and international markets',
    types: ['Venlo Glass Greenhouse','PC Panel Greenhouse','Solar Greenhouse','Multi-span Film Greenhouse','Single-span Tunnel','Supporting Systems','Equipment & Parts','Other Inquiry'] },
  ru: { address: 'ул. Хунту, 8, промышленный парк Шэньсянь, Ляочэн, Шаньдун, Китай', contact: 'г-жа Ван', hours: 'Понедельник–суббота 08:30–17:30', serviceArea: 'Работаем по всему Китаю и на международных рынках',
    types: ['Стеклянная теплица Venlo','Теплица из поликарбоната','Солнечная теплица','Многопролётная плёночная теплица','Однопролётный тоннель','Вспомогательные системы','Оборудование и комплектующие','Другой запрос'] },
  ar: { address: 'رقم 8، شارع هونغتو، مجمع شينشيان الصناعي، لياوتشنغ، شاندونغ، الصين', contact: 'السيدة وانغ', hours: 'الاثنين–السبت 08:30–17:30', serviceArea: 'نخدم العملاء في جميع أنحاء الصين والأسواق الدولية',
    types: ['دفيئة زجاجية فينلو','دفيئة ألواح بولي كربونات','دفيئة شمسية','دفيئة فيلمية متعددة البحور','نفق أحادي البحر','أنظمة مساندة','معدات وقطع غيار','استفسار آخر'] },
};

export default function ContactPage() {
  const { t } = useTranslation('common');
  const { locale = 'zh' } = useRouter();
  const localContact = LOCAL_CONTACT[locale] || LOCAL_CONTACT.en;
  const [site,setSite]=useState({});
  useEffect(()=>{ axios.get('/api/settings').then(r=>setSite(r.data?.data||{})).catch(()=>{}); },[]);
  const displayContact = locale==='zh' ? { ...localContact, address:site.company_address||localContact.address,
    contact:site.company_contact||localContact.contact, hours:site.working_hours||localContact.hours,
    serviceArea:site.service_area||localContact.serviceArea } : localContact;
  const phone1=site.company_phone||COMPANY.phone1, phone2=site.company_phone2||COMPANY.phone2;
  const [form,   setForm]   = useState({ name:'', country:'', phone:'', email:'', greenhouse_type:'', area:'', message:'' });
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('');

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim())                   { setErrMsg(t('contact.error_name'));    return; }
    if (!form.phone.trim() && !form.email.trim()) { setErrMsg(t('contact.error_contact')); return; }
    setErrMsg(''); setStatus('loading'); // 每次提交前重置状态
    try {
      await axios.post('/api/contact', form);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setErrMsg(err.response?.data?.message || t('contact.error_server'));
    }
  };

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all';

  return (
    <Layout title={`${t('contact.title')} - 山东京阳温室科技有限公司`} description={t('contact.subtitle')}
      keywords="温室报价,温室咨询,联系京阳温室,温室免费方案">
      {/* Hero */}
      <section className="py-16 text-white text-center" style={{ background: 'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs tracking-widest uppercase text-green-300 mb-3">{t('contact.title')}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'Noto Serif SC,serif' }}>{t('contact.subtitle')}</h1>
          <p className="text-white/70">{t('contact.form_subtitle')}</p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* 联系信息 */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Noto Serif SC,serif' }}>{t('contact.get_plan')}</h2>
                <p className="text-gray-500 text-sm leading-relaxed">{t('contact.form_subtitle')}</p>
              </div>
              {[
                { icon:'📍', label:t('contact.address_label'), value:displayContact.address },
                { icon:'📞', label:t('contact.phone_label'), value:`${phone1}\n${phone2} (${displayContact.contact})`, href:`tel:${phone1.replace(/-/g,'')}` },
                { icon:'✉️', label:t('contact.email_label'), value:COMPANY.email, href:`mailto:${COMPANY.email}` },
                { icon:'🕐', label:t('contact.hours_label'), value:displayContact.hours },
                { icon:'🗺️', label:t('contact.service_area'), value:displayContact.serviceArea },
              ].map(item => (
                <div key={item.label} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-primary-600 font-medium hover:underline whitespace-pre-line">{item.value}</a>
                    ) : (
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{item.value}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 表单 */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              {status === 'success' ? (
                <div className="text-center py-10">
                  <div className="text-6xl mb-5">✅</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{t('contact.success_title')}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-8">{t('contact.success_desc')}</p>
                  <div className="flex gap-4 justify-center">
                    <a href={`tel:${COMPANY.phone1.replace(/-/g,'')}`}
                      className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
                    >{t('contact.call_now')}</a>
                    <button onClick={() => { setStatus('idle'); setForm({ name:'',country:'',phone:'',email:'',greenhouse_type:'',area:'',message:'' }); }}
                      className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-colors"
                    >{t('contact.resubmit')}</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{t('contact.get_plan')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.name')} <span className="text-red-500">*</span></label>
                      <input value={form.name} onChange={set('name')} placeholder={t('contact.name_placeholder')} className={inputCls}/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.country')}</label>
                      <input value={form.country} onChange={set('country')} placeholder={t('contact.country_placeholder')} className={inputCls}/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.phone')} <span className="text-orange-400 text-[10px]">{t('contact.contact_hint')}</span></label>
                      <input value={form.phone} onChange={set('phone')} placeholder={t('contact.phone_placeholder')} className={inputCls}/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.email')}</label>
                      <input value={form.email} onChange={set('email')} type="email" placeholder={t('contact.email_placeholder')} className={inputCls}/>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.greenhouse_type')}</label>
                      <select value={form.greenhouse_type} onChange={set('greenhouse_type')} className={inputCls}>
                        <option value="">{t('contact.select')}</option>
                        {localContact.types.map((label, index) => <option key={TYPES[index]} value={TYPES[index]}>{label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.area')}</label>
                      <input value={form.area} onChange={set('area')} type="number" placeholder={t('contact.area_placeholder')} className={inputCls}/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('contact.message')}</label>
                    <textarea value={form.message} onChange={set('message')} rows={4} placeholder={t('contact.message_placeholder')} className={`${inputCls} resize-none`}/>
                  </div>
                  {errMsg && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">⚠️ {errMsg}</div>
                  )}
                  <button onClick={handleSubmit} disabled={status === 'loading'}
                    className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === 'loading' ? t('contact.submitting') : status === 'error' ? `🔄 ${t('contact.resubmit')}` : `🌿 ${t('contact.submit')}`}
                  </button>
                  <div className="text-center text-xs text-gray-400">
                    {t('contact.or_call')}：
                    <a href={`tel:${COMPANY.phone1.replace(/-/g,'')}`} className="text-primary-600 font-semibold">{COMPANY.phone1}</a>
                    （{t('contact.work_hours')}）
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>
    </Layout>
  );
}

// ✅ 已修复：多语言正常，不报错
export async function getStaticProps(ctx) {
  const locale = ctx.locale || 'zh';
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  };
}
