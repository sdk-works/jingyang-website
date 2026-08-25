-- ============================================
-- 迁移脚本 v3 — 补充缺失字段
-- 运行: psql -U greenhouse_user -d greenhouse_db -f migrate_v3.sql
-- ============================================

-- 1. articles 表添加 video_url
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- 2. users 表 role 字段允许更多角色值（已是 VARCHAR，无需修改）
-- 确保超级管理员角色存在
UPDATE users SET role='superadmin' WHERE username='admin' AND role IN ('admin','superadmin');

-- 3. site_settings 可能需要的索引
CREATE INDEX IF NOT EXISTS idx_settings_key ON site_settings(key);

-- 4. 确保产品翻译中 features 字段支持 jsonb
-- (如果 features 是 JSONB 类型则 OK，如果是 TEXT 则需要转换)
DO $$
BEGIN
  -- 检查 features 列类型
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='product_translations' AND column_name='features' AND data_type='text'
  ) THEN
    ALTER TABLE product_translations ALTER COLUMN features TYPE JSONB USING features::jsonb;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'features column migration skipped: %', SQLERRM;
END $$;

