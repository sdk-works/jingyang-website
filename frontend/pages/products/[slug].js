import { useEffect,useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import axios from 'axios';
import Layout from '../../components/common/Layout';

export default function ProductDetail(){const r=useRouter(),{t}=useTranslation('common'),[item,setItem]=useState(null),[error,setError]=useState(false);
 useEffect(()=>{if(!r.query.slug)return;axios.get(`/api/products/${r.query.slug}`,{params:{lang:r.locale||'zh'}}).then(x=>setItem(x.data.data)).catch(()=>setError(true))},[r.query.slug,r.locale]);
 if(error)return <Layout title="404"><div className="pt-32 text-center">{t('common.error')}</div></Layout>;
 if(!item)return <Layout title={t('common.loading')}><div className="pt-32 text-center">{t('common.loading')}</div></Layout>;
 const features=Array.isArray(item.features)?item.features:[];
 return <Layout title={item.name} description={item.description||item.desc}><section className="pt-28 pb-16 bg-gray-50"><div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-10"><img src={item.cover||item.cover_image||'/images/photo/产品技术/文洛型玻璃温室.jpg'} alt={item.name} className="w-full rounded-2xl object-cover"/><div><h1 className="text-3xl font-bold mb-4">{item.name}</h1><p className="text-gray-600 leading-7 mb-5">{item.description||item.desc}</p>{item.price_per_sqm&&<p className="text-primary-600 text-xl font-bold mb-5">{item.price_per_sqm} {t('common.cny')}/{t('common.sqm')}</p>}<ul className="space-y-2">{features.map((x,i)=><li key={i}>✓ {x}</li>)}</ul><a href="/contact" className="inline-block mt-8 px-6 py-3 bg-primary-600 text-white rounded-xl">{t('products.consult')}</a></div></div></section></Layout>}
export async function getServerSideProps({locale='zh'}){return{props:{...(await serverSideTranslations(locale,['common']))}}}
