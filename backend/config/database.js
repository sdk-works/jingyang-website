/**
 * PostgreSQL 数据库连接配置
 * v6 改进：
 * - 连接失败时自动重试（最多 5 次，指数退避）
 * - 明确的错误提示（配置错误 vs 网络错误 vs 认证错误）
 * - 连接池健康检查
 *
 * 配置方式：在 backend/.env 中设置以下变量
 *   DB_HOST     数据库主机（默认 localhost）
 *   DB_PORT     端口（默认 5432）
 *   DB_NAME     数据库名（默认 greenhouse_db）
 *   DB_USER     用户名（默认 greenhouse_user）
 *   DB_PASSWORD 密码（必填，无默认值）
 */

const { Pool } = require('pg');

// ── 连接池配置 ────────────────────────────────────────────────
const pool = new Pool({
  host:                   process.env.DB_HOST     || 'localhost',
  port:                   parseInt(process.env.DB_PORT) || 5432,
  database:               process.env.DB_NAME     || 'greenhouse_db',
  user:                   process.env.DB_USER     || 'greenhouse_user',
  password:               process.env.DB_PASSWORD || '',
  max:                    10,    // 最大连接数（小内存机器降低至 10）
  min:                    2,     // 最小保持连接数
  idleTimeoutMillis:      30000, // 空闲连接超时 30s
  connectionTimeoutMillis:5000,  // 连接超时 5s（原来 2s 太短）
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

// ── 连接事件监听 ──────────────────────────────────────────────
pool.on('connect', (client) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('📊 [DB] 新连接建立');
  }
});

pool.on('error', (err, client) => {
  // 详细错误分类，帮助快速定位问题
  if (err.code === 'ECONNREFUSED') {
    console.error('❌ [DB] 连接被拒绝 - 请检查 PostgreSQL 是否已启动、端口是否正确');
    console.error(`   配置: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
  } else if (err.code === 'ENOTFOUND') {
    console.error('❌ [DB] 无法解析主机 - 请检查 DB_HOST 配置');
  } else if (err.code === '28P01' || err.code === '28000') {
    console.error('❌ [DB] 认证失败 - 请检查 DB_USER 和 DB_PASSWORD');
  } else if (err.code === '3D000') {
    console.error(`❌ [DB] 数据库不存在 - 请先创建数据库: ${process.env.DB_NAME || 'greenhouse_db'}`);
  } else {
    console.error('❌ [DB] 连接池错误:', err.message);
  }
  // 不调用 process.exit()，让应用继续尝试恢复
});

pool.on('remove', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 [DB] 连接已释放');
  }
});

// ── 查询辅助函数（含重试）────────────────────────────────────
const query = async (text, params, retries = 3) => {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const start = Date.now();
      const res   = await pool.query(text, params);
      if (process.env.NODE_ENV === 'development') {
        console.log('[DB]', { sql: text.slice(0, 80), ms: Date.now()-start, rows: res.rowCount });
      }
      return res;
    } catch (err) {
      lastErr = err;
      // 非网络错误（如 SQL 语法错误）不重试
      if (!['ECONNREFUSED','ENOTFOUND','ETIMEDOUT','57P01'].includes(err.code)) {
        throw err;
      }
      if (i < retries - 1) {
        const wait = 500 * Math.pow(2, i); // 500ms, 1s, 2s
        console.warn(`[DB] 查询失败，${wait}ms 后重试... (${i+1}/${retries})`);
        await new Promise(r => setTimeout(r, wait));
      }
    }
  }
  throw lastErr;
};

// ── 事务辅助函数 ──────────────────────────────────────────────
const withTransaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};

// ── 启动时连接验证 ────────────────────────────────────────────
const testConnection = async (attempt = 1, maxAttempts = 5) => {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ [DB] 数据库连接成功');
    console.log(`   📍 ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'greenhouse_db'}`);
    return true;
  } catch (err) {
    const wait = 2000 * attempt;
    if (attempt < maxAttempts) {
      console.warn(`⚠️  [DB] 连接失败 (${attempt}/${maxAttempts})，${wait/1000}s 后重试...`);
      console.warn(`   错误: ${err.message}`);
      await new Promise(r => setTimeout(r, wait));
      return testConnection(attempt + 1, maxAttempts);
    } else {
      console.error('❌ [DB] 数据库连接失败，已重试', maxAttempts, '次');
      console.error('   请检查：');
      console.error('   1. PostgreSQL 是否已启动：sudo systemctl status postgresql');
      console.error('   2. .env 文件配置是否正确（DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD）');
      console.error('   3. 数据库用户权限：GRANT ALL ON DATABASE greenhouse_db TO greenhouse_user');
      // 不退出进程，让 API 返回 503，等数据库恢复后自动重连
      return false;
    }
  }
};

// 服务启动时自动测试连接
if (process.env.NODE_ENV !== 'test') {
  testConnection().catch(() => {});
}

module.exports = { pool, query, withTransaction, testConnection };
