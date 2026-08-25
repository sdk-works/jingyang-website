import '../styles/globals.css';
// 新增：引入i18n初始化文件（下一步会创建）
import '../i18n';
import { appWithTranslation } from 'next-i18next';
import { Toaster } from 'react-hot-toast';
import Head from 'next/head';

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Component {...pageProps} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 20px'
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' }
          }
        }}
      />
    </>
  );
}

export default appWithTranslation(App);