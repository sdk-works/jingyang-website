import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';
import { CASE_IMAGES, localizeCase } from '../../utils/caseContent';

function CaseImage({ src, fallback, alt }) {
  const [failed, setFailed] = useState(false);
  return <img src={!failed && src ? src : fallback} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>;
}

export default function CasesPage() {
  const { t } = useTranslation('common');
  const { locale = 'zh' } = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.get('/api/cases', { params:{ lang:locale } });
        if (res.data?.data) setList(res.data.data);
      } catch (e) {
        console.error('案例接口加载失败');
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, [locale]);

  const getCaseText = (item, field) => item[field];

  return (
    <Layout title={`${t('cases.title')} - 山东京阳温室科技有限公司`} description={t('cases.subtitle')} keywords="温室工程案例,大棚项目,温室施工实例,各地温室项目">
      <section className="py-16 text-white text-center" style={{ background: 'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs tracking-widest uppercase text-green-300 mb-3">{t('cases.title')}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily: 'Noto Serif SC,serif' }}>{t('cases.subtitle')}</h1>
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
          ) : list.length === 0 ? (
            <div className="text-center py-20 text-gray-400">{t('common.empty')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {list.map((rawItem, index) => {
                const item = localizeCase(rawItem, locale);
                return (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <CaseImage src={item.cover} fallback={CASE_IMAGES[index % CASE_IMAGES.length]} alt={getCaseText(item, 'title')}/>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1">{getCaseText(item, 'title')}</h3>
                    <p className="text-xs text-gray-500 mb-2">📍 {getCaseText(item, 'address')}</p>
                    <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">{getCaseText(item, 'desc')}</p>
                    <div className="mt-4">
                      <a href={`/cases/${item.slug}`} className="text-primary-600 text-sm font-medium hover:underline">{t('common.details')} →</a>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps({ locale = 'zh' }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}
