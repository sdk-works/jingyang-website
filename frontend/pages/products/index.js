import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';

const DEFAULT_CATS = [
  { id:1, name:'全部', slug:'all' },
  { id:2, name:'玻璃温室', slug:'glass' },
  { id:3, name:'阳光板温室', slug:'pc' },
  { id:4, name:'日光温室', slug:'solar' },
  { id:5, name:'薄膜温室', slug:'film' },
  { id:6, name:'配件系统', slug:'parts' },
];

export default function ProductsPage() {
  const { t } = useTranslation('common');
  const { locale = 'zh' } = useRouter();
  const [cats, setCats] = useState(DEFAULT_CATS);
  const [activeCat, setActiveCat] = useState('all');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/products', { params:{ lang:locale } });
        if(res.data?.data) setList(res.data.data);
      } catch (e) {
        console.error('产品接口请求失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [locale]);

  const getTxt = (item, field) => item[field];

  const filterList = activeCat === 'all' ? list : list.filter(item => item.category_slug === activeCat);

  return (
    <Layout title={`${t('products.title')} - 山东京阳温室科技有限公司`} description={t('products.subtitle')} keywords="温室设备,温室大棚,温室骨架,温室配件,连栋温室">
      <section className="py-16 text-white text-center" style={{ background:'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs tracking-widest uppercase text-green-300 mb-3">{t('products.title')}</div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3" style={{ fontFamily:'Noto Serif SC,serif' }}>{t('products.subtitle')}</h1>
        </div>
      </section>
      <section className="bg-white border-b sticky top-16 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {cats.map(cat => (
              <button key={cat.id} onClick={() => setActiveCat(cat.slug)} className={`whitespace-nowrap px-4 py-2 rounded-full text-sm transition-all ${activeCat === cat.slug ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{cat.name}</button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 bg-gray-50 min-h-[50vh]">
        <div className="max-w-6xl mx-auto px-6">
          {loading ? (
            <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
          ) : filterList.length === 0 ? (
            <div className="text-center py-20 text-gray-400">{t('common.empty')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterList.map(item => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img src={item.cover || '/images/default-product.jpg'} alt={getTxt(item, 'name')} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{getTxt(item, 'name')}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">{getTxt(item, 'desc')}</p>
                    <a href={`/products/${item.slug}`} className="inline-flex items-center text-primary-600 text-sm font-medium hover:underline">
                      {t('common.view_detail')}
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps({ locale = 'zh'}) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}
