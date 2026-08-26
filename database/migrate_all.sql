-- ============================================
-- 京阳温室官网 数据库迁移脚本（全量）
-- 适用：已有数据库（非全新安装）升级到 v5
-- 运行：psql -U greenhouse_user -d greenhouse_db -f database/migrate_all.sql
-- 所有语句均使用 IF NOT EXISTS，可安全重复执行
-- ============================================

-- ── v3 补丁 ──────────────────────────────────────────────
-- articles 表添加 video_url
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- users 超级管理员角色确认
UPDATE users SET role='superadmin' WHERE username='admin' AND role IN ('admin','superadmin');

-- site_settings 索引
CREATE INDEX IF NOT EXISTS idx_settings_key ON site_settings(key);

-- product_translations.features 字段类型升级（TEXT → JSONB）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='product_translations' AND column_name='features' AND data_type='text'
  ) THEN
    ALTER TABLE product_translations ALTER COLUMN features TYPE JSONB USING features::jsonb;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'features column migration skipped: %', SQLERRM;
END $$;

-- ── v4/v5 补丁 ────────────────────────────────────────────
-- calculator_records 补全字段（原表字段不足）
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_smart_control  BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_irrigation      BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_lighting        BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_cooling         BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_heating         BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS base_price_per_sqm  DECIMAL(10,2);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS lang                VARCHAR(10) DEFAULT 'zh';
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_name        VARCHAR(200);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_email       VARCHAR(255);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_phone       VARCHAR(50);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS country             VARCHAR(100);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS submitted           BOOLEAN DEFAULT false;

-- 操作日志表（新增）
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  username    VARCHAR(100),
  action      VARCHAR(50)  NOT NULL,
  resource    VARCHAR(100),
  resource_id VARCHAR(200),
  detail      TEXT,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);

-- cases 表确保有 is_active 默认值
ALTER TABLE cases ALTER COLUMN is_active SET DEFAULT true;

-- 确认 articles.category 有合理默认
ALTER TABLE articles ALTER COLUMN category SET DEFAULT 'industry';

-- 自动翻译任务（产品、案例、文章共用）
CREATE TABLE IF NOT EXISTS translation_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('product','case','article')),
  entity_id UUID NOT NULL,
  target_lang VARCHAR(5) NOT NULL CHECK (target_lang IN ('en','ru','ar')),
  source_hash VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','success','failed','waiting_config')),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_id, target_lang)
);
CREATE INDEX IF NOT EXISTS idx_translation_jobs_status ON translation_jobs(status, updated_at);

-- 人工译文锁定，防止自动补译覆盖人工修订
ALTER TABLE product_translations ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE case_translations ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE article_translations ADD COLUMN IF NOT EXISTS is_locked BOOLEAN NOT NULL DEFAULT false;

-- 预算计算器的温室类型和配套系统，可由后台完整维护
CREATE TABLE IF NOT EXISTS calculator_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type VARCHAR(10) NOT NULL CHECK(item_type IN('base','addon')),
  item_key VARCHAR(80) UNIQUE NOT NULL,
  label_zh VARCHAR(120) NOT NULL,
  icon VARCHAR(20) DEFAULT '⚙️',
  price_per_sqm NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO calculator_items(item_type,item_key,label_zh,icon,price_per_sqm,sort_order) VALUES
('base','glass','玻璃温室（文洛型）','🏗️',500,10),('base','pc','PC板温室（阳光板）','☀️',350,20),('base','solar','日光温室','🌱',280,30),('base','multi-span','薄膜连栋温室','🏛️',200,40),('base','arch','单体拱棚','⛺',120,50),
('addon','cooling','降温系统','❄️',40,10),('addon','heating','升温系统','🔥',30,20),('addon','irrigation','水肥一体化','💧',30,30),('addon','lighting','补光系统','💡',50,40),('addon','smart_control','智能控制','🤖',20,50)
ON CONFLICT(item_key) DO NOTHING;

-- ── 完成 ─────────────────────────────────────────────────
DO $$ BEGIN RAISE NOTICE '✅ 数据库迁移完成！'; END $$;
