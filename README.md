# 山东京阳温室科技有限公司 官网

## 🔑 默认管理员账号

| 字段 | 值 |
|------|----|
| 用户名 | `admin` |
| 密码   | `Admin@123456` |
| 角色   | 超级管理员 |

> ⚠️ **首次登录后请立即修改密码！**
> 后台地址：`https://你的域名/admin`

---

## 🚀 快速部署

```bash
# 一键部署（全新服务器）
bash deploy.sh

# 仅更新代码
bash deploy.sh --update

# 仅初始化数据库
bash deploy.sh --db-only

# 清理缓存（修改图片/代码后）
bash clear-cache.sh
```

详细步骤见 [DEPLOY_v5.md](./DEPLOY_v5.md)

---

## 📁 项目结构

```
greenhouse-website/
├── backend/              # Express API 服务（端口 4000）
│   ├── routes/           # API 路由
│   ├── config/           # 数据库配置
│   ├── scripts/init.js   # 数据库初始化脚本
│   ├── uploads/          # 上传的图片/视频
│   └── .env.example      # 环境变量模板
├── frontend/             # Next.js 前端（端口 3000）
│   ├── pages/            # 页面文件
│   ├── components/       # 组件
│   ├── public/
│   │   └── images/       # 静态图片
│   │       ├── logo.png  # ← 替换 Logo
│   │       ├── home/     # 首页背景图
│   │       ├── about/    # 关于页图片
│   │       ├── products/ # 产品图片（文件名=产品slug）
│   │       ├── cases/    # 案例图片（文件名=案例slug）
│   │       └── news/     # 新闻封面图
│   └── .env.example
├── database/
│   ├── schema.sql        # 完整数据库结构
│   └── migrate_all.sql   # 升级迁移脚本（已有库使用）
├── nginx/
│   └── greenhouse.conf   # Nginx 配置文件
├── ecosystem.config.js   # PM2 进程配置
├── deploy.sh             # 一键部署脚本
└── clear-cache.sh        # 缓存清理脚本
```

---

## 🖼️ 替换 Logo

1. 将 Logo 图片重命名为 `logo.png`（推荐 PNG，支持透明背景）
2. 放入 `frontend/public/images/` 目录
3. 推荐尺寸：`160×40px`（横版）或 `40×40px`（方形）
4. 无需重新构建，Nginx 重载即生效：`nginx -s reload`

---

## 🌍 多语言管理

语言包位置：`frontend/public/locales/{语言代码}/common.json`

| 语言 | 代码 | 文件 |
|------|------|------|
| 中文 | zh | locales/zh/common.json |
| 英文 | en | locales/en/common.json |
| 俄文 | ru | locales/ru/common.json |
| 阿拉伯文 | ar | locales/ar/common.json |

修改翻译后重启前端服务：`pm2 restart greenhouse-frontend`

新增语言见 `frontend/next-i18next.config.js` 中的注释。

---

## 🔧 日常运维

```bash
pm2 status                  # 查看服务状态
pm2 logs greenhouse-backend # 查看后端日志
pm2 restart all             # 重启所有服务
bash clear-cache.sh         # 清理缓存（修改内容后）
```

---

## 📞 技术支持

遇到问题请检查：
1. `pm2 logs` 查看错误日志
2. PostgreSQL 状态：`sudo systemctl status postgresql`
3. Nginx 状态：`sudo systemctl status nginx`
