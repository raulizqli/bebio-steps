const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../utils/database');

/**
 * Check daily goals and create notifications if goals are not being met
 */
function checkGoalsAndNotify(babyId, goalType) {
  try {
    const db = getDb();

    const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(babyId);
    if (!baby) return;

    const goal = db.prepare(`
      SELECT * FROM daily_goals WHERE baby_id = ? AND goal_type = ? AND is_active = 1
    `).get(babyId, goalType);

    if (!goal) return;

    let currentValue = 0;
    const now = new Date();
    const hourOfDay = now.getHours();

    if (goalType === 'feeding_oz') {
      const result = db.prepare(`
        SELECT COALESCE(SUM(amount_oz), 0) as total
        FROM feedings WHERE baby_id = ? AND date(started_at) = date('now')
      `).get(babyId);
      currentValue = result.total;
    } else if (goalType === 'sleep_hours') {
      const result = db.prepare(`
        SELECT COALESCE(SUM(
          CASE WHEN ended_at IS NOT NULL 
            THEN (julianday(ended_at) - julianday(started_at)) * 24 
            ELSE 0 END), 0) as total
        FROM sleep_records WHERE baby_id = ? AND date(started_at) = date('now')
      `).get(babyId);
      currentValue = result.total;
    }

    const percentage = (currentValue / goal.target_value) * 100;

    // Expected progress based on time of day (linear approximation)
    const expectedPercentage = (hourOfDay / 24) * 100;

    // Only notify if significantly behind and it's past noon
    if (hourOfDay >= 12 && percentage < expectedPercentage * 0.5) {
      const type = goalType === 'feeding_oz' ? 'feeding_goal_alert' : 'sleep_goal_alert';
      const title = goalType === 'feeding_oz'
        ? `${baby.name}: Meta de alimentación`
        : `${baby.name}: Meta de sueño`;
      const message = goalType === 'feeding_oz'
        ? `${baby.name} ha tomado ${currentValue.toFixed(1)} oz de ${goal.target_value} oz hoy (${percentage.toFixed(0)}%)`
        : `${baby.name} ha dormido ${currentValue.toFixed(1)} hrs de ${goal.target_value} hrs hoy (${percentage.toFixed(0)}%)`;

      // Check if we already sent this type of notification today
      const existingNotification = db.prepare(`
        SELECT * FROM notifications
        WHERE baby_id = ? AND type = ? AND date(created_at) = date('now')
        ORDER BY created_at DESC LIMIT 1
      `).get(babyId, type);

      // Don't spam - max one notification per type per 4 hours
      if (existingNotification) {
        const lastNotifTime = new Date(existingNotification.created_at);
        const hoursSinceLastNotif = (now - lastNotifTime) / (1000 * 60 * 60);
        if (hoursSinceLastNotif < 4) return;
      }

      // Notify all family members (parents)
      const parents = db.prepare(`
        SELECT fm.user_id FROM family_members fm
        WHERE fm.family_id = ? AND fm.role = 'parent' AND fm.is_active = 1
      `).all(baby.family_id);

      const insertNotification = db.prepare(`
        INSERT INTO notifications (id, user_id, baby_id, type, title, message, data)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        for (const parent of parents) {
          insertNotification.run(
            uuidv4(), parent.user_id, babyId, type, title, message,
            JSON.stringify({ goal_type: goalType, current: currentValue, target: goal.target_value, percentage })
          );
        }
      });

      transaction();
    }
  } catch (error) {
    console.error('Goal notification error:', error);
  }
}

/**
 * Run end-of-day goal check for all babies
 */
function runDailyGoalCheck() {
  try {
    const db = getDb();
    const babies = db.prepare('SELECT id FROM babies').all();

    for (const baby of babies) {
      checkGoalsAndNotify(baby.id, 'feeding_oz');
      checkGoalsAndNotify(baby.id, 'sleep_hours');
    }
  } catch (error) {
    console.error('Daily goal check error:', error);
  }
}

/**
 * Create a custom notification for a user
 */
function createNotification(userId, babyId, type, title, message, data = null) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO notifications (id, user_id, baby_id, type, title, message, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), userId, babyId, type, title, message, data ? JSON.stringify(data) : null);
  } catch (error) {
    console.error('Create notification error:', error);
  }
}

module.exports = { checkGoalsAndNotify, runDailyGoalCheck, createNotification };
