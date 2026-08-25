import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';
import { useRouter } from 'next/router';

const FALLBACK = [
  { id:'1', slug:'greenhouse-tech-2024',  category:'tech',     title:'温室农业智能化发展趋势分析',     summary:'随着物联网、人工智能技术的快速发展，智慧温室正成为现代农业的重要方向。本文深入分析当前温室智能化发展的关键技术与市场趋势。', content:'随着物联网、人工智能技术的快速发展，智慧温室正成为现代农业的重要方向。自动化控制系统、传感器网络和大数据分析正在改变传统温室种植方式，大幅提高了生产效率和资源利用率。\n\n根据市场研究数据，中国智能温室市场规模预计在未来五年内保持年均15%以上的增长。政府对现代农业设施的持续投入，以及新型农业经营主体的不断涌现，为行业发展提供了强劲动力。\n\n京阳温室科技在多年的发展中积累了丰富的智能温室建设经验，已为多个省份的种植基地提供了完整的智能化解决方案。', published_at:'2024-01-15', views:328 },
  { id:'2', slug:'film-greenhouse-guide', category:'tech',     title:'薄膜连栋温室选材与安装要点',     summary:'薄膜连栋温室因其低成本、大跨度的优势广受欢迎。本文详细介绍薄膜材料的选择标准、结构安装要点及日常维护方法，帮助用户避免常见问题。', content:'薄膜连栋温室是目前国内应用最广泛的温室类型之一，具有建设成本低、施工速度快、采光效果好等优点。\n\n在薄膜材料的选择上，建议优先选择防紫外线、防雾滴的PO膜（聚烯烃）材料，使用寿命可达3-5年，远优于普通PE膜。\n\n安装过程中需要特别注意骨架的防腐处理和节点密封，避免漏风漏雨。建议每年秋季对薄膜进行全面检查，及时修补破损处，延长使用寿命。', published_at:'2024-01-08', views:215 },
];

const CAT_COLORS = { tech:'#1565c0', industry:'#2d6a4f' };

function renderMarkdown(text) {
  if (!text) return [];
  const lines = text.split('\n');
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { elements.push({ type: 'br', key: i }); i++; continue; }
    if (line.startsWith('## ')) { elements.push({ type: 'h2', text: line.slice(3), key: i }); i++; continue; }
    if (line.startsWith('### ')) { elements.push({ type: 'h3', text: line.slice(4), key: i }); i++; continue; }
    if (line.trim() === '---') { elements.push({ type: 'hr', key: i }); i++; continue; }
    if (line.startsWith('- ')) {
      const items = [];
      while (i < lines.length && lines[i].startsWith('- ')) { items.push(lines[i].slice(2)); i++; }
      elements.push({ type: 'ul', items, key: `ul-${i}` });
      continue;
    }
    elements.push({ type: 'p', text: line, key: i });
    i++;
  }
  return elements;
}

function InlineText({ text }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return <> {parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-900">{part}</strong> : <span key={i}>{part}</span>)} </>;
}

function MarkdownContent({ content: text }) {
  const blocks = renderMarkdown(text || '');
  return (
    <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
      {blocks.map(block => {
        switch (block.type) {
          case 'h2': return <h2 key={block.key} className="text-base font-bold text-gray-900 mt-4 mb-1">{block.text}</h2>;
          case 'h3': return <h3 key={block.key} className="text-sm font-bold text-gray-800 mt-3 mb-1">{block.text}</h3>;
          case 'hr': return <hr key={block.key} className="border-gray-200 my-3"/>;
          case 'ul': return <ul key={block.key} className="list-none space-y-1 pl-2"> {block.items.map((item, j) => <li key={j} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-primary-500 mt-0.5 flex-shrink-0">•</span><InlineText text={item}/></li>)} </ul>;
          case 'br': return <div key={block.key} className="h-1"/>;
          default: return <p key={block.key}><InlineText text={block.text}/></p>;
        }
      })}
    </div>
  );
}

function ArticleImage({ article, color, className = '' }) {
  const [err, setErr] = useState(false);
  const src = article.cover_image || `/images/news/${article.slug || article.id}.jpg`;
  if (!err) return <img src={src} alt={article.title} className={`w-full h-full object-cover ${className}`} onError={() => setErr(true)}/>;
  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`} style={{ background: `linear-gradient(135deg,${color}cc,${color}66)` }}>
      <svg className="w-12 h-12 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h4v4H7V8z"/>
      </svg>
    </div>
  );
}

function ArticleModal({ article, onClose, t, getText }) {
  if (!article) return null;
  const color = CAT_COLORS[article.category] || '#2d6a4f';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="h-52 relative overflow-hidden rounded-t-2xl">
          <ArticleImage article={article} color={color} />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
          <div className="absolute bottom-4 left-6 z-10">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white bg-white/20 backdrop-blur-sm mb-2"> {article.category === 'tech' ? t('news.tech') : t('news.industry')} </span>
            <h2 className="text-xl font-bold text-white">{getText(article, 'title')}</h2>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 backdrop-blur text-white flex items-center justify-center hover:bg-black/50">✕</button>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
            <span>📅 {article.published_at?.slice(0,10) || '-'}</span>
            {article.views && <span>👁 {article.views} {t('news.views')}</span>}
          </div>
          <MarkdownContent content={getText(article, 'content') || getText(article, 'summary')} />
        </div>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { t } = useTranslation('common');
  const { locale = 'zh' } = useRouter();
  const [articles, setArticles] = useState(FALLBACK);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    axios.get('/api/articles', { params:{ lang:locale } })
      .then(res => { if (res.data?.data?.length) setArticles(res.data.data); }).catch(() => {});
  }, [locale]);

  const getText = (art, field) => art[field];

  const cats = [
    { id:'all', label: t('news.all') },
    { id:'tech', label: t('news.tech') },
    { id:'industry', label: t('news.industry') },
  ];
  const filtered = category === 'all' ? articles : articles.filter(a => a.category === category);

  return (
    <Layout title={`${t('news.title')} - 山东京阳温室科技有限公司`} description={t('news.subtitle')} keywords="温室行业资讯,智能温室技术,农业大棚新闻">
      <section className="py-16 text-white text-center" style={{ background:'linear-gradient(135deg,#1a3d2b,#2d6a4f)' }}>
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-xs tracking-widest uppercase text-green-300 mb-3">{t('news.title')}</div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ fontFamily:'Noto Serif SC,serif' }}>{t('news.subtitle')}</h1>
        </div>
      </section>
      <section className="sticky top-16 z-30 bg-white border-b shadow-sm">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 py-3">
            {cats.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.id)} className={`px-4 py-2 rounded-lg text-sm transition-all ${category === cat.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>{cat.label}</button>
            ))}
          </div>
        </div>
      </section>
      <section className="py-12 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-6">
            {filtered.map(article => {
              const color = CAT_COLORS[article.category] || '#2d6a4f';
              return (
                <article key={article.id || article.slug} onClick={() => setSelected(article)} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group">
                  <div className="h-44 overflow-hidden">
                    <ArticleImage article={article} color={color} className="group-hover:scale-105 transition-transform duration-500"/>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: color }}> {article.category === 'tech' ? t('news.tech') : t('news.industry')} </span>
                      <span className="text-xs text-gray-400">{article.published_at?.slice(0,10)}</span>
                    </div>
                    <h2 className="font-bold text-gray-900 text-base mb-2 line-clamp-2 leading-snug"> {getText(article, 'title')} </h2>
                    <p className="text-gray-500 text-sm line-clamp-2"> {getText(article, 'summary')} </p>
                  </div>
                </article>
              );
            })}
          </div>
          {filtered.length === 0 && <div className="text-center py-20 text-gray-400">{t('common.empty')}</div>}
        </div>
      </section>
      {selected && <ArticleModal article={selected} onClose={() => setSelected(null)} t={t} getText={getText} />}
    </Layout>
  );
}

export async function getStaticProps({ locale = 'zh' }) {
  return { props: { ...(await serverSideTranslations(locale, ['common'])) } };
}
