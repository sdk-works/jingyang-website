# 山东京阳温室科技有限公司 - 官网部署教程

> 适用环境：Ubuntu 22.04 LTS + Nginx + Node.js 18+ + PostgreSQL 15 + PM2

---

## 一、服务器环境准备

### 1. 更新系统
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip build-essential
```

### 2. 安装 Node.js 18
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # 应显示 v18.x.x
npm -v
```

### 3. 安装 PM2（进程管理器）
```bash
sudo npm install -g pm2
pm2 startup  # 按提示执行输出的命令，设置开机自启
```

### 4. 安装 PostgreSQL 15
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 5. 安装 Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 二、数据库初始化

### 1. 创建数据库和用户
```bash
sudo -u postgres psql
```

在 psql 交互界面执行：
```sql
-- 创建数据库用户（替换 your_strong_password）
CREATE USER greenhouse_user WITH PASSWORD 'your_strong_password';

-- 创建数据库
CREATE DATABASE greenhouse_db OWNER greenhouse_user;

-- 授予权限
GRANT ALL PRIVILEGES ON DATABASE greenhouse_db TO greenhouse_user;

-- 退出
\q
```

### 2. 初始化数据库表结构
```bash
# 上传项目到服务器后执行
cd /var/www/greenhouse
sudo -u postgres psql -U greenhouse_user -d greenhouse_db -f database/schema.sql
```

### 3. 验证数据库
```bash
psql -U greenhouse_user -d greenhouse_db -h localhost
\dt  # 查看所有表
\q
```

---

## 三、上传项目代码

### 方式一：Git 克隆（推荐）
```bash
sudo mkdir -p /var/www/greenhouse
sudo chown $USER:$USER /var/www/greenhouse
cd /var/www/greenhouse
git clone https://github.com/your-repo/greenhouse-website.git .
```

### 方式二：SCP 上传
```bash
# 在本地执行（将整个项目压缩上传）
scp -r greenhouse-website.zip user@your-server-ip:/var/www/greenhouse/
# 在服务器解压
cd /var/www/greenhouse && unzip greenhouse-website.zip
```

---

## 四、配置后端

### 1. 安装依赖
```bash
cd /var/www/greenhouse/backend
npm install --production
```

### 2. 配置环境变量
```bash
cp .env.example .env
nano .env
```

填写以下配置（替换所有占位符）：
```env
PORT=4000
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=greenhouse_db
DB_USER=greenhouse_user
DB_PASSWORD=your_strong_password

JWT_SECRET=请填写至少32位的随机字符串
JWT_EXPIRES_IN=7d

UPLOAD_DIR=./uploads
MAX_FILE_SIZE=50000000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM=京阳温室科技 <noreply@jingyang-greenhouse.com>

SALES_EMAIL=sales@jingyang-greenhouse.com
FRONTEND_URL=https://www.jingyang-greenhouse.com
```

### 3. 创建上传目录
```bash
mkdir -p /var/www/greenhouse/backend/uploads/{images,videos}
chmod 755 /var/www/greenhouse/backend/uploads
```

### 4. 测试后端启动
```bash
cd /var/www/greenhouse/backend
node server.js
# 看到"API 服务器启动成功"后 Ctrl+C 停止
```

---

## 五、配置前端

### 1. 安装依赖
```bash
cd /var/www/greenhouse/frontend
npm install
```

### 2. 配置环境变量
```bash
cat > .env.production << EOF
NEXT_PUBLIC_API_URL=https://www.jingyang-greenhouse.com
NEXT_PUBLIC_SITE_URL=https://www.jingyang-greenhouse.com
NEXT_PUBLIC_WHATSAPP=8613888888888
EOF
```

### 3. 构建前端
```bash
npm run build
# 构建成功后会显示页面信息
```

---

## 六、使用 PM2 运行服务

### 1. 启动所有服务
```bash
cd /var/www/greenhouse
pm2 start ecosystem.config.js
```

### 2. 查看运行状态
```bash
pm2 status
pm2 logs greenhouse-backend  # 查看后端日志
pm2 logs greenhouse-frontend  # 查看前端日志
```

### 3. 保存 PM2 配置（重启后自动恢复）
```bash
pm2 save
```

---

## 七、配置 Nginx

### 1. 复制配置文件
```bash
sudo cp /var/www/greenhouse/nginx/greenhouse.conf /etc/nginx/sites-available/greenhouse
```

### 2. 修改域名（替换为你的真实域名）
```bash
sudo nano /etc/nginx/sites-available/greenhouse
# 将所有 jingyang-greenhouse.com 替换为你的真实域名
```

### 3. 启用站点
```bash
sudo ln -sf /etc/nginx/sites-available/greenhouse /etc/nginx/sites-enabled/greenhouse
sudo rm -f /etc/nginx/sites-enabled/default  # 删除默认配置
```

### 4. 测试并重载 Nginx
```bash
sudo nginx -t  # 测试配置
sudo systemctl reload nginx
```

---

## 八、配置 SSL 证书（免费）

### 1. 安装 Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. 申请证书（替换域名）
```bash
sudo certbot --nginx -d jingyang-greenhouse.com -d www.jingyang-greenhouse.com
```

### 3. 设置自动续期
```bash
sudo crontab -e
# 添加以下行（每天凌晨2点检查）
0 2 * * * /usr/bin/certbot renew --quiet
```

---

## 九、防火墙配置

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
sudo ufw status
```

---

## 十、验证部署

1. 访问 `https://www.jingyang-greenhouse.com` → 看到首页 ✅
2. 访问 `https://www.jingyang-greenhouse.com/en` → 英文版 ✅
3. 访问 `https://www.jingyang-greenhouse.com/ru` → 俄文版 ✅
4. 访问 `https://www.jingyang-greenhouse.com/ar` → 阿拉伯文版 ✅
5. 访问 `https://www.jingyang-greenhouse.com/calculator` → 计算器 ✅
6. 访问 `https://www.jingyang-greenhouse.com/admin` → 后台登录 ✅
7. 提交一条咨询 → 收到销售邮件通知 ✅

---

## 十一、日常维护

### 查看日志
```bash
pm2 logs              # 所有日志
tail -f /var/log/nginx/greenhouse_access.log  # Nginx访问日志
tail -f /var/log/nginx/greenhouse_error.log   # Nginx错误日志
```

### 重启服务
```bash
pm2 restart greenhouse-backend   # 重启后端
pm2 restart greenhouse-frontend  # 重启前端
sudo systemctl reload nginx      # 重载Nginx
```

### 更新代码
```bash
cd /var/www/greenhouse
git pull origin main

# 更新后端
cd backend && npm install
pm2 restart greenhouse-backend

# 更新前端
cd ../frontend && npm install && npm run build
pm2 restart greenhouse-frontend
```

### 数据库备份
```bash
# 备份
pg_dump -U greenhouse_user -d greenhouse_db > backup_$(date +%Y%m%d).sql

# 设置每日自动备份
echo "0 3 * * * pg_dump -U greenhouse_user greenhouse_db > /backup/db_\$(date +\%Y\%m\%d).sql" | crontab -
```

---

## 十二、后台管理

- **登录地址**: `https://www.jingyang-greenhouse.com/admin`
- **默认用户名**: `admin`
- **默认密码**: `Admin@123456`
- **⚠️ 首次登录后请立即修改密码！**

---

## 常见问题

**Q: 后端启动失败？**
```bash
cd /var/www/greenhouse/backend
node server.js  # 查看具体错误信息
# 通常是数据库连接或.env配置问题
```

**Q: 前端构建失败？**
```bash
cd /var/www/greenhouse/frontend
npm run build 2>&1 | tail -50  # 查看错误
# 通常是依赖版本问题，尝试 rm -rf node_modules && npm install
```

**Q: 邮件发送失败？**
- Gmail需要开启"应用专用密码"
- 腾讯企业邮箱：SMTP_HOST=smtp.exmail.qq.com, PORT=465, SECURE=true
- 阿里云邮箱：SMTP_HOST=smtp.mxhichina.com, PORT=465, SECURE=true
