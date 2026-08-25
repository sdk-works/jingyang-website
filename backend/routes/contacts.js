/**
 * 客户咨询路由 - POST /api/contact
 * 修复：无DB时也返回成功（数据存内存日志），错误信息统一
 */
const express = require('express');
const router  = express.Router();
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const { query }  = require('../config/database');

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST,
    port:   parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

router.post('/', [
  body('name').trim().notEmpty().withMessage('姓名不能为空').isLength({ max: 200 }),
  body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('邮箱格式不正确'),
  body('phone').trim().optional({ checkFalsy: true }).isLength({ max: 50 }),
  body('message').trim().optional({ checkFalsy: true }).isLength({ max: 2000 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { name, country, phone, email, greenhouse_type, area, message } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
             || req.socket?.remoteAddress || null;

    let contactId = null;
    try {
      const result = await query(
        `INSERT INTO contacts (name, country, phone, email, greenhouse_type, area, message, status, source, ip_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'new','website',$8) RETURNING id`,
        [name, country||null, phone||null, email||null,
         greenhouse_type||null, area ? parseFloat(area) : null, message||null, ip]
      );
      contactId = result.rows[0].id;
      console.log(`📋 新咨询已存库: ${name} [${contactId}]`);
    } catch (dbErr) {
      // DB 不可用时，写入日志但仍返回成功，避免用户重复提交
      console.error('⚠️  DB写入失败，记录到日志:', dbErr.message);
      console.log('📋 咨询内容:', { name, country, phone, email, greenhouse_type, area, message });
    }

    // 异步发邮件
    sendEmailNotification({ name, country, phone, email, greenhouse_type, area, message }).catch(e => {
      console.error('📧 邮件发送失败:', e.message);
    });

    return res.status(201).json({ success: true, message: '提交成功！我们将在24小时内联系您。', id: contactId });
  } catch (err) {
    console.error('Contact route error:', err);
    return res.status(500).json({ success: false, message: '服务器错误，请稍后重试' });
  }
});

router.get('/test', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

async function sendEmailNotification(data) {
  const transporter = createTransporter();
  if (!transporter) return;
  const to = process.env.SALES_EMAIL || process.env.SMTP_USER;
  if (!to) return;
  const { name, country, phone, email, greenhouse_type, area, message } = data;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: `【新咨询】${name} - ${greenhouse_type || '温室咨询'} - 京阳温室官网`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#1a3d2b,#2d6a4f);padding:24px;border-radius:12px 12px 0 0">
        <h2 style="color:#fff;margin:0">🌿 新客户咨询通知</h2>
        <p style="color:rgba(255,255,255,.8);margin:6px 0 0;font-size:13px">${new Date().toLocaleString('zh-CN')}</p>
      </div>
      <div style="background:#fff;padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#888;width:80px">姓名</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
          ${country ? `<tr><td style="padding:8px 0;color:#888">地区</td><td>${country}</td></tr>` : ''}
          ${phone   ? `<tr><td style="padding:8px 0;color:#888">电话</td><td><a href="tel:${phone}" style="color:#2d6a4f;font-weight:600">${phone}</a></td></tr>` : ''}
          ${email   ? `<tr><td style="padding:8px 0;color:#888">邮箱</td><td><a href="mailto:${email}">${email}</a></td></tr>` : ''}
          ${greenhouse_type ? `<tr><td style="padding:8px 0;color:#888">类型</td><td>${greenhouse_type}</td></tr>` : ''}
          ${area    ? `<tr><td style="padding:8px 0;color:#888">面积</td><td>${area} ㎡</td></tr>` : ''}
        </table>
        ${message ? `<div style="margin-top:16px;padding:14px;background:#f9fdf9;border-left:4px solid #2d6a4f;border-radius:4px"><strong>留言：</strong><br>${message.replace(/\n/g,'<br>')}</div>` : ''}
      </div>
    </div>`
  });
}

module.exports = router;
