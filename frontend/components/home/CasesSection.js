import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import axios from 'axios';

const FALLBACK_CASES = [
  { id: '1', title: '荷兰番茄种植温室', country: '荷兰', area: 50000, greenhouse_type: 'glass', slug: 'netherlands-tomato', flag: '🇳🇱' },
  { id: '2', title: '沙特阿拉伯蔬菜温室', country: '沙特阿拉伯', area: 30000, greenhouse_type: 'smart', slug: 'saudi-vegetable', flag: '🇸🇦' },
  { id: '3', title: '俄罗斯草莓种植基地', country: '俄罗斯', area: 20000, greenhouse_type: 'pc', slug: 'russia-strawberry', flag: '🇷🇺' }
];

export default function CasesSection() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [cases, setCases] = useState([]);

  useEffect(() => {
    axios.get(`/api/cases?lang=${locale}&limit=3`)
      .then(r => setCases(r.data.data?.length ? r.data.data : FALLBACK_CASES))
      .catch(() => setCases(FALLBACK_CASES));
  }, [locale]);

  const displayCases = cases.length ? cases : FALLBACK_CASES;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <span className="text-primary-600 font-semibold text-sm tracking-wider uppercase">Global Projects</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">{t('cases.title')}</h2>
            <p className="text-gray-500 mt-3">{t('cases.subtitle')}</p>
          </div>
          <Link href="/cases" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 border border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
            {t('cases.view_all')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayCases.slice(0, 3).map((c, i) => (
            <div key={c.id || i} className="group rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
              {/* Case Image */}
              <div className="h-52 bg-gradient-to-br from-primary-800 to-forest-900 relative overflow-hidden">
                {c.cover_image ? (
                  <img src={c.cover_image} alt={c.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl mb-2">{c.flag || '🌿'}</div>
                      <div className="text-white/60 text-sm">{c.country}</div>
                    </div>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white text-xs rounded-full border border-white/20">
                    {t(`products.categories.${c.greenhouse_type}`) || c.greenhouse_type}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <h3 className="font-bold text-gray-900 text-lg mb-3">{c.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {c.country}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    {c.area?.toLocaleString()} {t('common.sqm')}
                  </div>
                </div>
                <Link href={`/cases/${c.slug}`} className="text-primary-600 font-semibold text-sm hover:text-primary-700 flex items-center gap-1 group">
                  {t('cases.view_detail')}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
