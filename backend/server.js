/**
 * 京阳温室官网 - 后端服务（永久稳定版）
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',').map(v => v.trim()).filter(Boolean);
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS origin not allowed'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '256kb' }));
app.use(express.urlencoded({ extended: true, limit: '256kb' }));
app.use('/api/admin/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 8,
  standardHeaders: true, legacyHeaders: false, message: { error: '登录尝试过多，请15分钟后重试' } }));
app.use('/api/contact', rateLimit({ windowMs: 10 * 60 * 1000, limit: 10,
  standardHeaders: true, legacyHeaders: false, message: { success:false, message:'提交过于频繁，请稍后再试' } }));
app.use('/api/calculator', rateLimit({ windowMs: 60 * 1000, limit: 60,
  standardHeaders: true, legacyHeaders: false }));

// 静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 路由
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/products',   require('./routes/products'));
app.use('/api/cases',      require('./routes/cases'));
app.use('/api/articles',   require('./routes/articles'));
app.use('/api/contact',    require('./routes/contacts'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/media',      require('./routes/media'));
app.use('/api/settings',   require('./routes/settings'));

// 健康检查
app.get('/health', async (req, res) => {
  try {
    const { query } = require('./config/database');
    await query('SELECT 1', [], 1);
    res.json({ status: 'healthy', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', database: 'disconnected' });
  }
});

app.use((err, req, res, next) => {
  console.error('[HTTP]', err.message);
  if (err.message === 'CORS origin not allowed') return res.status(403).json({ error: err.message });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: '文件过大' });
  return res.status(500).json({ error: '服务器内部错误' });
});

// 启动
const PORT = parseInt(process.env.PORT, 10) || 4001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌿 京阳温室 API 启动成功
📡 端口: ${PORT}
ℹ️  数据库状态请访问 /health
`);
  require('./services/translationService').startWorker();
});

module.exports = app;
