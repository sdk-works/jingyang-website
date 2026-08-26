/**
 * 文章/新闻路由 - /api/articles
 */
const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

const FALLBACK_ARTICLES = [
  { slug:'greenhouse-trends-2024', category:'news', title:'2024年温室行业发展趋势分析', summary:'随着农业现代化进程加快，智能温室、节能温室成为行业热点，我国温室面积持续增长。', published_at:'2024-03-15', view_count:128 },
  { slug:'wenlo-greenhouse-guide', category:'tech', title:'文洛型玻璃温室设计建造要点详解', summary:'文洛型温室是目前国际上最成熟的温室结构形式之一，本文详解其设计要点和建造注意事项。', published_at:'2024-02-20', view_count:256 },
  { slug:'winter-heating-tips',    category:'tech', title:'北方温室冬季增温保温技术指南', summary:'北方地区冬季温室保温是关键，介绍日光温室、连栋温室冬季保温增温的实用技术。', published_at:'2024-01-10', view_count:89 },
  { slug:'irrigation-water-saving',category:'tech', title:'温室水肥一体化灌溉系统节水技术', summary:'水肥一体化技术是现代温室农业的重要发展方向，可节水30%-50%，提高肥料利用率。', published_at:'2023-12-05', view_count:67 },
  { slug:'company-cases-2023',     category:'news', title:'2023年京阳温室重点项目回顾', summary:'回顾2023年公司承建的重点温室项目，涉及山东、陕西、河南等多个省份，总面积超3万平方米。', published_at:'2023-12-28', view_count:45 },
  { slug:'pv-greenhouse-intro',    category:'tech', title:'光伏温室：农业与新能源的完美结合', summary:'光伏温室通过在温室顶部铺设光伏板，实现农业种植与清洁能源发电双重效益。', published_at:'2023-11-15', view_count:203 },
];

// GET /api/articles
router.get('/', async (req, res) => {
  try {
    const { lang='zh', category } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const offset = (page-1) * limit;
    const params = [lang];
    let sql = `
      SELECT a.id, a.slug, a.cover_image, a.category, a.published_at, a.view_count,
             a.view_count AS views, COALESCE(at.title,zh.title,a.slug) title,
             COALESCE(at.summary,zh.summary) summary, COALESCE(at.content,zh.content) content
      FROM articles a
      LEFT JOIN article_translations at ON a.id=at.article_id AND at.lang=$1
      LEFT JOIN article_translations zh ON a.id=zh.article_id AND zh.lang='zh'
      WHERE a.is_published=true`;
    if (category) { params.push(category); sql += ` AND a.category=$${params.length}`; }
    sql += ` ORDER BY a.published_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);

    const { rows } = await query(sql, params);
    const countRes = await query(`SELECT COUNT(*) FROM articles WHERE is_published=true${category?' AND category=$1':''}`,
      category ? [category] : []);

    if (rows.length === 0) {
      let fb = FALLBACK_ARTICLES;
      if (category) fb = fb.filter(a => a.category === category);
      return res.json({ data: fb, total: fb.length, source:'fallback' });
    }
    return res.json({ data: rows, total: +countRes.rows[0].count, page:+page });
  } catch (err) {
    console.error('Articles error:', err.message);
    return res.json({ data: FALLBACK_ARTICLES, total: FALLBACK_ARTICLES.length, source:'fallback' });
  }
});

// GET /api/articles/:slug
router.get('/:slug', async (req, res) => {
  try {
    const lang = req.query.lang || 'zh';
    const { rows } = await query(`
      SELECT a.*, COALESCE(at.title,zh.title,a.slug) title,
             COALESCE(at.summary,zh.summary) summary, COALESCE(at.content,zh.content) content,
             COALESCE(at.meta_title,zh.meta_title) meta_title,
             COALESCE(at.meta_description,zh.meta_description) meta_description
      FROM articles a LEFT JOIN article_translations at ON a.id=at.article_id AND at.lang=$1
      LEFT JOIN article_translations zh ON a.id=zh.article_id AND zh.lang='zh'
      WHERE a.slug=$2 AND a.is_published=true`, [lang, req.params.slug]);

    if (rows.length > 0) {
      await query('UPDATE articles SET view_count=view_count+1 WHERE id=$1', [rows[0].id]).catch(()=>{});
      return res.json({ data: rows[0] });
    }
    const fb = FALLBACK_ARTICLES.find(a => a.slug === req.params.slug);
    if (fb) return res.json({ data: fb });
    return res.status(404).json({ error: 'Article not found' });
  } catch (err) {
    const fb = FALLBACK_ARTICLES.find(a => a.slug === req.params.slug);
    if (fb) return res.json({ data: fb, source:'fallback' });
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
