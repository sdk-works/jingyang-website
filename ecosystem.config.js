/**
 * PM2 进程管理配置
 * 京阳温室官网 v6
 *
 * 使用说明：
 *   pm2 start ecosystem.config.js          # 首次启动
 *   pm2 restart ecosystem.config.js        # 重启所有
 *   pm2 restart greenhouse-backend         # 仅重启后端
 *   pm2 save && pm2 startup                # 设置开机自启
 *   pm2 logs greenhouse-backend            # 查看后端日志
 *   pm2 monit                              # 实时监控
 *
 * 注意：
 *   - 前端使用 Next.js standalone 模式，由 node .next/standalone/server.js 启动
 *   - 前端静态资源由 Nginx 直接托管（/_next/static、/images 等），不经过 Node
 *   - 后端 API 内存限制 200M，超出后 PM2 自动重启
 *   - 生产环境前端内存限制 400M
 *
 * 部署路径约定（与 Nginx 配置对应）：
 *   /var/www/jingyang-website/backend/   ← 后端代码
 *   /var/www/jingyang-website/frontend/  ← 前端代码
 */

const BASE = '/var/www/jingyang-website';

module.exports = {
  apps: [
    // ── 后端 API 服务 ──────────────────────────────────────
    {
      name:          'jingyang-backend',
      cwd:           `${BASE}/backend`,
      script:        'server.js',
      interpreter:   'node',

      // 集群模式（多核 CPU 负载均衡）
      // instances: 'max' 使用所有 CPU 核心；小内存机器建议设为 1
      instances:     1,           // 1G 内存机器推荐设为 1
      exec_mode:     'fork',      // fork 模式，cluster 模式需要更多内存

      // 内存限制：超出 200M 自动重启（防止内存泄漏导致服务器卡死）
      max_memory_restart: '200M',

      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT:     4001,
        CORS_ORIGIN: 'http://localhost:3000,http://127.0.0.1:3000,http://192.168.109.128:3000',
      },

      // 日志
      error_file:      '/var/log/pm2/greenhouse-backend-error.log',
      out_file:        '/var/log/pm2/greenhouse-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs:      true,

      // 崩溃重启策略
      restart_delay:   3000,    // 崩溃后等 3 秒再重启
      max_restarts:    10,      // 最多重启 10 次
      min_uptime:      '10s',   // 运行不足 10s 视为启动失败

      // 监控
      watch:           false,   // 生产环境不监听文件变化
    },

    // ── 前端 Next.js 服务（standalone 模式，内存最优）──────
    {
      name:          'jingyang-frontend',
      cwd:           `${BASE}/frontend`,
      // 使用已安装的 Next.js 启动生产构建
      script:        'node_modules/next/dist/bin/next',
      args:          'start -p 3000',
      interpreter:   'node',

      instances:     1,
      exec_mode:     'fork',

      // 内存限制：小内存机器设为 300M，标准机器可调至 512M
      max_memory_restart: '300M',

      // 环境变量
      env: {
        NODE_ENV:  'production',
        PORT:      3000,
        HOSTNAME:  '127.0.0.1',  // 只监听本地，让 Nginx 做反向代理
      },

      // 日志
      error_file:      '/var/log/pm2/greenhouse-frontend-error.log',
      out_file:        '/var/log/pm2/greenhouse-frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs:      true,

      // 崩溃重启策略
      restart_delay: 5000,
      max_restarts:  10,
      min_uptime:    '30s',

      watch:         false,
    },
  ],
};
