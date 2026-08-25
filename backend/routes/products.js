/**
 * 产品路由 - /api/products
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// 静态兜底数据（数据库无数据时使用）
const FALLBACK_PRODUCTS = [
  { slug:'wenlo-glass',    category:'tech',   name:'文洛型玻璃温室',    description:'主体采用热镀锌钢骨架，浮法玻璃覆盖，透光率>97%，外形美观，可配套全自动环控系统。', price_per_sqm:500, sort_order:1 },
  { slug:'pc-panel',       category:'tech',   name:'阳光板温室（PC板）', description:'冷轧热镀锌骨架，PC聚碳酸酯中空板，采光好、强度高、防结露，性价比高。',     price_per_sqm:350, sort_order:2 },
  { slug:'solar-room',     category:'tech',   name:'日光温室',          description:'保温效果极佳，投资低，北方越冬首选，可配套自动卷帘、遮阳、喷灌系统。',     price_per_sqm:280, sort_order:3 },
  { slug:'film-multispan', category:'tech',   name:'薄膜连栋温室',       description:'多跨连体结构，PO膜覆盖，土地利用率高，造价经济，适合大规模蔬菜瓜果种植。', price_per_sqm:200, sort_order:4 },
  { slug:'single-arch',    category:'tech',   name:'单体拱棚（椭圆管棚）',description:'结构简单，造价低廉，搭建灵活，适合各类作物种植和畜牧养殖。',             price_per_sqm:120, sort_order:5 },
  { slug:'cooling-sys',    category:'system', name:'温室降温系统',       description:'湿帘+风机系统，降温效率≥80%，3C认证风机，进口轴承，运行安静节能。',      price_per_sqm:0,   sort_order:6 },
  { slug:'heating-sys',    category:'system', name:'温室升温系统',       description:'锅炉/暖风机系列，循环燃烧高效节能，物联网自动化水温管理，全自动运行。',    price_per_sqm:0,   sort_order:7 },
  { slug:'irrigation-sys', category:'system', name:'温室喷灌系统',       description:'水肥一体化管理，喷灌/微灌/滴灌三种模式，自动定时灌溉，节水高效。',        price_per_sqm:0,   sort_order:8 },
  { slug:'lighting-sys',   category:'system', name:'温室补光系统',       description:'LED/高压钠灯可选，冬春补光防减产，自动光照感应联动，节能长寿命。',        price_per_sqm:0,   sort_order:9 },
  { slug:'seedbed-sys',    category:'system', name:'苗床系统',           description:'铝合金边框，热镀锌网面，空间利用率≥90%，承重≥150kg/㎡，固定/移动可选。', price_per_sqm:0,  sort_order:10 },
  { slug:'core-parts',     category:'parts',  name:'温室核心作业与环境调控配件', description:'电力运输车、播种机、卷膜器、拉幕电机等，覆盖温室生产全流程。',     price_per_sqm:0,  sort_order:11 },
  { slug:'struct-parts',   category:'parts',  name:'温室配套材料与结构件',description:'托幕线、保温棉被、遮阳网、卡膜箍、湿帘、风机等齐全配套材料。',          price_per_sqm:0,  sort_order:12 },
  { slug:'heat-drive-parts',category:'parts', name:'温室供暖与传动配件', description:'暖风炉、齿条、钢材等配件，精准调控温室温度与传动系统。',                 price_per_sqm:0,  sort_order:13 },
];

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { lang = 'zh', category } = req.query;
    let sql = `
      SELECT p.id, p.slug, p.category, p.category AS category_slug,
             p.cover_image, p.cover_image AS cover, p.price_per_sqm, p.sort_order, p.is_active,
             COALESCE(pt.name, zh.name, p.slug) AS name,
             COALESCE(pt.description, zh.description) AS description,
             COALESCE(pt.description, zh.description) AS desc,
             COALESCE(pt.features, zh.features) AS features, COALESCE(pt.specs, zh.specs) AS specs
      FROM products p
      LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.lang = $1
      LEFT JOIN product_translations zh ON p.id = zh.product_id AND zh.lang = 'zh'
      WHERE p.is_active = true`;
    const params = [lang];
    if (category) { params.push(category); sql += ` AND p.category = $${params.length}`; }
    sql += ' ORDER BY p.sort_order';

    const { rows } = await query(sql, params);

    if (rows.length === 0) {
      // 数据库无数据，返回兜底数据
      let filtered = FALLBACK_PRODUCTS;
      if (category) filtered = FALLBACK_PRODUCTS.filter(p => p.category === category);
      return res.json({ data: filtered, source: 'fallback' });
    }
    return res.json({ data: rows });
  } catch (err) {
    console.error('Products error:', err.message);
    let filtered = FALLBACK_PRODUCTS;
    if (req.query.category) filtered = FALLBACK_PRODUCTS.filter(p => p.category === req.query.category);
    return res.json({ data: filtered, source: 'fallback' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const lang = req.query.lang || 'zh';
    const { rows } = await query(`
      SELECT p.*, COALESCE(pt.name,zh.name,p.slug) name,
             COALESCE(pt.description,zh.description) description,
             COALESCE(pt.features,zh.features) features, COALESCE(pt.specs,zh.specs) specs
      FROM products p
      LEFT JOIN product_translations pt ON p.id=pt.product_id AND pt.lang=$1
      LEFT JOIN product_translations zh ON p.id=zh.product_id AND zh.lang='zh'
      WHERE p.slug=$2 AND p.is_active=true`, [lang, req.params.slug]);

    if (rows.length === 0) {
      const fb = FALLBACK_PRODUCTS.find(p => p.slug === req.params.slug);
      if (fb) return res.json({ data: fb });
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ data: rows[0] });
  } catch (err) {
    const fb = FALLBACK_PRODUCTS.find(p => p.slug === req.params.slug);
    if (fb) return res.json({ data: fb, source: 'fallback' });
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
