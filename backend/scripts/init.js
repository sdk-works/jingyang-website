#!/usr/bin/env node
/**
 * 京阳温室官网 - 快速部署初始化脚本
 * 
 * 用法：
 *   node scripts/init.js
 * 
 * 功能：
 *   1. 检查数据库连接
 *   2. 初始化数据表
 *   3. 创建管理员账号（如不存在）
 *   4. 导入基础数据
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'greenhouse_db',
  user:     process.env.DB_USER || 'greenhouse_user',
  password: process.env.DB_PASSWORD || '',
});

async function init() {
  console.log('\n🌿 京阳温室官网 - 初始化脚本\n');
  console.log('📡 数据库连接信息:');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   DB:   ${process.env.DB_NAME || 'greenhouse_db'}`);
  console.log(`   User: ${process.env.DB_USER || 'greenhouse_user'}\n`);

  const client = await pool.connect();
  try {
    // 1. 测试连接
    await client.query('SELECT NOW()');
    console.log('✅ 数据库连接成功');

    // 2. 执行 schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schema);
      console.log('✅ 数据库表结构初始化完成');
    } else {
      console.log('⚠️  未找到 schema.sql，跳过');
    }

    // 3. 确保管理员账号存在，并用正确密码
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123456';
    const hash = await bcrypt.hash(adminPassword, 12);
    await client.query(
      `INSERT INTO users (username, email, password_hash, role, is_active)
       VALUES ('admin', $1, $2, 'superadmin', true)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2, is_active = true`,
      [process.env.ADMIN_EMAIL || 'admin@jingyang-greenhouse.com', hash]
    );
    console.log(`✅ 管理员账号创建/更新成功`);
    console.log(`   用户名: admin`);
    console.log(`   密码:   ${adminPassword}`);

    // 4. 显示数据统计
    const stats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) users,
        (SELECT COUNT(*) FROM products) products,
        (SELECT COUNT(*) FROM cases) cases,
        (SELECT COUNT(*) FROM contacts) contacts
    `);
    const s = stats.rows[0];
    console.log(`\n📊 数据统计:`);
    console.log(`   用户: ${s.users}, 产品: ${s.products}, 案例: ${s.cases}, 咨询: ${s.contacts}`);

    console.log('\n🎉 初始化完成！');
    console.log('\n📋 下一步:');
    console.log('   1. 启动后端: cd backend && pm2 start ecosystem.config.js');
    console.log('   2. 启动前端: cd frontend && npm run build && pm2 start ecosystem.config.js');
    console.log('   3. 访问后台: http://你的域名/admin');
    console.log(`   4. 登录账号: admin / ${adminPassword}\n`);

  } catch (err) {
    console.error('\n❌ 初始化失败:', err.message);
    if (err.message.includes('password authentication')) {
      console.log('\n💡 提示: 请检查 .env 文件中的数据库密码');
    }
    if (err.message.includes('does not exist')) {
      console.log('\n💡 提示: 请先创建数据库:');
      console.log(`   sudo -u postgres createdb ${process.env.DB_NAME || 'greenhouse_db'}`);
    }
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

init();
