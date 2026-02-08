const jwt = require('jsonwebtoken');
const { getDb } = require('../utils/database');

const JWT_SECRET = process.env.JWT_SECRET || 'bebio-dev-secret-change-in-production';

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRY || '7d' }
  );
}

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE id = ?').get(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

function checkFamilyAccess(requiredPermissions = ['read']) {
  return (req, res, next) => {
    const db = getDb();
    const familyId = req.params.familyId || req.body.family_id;

    if (!familyId) {
      return res.status(400).json({ error: 'family_id requerido' });
    }

    const member = db.prepare(`
      SELECT fm.*, f.name as family_name 
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.family_id = ? AND fm.user_id = ? AND fm.is_active = 1
    `).get(familyId, req.user.id);

    if (!member) {
      return res.status(403).json({ error: 'No tienes acceso a esta familia' });
    }

    // Check if access has expired (for nannies with time-limited access)
    if (member.expires_at && new Date(member.expires_at) < new Date()) {
      // Deactivate expired access
      db.prepare('UPDATE family_members SET is_active = 0 WHERE id = ?').run(member.id);
      return res.status(403).json({ error: 'Tu acceso ha expirado' });
    }

    // Check permissions
    const memberPermissions = JSON.parse(member.permissions || '["read"]');
    const hasPermission = requiredPermissions.every(p => memberPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes los permisos necesarios' });
    }

    req.familyMember = member;
    next();
  };
}

function checkBabyAccess(requiredPermissions = ['read']) {
  return (req, res, next) => {
    const db = getDb();
    const babyId = req.params.babyId || req.body.baby_id;

    if (!babyId) {
      return res.status(400).json({ error: 'baby_id requerido' });
    }

    const baby = db.prepare('SELECT * FROM babies WHERE id = ?').get(babyId);
    if (!baby) {
      return res.status(404).json({ error: 'Bebé no encontrado' });
    }

    const member = db.prepare(`
      SELECT fm.*
      FROM family_members fm
      WHERE fm.family_id = ? AND fm.user_id = ? AND fm.is_active = 1
    `).get(baby.family_id, req.user.id);

    if (!member) {
      return res.status(403).json({ error: 'No tienes acceso a este bebé' });
    }

    if (member.expires_at && new Date(member.expires_at) < new Date()) {
      db.prepare('UPDATE family_members SET is_active = 0 WHERE id = ?').run(member.id);
      return res.status(403).json({ error: 'Tu acceso ha expirado' });
    }

    const memberPermissions = JSON.parse(member.permissions || '["read"]');
    const hasPermission = requiredPermissions.every(p => memberPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ error: 'No tienes los permisos necesarios' });
    }

    req.baby = baby;
    req.familyMember = member;
    next();
  };
}

module.exports = { generateToken, authenticate, checkFamilyAccess, checkBabyAccess, JWT_SECRET };
