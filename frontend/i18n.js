import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 手动导入你的翻译文件（本地加载，无需http后端）
import commonZH from './public/locales/zh/common.json';
import commonEN from './public/locales/en/common.json';
import commonRU from './public/locales/ru/common.json';
import commonAR from './public/locales/ar/common.json';

// 核心初始化：只保留必须的配置，无多余依赖
i18n
  .use(initReactI18next) // 仅关联react-i18next
  .init({
    fallbackLng: 'zh', // 默认中文
    debug: false, // 关闭调试
    interpolation: {
      escapeValue: false, // React已自动转义
    },
    // 直接加载本地翻译文件
    resources: {
      zh: { common: commonZH },
      en: { common: commonEN },
      ru: { common: commonRU },
      ar: { common: commonAR },
    },
    ns: ['common'],
    defaultNS: 'common',
  });

export default i18n;