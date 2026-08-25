#!/usr/bin/env node
/**
 * 重置管理员密码脚本
 * 用法: node scripts/reset-admin-password.js '新的强密码'
 * 
 * 在服务器上安装好 bcryptjs 依赖后运行此脚本
 * 密码不会打印到终端或日志。
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME     || 'greenhouse_db',
  user:     process.env.DB_USER     || 'greenhouse_user',
  password: process.env.DB_PASSWORD || '',
});

async function resetPassword() {
  const password = process.argv[2];
  if (!password || password.length < 12) throw new Error('必须提供至少 12 位的新密码');
  console.log('\n🔑 正在更新 admin 密码...');
  
  const hash = await bcrypt.hash(password, 12);
  
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES ('admin', 'admin@jingyang-greenhouse.com', $1, 'superadmin', true)
       ON CONFLICT (username) DO UPDATE SET password_hash = $1, is_active = true
       RETURNING id, username`,
      [hash]
    );
    console.log(`\n✅ 密码设置成功！`);
    console.log(`   用户: ${result.rows[0].username}`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`\n   登录地址: http://你的域名/manage888`);
    console.log(`   账号: admin`);
    console.log('   密码已更新（未输出到日志）\n');
  } finally {
    client.release();
    pool.end();
  }
}

resetPassword().catch(err => {
  console.error('❌ 错误:', err.message);
  process.exit(1);
});
