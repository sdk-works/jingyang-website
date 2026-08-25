const CASE_CONTENT = {
  'moiftpa7-5l1j': {
    en: ['Shandong Test Company', 'Shandong', 'Test project'],
    ru: ['Тестовая компания Шаньдуна', 'Шаньдун', 'Тестовый проект'],
    ar: ['شركة شاندونغ التجريبية', 'شاندونغ', 'مشروع تجريبي'],
  },
  'shandong-sunrise-seed': {
    en: ['Shandong Sunrise Seed Co., Ltd.', 'Shandong', 'An 8,000 m² multi-span film greenhouse for vegetable breeding, equipped with cooling, supplemental lighting and irrigation systems.'],
    ru: ['Shandong Sunrise Seed Co., Ltd.', 'Шаньдун', 'Плёночная многопролётная теплица площадью 8 000 м² для селекции овощей с системами охлаждения, досветки и орошения.'],
    ar: ['شركة شاندونغ صن رايز للبذور', 'شاندونغ', 'دفيئة فيلمية متعددة البحور بمساحة 8,000 م² لتربية الخضروات، مع أنظمة تبريد وإضاءة وري.'],
  },
  'shaanxi-qianxian-veggie': {
    en: ['Qianxian Vegetable Growing Base', 'Shaanxi', 'A 5,000 m² solar greenhouse with automated curtain, heating and irrigation systems for winter vegetable production.'],
    ru: ['Овощеводческая база уезда Цяньсянь', 'Шэньси', 'Солнечная теплица площадью 5 000 м² с автоматическими шторами, отоплением и орошением для зимнего выращивания овощей.'],
    ar: ['قاعدة تشيانشيان لزراعة الخضروات', 'شنشي', 'دفيئة شمسية بمساحة 5,000 م² مزودة بستائر آلية وأنظمة تدفئة وري لإنتاج الخضروات شتاءً.'],
  },
  'liaocheng-zhengxin': {
    en: ['Liaocheng Zhengxin Food Drying Base', 'Liaocheng, Shandong', 'A 12,000 m² multi-span film structure designed for food drying, with excellent ventilation and daylight.'],
    ru: ['Сушильная база Liaocheng Zhengxin', 'Ляочэн, Шаньдун', 'Многопролётная плёночная конструкция площадью 12 000 м² для сушки пищевой продукции с хорошей вентиляцией и освещением.'],
    ar: ['قاعدة لياوتشنغ تشنغشين للتجفيف', 'لياوتشنغ، شاندونغ', 'منشأة فيلمية متعددة البحور بمساحة 12,000 م² لتجفيف المنتجات الغذائية بتهوية وإضاءة طبيعية ممتازتين.'],
  },
  'liaocheng-ruitai': {
    en: ['Liaocheng Ruitai Agricultural Products Base', 'Liaocheng, Shandong', 'A 6,000 m² Venlo glass greenhouse for premium flowers and vegetables, with shading, cooling and fertigation systems.'],
    ru: ['База Liaocheng Ruitai Agricultural Products', 'Ляочэн, Шаньдун', 'Стеклянная теплица Venlo площадью 6 000 м² для цветов и овощей с затенением, охлаждением и фертигацией.'],
    ar: ['قاعدة لياوتشنغ رويتاي للمنتجات الزراعية', 'لياوتشنغ، شاندونغ', 'دفيئة زجاجية من طراز فينلو بمساحة 6,000 م² للزهور والخضروات مع أنظمة تظليل وتبريد وتسميد بالري.'],
  },
  'henan-youlin': {
    en: ['Henan Youlin Greenhouse Growing Base', 'Henan', 'A 4,000 m² multi-span film greenhouse for fruit and vegetable production, equipped with cooling, lighting and irrigation systems.'],
    ru: ['Тепличная база Henan Youlin', 'Хэнань', 'Многопролётная плёночная теплица площадью 4 000 м² для овощей и фруктов с охлаждением, досветкой и орошением.'],
    ar: ['قاعدة خنان يولين للزراعة المحمية', 'خنان', 'دفيئة فيلمية متعددة البحور بمساحة 4,000 م² لإنتاج الفاكهة والخضروات مع أنظمة تبريد وإضاءة وري.'],
  },
};

export const CASE_IMAGES = [
  '/images/photo/工程案例/案例01.jpg', '/images/photo/工程案例/案例02.jpg',
  '/images/photo/工程案例/案例03.jpg', '/images/photo/工程案例/案例05.jpg',
  '/images/photo/工程案例/案例06.jpg', '/images/photo/工程案例/案例07.jpg',
];

export function localizeCase(item, locale) {
  if (!item || locale === 'zh') return item;
  // 数据库已有目标语言译文时直接使用；这里只为尚未补译的历史中文数据兜底。
  if (item.title && !/[\u3400-\u9fff]/.test(item.title)) return item;
  const text = CASE_CONTENT[item.slug]?.[locale];
  if (!text) return item;
  return { ...item, title: text[0], address: text[1], province: text[1], desc: text[2], description: text[2] };
}
