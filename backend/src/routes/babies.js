const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../utils/database');
const { authenticate, checkFamilyAccess } = require('../middleware/auth');

const router = express.Router();

// Create baby
router.post('/', authenticate, [
  body('family_id').notEmpty(),
  body('name').trim().notEmpty(),
  body('birth_date').isDate(),
  body('gender').optional().isIn(['male', 'female', 'other']),
  body('weight_at_birth').optional().isFloat({ min: 0 }),
  body('height_at_birth').optional().isFloat({ min: 0 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { family_id, name, birth_date, gender, weight_at_birth, height_at_birth } = req.body;
  const db = getDb();

  // Check family access with write permission
  const member = db.prepare(`
    SELECT * FROM family_members
    WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(family_id, req.user.id);

  if (!member) {
    return res.status(403).json({ error: 'No tienes acceso a esta familia' });
  }

  const permissions = JSON.parse(member.permissions || '[]');
  if (!permissions.includes('write') && !permissions.includes('admin')) {
    return res.status(403).json({ error: 'No tienes permisos de escritura' });
  }

  const babyId = uuidv4();
  db.prepare(`
    INSERT INTO babies (id, family_id, name, birth_date, gender, weight_at_birth, height_at_birth)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(babyId, family_id, name, birth_date, gender || null, weight_at_birth || null, height_at_birth || null);

  // Create default goals
  const insertGoal = db.prepare(`
    INSERT INTO daily_goals (id, baby_id, goal_type, target_value) VALUES (?, ?, ?, ?)
  `);

  const goalTransaction = db.transaction(() => {
    insertGoal.run(uuidv4(), babyId, 'sleep_hours', 14); // Default 14 hours for newborn
    insertGoal.run(uuidv4(), babyId, 'feeding_oz', 24); // Default 24 oz per day
  });

  goalTransaction();

  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(babyId);
  res.status(201).json({ baby });
});

// List babies for a family
router.get('/family/:familyId', authenticate, checkFamilyAccess(['read']), (req, res) => {
  const db = getDb();
  const babies = db.prepare(`
    SELECT b.*, 
           (SELECT COUNT(*) FROM feedings WHERE baby_id = b.id AND date(started_at) = date('now')) as feedings_today,
           (SELECT COALESCE(SUM(amount_oz), 0) FROM feedings WHERE baby_id = b.id AND date(started_at) = date('now')) as oz_today,
           (SELECT COALESCE(SUM(
             CASE WHEN ended_at IS NOT NULL 
               THEN (julianday(ended_at) - julianday(started_at)) * 24 
               ELSE 0 
             END), 0) FROM sleep_records WHERE baby_id = b.id AND date(started_at) = date('now')) as sleep_hours_today
    FROM babies b
    WHERE b.family_id = ?
    ORDER BY b.birth_date DESC
  `).all(req.params.familyId);

  res.json({ babies });
});

// Get baby details
router.get('/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);

  if (!baby) {
    return res.status(404).json({ error: 'Bebé no encontrado' });
  }

  // Check access
  const member = db.prepare(`
    SELECT * FROM family_members
    WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);

  if (!member) {
    return res.status(403).json({ error: 'No tienes acceso' });
  }

  // Get goals
  const goals = db.prepare('SELECT * FROM daily_goals WHERE baby_id = ? AND is_active = 1').all(baby.id);

  // Get today's summary
  const todaySummary = {
    feedings: db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount_oz), 0) as total_oz,
             COALESCE(SUM(duration_minutes), 0) as total_minutes
      FROM feedings WHERE baby_id = ? AND date(started_at) = date('now')
    `).get(baby.id),
    sleep: db.prepare(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(
               CASE WHEN ended_at IS NOT NULL 
                 THEN (julianday(ended_at) - julianday(started_at)) * 24 
                 ELSE 0 
               END), 0) as total_hours
      FROM sleep_records WHERE baby_id = ? AND date(started_at) = date('now')
    `).get(baby.id),
    meals: db.prepare(`
      SELECT COUNT(*) as count FROM meals WHERE baby_id = ? AND date(recorded_at) = date('now')
    `).get(baby.id),
    moods: db.prepare(`
      SELECT mood, COUNT(*) as count FROM moods
      WHERE baby_id = ? AND date(recorded_at) = date('now')
      GROUP BY mood ORDER BY count DESC LIMIT 1
    `).get(baby.id),
  };

  res.json({ baby, goals, today: todaySummary });
});

// Update baby
router.put('/:babyId', authenticate, [
  body('name').optional().trim().notEmpty(),
  body('birth_date').optional().isDate(),
], (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);

  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members
    WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);

  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const permissions = JSON.parse(member.permissions || '[]');
  if (!permissions.includes('write') && !permissions.includes('admin')) {
    return res.status(403).json({ error: 'Sin permisos de escritura' });
  }

  const { name, birth_date, gender, weight_at_birth, height_at_birth } = req.body;
  const updates = [];
  const values = [];

  if (name) { updates.push('name = ?'); values.push(name); }
  if (birth_date) { updates.push('birth_date = ?'); values.push(birth_date); }
  if (gender) { updates.push('gender = ?'); values.push(gender); }
  if (weight_at_birth) { updates.push('weight_at_birth = ?'); values.push(weight_at_birth); }
  if (height_at_birth) { updates.push('height_at_birth = ?'); values.push(height_at_birth); }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.babyId);
    db.prepare(`UPDATE babies SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const updated = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  res.json({ baby: updated });
});

// Set daily goals
router.post('/:babyId/goals', authenticate, [
  body('goal_type').isIn(['sleep_hours', 'feeding_oz', 'meals_count']),
  body('target_value').isFloat({ min: 0 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { goal_type, target_value } = req.body;
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);

  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members
    WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);

  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const permissions = JSON.parse(member.permissions || '[]');
  if (!permissions.includes('write') && !permissions.includes('admin')) {
    return res.status(403).json({ error: 'Sin permisos' });
  }

  // Upsert goal
  const existing = db.prepare(`
    SELECT * FROM daily_goals WHERE baby_id = ? AND goal_type = ?
  `).get(req.params.babyId, goal_type);

  if (existing) {
    db.prepare(`
      UPDATE daily_goals SET target_value = ?, is_active = 1, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(target_value, existing.id);
  } else {
    db.prepare(`
      INSERT INTO daily_goals (id, baby_id, goal_type, target_value) VALUES (?, ?, ?, ?)
    `).run(uuidv4(), req.params.babyId, goal_type, target_value);
  }

  res.json({ message: 'Meta actualizada' });
});

module.exports = router;
