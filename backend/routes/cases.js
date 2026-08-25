/**
 * 工程案例路由 - /api/cases
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

// 修复后的完整案例数据（无语法错误）
const CASES = [
  { slug:'shandong-sunrise-seed', country:'中国', province:'山东省', area:8000, greenhouse_type:'薄膜连栋温室', title:'山东旭日种业有限公司', description:'承建薄膜连栋温室8000平方米，采用热镀锌骨架+PO膜覆盖，配套降温、补光、喷灌系统，主要用于蔬菜育种，获客户高度好评。', completion_date:'2023-06-01', sort_order:1 },
  { slug:'shaanxi-qianxian-veggie', country:'中国', province:'陕西省', area:5000, greenhouse_type:'日光温室', title:'陕西省乾县阳洪蔬菜种植基地', description:'日光温室5000平方米，配套自动卷帘、升温、喷灌系统，主要用于冬季蔬菜越冬生产，有效解决当地冬季蔬菜供应问题。', completion_date:'2023-03-01', sort_order:2 },
  { slug:'liaocheng-zhengxin', country:'中国', province:'山东聊城', area:12000, greenhouse_type:'薄膜连栋温室', title:'聊城市正信味业晒棚生产基地', description:'大型晒棚生产基地12000平方米，薄膜连栋结构，通风采光优良，满足调味品晾晒生产需求，项目按时交付。', completion_date:'2022-10-01', sort_order:3 },
  { slug:'liaocheng-ruitai', country:'中国', province:'山东聊城', area:6000, greenhouse_type:'玻璃温室', title:'聊城市瑞泰农产品有限公司基地', description:'文洛型玻璃温室6000平方米，配套全套内外遮阳、湿帘降温、水肥一体化系统，用于高端花卉和蔬菜种植。', completion_date:'2022-05-01', sort_order:4 },
  { slug:'henan-youlin', country:'中国', province:'河南省', area:4000, greenhouse_type:'薄膜连栋温室', title:'河南省佑林事业温室种植基地', description:'薄膜连栋温室4000平方米，配套降温、补光、喷灌系统，用于蔬菜和水果种植，客户对质量和工期均表示满意。', completion_date:'2023-08-01', sort_order:5 }
];

// GET /api/cases
router.get('/', async (req, res) => {
  try {
    const { lang='zh', greenhouse_type } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page-1) * limit;
    const params = [lang];
    let sql = `
      SELECT c.id, c.slug, c.country, c.province, c.province AS address, c.area, c.greenhouse_type,
             c.cover_image, c.cover_image AS cover, c.images, c.completion_date, c.sort_order,
             COALESCE(ct.title, zh.title, c.slug) AS title,
             COALESCE(ct.description, zh.description) AS description,
             COALESCE(ct.description, zh.description) AS "desc",
             COALESCE(ct.highlights, zh.highlights) AS highlights
      FROM cases c
      LEFT JOIN case_translations ct ON c.id=ct.case_id AND ct.lang=$1
      LEFT JOIN case_translations zh ON c.id=zh.case_id AND zh.lang='zh'
      WHERE c.is_active=true`;

    if (greenhouse_type) {
      params.push(greenhouse_type);
      sql += ` AND c.greenhouse_type=$${params.length}`;
    }

    sql += ` ORDER BY c.sort_order LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM cases WHERE is_active=true${greenhouse_type ? ' AND greenhouse_type=$1' : ''}`,
      greenhouse_type ? [greenhouse_type] : []);

    if (rows.length === 0) {
      return res.json({ data: CASES, total: CASES.length, page:+page, source:'fallback' });
    }
    return res.json({ data: rows, total: +countRes.rows[0].count, page: +page });
  } catch (err) {
    console.error('Cases error:', err.message);
    return res.json({ data: CASES, total: CASES.length, page: 1, source:'fallback' });
  }
});

// GET /api/cases/:slug
router.get('/:slug', async (req, res) => {
  try {
    const lang = req.query.lang || 'zh';
    const { rows } = await query(`
      SELECT c.*, COALESCE(ct.title,zh.title,c.slug) title,
             COALESCE(ct.description,zh.description) description,
             COALESCE(ct.highlights,zh.highlights) highlights
      FROM cases c LEFT JOIN case_translations ct ON c.id=ct.case_id AND ct.lang=$1
      LEFT JOIN case_translations zh ON c.id=zh.case_id AND zh.lang='zh'
      WHERE c.slug=$2 AND c.is_active=true`, [lang, req.params.slug]);

    if (rows.length === 0) {
      const fb = CASES.find(c => c.slug === req.params.slug);
      if (fb) return res.json({ data: fb });
      return res.status(404).json({ error: 'Case not found' });
    }
    return res.json({ data: rows[0] });
  } catch (err) {
    const fb = CASES.find(c => c.slug === req.params.slug);
    if (fb) return res.json({ data: fb, source:'fallback' });
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
