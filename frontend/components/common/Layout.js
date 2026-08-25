import Head from 'next/head';
import Navbar from './Navbar';

export default function Layout({ children, title, description, keywords, transparent = false }) {
  return (
    <>
      <Head>
        <title>{title || '京阳温室科技'}</title>
        <meta name="description" content={description || '专业温室设计、生产、安装一站式服务商'} />
        <meta name="keywords" content={keywords || '温室建造,玻璃温室,薄膜温室,日光温室,山东温室'} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar transparent={transparent} />

      <main>{children}</main>
    </>
  );
}