#!/bin/bash
set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo -e "\n🌿 清理缓存 + 重启服务（稳定版）"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 前端重启
cd ~/greenhouse-website/frontend
warn "清理前端缓存..."
rm -rf .next

warn "重启前端服务..."
pm2 restart jingyang-frontend

# 后端重启
cd ~/greenhouse-website/backend
warn "重启后端服务..."
pm2 restart jingyang-backend

log "✅ 重启完成！系统已正常运行！"
echo -e "\n🌐 访问地址：http://localhost:3000"
echo -e "🔐 后台地址：http://localhost:3000/manage888\n"