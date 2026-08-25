import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import axios from 'axios';

const PRODUCT_IMAGES = {
  'glass-greenhouse': 'bg-gradient-to-br from-blue-100 to-cyan-100',
  'film-greenhouse': 'bg-gradient-to-br from-yellow-100 to-orange-100',
  'pc-greenhouse': 'bg-gradient-to-br from-purple-100 to-pink-100',
  'multi-span-greenhouse': 'bg-gradient-to-br from-gray-100 to-slate-100',
  'smart-greenhouse': 'bg-gradient-to-br from-green-100 to-emerald-100'
};

const EMOJI_MAP = {
  glass: '🏛️', film: '🏕️', pc: '🏠', 'multi-span': '🏭', smart: '🤖'
};

export default function ProductsSection() {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get(`/api/products?lang=${locale}`)
      .then(r => setProducts(r.data.data || []))
      .catch(() => setProducts(getFallbackProducts()));
  }, [locale]);

  const getFallbackProducts = () => [
    { slug: 'glass-greenhouse', category: 'glass', price_per_sqm: 500, name: t('products.categories.glass') },
    { slug: 'film-greenhouse', category: 'film', price_per_sqm: 120, name: t('products.categories.film') },
    { slug: 'pc-greenhouse', category: 'pc', price_per_sqm: 350, name: t('products.categories.pc') },
    { slug: 'multi-span-greenhouse', category: 'multi-span', price_per_sqm: 280, name: t('products.categories.multi-span') },
    { slug: 'smart-greenhouse', category: 'smart', price_per_sqm: 650, name: t('products.categories.smart') }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <span className="text-primary-600 font-semibold text-sm tracking-wider uppercase">Products & Services</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-2">{t('products.title')}</h2>
            <p className="text-gray-500 mt-3 max-w-xl">{t('products.subtitle')}</p>
          </div>
          <Link href="/products" className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 border border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
            {t('products.view_all')}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {(products.length ? products : getFallbackProducts()).map((product, i) => (
            <div key={product.slug} className="product-card bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 reveal" style={{ transitionDelay: `${i * 0.08}s` }}>
              {/* Product Image Placeholder */}
              <div className={`${PRODUCT_IMAGES[product.slug] || 'bg-gray-100'} h-48 flex items-center justify-center`}>
                {product.cover_image ? (
                  <img src={product.cover_image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center">
                    <span className="text-6xl">{EMOJI_MAP[product.category]}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{product.name}</h3>
                  {product.price_per_sqm && (
                    <span className="text-sm font-semibold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg whitespace-nowrap">
                      ¥{product.price_per_sqm}{t('products.price_unit')}
                    </span>
                  )}
                </div>
                
                {product.description && (
                  <p className="text-gray-500 text-sm leading-relaxed mb-4 line-clamp-2">{product.description}</p>
                )}

                <div className="flex gap-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="flex-1 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 transition-colors text-center"
                  >
                    {t('products.view_detail')}
                  </Link>
                  <Link
                    href="/contact"
                    className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm rounded-xl hover:border-primary-300 hover:text-primary-600 transition-colors"
                  >
                    {t('products.consult')}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="sm:hidden mt-8 text-center">
          <Link href="/products" className="inline-flex items-center gap-2 px-5 py-2.5 border border-primary-600 text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
            {t('products.view_all')}
          </Link>
        </div>
      </div>
    </section>
  );
}
