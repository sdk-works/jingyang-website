import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';
import Link from 'next/link';

const PRODUCT_IMAGES = [
  '/images/photo/产品技术/文洛型玻璃温室.jpg', '/images/photo/产品技术/阳光板温室.jpg',
  '/images/photo/产品技术/日光温室.jpg', '/images/photo/产品技术/薄膜连栋温室.jpg',
  '/images/photo/产品技术/椭圆管棚.jpg', '/images/photo/配套系统/温室降温系统.jpg',
  '/images/photo/配套系统/温室喷灌系统.jpg', '/images/photo/设备配件/温室配件1.jpg',
];

function ProductImage({ src, fallback, alt }) {
  const [failed, setFailed] = useState(false);
  return <img src={!failed && src ? src : fallback} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"/>;
}

export default function ProductsPage() {
  const { t } = useTranslation('common');
  const { locale = 'zh' } = useRouter();
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

  const cats = ['all','tech','system','parts'].map((slug, index) => ({ id:index, slug, name:t(`products.categories.${slug}`) }));

  const filterList = activeCat === 'all' ? list : list.filter(item => (item.category_slug || item.category) === activeCat);

  return (
    <Layout title={`${t('products.title')} - ${t('company.name')}`} description={t('products.subtitle')} keywords="温室设备,温室大棚,温室骨架,温室配件,连栋温室">
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
              {filterList.map((item, index) => (
                <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <ProductImage src={item.cover} fallback={PRODUCT_IMAGES[index % PRODUCT_IMAGES.length]} alt={getTxt(item, 'name')}/>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-2 line-clamp-1">{getTxt(item, 'name')}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-4 min-h-[40px]">{getTxt(item, 'desc')}</p>
                    <Link href={`/products/${item.slug}`} locale={locale} className="inline-flex items-center text-primary-600 text-sm font-medium hover:underline">
                      {t('common.details')}
                      <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
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
