/**
 * 温室预算计算器路由
 * 修复：增加 has_heating 支持；单价优先读数据库配置
 */
const express = require('express');
const router  = express.Router();
const { query } = require('../config/database');

const PRICE_RULES = {
  glass:        500,
  film:         120,
  pc:           350,
  'multi-span': 200,
  solar:        280,
  arch:         120,
};

const ADDON_RULES = {
  has_irrigation:    30,
  has_lighting:      50,
  has_cooling:       40,
  has_smart_control: 20,
  has_heating:       30,  // 新增升温系统
};

const RECOMMENDATIONS = {
  glass:        { zh:['配备天沟排水系统','建议安装内遮阳系统','推荐智能通风控制'],       en:['Gutter drainage system','Shade system recommended','Smart ventilation'] },
  film:         { zh:['建议安装滴灌系统','配备内保温幕帘','推荐简易环境控制器'],         en:['Drip irrigation recommended','Thermal screen','Simple environment controller'] },
  pc:           { zh:['双层PC板增强保温','建议安装遮阳网','推荐湿帘+风机降温'],          en:['Double-layer PC panel','Shade net recommended','Evaporative cooling'] },
  'multi-span': { zh:['统一智能化控制管理','配备完整水肥系统','建议安装天沟集水系统'],   en:['Unified smart control','Complete irrigation','Gutter collection recommended'] },
  solar:        { zh:['自动卷帘系统','配套补光系统','建议安装升温系统'],                 en:['Auto rolling screen','Supplemental lighting','Heating system recommended'] },
  arch:         { zh:['造价最低首选方案','可配套简易喷灌','适合季节性种植'],              en:['Most economical option','Simple irrigation','Good for seasonal crops'] },
};

// POST /api/calculator/calculate
router.post('/calculate', async (req, res) => {
  try {
    const {
      greenhouse_type, area,
      has_smart_control = false,
      has_irrigation    = false,
      has_lighting      = false,
      has_cooling       = false,
      has_heating       = false,   // 新增
      lang = 'zh'
    } = req.body;

    if (!greenhouse_type || !area) return res.status(400).json({ error: 'greenhouse_type and area are required' });
    if (!PRICE_RULES[greenhouse_type])   return res.status(400).json({ error: 'Invalid greenhouse type' });

    const areaNum = parseFloat(area);
    if (!Number.isFinite(areaNum) || areaNum <= 0 || areaNum > 10000000) {
      return res.status(400).json({ error: 'Area must be between 1 and 10000000 square meters' });
    }

    // 尝试从 DB 读取自定义单价
    let basePrice = PRICE_RULES[greenhouse_type];
    try {
      const { rows } = await query(
        "SELECT key,value FROM site_settings WHERE key = $1",
        [`calc_base_${greenhouse_type}`]
      );
      if (rows.length && parseFloat(rows[0].value) > 0) basePrice = parseFloat(rows[0].value);
    } catch {}

    let addons = 0;
    const addonDetails = [];
    const addonMap = { has_smart_control, has_irrigation, has_lighting, has_cooling, has_heating };
    for (const [k, v] of Object.entries(addonMap)) {
      if (v && ADDON_RULES[k]) {
        let price = ADDON_RULES[k];
        try {
          const { rows } = await query("SELECT value FROM site_settings WHERE key=$1", [`calc_addon_${k}`]);
          if (rows.length && parseFloat(rows[0].value) > 0) price = parseFloat(rows[0].value);
        } catch {}
        addons += price;
        addonDetails.push({ key: k.replace('has_',''), price });
      }
    }

    const pricePerSqm = basePrice + addons;
    const totalPrice  = Math.round(pricePerSqm * areaNum);
    const typeRecs    = RECOMMENDATIONS[greenhouse_type] || {};
    const recommendations = typeRecs[lang] || typeRecs.zh || [];

    // 保存记录（非阻塞）
    query(
      `INSERT INTO calculator_records
       (greenhouse_type,area,has_smart_control,has_irrigation,has_lighting,has_cooling,base_price_per_sqm,total_price,lang)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [greenhouse_type, areaNum, has_smart_control, has_irrigation, has_lighting, has_cooling, pricePerSqm, totalPrice, lang]
    ).catch(() => {});

    res.json({
      greenhouse_type, area: areaNum,
      base_price_per_sqm:  basePrice,
      addon_price_per_sqm: addons,
      total_price_per_sqm: pricePerSqm,
      total_price: totalPrice,
      currency: 'CNY',
      addon_details: addonDetails,
      recommendations,
    });
  } catch (err) {
    console.error('Calculator error:', err);
    res.status(500).json({ error: 'Calculation failed' });
  }
});

// POST /api/calculator/submit
router.post('/submit', async (req, res) => {
  try {
    const { record_id, name, email, phone, country } = req.body;
    if (record_id) {
      await query(
        'UPDATE calculator_records SET contact_name=$1,contact_email=$2,contact_phone=$3,country=$4,submitted=true WHERE id=$5',
        [name, email, phone, country, record_id]
      );
    }
    if (name && String(name).trim().length <= 200) {
      await query(
        'INSERT INTO contacts (name,email,phone,country,source) VALUES ($1,$2,$3,$4,$5)',
        [name, email, phone, country, 'calculator']
      );
    }
    if (!name) return res.status(400).json({ success:false, error:'Name is required' });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Server error' }); }
});

// GET /api/calculator/rules — 优先读数据库配置
router.get('/rules', async (req, res) => {
  try {
    const { rows } = await query("SELECT key,value FROM site_settings WHERE key LIKE 'calc_%'");
    const db = {};
    rows.forEach(r => { db[r.key] = parseFloat(r.value) || 0; });

    const base_prices = {
      glass:        db['calc_base_glass']         || PRICE_RULES.glass,
      pc:           db['calc_base_pc']            || PRICE_RULES.pc,
      solar:        db['calc_base_solar']         || PRICE_RULES.solar,
      'multi-span': db['calc_base_multi-span']    || PRICE_RULES['multi-span'],
      arch:         db['calc_base_arch']          || PRICE_RULES.arch,
    };
    const addon_prices = {
      has_irrigation:    db['calc_addon_has_irrigation']    || ADDON_RULES.has_irrigation,
      has_lighting:      db['calc_addon_has_lighting']      || ADDON_RULES.has_lighting,
      has_cooling:       db['calc_addon_has_cooling']       || ADDON_RULES.has_cooling,
      has_smart_control: db['calc_addon_has_smart_control'] || ADDON_RULES.has_smart_control,
      has_heating:       db['calc_addon_has_heating']       || ADDON_RULES.has_heating,
    };
    res.json({ base_prices, addon_prices, currency: 'CNY' });
  } catch {
    res.json({ base_prices: PRICE_RULES, addon_prices: ADDON_RULES, currency: 'CNY' });
  }
});

module.exports = router;
