import { useState } from 'react';
import Layout from '../components/common/Layout';
import Link from 'next/link';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

const COMPANY = {
  phone1: '152-7589-8666',
  phone2: '152-7589-8779',
  email: 'jingyangwenshikeji@163.com'
};

function AutoImg({ src, alt, fallbackIcon, className = '' }) {
  const [err, setErr] = useState(false);
  if (!err) return <img src={src} alt={alt} className={className} onError={() => setErr(true)} />;
  return (
    <div className={`flex items-center justify-center ${className}`} style={{ background: '#1a3d2b' }}>
      <span className="text-3xl opacity-50">{fallbackIcon || '🌿'}</span>
    </div>
  );
}

export async function getStaticProps({ locale = 'zh' }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}

export default function HomePage() {
  const [showModal, setShowModal] = useState(false);

  const PRODUCTS = [
    { slug: 'wenlo-glass', name: '文洛型玻璃温室', icon: '🏗️', color: '#1565c0', price: 500 },
    { slug: 'pc-panel', name: '阳光板温室', icon: '☀️', color: '#2d6a4f', price: 350 },
    { slug: 'solar-room', name: '日光温室', icon: '🌱', color: '#558b2f', price: 280 },
    { slug: 'film-multispan', name: '薄膜连栋温室', icon: '🏛️', color: '#e65100', price: 200 },
  ];

  const CASES = [
    { slug: 'shandong-sunrise-seed', title: '山东旭日种业有限公司', province: '山东省', type: '薄膜连栋温室', area: 8000 },
    { slug: 'liaocheng-ruitai', title: '聊城市瑞泰农产品基地', province: '山东聊城', type: '玻璃温室', area: 6000 },
    { slug: 'shaanxi-qianxian-veggie', title: '陕西乾县蔬菜基地', province: '陕西省', type: '日光温室', area: 5000 },
  ];

  return (
    <Layout title="山东京阳温室科技有限公司"
      description="专业温室设计、生产、安装一站式服务商。"
      keywords="温室建造,玻璃温室,薄膜温室,日光温室,山东温室"
    >
      {/* 首页 Banner */}
      <section className="relative min-h-[90vh] flex items-center text-white" style={{ background: 'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="absolute inset-0">
          <AutoImg src="/images/home/hero-bg.jpg" alt="banner" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            专业温室工程<br />
            <span className="text-green-400">设计与建造服务商</span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl mb-8">
            集研发、设计、生产、施工、服务于一体，技术成熟，案例丰富。
          </p>
          <div className="flex gap-4">
            <Link href="/cases" className="px-6 py-3 bg-green-600 text-white rounded-xl">
              查看案例
            </Link>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 border border-white/40 text-white rounded-xl">
              立即咨询
            </button>
          </div>
        </div>
      </section>

      {/* 产品 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">核心产品</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PRODUCTS.map(p => (
              <div key={p.slug} className="bg-white rounded-xl shadow p-4">
                <div className="h-32 rounded-lg mb-3 flex items-center justify-center" style={{ background: p.color }}>
                  <span className="text-3xl text-white">{p.icon}</span>
                </div>
                <h3 className="font-bold text-center">{p.name}</h3>
                <p className="text-sm text-gray-500 text-center mt-1">{p.price} 元/㎡</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案例 */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold">工程案例</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {CASES.map(c => (
              <div key={c.slug} className="bg-gray-100 rounded-xl overflow-hidden">
                <div className="h-40 bg-gray-200"></div>
                <div className="p-4">
                  <h3 className="font-bold">{c.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{c.province} | {c.type} | {c.area}㎡</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}


