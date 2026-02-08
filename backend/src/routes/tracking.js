const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, query, validationResult } = require('express-validator');
const { getDb } = require('../utils/database');
const { authenticate, checkBabyAccess } = require('../middleware/auth');
const { checkGoalsAndNotify } = require('../services/notifications');

const router = express.Router();

// ========== FEEDINGS ==========

// Log a feeding
router.post('/feedings', authenticate, [
  body('baby_id').notEmpty(),
  body('type').isIn(['breast', 'bottle', 'formula', 'mixed']),
  body('started_at').isISO8601(),
  body('amount_oz').optional().isFloat({ min: 0 }),
  body('duration_minutes').optional().isInt({ min: 0 }),
  body('side').optional().isIn(['left', 'right', 'both']),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, type, started_at, ended_at, amount_oz, duration_minutes, side, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO feedings (id, baby_id, recorded_by, type, amount_oz, duration_minutes, side, notes, started_at, ended_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, type, amount_oz || null, duration_minutes || null, side || null, notes || null, started_at, ended_at || null);

  const feeding = db.prepare('SELECT * FROM feedings WHERE id = ?').get(id);

  // Check goals asynchronously
  checkGoalsAndNotify(baby_id, 'feeding_oz');

  res.status(201).json({ feeding });
});

// Get feedings for a baby
router.get('/feedings/:babyId', authenticate, [
  query('date').optional().isDate(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  let sql = 'SELECT f.*, u.name as recorded_by_name FROM feedings f JOIN users u ON u.id = f.recorded_by WHERE f.baby_id = ?';
  const params = [req.params.babyId];

  if (req.query.date) {
    sql += ' AND date(f.started_at) = ?';
    params.push(req.query.date);
  } else if (req.query.from && req.query.to) {
    sql += ' AND f.started_at >= ? AND f.started_at <= ?';
    params.push(req.query.from, req.query.to);
  }

  sql += ' ORDER BY f.started_at DESC';

  if (req.query.limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(req.query.limit));
  }

  const feedings = db.prepare(sql).all(...params);

  // Daily total
  const dailyTotal = db.prepare(`
    SELECT COALESCE(SUM(amount_oz), 0) as total_oz, COUNT(*) as count
    FROM feedings WHERE baby_id = ? AND date(started_at) = date('now')
  `).get(req.params.babyId);

  res.json({ feedings, daily_total: dailyTotal });
});

// Delete feeding
router.delete('/feedings/:id', authenticate, (req, res) => {
  const db = getDb();
  const feeding = db.prepare('SELECT * FROM feedings WHERE id = ?').get(req.params.id);
  if (!feeding) return res.status(404).json({ error: 'No encontrado' });

  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(feeding.baby_id);
  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);

  if (!member) return res.status(403).json({ error: 'Sin acceso' });
  const perms = JSON.parse(member.permissions || '[]');
  if (!perms.includes('write') && !perms.includes('admin')) return res.status(403).json({ error: 'Sin permisos' });

  db.prepare('DELETE FROM feedings WHERE id = ?').run(req.params.id);
  res.json({ message: 'Eliminado' });
});

// ========== SLEEP ==========

router.post('/sleep', authenticate, [
  body('baby_id').notEmpty(),
  body('started_at').isISO8601(),
  body('quality').optional().isIn(['good', 'fair', 'poor', 'restless']),
  body('location').optional().isIn(['crib', 'bed', 'stroller', 'car_seat', 'arms', 'other']),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, started_at, ended_at, quality, location, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO sleep_records (id, baby_id, recorded_by, started_at, ended_at, quality, location, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, started_at, ended_at || null, quality || null, location || null, notes || null);

  const record = db.prepare('SELECT * FROM sleep_records WHERE id = ?').get(id);

  if (ended_at) {
    checkGoalsAndNotify(baby_id, 'sleep_hours');
  }

  res.status(201).json({ sleep: record });
});

// End sleep (update with ended_at)
router.patch('/sleep/:id/end', authenticate, [
  body('ended_at').isISO8601(),
  body('quality').optional().isIn(['good', 'fair', 'poor', 'restless']),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const db = getDb();
  const record = db.prepare('SELECT * FROM sleep_records WHERE id = ?').get(req.params.id);
  if (!record) return res.status(404).json({ error: 'No encontrado' });

  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(record.baby_id);
  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const { ended_at, quality } = req.body;
  db.prepare(`
    UPDATE sleep_records SET ended_at = ?, quality = COALESCE(?, quality) WHERE id = ?
  `).run(ended_at, quality || null, req.params.id);

  checkGoalsAndNotify(record.baby_id, 'sleep_hours');

  const updated = db.prepare('SELECT * FROM sleep_records WHERE id = ?').get(req.params.id);
  res.json({ sleep: updated });
});

router.get('/sleep/:babyId', authenticate, [
  query('date').optional().isDate(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  let sql = 'SELECT s.*, u.name as recorded_by_name FROM sleep_records s JOIN users u ON u.id = s.recorded_by WHERE s.baby_id = ?';
  const params = [req.params.babyId];

  if (req.query.date) {
    sql += ' AND date(s.started_at) = ?';
    params.push(req.query.date);
  }

  sql += ' ORDER BY s.started_at DESC';
  if (req.query.limit) { sql += ' LIMIT ?'; params.push(parseInt(req.query.limit)); }

  const records = db.prepare(sql).all(...params);

  const dailyTotal = db.prepare(`
    SELECT COALESCE(SUM(
      CASE WHEN ended_at IS NOT NULL 
        THEN (julianday(ended_at) - julianday(started_at)) * 24 
        ELSE 0 END), 0) as total_hours,
      COUNT(*) as count
    FROM sleep_records WHERE baby_id = ? AND date(started_at) = date('now')
  `).get(req.params.babyId);

  res.json({ sleep_records: records, daily_total: dailyTotal });
});

// ========== MEALS ==========

router.post('/meals', authenticate, [
  body('baby_id').notEmpty(),
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']),
  body('foods').notEmpty(),
  body('recorded_at').isISO8601(),
  body('amount').optional().isIn(['none', 'little', 'half', 'most', 'all']),
  body('reaction').optional().isIn(['loved', 'liked', 'neutral', 'disliked', 'refused']),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, meal_type, foods, recorded_at, amount, reaction, allergen_alert, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO meals (id, baby_id, recorded_by, meal_type, foods, amount, reaction, allergen_alert, notes, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, meal_type, foods, amount || null, reaction || null, allergen_alert ? 1 : 0, notes || null, recorded_at);

  const meal = db.prepare('SELECT * FROM meals WHERE id = ?').get(id);
  res.status(201).json({ meal });
});

router.get('/meals/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  let sql = 'SELECT m.*, u.name as recorded_by_name FROM meals m JOIN users u ON u.id = m.recorded_by WHERE m.baby_id = ?';
  const params = [req.params.babyId];

  if (req.query.date) { sql += ' AND date(m.recorded_at) = ?'; params.push(req.query.date); }
  sql += ' ORDER BY m.recorded_at DESC';
  if (req.query.limit) { sql += ' LIMIT ?'; params.push(parseInt(req.query.limit)); }

  const meals = db.prepare(sql).all(...params);
  res.json({ meals });
});

// ========== SYMPTOMS ==========

router.post('/symptoms', authenticate, [
  body('baby_id').notEmpty(),
  body('symptom_type').notEmpty(),
  body('recorded_at').isISO8601(),
  body('severity').optional().isIn(['mild', 'moderate', 'severe']),
  body('temperature').optional().isFloat({ min: 30, max: 45 }),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, symptom_type, recorded_at, severity, temperature, description } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO symptoms (id, baby_id, recorded_by, symptom_type, severity, temperature, description, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, symptom_type, severity || null, temperature || null, description || null, recorded_at);

  const symptom = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(id);
  res.status(201).json({ symptom });
});

router.get('/symptoms/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const symptoms = db.prepare(`
    SELECT s.*, u.name as recorded_by_name FROM symptoms s
    JOIN users u ON u.id = s.recorded_by WHERE s.baby_id = ?
    ORDER BY s.recorded_at DESC LIMIT ?
  `).all(req.params.babyId, parseInt(req.query.limit) || 50);

  res.json({ symptoms });
});

// Resolve symptom
router.patch('/symptoms/:id/resolve', authenticate, (req, res) => {
  const db = getDb();
  const symptom = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(req.params.id);
  if (!symptom) return res.status(404).json({ error: 'No encontrado' });

  db.prepare('UPDATE symptoms SET resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(req.params.id);
  res.json({ symptom: updated });
});

// ========== ILLNESSES ==========

router.post('/illnesses', authenticate, [
  body('baby_id').notEmpty(),
  body('name').notEmpty(),
  body('started_at').isISO8601(),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, name, started_at, diagnosis, doctor_name, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO illnesses (id, baby_id, recorded_by, name, diagnosis, doctor_name, started_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, name, diagnosis || null, doctor_name || null, started_at, notes || null);

  const illness = db.prepare('SELECT * FROM illnesses WHERE id = ?').get(id);
  res.status(201).json({ illness });
});

router.get('/illnesses/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const illnesses = db.prepare(`
    SELECT i.*, u.name as recorded_by_name,
      (SELECT json_group_array(json_object('id', m.id, 'name', m.name, 'dosage', m.dosage, 'administered_at', m.administered_at))
       FROM medicines m WHERE m.illness_id = i.id) as medicines
    FROM illnesses i
    JOIN users u ON u.id = i.recorded_by WHERE i.baby_id = ?
    ORDER BY i.started_at DESC
  `).all(req.params.babyId);

  res.json({ illnesses });
});

// Resolve illness
router.patch('/illnesses/:id/resolve', authenticate, (req, res) => {
  const db = getDb();
  db.prepare('UPDATE illnesses SET resolved_at = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  const updated = db.prepare('SELECT * FROM illnesses WHERE id = ?').get(req.params.id);
  res.json({ illness: updated });
});

// ========== MEDICINES ==========

router.post('/medicines', authenticate, [
  body('baby_id').notEmpty(),
  body('name').notEmpty(),
  body('dosage').notEmpty(),
  body('dosage_unit').notEmpty(),
  body('administered_at').isISO8601(),
  body('illness_id').optional(),
  body('frequency').optional(),
  body('next_dose_at').optional().isISO8601(),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, name, dosage, dosage_unit, administered_at, illness_id, frequency, next_dose_at, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO medicines (id, baby_id, recorded_by, illness_id, name, dosage, dosage_unit, frequency, administered_at, next_dose_at, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, illness_id || null, name, dosage, dosage_unit, frequency || null, administered_at, next_dose_at || null, notes || null);

  const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
  res.status(201).json({ medicine });
});

router.get('/medicines/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const medicines = db.prepare(`
    SELECT m.*, u.name as recorded_by_name, i.name as illness_name
    FROM medicines m
    JOIN users u ON u.id = m.recorded_by
    LEFT JOIN illnesses i ON i.id = m.illness_id
    WHERE m.baby_id = ?
    ORDER BY m.administered_at DESC LIMIT ?
  `).all(req.params.babyId, parseInt(req.query.limit) || 50);

  res.json({ medicines });
});

// ========== MOODS ==========

router.post('/moods', authenticate, [
  body('baby_id').notEmpty(),
  body('mood').isIn(['happy', 'calm', 'fussy', 'crying', 'sleepy', 'playful', 'irritable', 'sick']),
  body('recorded_at').isISO8601(),
  body('intensity').optional().isInt({ min: 1, max: 5 }),
], checkBabyAccess(['write']), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { baby_id, mood, recorded_at, intensity, context, notes } = req.body;
  const db = getDb();
  const id = uuidv4();

  db.prepare(`
    INSERT INTO moods (id, baby_id, recorded_by, mood, intensity, context, notes, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, baby_id, req.user.id, mood, intensity || null, context || null, notes || null, recorded_at);

  const record = db.prepare('SELECT * FROM moods WHERE id = ?').get(id);
  res.status(201).json({ mood: record });
});

router.get('/moods/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  let sql = 'SELECT m.*, u.name as recorded_by_name FROM moods m JOIN users u ON u.id = m.recorded_by WHERE m.baby_id = ?';
  const params = [req.params.babyId];

  if (req.query.date) { sql += ' AND date(m.recorded_at) = ?'; params.push(req.query.date); }
  sql += ' ORDER BY m.recorded_at DESC LIMIT ?';
  params.push(parseInt(req.query.limit) || 50);

  const moods = db.prepare(sql).all(...params);
  res.json({ moods });
});

// ========== DAILY SUMMARY ==========

router.get('/summary/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const date = req.query.date || new Date().toISOString().split('T')[0];

  const summary = {
    date,
    baby: { id: baby.id, name: baby.name },
    feedings: db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount_oz), 0) as total_oz,
             COALESCE(SUM(duration_minutes), 0) as total_minutes
      FROM feedings WHERE baby_id = ? AND date(started_at) = ?
    `).get(baby.id, date),
    sleep: db.prepare(`
      SELECT COUNT(*) as count,
             COALESCE(SUM(
               CASE WHEN ended_at IS NOT NULL 
                 THEN (julianday(ended_at) - julianday(started_at)) * 24 
                 ELSE 0 END), 0) as total_hours
      FROM sleep_records WHERE baby_id = ? AND date(started_at) = ?
    `).get(baby.id, date),
    meals: db.prepare(`
      SELECT COUNT(*) as count FROM meals WHERE baby_id = ? AND date(recorded_at) = ?
    `).get(baby.id, date),
    symptoms: db.prepare(`
      SELECT COUNT(*) as count FROM symptoms WHERE baby_id = ? AND date(recorded_at) = ? AND resolved_at IS NULL
    `).get(baby.id, date),
    medicines: db.prepare(`
      SELECT COUNT(*) as count FROM medicines WHERE baby_id = ? AND date(administered_at) = ?
    `).get(baby.id, date),
    moods: db.prepare(`
      SELECT mood, COUNT(*) as count FROM moods
      WHERE baby_id = ? AND date(recorded_at) = ?
      GROUP BY mood ORDER BY count DESC
    `).all(baby.id, date),
    goals: db.prepare('SELECT * FROM daily_goals WHERE baby_id = ? AND is_active = 1').all(baby.id),
  };

  // Calculate goal progress
  summary.goal_progress = summary.goals.map(goal => {
    let current = 0;
    if (goal.goal_type === 'feeding_oz') current = summary.feedings.total_oz;
    else if (goal.goal_type === 'sleep_hours') current = summary.sleep.total_hours;
    else if (goal.goal_type === 'meals_count') current = summary.meals.count;

    return {
      ...goal,
      current_value: Math.round(current * 100) / 100,
      percentage: Math.min(100, Math.round((current / goal.target_value) * 100)),
      met: current >= goal.target_value
    };
  });

  res.json({ summary });
});

// ========== HISTORY / TIMELINE ==========

router.get('/timeline/:babyId', authenticate, (req, res) => {
  const db = getDb();
  const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(req.params.babyId);
  if (!baby) return res.status(404).json({ error: 'Bebé no encontrado' });

  const member = db.prepare(`
    SELECT * FROM family_members WHERE family_id = ? AND user_id = ? AND is_active = 1
  `).get(baby.family_id, req.user.id);
  if (!member) return res.status(403).json({ error: 'Sin acceso' });

  const limit = parseInt(req.query.limit) || 20;
  const date = req.query.date || new Date().toISOString().split('T')[0];

  // Build a unified timeline
  const events = [];

  const feedings = db.prepare(`
    SELECT 'feeding' as event_type, id, started_at as event_time, type, amount_oz, duration_minutes
    FROM feedings WHERE baby_id = ? AND date(started_at) = ?
  `).all(baby.id, date);
  events.push(...feedings);

  const sleeps = db.prepare(`
    SELECT 'sleep' as event_type, id, started_at as event_time, ended_at, quality, location
    FROM sleep_records WHERE baby_id = ? AND date(started_at) = ?
  `).all(baby.id, date);
  events.push(...sleeps);

  const meals = db.prepare(`
    SELECT 'meal' as event_type, id, recorded_at as event_time, meal_type, foods, amount, reaction
    FROM meals WHERE baby_id = ? AND date(recorded_at) = ?
  `).all(baby.id, date);
  events.push(...meals);

  const symptoms = db.prepare(`
    SELECT 'symptom' as event_type, id, recorded_at as event_time, symptom_type, severity, temperature
    FROM symptoms WHERE baby_id = ? AND date(recorded_at) = ?
  `).all(baby.id, date);
  events.push(...symptoms);

  const medicines = db.prepare(`
    SELECT 'medicine' as event_type, id, administered_at as event_time, name, dosage, dosage_unit
    FROM medicines WHERE baby_id = ? AND date(administered_at) = ?
  `).all(baby.id, date);
  events.push(...medicines);

  const moods = db.prepare(`
    SELECT 'mood' as event_type, id, recorded_at as event_time, mood, intensity
    FROM moods WHERE baby_id = ? AND date(recorded_at) = ?
  `).all(baby.id, date);
  events.push(...moods);

  // Sort by time descending
  events.sort((a, b) => new Date(b.event_time) - new Date(a.event_time));

  res.json({ timeline: events.slice(0, limit), total: events.length, date });
});

module.exports = router;
