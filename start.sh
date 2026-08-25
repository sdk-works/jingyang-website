#!/bin/bash
set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error(){ echo -e "${RED}❌ $1${NC}"; }

echo -e "\n🌿 京阳温室官网 - 全自动一键启动（最终修复版）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ==========================
# 前端（自动构建 + 启动）
# ==========================
warn "1. 进入前端目录"
cd /home/user/greenhouse-website/frontend

warn "2. 清理旧缓存"
rm -rf .next

warn "3. 安装依赖"
npm install

warn "4. 编译项目（next build）"
npm run build

warn "5. 复制静态资源（standalone 必须）"
cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
cp -r public .next/standalone/ 2>/dev/null || true

warn "6. 停止旧前端进程"
pm2 delete jingyang-frontend 2>/dev/null || true

warn "7. 启动前端（正确模式）"
pm2 start "node .next/standalone/server.js" --name "jingyang-frontend"

# ==========================
# 后端
# ==========================
warn "8. 启动后端"
cd /home/user/greenhouse-website/backend
pm2 delete jingyang-backend 2>/dev/null || true
pm2 start npm --name "jingyang-backend" -- run start

# ==========================
# 完成
# ==========================
echo ""
log "========================================"
log "✅ 启动成功！"
log "🌐 访问地址：http://localhost:3000"
log "========================================"
echo ""