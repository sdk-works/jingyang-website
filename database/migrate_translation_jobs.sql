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

CREATE INDEX IF NOT EXISTS idx_translation_jobs_status
  ON translation_jobs(status, updated_at);
