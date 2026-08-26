export default function Sitemap() { return null; }
export async function getServerSideProps({ req, res }) {
  const proto=req.headers['x-forwarded-proto']||'http'; const origin=`${proto}://${req.headers.host}`;
  const pages=['','about','products','cases','news','calculator','contact'];
  const locales=['','en','ru','ar'];
  const urls=locales.flatMap(locale=>pages.map(page=>`${origin}/${[locale,page].filter(Boolean).join('/')}`));
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(x=>`<url><loc>${x}</loc></url>`).join('')}</urlset>`;
  res.setHeader('Content-Type','application/xml; charset=utf-8'); res.write(xml); res.end();
  return { props:{} };
}
