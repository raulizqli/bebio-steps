const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'bebio.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initializeDatabase() {
  const database = getDb();

  database.exec(`
    -- Users table (parents, nannies, family)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'parent' CHECK(role IN ('parent', 'nanny', 'family')),
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Families table (groups parents together)
    CREATE TABLE IF NOT EXISTS families (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Family members (links users to families with roles)
    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('parent', 'nanny', 'family')),
      permissions TEXT DEFAULT '["read"]',
      expires_at DATETIME,
      is_active INTEGER DEFAULT 1,
      invited_by TEXT REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(family_id, user_id)
    );

    -- Sharing codes for inviting nannies/family
    CREATE TABLE IF NOT EXISTS sharing_codes (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('nanny', 'family')),
      permissions TEXT DEFAULT '["read"]',
      expires_at DATETIME NOT NULL,
      max_uses INTEGER DEFAULT 1,
      uses INTEGER DEFAULT 0,
      access_duration_hours INTEGER,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Babies table
    CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY,
      family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      birth_date DATE NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female', 'other')),
      weight_at_birth REAL,
      height_at_birth REAL,
      photo_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Feedings (tomas/bottles)
    CREATE TABLE IF NOT EXISTS feedings (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      type TEXT NOT NULL CHECK(type IN ('breast', 'bottle', 'formula', 'mixed')),
      amount_oz REAL,
      duration_minutes INTEGER,
      side TEXT CHECK(side IN ('left', 'right', 'both')),
      notes TEXT,
      started_at DATETIME NOT NULL,
      ended_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sleep records
    CREATE TABLE IF NOT EXISTS sleep_records (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      started_at DATETIME NOT NULL,
      ended_at DATETIME,
      quality TEXT CHECK(quality IN ('good', 'fair', 'poor', 'restless')),
      location TEXT CHECK(location IN ('crib', 'bed', 'stroller', 'car_seat', 'arms', 'other')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Meals (solid foods - when applicable)
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
      foods TEXT NOT NULL,
      amount TEXT CHECK(amount IN ('none', 'little', 'half', 'most', 'all')),
      reaction TEXT CHECK(reaction IN ('loved', 'liked', 'neutral', 'disliked', 'refused')),
      allergen_alert INTEGER DEFAULT 0,
      notes TEXT,
      recorded_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Symptoms
    CREATE TABLE IF NOT EXISTS symptoms (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      symptom_type TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
      temperature REAL,
      description TEXT,
      recorded_at DATETIME NOT NULL,
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Illnesses
    CREATE TABLE IF NOT EXISTS illnesses (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      diagnosis TEXT,
      doctor_name TEXT,
      started_at DATETIME NOT NULL,
      resolved_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Medicines
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      illness_id TEXT REFERENCES illnesses(id),
      name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      dosage_unit TEXT NOT NULL,
      frequency TEXT,
      administered_at DATETIME NOT NULL,
      next_dose_at DATETIME,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Mood tracking
    CREATE TABLE IF NOT EXISTS moods (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      recorded_by TEXT NOT NULL REFERENCES users(id),
      mood TEXT NOT NULL CHECK(mood IN ('happy', 'calm', 'fussy', 'crying', 'sleepy', 'playful', 'irritable', 'sick')),
      intensity INTEGER CHECK(intensity BETWEEN 1 AND 5),
      context TEXT,
      notes TEXT,
      recorded_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Daily goals
    CREATE TABLE IF NOT EXISTS daily_goals (
      id TEXT PRIMARY KEY,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      goal_type TEXT NOT NULL CHECK(goal_type IN ('sleep_hours', 'feeding_oz', 'meals_count')),
      target_value REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(baby_id, goal_type)
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      baby_id TEXT REFERENCES babies(id),
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Push notification tokens
    CREATE TABLE IF NOT EXISTS push_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token TEXT NOT NULL,
      platform TEXT CHECK(platform IN ('ios', 'android', 'alexa')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, token)
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_feedings_baby ON feedings(baby_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_sleep_baby ON sleep_records(baby_id, started_at);
    CREATE INDEX IF NOT EXISTS idx_meals_baby ON meals(baby_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_symptoms_baby ON symptoms(baby_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_moods_baby ON moods(baby_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_family_members ON family_members(family_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_sharing_codes ON sharing_codes(code);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
  `);

  return database;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, initializeDatabase, closeDatabase };
