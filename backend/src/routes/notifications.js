const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../utils/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  const limit = parseInt(req.query.limit) || 50;
  const unreadOnly = req.query.unread === 'true';

  let sql = `
    SELECT n.*, b.name as baby_name
    FROM notifications n
    LEFT JOIN babies b ON b.id = n.baby_id
    WHERE n.user_id = ?
  `;
  const params = [req.user.id];

  if (unreadOnly) {
    sql += ' AND n.is_read = 0';
  }

  sql += ' ORDER BY n.created_at DESC LIMIT ?';
  params.push(limit);

  const notifications = db.prepare(sql).all(...params);

  const unreadCount = db.prepare(`
    SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({ notifications, unread_count: unreadCount.count });
});

// Mark notification as read
router.patch('/:id/read', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.user.id);
  res.json({ message: 'Marcada como leída' });
});

// Mark all as read
router.patch('/read-all', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0')
    .run(req.user.id);
  res.json({ message: 'Todas marcadas como leídas' });
});

// Register push token
router.post('/push-token', authenticate, [
  body('token').notEmpty(),
  body('platform').isIn(['ios', 'android', 'alexa']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { token, platform } = req.body;
  const db = getDb();

  // Upsert token
  const existing = db.prepare('SELECT * FROM push_tokens WHERE user_id = ? AND token = ?')
    .get(req.user.id, token);

  if (!existing) {
    db.prepare(`
      INSERT INTO push_tokens (id, user_id, token, platform) VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.user.id, token, platform);
  }

  res.json({ message: 'Token registrado' });
});

// Remove push token
router.delete('/push-token/:token', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM push_tokens WHERE user_id = ? AND token = ?')
    .run(req.user.id, req.params.token);
  res.json({ message: 'Token eliminado' });
});

module.exports = router;
