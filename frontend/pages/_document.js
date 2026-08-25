import { Html, Head, Main, NextScript } from 'next/document';

export default function Document({ __NEXT_DATA__ }) {
  const locale = __NEXT_DATA__.locale || 'zh';
  return (
    <Html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <Head />
      <body><Main /><NextScript /></body>
    </Html>
  );
}
