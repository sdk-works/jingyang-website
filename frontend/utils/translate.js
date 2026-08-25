// 免费自动翻译 API ｜ 防跨域、容错、超时降级
export async function autoTranslate(text, targetLang) {
  if (!text || typeof text !== 'string') return text;
  if (targetLang === 'zh') return text.trim();

  const trimText = text.trim();
  if (trimText.length === 0) return text;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimText)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('translate fail');
    const data = await res.json();
    const result = data[0]?.map(item => item[0])?.join('') || trimText;
    return result;
  } catch (err) {
    return trimText;
  }
}

// 网站语言 → 翻译API语言 映射
export const langMap = {
  en: 'en',
  ru: 'ru',
  ar: 'ar',
};