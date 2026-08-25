/**
 * next-i18next 多语言配置
 *
 * 当前支持语言：
 *   zh（中文，默认）  → public/locales/zh/common.json
 *   en（英文）        → public/locales/en/common.json
 *   ru（俄文）        → public/locales/ru/common.json
 *   ar（阿拉伯文）    → public/locales/ar/common.json（RTL 从右到左）
 *
 * 新增语言步骤：
 *   1. 在下方 locales 数组中添加语言代码，如 'fr'
 *   2. 复制 public/locales/zh/common.json 到 public/locales/fr/common.json
 *   3. 翻译 fr/common.json 中所有文本值
 *   4. 在 Navbar.js 的 LANGUAGES 数组中添加 { code:'fr', label:'Français', flag:'🇫🇷' }
 *   5. 重新构建：npm run build
 *
 * 修改已有翻译：
 *   直接编辑对应语言文件夹内的 common.json，保存后重启服务即可生效
 *
 * 语言文件结构：
 *   common.json 分为以下区块（对应页面/功能模块）：
 *   nav / hero / products / calculator / contact / cases / about / news / footer / common
 */
module.exports = {
  i18n: {
    defaultLocale: 'zh',                     // 默认语言
    locales: ['zh', 'en', 'ru', 'ar'],       // 支持的语言列表
    localeDetection: false,                   // 关闭自动检测（防止覆盖用户手动切换的语言）
  },
  localePath: './public/locales',            // 语言包存放目录
  reloadOnPrerender: process.env.NODE_ENV === 'development',  // 开发环境修改语言文件后自动刷新
};
