const crypto = require('crypto');
const { query } = require('../config/database');

const TARGETS = ['en', 'ru', 'ar'];
const TABLES = {
  product: { sourceTable:'product_translations', idColumn:'product_id', fields:['name','description','features'] },
  case: { sourceTable:'case_translations', idColumn:'case_id', fields:['title','description'] },
  article: { sourceTable:'article_translations', idColumn:'article_id', fields:['title','summary','content'] },
};

function configured() {
  const provider = process.env.TRANSLATION_PROVIDER || 'openai_compatible';
  if (provider === 'argos') return Boolean(process.env.TRANSLATION_API_URL);
  return Boolean(process.env.TRANSLATION_API_URL && process.env.TRANSLATION_MODEL);
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function sourceFor(entityType, entityId) {
  const cfg = TABLES[entityType];
  if (!cfg) throw new Error('Unsupported translation entity');
  const fields = cfg.fields.map(f => `${f}::text AS ${f}`).join(',');
  const { rows } = await query(
    `SELECT ${fields} FROM ${cfg.sourceTable} WHERE ${cfg.idColumn}=$1 AND lang='zh'`, [entityId]
  );
  if (!rows[0]) throw new Error('Chinese source content not found');
  const value = { ...rows[0] };
  if (entityType === 'product') {
    try { value.features = JSON.parse(value.features || '[]'); } catch { value.features = []; }
  }
  return value;
}

async function enqueue(entityType, entityId, force = false) {
  const source = await sourceFor(entityType, entityId);
  const sourceHash = digest(source);
  for (const lang of TARGETS) {
    await query(
      `INSERT INTO translation_jobs(entity_type,entity_id,target_lang,source_hash,status)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(entity_type,entity_id,target_lang) DO UPDATE SET
         source_hash=EXCLUDED.source_hash,
         status=CASE WHEN $6 OR translation_jobs.source_hash<>EXCLUDED.source_hash
                     THEN EXCLUDED.status ELSE translation_jobs.status END,
         attempts=CASE WHEN $6 OR translation_jobs.source_hash<>EXCLUDED.source_hash THEN 0 ELSE translation_jobs.attempts END,
         last_error=CASE WHEN $6 OR translation_jobs.source_hash<>EXCLUDED.source_hash THEN NULL ELSE translation_jobs.last_error END,
         updated_at=CASE WHEN $6 OR translation_jobs.source_hash<>EXCLUDED.source_hash THEN NOW() ELSE translation_jobs.updated_at END`,
      [entityType, entityId, lang, sourceHash, configured() ? 'pending' : 'waiting_config', force]
    );
  }
  return { configured: configured(), languages: TARGETS };
}

function safeJson(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

async function callProvider(source, targetLang) {
  if (!configured()) throw new Error('Translation provider is not configured');
  const base = process.env.TRANSLATION_API_URL.replace(/\/$/, '');
  if ((process.env.TRANSLATION_PROVIDER || '') === 'argos') {
    const translateText = async (value) => {
      if (!value || typeof value !== 'string' || !/[\u3400-\u9fff]/.test(value)) return value;
      // 富文本按HTML标签切分，只翻译可见文字，避免破坏标签和链接。
      const parts = value.split(/(<[^>]+>)/g);
      for (let i=0; i<parts.length; i++) {
        if (!parts[i] || parts[i].startsWith('<') || !/[\u3400-\u9fff]/.test(parts[i])) continue;
        const response = await fetch(`${base}/translate`, { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ q:parts[i], source:'zh', target:targetLang }) });
        if (!response.ok) throw new Error(`Argos HTTP ${response.status}`);
        const data = await response.json();
        parts[i] = data.translatedText;
      }
      return parts.join('');
    };
    const result = {};
    for (const [key,value] of Object.entries(source)) {
      result[key] = Array.isArray(value)
        ? await Promise.all(value.map(translateText))
        : await translateText(value);
    }
    return result;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.TRANSLATION_TIMEOUT_MS || 45000));
  const system = `You are a professional greenhouse-industry translator. Translate Chinese JSON values into ${targetLang}. Preserve JSON keys, arrays, HTML tags, URLs, numbers and units. Return JSON only. Use consistent technical terminology.`;
  try {
    const response = await fetch(`${base}/chat/completions`, {
      method:'POST', signal:controller.signal,
      headers:{ 'Content-Type':'application/json', ...(process.env.TRANSLATION_API_KEY ? { Authorization:`Bearer ${process.env.TRANSLATION_API_KEY}` } : {}) },
      body:JSON.stringify({ model:process.env.TRANSLATION_MODEL, temperature:0.15, response_format:{ type:'json_object' },
        messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(source)}] }),
    });
    if (!response.ok) throw new Error(`Translation API HTTP ${response.status}`);
    const data = await response.json();
    return safeJson(data.choices?.[0]?.message?.content);
  } finally { clearTimeout(timer); }
}

async function saveTranslation(entityType, entityId, lang, translated) {
  if (entityType === 'product') {
    const features = Array.isArray(translated.features) ? translated.features : [];
    return query(`INSERT INTO product_translations(product_id,lang,name,description,features,is_locked)
      VALUES($1,$2,$3,$4,$5,false) ON CONFLICT(product_id,lang) DO UPDATE SET name=$3,description=$4,features=$5
      WHERE product_translations.is_locked=false`,
      [entityId,lang,translated.name||'',translated.description||'',JSON.stringify(features)]);
  }
  if (entityType === 'case') return query(`INSERT INTO case_translations(case_id,lang,title,description,is_locked)
    VALUES($1,$2,$3,$4,false) ON CONFLICT(case_id,lang) DO UPDATE SET title=$3,description=$4
    WHERE case_translations.is_locked=false`,
    [entityId,lang,translated.title||'',translated.description||'']);
  return query(`INSERT INTO article_translations(article_id,lang,title,summary,content,is_locked)
    VALUES($1,$2,$3,$4,$5,false) ON CONFLICT(article_id,lang) DO UPDATE SET title=$3,summary=$4,content=$5
    WHERE article_translations.is_locked=false`,
    [entityId,lang,translated.title||'',translated.summary||'',translated.content||'']);
}

let working = false;
async function processOne() {
  if (working || !configured()) return;
  working = true;
  let job;
  try {
    const { rows } = await query(`UPDATE translation_jobs SET status='processing',attempts=attempts+1,updated_at=NOW()
      WHERE id=(SELECT id FROM translation_jobs WHERE status IN ('pending','failed','waiting_config') AND attempts<3 ORDER BY updated_at LIMIT 1 FOR UPDATE SKIP LOCKED)
      RETURNING *`);
    job = rows[0];
    if (!job) return;
    const source = await sourceFor(job.entity_type, job.entity_id);
    const translated = await callProvider(source, job.target_lang);
    await saveTranslation(job.entity_type, job.entity_id, job.target_lang, translated);
    await query(`UPDATE translation_jobs SET status='success',last_error=NULL,completed_at=NOW(),updated_at=NOW() WHERE id=$1`, [job.id]);
  } catch (error) {
    console.error('[translation]', error.message);
    if (job) await query(`UPDATE translation_jobs SET status='failed',last_error=$2,updated_at=NOW() WHERE id=$1`, [job.id,String(error.message).slice(0,1000)]);
  } finally { working = false; }
}

function startWorker() {
  if (!configured()) console.warn('⚠️  自动翻译未配置，翻译任务将保留为 waiting_config');
  setInterval(processOne, Number(process.env.TRANSLATION_POLL_MS || 5000)).unref();
  setTimeout(processOne, 1000).unref();
}

async function translateCalculatorItem(id, labelZh) {
  if (!configured() || !labelZh) return;
  for (const lang of TARGETS) {
    try {
      const translated=await callProvider({label:labelZh},lang);
      const column={en:'label_en',ru:'label_ru',ar:'label_ar'}[lang];
      await query(`UPDATE calculator_items SET ${column}=COALESCE(NULLIF(${column},''),$2),updated_at=NOW() WHERE id=$1`,[id,translated.label||'']);
    } catch(error) { console.error('[calculator-translation]',lang,error.message); }
  }
}

async function backfill(entityType) {
  const types = entityType ? [entityType] : Object.keys(TABLES);
  let count = 0;
  for (const type of types) {
    if (!TABLES[type]) continue;
    const cfg = TABLES[type];
    const { rows } = await query(`SELECT ${cfg.idColumn} AS id FROM ${cfg.sourceTable} WHERE lang='zh'`);
    for (const row of rows) {
      await enqueue(type, row.id, false);
      const pending = await query(`SELECT COUNT(*)::int AS count FROM translation_jobs
        WHERE entity_type=$1 AND entity_id=$2 AND status<>'success'`, [type, row.id]);
      count += pending.rows[0].count;
    }
  }
  return { count, configured:configured() };
}

module.exports = { enqueue, backfill, configured, startWorker, translateCalculatorItem, TARGETS };
