/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 启用Next.js多语言路由（核心：解决切换后无变化）
  i18n: {
    locales: ['zh', 'en', 'ru', 'ar'], // 你的语言列表
    defaultLocale: 'zh', // 默认中文
    localeDetection: false, // 关闭自动检测
  },

  // 保留你原有接口转发配置
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4001'}/api/:path*`
      },
      {
        source: '/uploads/:path*',
        destination: `${process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4001'}/uploads/:path*`
      }
    ]
  }
}

module.exports = nextConfig;
