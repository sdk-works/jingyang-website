export default function Robots() { return null; }
export async function getServerSideProps({ req, res }) {
  const proto=req.headers['x-forwarded-proto']||'http'; const host=req.headers.host;
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  res.write(`User-agent: *\nAllow: /\nDisallow: /manage888\nDisallow: /api/\nSitemap: ${proto}://${host}/sitemap.xml\n`); res.end();
  return { props:{} };
}
