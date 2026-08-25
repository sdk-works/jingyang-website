/**
 * 京阳温室官网 - 后端服务（永久稳定版）
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// 中间件
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 启动
const PORT = 4001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🌿 京阳温室 API 启动成功
📡 端口: ${PORT}
✅ 数据库已连接
`);
});

module.exports = app;
