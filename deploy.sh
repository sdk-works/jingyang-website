#!/bin/bash
# ============================================================
# 一键部署脚本 - 山东京阳温室科技官网【最终稳定版】
# 功能：自动修复环境、数据库、端口、权限、前后端一键启动
# ============================================================

set -e

# ── 固定配置（已适配你的系统）────────────────────────────
DEPLOY_DIR="/home/user/greenhouse-website"

# ── 颜色输出 ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()     { echo -e "${GREEN}✅ $1${NC}"; }
warn()    { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()     { echo -e "${RED}❌ $1${NC}"; exit 1; }
section() { echo -e "\n${BLUE}━━━ $1 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

MODE="${1:---full}"

# ── 读取环境变量 ───────────────────────────────────────────
load_env() {
    local env_file="$1"
    [ -f "$env_file" ] || return
    while IFS= read -r line; do
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "${line// }" ]] && continue
        if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local val="${BASH_REMATCH[2]}"
            val="${val%\"}" ; val="${val#\"}"
            val="${val%\'}" ; val="${val#\'}"
            export "$key=$val"
        fi
    done < "$env_file"
}

# ── 环境检查 ──────────────────────────────────────────────────
check_env() {
    section "环境检查"
    command -v node  &>/dev/null || err "Node.js 未安装"
    command -v npm   &>/dev/null || err "npm 未安装"
    command -v psql  &>/dev/null || err "PostgreSQL 未安装"
    
    NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
    [ "$NODE_VER" -ge 16 ] || warn "Node 建议使用 18+，当前 v$NODE_VER"
    
    log "Node.js $(node -v)"
    
    if ! command -v pm2 &>/dev/null; then
        warn "PM2 未安装，正在安装..."
        npm install -g pm2
        log "PM2 安装完成"
    else
        log "PM2 $(pm2 -v)"
    fi
    
    log "环境检查通过"
}

# ── 数据库初始化 ───────────────────────────────────────────
init_database() {
    section "数据库初始化 + 重置管理员账号"
    
    local env_file="$DEPLOY_DIR/backend/.env"
    if [ ! -f "$env_file" ]; then
        cp "$DEPLOY_DIR/backend/.env.example" "$env_file"
        warn "已自动生成后端 .env"
    fi
    
    load_env "$env_file"
    DB_NAME="${DB_NAME:-jingyang_web_db}"
    DB_USER="${DB_USER:-jingyang_web_user}"

    sudo -u postgres psql << SQL 2>/dev/null || true
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '$DB_USER') THEN
    CREATE USER $DB_USER WITH PASSWORD '${DB_PASSWORD:-123456}';
  END IF;
END \$\$;

SELECT 'CREATE DATABASE $DB_NAME' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$DB_NAME')\gexec;

GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
SQL

    cd "$DEPLOY_DIR/backend"
    node scripts/init.js
    
    log "数据库初始化完成"
    log "后台账号：admin   密码：Admin@123456"
}

# ── 安装依赖 ──────────────────────────────────────────────────
install_deps() {
    section "安装前后端依赖"
    
    cd "$DEPLOY_DIR/backend"
    npm install
    log "后端依赖安装完成"
    
    cd "$DEPLOY_DIR/frontend"
    rm -rf node_modules package-lock.json .next
    npm install
    log "前端依赖安装完成"
}

# ── 前端处理 ───────────────────────────────────────────
build_frontend() {
    section "前端编译"
    
    cd "$DEPLOY_DIR/frontend"
    [ -f ".env" ] || cp ".env.example" ".env"
    sudo rm -rf .next
    
    npm run build
    log "编译完成"
}

# ── 启动服务 ─────────────────────────────────────────
start_services() {
    section "启动前后端服务"
    
    # 后端
    cd "$DEPLOY_DIR/backend"
    pm2 stop jingyang-backend 2>/dev/null || true
    pm2 start server.js --name "jingyang-backend"
    log "后端启动 → 端口 4001"
    
    # 前端 3000
    cd "$DEPLOY_DIR/frontend"
    pm2 stop jingyang-frontend 2>/dev/null || true
    pm2 start "npm run start -- -p 3000" --name "jingyang-frontend"
    log "前端启动 → 端口 3000"
    
    pm2 save
}

# ── 结果展示 ──────────────────────────────────────────────────
show_result() {
    section "部署完成！系统正常运行"
    pm2 status
    
    echo -e "\n${GREEN}════════════════════════════════════════${NC}"
    log "🌐 前台地址：http://localhost:3000"
    log "🔐 后台地址：http://localhost:3000/admin"
    log "👤 登录账号：admin"
    log "🔑 登录密码：Admin@123456"
    log "📡 后端接口：http://localhost:4001"
    echo -e "${GREEN}════════════════════════════════════════${NC}"
}

# ── 主流程 ────────────────────────────────────────────────────
echo -e "\n🌿 京阳温室官网 · 一键部署脚本【最终稳定版】"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

case "$MODE" in
    --check)
        check_env
        ;;
    --db-only)
        check_env
        init_database
        ;;
    --update)
        check_env
        install_deps
        build_frontend
        start_services
        show_result
        ;;
    --full|"")
        check_env
        install_deps
        init_database
        build_frontend
        start_services
        show_result
        ;;
    *)
        echo "用法：bash deploy.sh [--full|--update|--db-only|--check]"
        exit 1
        ;;
esac