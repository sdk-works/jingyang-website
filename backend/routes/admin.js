/**
 * 管理员路由 - /api/admin
 * v4 修复：
 * - GET products/cases/articles 直接返回 name/title 字段（修复编辑时为空 bug）
 * - 新增操作日志 audit_logs
 * - stats 增加本月、本周咨询数
 * - 已下架产品也在列表中显示（带状态标记）
 * - GET products 支持 ?include_inactive=true
 */
const express   = require('express');
const router    = express.Router();
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const multer    = require('multer');
const path      = require('path');
const fs        = require('fs');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticate, requireRole, ROLES } = require('../middleware/auth');
const XLSX      = require('xlsx');

// ── 图片上传配置 ──────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = new Map([
      ['.jpg', ['image/jpeg']], ['.jpeg', ['image/jpeg']], ['.png', ['image/png']],
      ['.gif', ['image/gif']], ['.webp', ['image/webp']], ['.mp4', ['video/mp4']],
      ['.mov', ['video/quicktime']], ['.avi', ['video/x-msvideo']],
    ]);
    if (allowed.get(ext)?.includes(file.mimetype)) cb(null, true);
    else cb(new Error('仅支持图片（JPG/PNG/GIF/WebP）和视频（MP4/MOV/AVI）'));
  },
});

// ── 操作日志 ──────────────────────────────────────────────
async function auditLog(req, action, resource, resourceId, detail) {
  try {
    await query(
      'INSERT INTO audit_logs(user_id,username,action,resource,resource_id,detail,ip_address) VALUES($1,$2,$3,$4,$5,$6,$7)',
      [req.user?.id, req.user?.username, action, resource, resourceId?.toString(), detail,
       req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress]
    );
  } catch {} // 日志失败不影响主流程
}

// ── 权限中间件 ────────────────────────────────────────────
const requireSuperAdmin = (req, res, next) => {
  if (req.user?.role !== 'superadmin') return res.status(403).json({ error: '需要超级管理员权限' });
  next();
};

// ──────────────────────────────────────────────────────────
// POST /api/admin/login
// ──────────────────────────────────────────────────────────
router.post('/login', [
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: '请填写用户名和密码' });

    const { username, password } = req.body;
    const result = await query(
      'SELECT * FROM users WHERE (username=$1 OR email=$1) AND is_active=true', [username]
    );
    if (result.rows.length === 0) return res.status(401).json({ error: '用户名或密码错误' });

    const user = result.rows[0];
    let valid = false;
    try { valid = await bcrypt.compare(password, user.password_hash); } catch {}
    if (!valid && process.env.NODE_ENV !== 'production') valid = (password === user.password_hash);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

    await query('UPDATE users SET last_login=NOW() WHERE id=$1', [user.id]);
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(503).json({ error: '认证服务未配置' });
    const token  = jwt.sign(
      { userId: user.id, role: user.role, username: user.username },
      secret, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    return res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// ──────────────────────────────────────────────────────────
// GET /api/admin/stats  — 增加本月/本周
// ──────────────────────────────────────────────────────────
router.get('/stats', authenticate, async (req, res) => {
  try {
    const [contacts, products, cases, articles, recent, monthly, weekly] = await Promise.all([
      query("SELECT COUNT(*) total, COUNT(*) FILTER(WHERE status='new') new_count FROM contacts"),
      query("SELECT COUNT(*) total FROM products WHERE is_active=true"),
      query("SELECT COUNT(*) total FROM cases WHERE is_active=true"),
      query("SELECT COUNT(*) total FROM articles WHERE is_published=true"),
      query("SELECT id,name,country,greenhouse_type,area,phone,email,status,created_at FROM contacts ORDER BY created_at DESC LIMIT 8"),
      query("SELECT COUNT(*) total FROM contacts WHERE created_at >= date_trunc('month', NOW())"),
      query("SELECT COUNT(*) total FROM contacts WHERE created_at >= NOW() - INTERVAL '7 days'"),
    ]);
    res.json({
      contacts: {
        total:   +contacts.rows[0].total,
        new:     +contacts.rows[0].new_count,
        monthly: +monthly.rows[0].total,
        weekly:  +weekly.rows[0].total,
      },
      products: +products.rows[0].total,
      cases:    +cases.rows[0].total,
      articles: +articles.rows[0].total,
      recentContacts: recent.rows,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 咨询管理
// ──────────────────────────────────────────────────────────
router.get('/contacts', authenticate, async (req, res) => {
  try {
    const { page=1, limit=20, status, search } = req.query;
    const offset = (page-1) * limit;
    const params = [], conds = [];
    if (status) { params.push(status); conds.push(`status=$${params.length}`); }
    if (search) {
      params.push(`%${search}%`);
      const n = params.length;
      conds.push(`(name ILIKE $${n} OR email ILIKE $${n} OR phone ILIKE $${n})`);
    }
    const where = conds.length ? 'WHERE '+conds.join(' AND ') : '';
    params.push(limit, offset);
    const [rows, count] = await Promise.all([
      query(`SELECT * FROM contacts ${where} ORDER BY created_at DESC LIMIT $${params.length-1} OFFSET $${params.length}`, params),
      query(`SELECT COUNT(*) FROM contacts ${where}`, params.slice(0,-2)),
    ]);
    res.json({ data: rows.rows, total: +count.rows[0].count, page: +page, limit: +limit });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.get('/contacts/export', authenticate, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM contacts ORDER BY created_at DESC');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, '咨询记录');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch { res.status(500).json({ error: 'Export failed' }); }
});

router.patch('/contacts/:id/status', authenticate, requireRole(ROLES.MANAGE), async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE contacts SET status=$1,updated_at=NOW() WHERE id=$2', [status, req.params.id]);
    await auditLog(req, 'update', 'contacts', req.params.id, `状态改为 ${status}`);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.delete('/contacts/:id', authenticate, requireRole(ROLES.MANAGE), async (req, res) => {
  try {
    await query('DELETE FROM contacts WHERE id=$1', [req.params.id]);
    await auditLog(req, 'delete', 'contacts', req.params.id, '删除咨询');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 图片/媒体上传
// POST /api/admin/upload
// ──────────────────────────────────────────────────────────
router.post('/upload', authenticate, requireRole(ROLES.EDIT), (req, res, next) => {
  // 使用自定义中间件包裹 multer，捕获文件类型/大小错误并返回友好提示
  upload.single('file')(req, res, (err) => {
    if (err) {
      // multer 校验失败（文件类型不对、文件过大）
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: '文件过大，最大支持 8MB' });
      }
      if (err.message) {
        return res.status(400).json({ error: err.message });
      }
      return res.status(400).json({ error: '文件上传失败，请检查文件格式' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的文件' });
    }
    const url = `/uploads/${req.file.filename}`;
    auditLog(req, 'upload', 'media', req.file.filename, `上传文件 ${req.file.originalname}`).catch(() => {});
    res.json({ success: true, url, filename: req.file.filename, size: req.file.size });
  });
});

// ──────────────────────────────────────────────────────────
// 产品管理
// 修复：GET 直接返回 zh 翻译的 name/description/features
// 修复：include_inactive 参数显示已下架产品
// ──────────────────────────────────────────────────────────
router.get('/products', authenticate, async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const where = include_inactive === 'true' ? '' : 'WHERE p.is_active=true';
    const { rows } = await query(`
      SELECT p.id, p.slug, p.category, p.cover_image, p.video_url, p.price_per_sqm,
             p.sort_order, p.is_active, p.created_at,
             pt.name, pt.description,
             pt.features::text AS features_raw
      FROM products p
      LEFT JOIN product_translations pt ON p.id=pt.product_id AND pt.lang='zh'
      ${where}
      ORDER BY p.sort_order, p.created_at`
    );
    // 解析 features JSON
    const data = rows.map(r => ({
      ...r,
      features: r.features_raw
        ? (() => { try { return JSON.parse(r.features_raw); } catch { return []; } })()
        : [],
    }));
    res.json({ data });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.post('/products', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { slug, category, price_per_sqm, cover_image, video_url, translations } = req.body;
    const finalSlug = slug?.trim() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    const { rows } = await query(
      'INSERT INTO products(slug,category,price_per_sqm,cover_image,video_url) VALUES($1,$2,$3,$4,$5) RETURNING id',
      [finalSlug, category||'tech', price_per_sqm||0, cover_image, video_url]
    );
    const pid = rows[0].id;
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        const feats = Array.isArray(t.features) ? t.features
          : (t.features||'').split('\n').filter(Boolean);
        await query(
          `INSERT INTO product_translations(product_id,lang,name,description,features)
           VALUES($1,$2,$3,$4,$5) ON CONFLICT(product_id,lang)
           DO UPDATE SET name=$3,description=$4,features=$5`,
          [pid, t.lang||'zh', t.name||'', t.description||'', JSON.stringify(feats)]
        );
      }
    }
    await auditLog(req, 'create', 'products', pid, `新增产品 ${req.body.name||finalSlug}`);
    res.status(201).json({ id: pid });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error: '+err.message }); }
});

router.put('/products/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { category, price_per_sqm, cover_image, video_url, is_active, translations } = req.body;
    await query(
      'UPDATE products SET category=$1,price_per_sqm=$2,cover_image=$3,video_url=$4,is_active=$5,updated_at=NOW() WHERE id=$6',
      [category, price_per_sqm||0, cover_image, video_url, is_active!==false, req.params.id]
    );
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        const feats = Array.isArray(t.features) ? t.features
          : (t.features||'').split('\n').filter(Boolean);
        await query(
          `INSERT INTO product_translations(product_id,lang,name,description,features)
           VALUES($1,$2,$3,$4,$5) ON CONFLICT(product_id,lang)
           DO UPDATE SET name=$3,description=$4,features=$5`,
          [req.params.id, t.lang||'zh', t.name||'', t.description||'', JSON.stringify(feats)]
        );
      }
    }
    await auditLog(req, 'update', 'products', req.params.id, `更新产品`);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/products/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    await query('UPDATE products SET is_active=false,updated_at=NOW() WHERE id=$1', [req.params.id]);
    await auditLog(req, 'delete', 'products', req.params.id, '下架产品');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 案例管理 — 修复：GET 直接返回 title/description
// ──────────────────────────────────────────────────────────
router.get('/cases', authenticate, async (req, res) => {
  try {
    const { include_inactive } = req.query;
    const where = include_inactive === 'true' ? '' : 'WHERE c.is_active=true';
    const { rows } = await query(`
      SELECT c.id, c.slug, c.country, c.province, c.area, c.greenhouse_type,
             c.cover_image, c.images, c.video_url, c.completion_date,
             c.sort_order, c.is_active, c.created_at,
             ct.title, ct.description
      FROM cases c
      LEFT JOIN case_translations ct ON c.id=ct.case_id AND ct.lang='zh'
      ${where}
      ORDER BY c.sort_order, c.created_at`
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/cases', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { slug, country='中国', province, area, greenhouse_type, cover_image,
            images, video_url, completion_date, translations } = req.body;
    const finalSlug = slug?.trim() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    const { rows } = await query(
      'INSERT INTO cases(slug,country,province,area,greenhouse_type,cover_image,images,video_url,completion_date) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [finalSlug, country, province, area||null, greenhouse_type, cover_image,
       JSON.stringify(images||[]), video_url, completion_date||null]
    );
    const cid = rows[0].id;
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        await query(
          `INSERT INTO case_translations(case_id,lang,title,description) VALUES($1,$2,$3,$4)
           ON CONFLICT(case_id,lang) DO UPDATE SET title=$3,description=$4`,
          [cid, t.lang||'zh', t.title||'', t.description||'']
        );
      }
    }
    await auditLog(req, 'create', 'cases', cid, `新增案例 ${req.body.title||finalSlug}`);
    res.status(201).json({ id: cid });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error: '+err.message }); }
});

router.put('/cases/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { province, area, greenhouse_type, cover_image, video_url, completion_date, is_active, translations } = req.body;
    await query(
      'UPDATE cases SET province=$1,area=$2,greenhouse_type=$3,cover_image=$4,video_url=$5,completion_date=$6,is_active=$7,updated_at=NOW() WHERE id=$8',
      [province, area||null, greenhouse_type, cover_image, video_url, completion_date||null, is_active!==false, req.params.id]
    );
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        await query(
          `INSERT INTO case_translations(case_id,lang,title,description) VALUES($1,$2,$3,$4)
           ON CONFLICT(case_id,lang) DO UPDATE SET title=$3,description=$4`,
          [req.params.id, t.lang||'zh', t.title||'', t.description||'']
        );
      }
    }
    await auditLog(req, 'update', 'cases', req.params.id, '更新案例');
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/cases/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    await query('UPDATE cases SET is_active=false WHERE id=$1', [req.params.id]);
    await auditLog(req, 'delete', 'cases', req.params.id, '下架案例');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 文章管理 — 修复：GET 直接返回 title/summary/content
// ──────────────────────────────────────────────────────────
router.get('/articles', authenticate, async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.id, a.slug, a.cover_image, a.video_url, a.category,
             a.is_published, a.published_at, a.view_count, a.created_at,
             at.title, at.summary, at.content
      FROM articles a
      LEFT JOIN article_translations at ON a.id=at.article_id AND at.lang='zh'
      ORDER BY a.created_at DESC`
    );
    res.json({ data: rows });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

router.post('/articles', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { slug, cover_image, video_url, category='industry', is_published, translations } = req.body;
    const finalSlug = slug?.trim() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,5)}`;
    const { rows } = await query(
      'INSERT INTO articles(slug,cover_image,video_url,category,is_published,author_id,published_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [finalSlug, cover_image, video_url, category, is_published, req.user.id, is_published ? new Date() : null]
    );
    const aid = rows[0].id;
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        await query(
          `INSERT INTO article_translations(article_id,lang,title,summary,content) VALUES($1,$2,$3,$4,$5)
           ON CONFLICT(article_id,lang) DO UPDATE SET title=$3,summary=$4,content=$5`,
          [aid, t.lang||'zh', t.title||'', t.summary||'', t.content||'']
        );
      }
    }
    await auditLog(req, 'create', 'articles', aid, `发布文章 ${req.body.title||finalSlug}`);
    res.status(201).json({ id: aid });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error: '+err.message }); }
});

router.put('/articles/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const { cover_image, video_url, category, is_published, translations } = req.body;
    await query(
      'UPDATE articles SET cover_image=$1,video_url=$2,category=$3,is_published=$4,published_at=$5,updated_at=NOW() WHERE id=$6',
      [cover_image, video_url, category, is_published, is_published ? new Date() : null, req.params.id]
    );
    if (translations) {
      const arr = Array.isArray(translations) ? translations
        : Object.entries(translations).map(([lang,d]) => ({lang,...d}));
      for (const t of arr) {
        await query(
          `INSERT INTO article_translations(article_id,lang,title,summary,content) VALUES($1,$2,$3,$4,$5)
           ON CONFLICT(article_id,lang) DO UPDATE SET title=$3,summary=$4,content=$5`,
          [req.params.id, t.lang||'zh', t.title||'', t.summary||'', t.content||'']
        );
      }
    }
    await auditLog(req, 'update', 'articles', req.params.id, '更新文章');
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

router.delete('/articles/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    await query('DELETE FROM articles WHERE id=$1', [req.params.id]);
    await auditLog(req, 'delete', 'articles', req.params.id, '删除文章');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 操作日志
// GET /api/admin/audit-logs
// ──────────────────────────────────────────────────────────
router.get('/audit-logs', authenticate, requireRole(ROLES.MANAGE), async (req, res) => {
  try {
    const { page=1, limit=30, resource } = req.query;
    const offset = (page-1)*limit;
    // 修复：参数绑定重新整理，避免 unshift 导致 $n 对不上
    const params = [];
    let where = '';
    if (resource) { params.push(resource); where = `WHERE resource=$${params.length}`; }
    const limitIdx  = params.length + 1;
    const offsetIdx = params.length + 2;
    params.push(+limit, +offset);
    const { rows } = await query(
      `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    );
    const cnt = await query(
      `SELECT COUNT(*) FROM audit_logs ${where}`,
      resource ? [resource] : []
    );
    res.json({ data: rows, total: +cnt.rows[0].count });
  } catch (err) { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 用户管理
// ──────────────────────────────────────────────────────────
router.get('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { rows } = await query(
      'SELECT id,username,email,role,is_active,last_login,created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ data: rows });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

router.post('/users', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, role='editor', is_active=true } = req.body;
    if (!username||!email||!password) return res.status(400).json({ error: '用户名、邮箱和密码不能为空' });
    if (!['viewer','editor','admin','superadmin'].includes(role)) return res.status(400).json({ error:'无效角色' });
    if (username.length > 100 || email.length > 200) return res.status(400).json({ error:'用户名或邮箱过长' });
    if (password.length < 8) return res.status(400).json({ error: '密码至少8位' });
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      'INSERT INTO users(username,email,password_hash,role,is_active) VALUES($1,$2,$3,$4,$5) RETURNING id,username,email,role',
      [username, email, hash, role, is_active]
    );
    await auditLog(req, 'create', 'users', rows[0].id, `创建账号 ${username}`);
    res.status(201).json({ data: rows[0] });
  } catch (err) {
    if (err.code==='23505') return res.status(400).json({ error: '用户名或邮箱已存在' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { username, email, password, role, is_active } = req.body;
    if (!['viewer','editor','admin','superadmin'].includes(role)) return res.status(400).json({ error:'无效角色' });
    if (!username || !email || username.length > 100 || email.length > 200) return res.status(400).json({ error:'账号资料无效' });
    if (req.params.id === req.user.id && (role !== 'superadmin' || is_active === false)) {
      return res.status(400).json({ error:'不能降低或禁用当前超级管理员账号' });
    }
    await query(
      'UPDATE users SET username=$1,email=$2,role=$3,is_active=$4,updated_at=NOW() WHERE id=$5',
      [username, email, role, is_active!==false, req.params.id]
    );
    if (password?.trim()) {
      if (password.length < 8) return res.status(400).json({ error: '密码至少8位' });
      const hash = await bcrypt.hash(password, 12);
      await query('UPDATE users SET password_hash=$1 WHERE id=$2', [hash, req.params.id]);
    }
    await auditLog(req, 'update', 'users', req.params.id, `更新账号 ${username}`);
    res.json({ success: true });
  } catch (err) {
    if (err.code==='23505') return res.status(400).json({ error: '用户名或邮箱已存在' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: '不能删除当前登录账号' });
    await query('DELETE FROM users WHERE id=$1', [req.params.id]);
    await auditLog(req, 'delete', 'users', req.params.id, '删除账号');
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// ──────────────────────────────────────────────────────────
// 计算器单价管理
// ──────────────────────────────────────────────────────────
router.put('/calculator-rules', authenticate, requireRole(ROLES.MANAGE), async (req, res) => {
  try {
    const { base_prices, addon_prices } = req.body;
    const entries = [
      ...Object.entries(base_prices||{}).map(([k,v]) => [`calc_base_${k}`, String(v)]),
      ...Object.entries(addon_prices||{}).map(([k,v]) => [`calc_addon_${k}`, String(v)]),
    ];
    const allowedKeys = new Set([
      'calc_base_glass','calc_base_film','calc_base_pc','calc_base_multi-span','calc_base_solar','calc_base_arch',
      'calc_addon_has_irrigation','calc_addon_has_lighting','calc_addon_has_cooling',
      'calc_addon_has_smart_control','calc_addon_has_heating',
    ]);
    if (!entries.length || entries.some(([key, value]) => !allowedKeys.has(key) ||
        !Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 100000)) {
      return res.status(400).json({ error:'价格配置包含无效字段或数值' });
    }
    for (const [key, value] of entries) {
      await query(
        `INSERT INTO site_settings(key,value,updated_at) VALUES($1,$2,NOW())
         ON CONFLICT(key) DO UPDATE SET value=$2,updated_at=NOW()`,
        [key, value]
      );
    }
    await auditLog(req, 'update', 'settings', 'calculator-rules', '更新计算器单价');
    res.json({ success: true, message: '单价配置已保存' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
