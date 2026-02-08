const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../utils/database');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail().withMessage('Email válido requerido'),
  body('password').isLength({ min: 6 }).withMessage('Contraseña mínimo 6 caracteres'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Este email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const familyId = uuidv4();

    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, 'parent')
    `);

    const insertFamily = db.prepare(`
      INSERT INTO families (id, name, created_by)
      VALUES (?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT INTO family_members (id, family_id, user_id, role, permissions, invited_by)
      VALUES (?, ?, ?, 'parent', ?, ?)
    `);

    const transaction = db.transaction(() => {
      insertUser.run(userId, email, passwordHash, name);
      insertFamily.run(familyId, `Familia ${name}`, userId);
      insertMember.run(uuidv4(), familyId, userId, JSON.stringify(['read', 'write', 'admin']), userId);
    });

    transaction();

    const token = generateToken({ id: userId, email, role: 'parent' });

    res.status(201).json({
      message: 'Registro exitoso',
      user: { id: userId, email, name, role: 'parent' },
      family: { id: familyId, name: `Familia ${name}` },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const db = getDb();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Get user families
    const families = db.prepare(`
      SELECT f.*, fm.role as member_role, fm.permissions
      FROM families f
      JOIN family_members fm ON fm.family_id = f.id
      WHERE fm.user_id = ? AND fm.is_active = 1
    `).all(user.id);

    const token = generateToken({ id: user.id, email: user.email, role: user.role });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      families,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Get current user profile
router.get('/me', authenticate, (req, res) => {
  const db = getDb();

  const families = db.prepare(`
    SELECT f.*, fm.role as member_role, fm.permissions, fm.expires_at
    FROM families f
    JOIN family_members fm ON fm.family_id = f.id
    WHERE fm.user_id = ? AND fm.is_active = 1
  `).all(req.user.id);

  res.json({
    user: req.user,
    families
  });
});

// Add second parent to family
router.post('/add-parent', authenticate, [
  body('email').isEmail().normalizeEmail(),
  body('family_id').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, family_id } = req.body;
    const db = getDb();

    // Verify requester is a parent/admin of this family
    const requesterMember = db.prepare(`
      SELECT * FROM family_members
      WHERE family_id = ? AND user_id = ? AND role = 'parent' AND is_active = 1
    `).get(family_id, req.user.id);

    if (!requesterMember) {
      return res.status(403).json({ error: 'Solo padres pueden agregar otro padre' });
    }

    const targetUser = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuario no encontrado. Debe registrarse primero.' });
    }

    const existingMember = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(family_id, targetUser.id);

    if (existingMember) {
      return res.status(409).json({ error: 'Este usuario ya es miembro de la familia' });
    }

    db.prepare(`
      INSERT INTO family_members (id, family_id, user_id, role, permissions, invited_by)
      VALUES (?, ?, ?, 'parent', ?, ?)
    `).run(uuidv4(), family_id, targetUser.id, JSON.stringify(['read', 'write', 'admin']), req.user.id);

    res.status(201).json({ message: 'Padre agregado exitosamente' });
  } catch (error) {
    console.error('Add parent error:', error);
    res.status(500).json({ error: 'Error al agregar padre' });
  }
});

module.exports = router;
