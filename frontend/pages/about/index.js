/**
 * 公司介绍页 /about
 * 图片说明：
 *   - Hero背景: /public/images/about/hero-bg.jpg (缺失时用渐变)
 *   - 公司外观: /public/images/about/company.jpg
 *   - 工厂车间: /public/images/about/factory.jpg
 * 多语言: 通过 next-i18next + useTranslation 实现
 */
import React, { useState } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Layout from '../../components/common/Layout';


// 图片组件
function AboutImage({ src, alt, fallback }) {
  const [err, setErr] = useState(false);
  if (!err) return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setErr(true)}/>;
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-800 to-forest-900">
      <span className="text-5xl mb-2 opacity-30">{fallback}</span>
    </div>
  );
}

const COMPANY = {
  name:    '山东京阳温室科技有限公司',
  address: '山东省聊城市莘县工业园区鸿图街8号',
  phone1:  '152-7589-8666',
  phone2:  '152-7589-8779',
  contact: '王静',
  email:   'jingyangwenshikeji@163.com',
  hours:   '周一至周六 08:30 – 17:30',
  serviceArea: '山东、河南、河北、东北、山西、陕西、江苏、安徽等全国各地',
};

// 合作院校：各语言版本在语言包 about.partners_list 中定义
// 如需修改院校名称，直接更新 public/locales/*/common.json
const PARTNERS_ZH = ['中国农业大学', '山东建筑大学', '山东轻工业设计研究院'];
const PARTNERS_EN = ['China Agricultural University', 'Shandong Jianzhu University', 'Shandong Light Industry Design & Research Institute'];
const PARTNERS_RU = ['Китайский аграрный университет', 'Шаньдунский строительный университет', 'Шаньдунский институт лёгкой промышленности'];
const PARTNERS_AR = ['الجامعة الزراعية الصينية', 'جامعة شاندونغ للبناء', 'معهد تصميم الصناعات الخفيفة بشاندونغ'];
const PARTNERS_MAP = { zh: PARTNERS_ZH, en: PARTNERS_EN, ru: PARTNERS_RU, ar: PARTNERS_AR };

const STATS = [
  { num: '15+', key: 'projects' },
  { num: '8+',  key: 'provinces' },
  { num: '3',   key: 'partners' },
];

const SERVICES = ['design','system','parts','service'];

export default function AboutPage() {
  const { t, i18n } = useTranslation('common');
  const PARTNERS = PARTNERS_MAP[i18n.language] || PARTNERS_ZH;

  return (
    <Layout
      title={`${t('about.title')} - ${COMPANY.name}`}
      description={t('about.intro')}
      keywords="京阳温室,公司介绍,温室建造,山东温室,聊城莘县"
    >
      {/* ── Hero ── */}
      {/* 图片: /public/images/about/hero-bg.jpg，缺失时显示渐变 */}
      <section
        className="relative py-24 text-white text-center"
        style={{ background: 'linear-gradient(135deg,#1a3d2b 0%,#2d6a4f 60%,#1a3d2b 100%)' }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #52b788 0%, transparent 60%)' }}
        />
        <div className="relative max-w-3xl mx-auto px-6">
          <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium tracking-widest text-green-200 mb-5 uppercase">
            {t('about.title')}
          </div>
          <h1 className="font-bold text-3xl md:text-5xl leading-tight mb-5" style={{ fontFamily: 'Noto Serif SC, serif' }}>
            {t('about.subtitle')}
          </h1>
          <p className="text-white/75 text-base md:text-lg leading-relaxed">{t('about.intro')}</p>
        </div>
      </section>

      {/* ── 数据统计 ── */}
      <section className="bg-white py-12 border-b">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-6">
          {STATS.map(s => (
            <div key={s.key} className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-1" style={{ fontFamily: 'Noto Serif SC, serif' }}>{s.num}</div>
              <div className="text-sm text-gray-500">{t(`about.stats.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 公司简介 + 图片 ── */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">{t('about.title')}</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-5 leading-tight" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                {t('about.subtitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">{t('about.intro')}</p>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('about.service_area_desc')}
              </p>

              {/* 业务范围 */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {SERVICES.map(k => (
                  <div key={k} className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-primary-100 shadow-sm">
                    <svg className="w-4 h-4 text-primary-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.707-4.707a1 1 0 111.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-sm text-gray-700">{t(`about.service_list.${k}`)}</span>
                  </div>
                ))}
              </div>

              {/* 合作院校 */}
              <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                <div className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-3">{t('about.partners')}</div>
                <div className="flex flex-wrap gap-2">
                  {PARTNERS.map(p => (
                    <span key={p} className="px-3 py-1.5 bg-white border border-primary-200 rounded-full text-xs text-gray-700 font-medium">{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 右侧图片区域 */}
            {/* 图片: /public/images/about/company.jpg - 公司外观照片 */}
            <div className="space-y-4">
              <div className="relative h-64 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-primary-800 to-forest-900 flex items-center justify-center">
                {/* 若图片存在则显示: <img src="/images/about/company.jpg" alt="公司外观" className="w-full h-full object-cover"/> */}
                <div className="text-center text-white/60">
                  <svg className="w-16 h-16 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                  <p className="text-sm">公司外观图</p>
                  <p className="text-xs opacity-60">图片路径: /images/about/company.jpg</p>
                </div>
              </div>
              {/* 图片: /public/images/about/factory.jpg */}
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-lg">
                <AboutImage src="/images/about/factory.jpg" alt="工厂车间" fallback="🏗️"/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 企业价值观 ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="text-xs font-semibold text-primary-600 tracking-widest uppercase mb-3">{t('about.values_title')}</div>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Noto Serif SC, serif' }}>{t('about.mission')}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '💎', titleKey: 'core_value', descKey: 'core_value_desc' },
              { icon: '🎯', titleKey: 'vision',     descKey: 'vision_desc' },
              { icon: '🌿', titleKey: 'spirit',     descKey: 'spirit_desc' },
            ].map(item => (
              <div key={item.titleKey} className="text-center p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t(`about.${item.titleKey}`)}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{t(`about.${item.descKey}`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 联系信息 ── */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg,#1a3d2b,#0f2318)' }}>
        <div className="max-w-5xl mx-auto px-6 text-white text-center">
          <h2 className="text-3xl font-bold mb-10" style={{ fontFamily: 'Noto Serif SC, serif' }}>{t('contact.title')}</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '📍', label: t('contact.address_label'), value: COMPANY.address },
              { icon: '📞', label: t('contact.phone_label'), value: `${COMPANY.phone1}\n${COMPANY.phone2}（${COMPANY.contact}）` },
              { icon: '✉️', label: t('contact.email_label'), value: COMPANY.email },
              { icon: '🕐', label: t('contact.hours_label'), value: COMPANY.hours },
            ].map(item => (
              <div key={item.label} className="p-5 rounded-2xl bg-white/8 border border-white/10 text-left">
                <div className="text-2xl mb-3">{item.icon}</div>
                <div className="text-xs text-white/50 mb-1 font-medium uppercase tracking-wider">{item.label}</div>
                <div className="text-sm text-white/85 leading-relaxed whitespace-pre-line">{item.value}</div>
              </div>
            ))}
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