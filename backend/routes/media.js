const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, requireRole, ROLES } = require('../middleware/auth');

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.mimetype.startsWith('image/') ? 'images' : 'videos';
    const dir = path.join(uploadDir, type);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const extensionByMime = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
      'video/mp4': '.mp4', 'video/webm': '.webm',
    };
    const ext = extensionByMime[file.mimetype];
    if (!ext) return cb(new Error('File type not allowed'));
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

// POST /api/media/upload
router.post('/upload', authenticate, requireRole(ROLES.EDIT), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const type = req.file.mimetype.startsWith('image/') ? 'images' : 'videos';
    const url = `/uploads/${type}/${req.file.filename}`;

    const result = await query(
      'INSERT INTO media (filename, original_name, file_type, mime_type, file_size, url, uploaded_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, url',
      [req.file.filename, req.file.originalname, type.slice(0, -1), req.file.mimetype, req.file.size, url, req.user.id]
    );

    res.json({ id: result.rows[0].id, url: result.rows[0].url, filename: req.file.filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// GET /api/media
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const params = type ? [type, limit, offset] : [limit, offset];
    const where = type ? 'WHERE file_type = $1' : '';

    const result = await query(
      `SELECT id, filename, original_name, file_type, file_size, url, created_at FROM media ${where} ORDER BY created_at DESC LIMIT $${type ? 2 : 1} OFFSET $${type ? 3 : 2}`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/media/:id
router.delete('/:id', authenticate, requireRole(ROLES.EDIT), async (req, res) => {
  try {
    const result = await query('SELECT * FROM media WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });

    const file = result.rows[0];
    const filePath = path.join(__dirname, '..', file.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await query('DELETE FROM media WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
