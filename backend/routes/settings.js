const express = require('express');
const router = express.Router();
const { query } = require('../config/database');

router.get('/', async (req, res) => {
  try {
    const publicKeys = ['company_name','company_phone','company_email','company_address',
      'wechat','working_hours','site_title','site_description'];
    const result = await query('SELECT key, value FROM site_settings WHERE key = ANY($1)', [publicKeys]);
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json({ data: settings });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
