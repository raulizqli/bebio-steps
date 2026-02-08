const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { customAlphabet } = require('nanoid');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../utils/database');
const { authenticate, checkFamilyAccess } = require('../middleware/auth');

const router = express.Router();

// Generate a human-readable sharing code
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

// Create sharing code
router.post('/code', authenticate, [
  body('family_id').notEmpty(),
  body('role').isIn(['nanny', 'family']),
  body('permissions').isArray(),
  body('expires_in_hours').isInt({ min: 1, max: 8760 }),
  body('access_duration_hours').optional().isInt({ min: 1 }),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { family_id, role, permissions, expires_in_hours, access_duration_hours, max_uses } = req.body;
    const db = getDb();

    // Verify requester is admin/parent
    const member = db.prepare(`
      SELECT * FROM family_members
      WHERE family_id = ? AND user_id = ? AND role = 'parent' AND is_active = 1
    `).get(family_id, req.user.id);

    if (!member) {
      return res.status(403).json({ error: 'Solo padres pueden crear códigos de compartir' });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO sharing_codes (id, family_id, code, role, permissions, expires_at, max_uses, access_duration_hours, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), family_id, code, role,
      JSON.stringify(permissions), expiresAt,
      max_uses || 1, access_duration_hours || null, req.user.id
    );

    res.status(201).json({
      code,
      role,
      permissions,
      expires_at: expiresAt,
      access_duration_hours: access_duration_hours || null,
      message: `Código generado: ${code}. Comparte este código con ${role === 'nanny' ? 'la niñera' : 'el familiar'}.`
    });
  } catch (error) {
    console.error('Create code error:', error);
    res.status(500).json({ error: 'Error al crear código' });
  }
});

// Redeem sharing code
router.post('/redeem', authenticate, [
  body('code').trim().notEmpty(),
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code } = req.body;
    const db = getDb();

    const sharingCode = db.prepare(`
      SELECT sc.*, f.name as family_name
      FROM sharing_codes sc
      JOIN families f ON f.id = sc.family_id
      WHERE sc.code = ?
    `).get(code.toUpperCase());

    if (!sharingCode) {
      return res.status(404).json({ error: 'Código no encontrado' });
    }

    if (new Date(sharingCode.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Este código ha expirado' });
    }

    if (sharingCode.uses >= sharingCode.max_uses) {
      return res.status(410).json({ error: 'Este código ya fue usado el máximo de veces' });
    }

    // Check if already a member
    const existingMember = db.prepare(`
      SELECT * FROM family_members WHERE family_id = ? AND user_id = ?
    `).get(sharingCode.family_id, req.user.id);

    if (existingMember) {
      if (existingMember.is_active) {
        return res.status(409).json({ error: 'Ya eres miembro de esta familia' });
      }
      // Reactivate
      const expiresAt = sharingCode.access_duration_hours
        ? new Date(Date.now() + sharingCode.access_duration_hours * 60 * 60 * 1000).toISOString()
        : null;

      db.prepare(`
        UPDATE family_members SET is_active = 1, role = ?, permissions = ?, expires_at = ?
        WHERE id = ?
      `).run(sharingCode.role, sharingCode.permissions, expiresAt, existingMember.id);
    } else {
      const expiresAt = sharingCode.access_duration_hours
        ? new Date(Date.now() + sharingCode.access_duration_hours * 60 * 60 * 1000).toISOString()
        : null;

      db.prepare(`
        INSERT INTO family_members (id, family_id, user_id, role, permissions, expires_at, invited_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), sharingCode.family_id, req.user.id,
        sharingCode.role, sharingCode.permissions,
        expiresAt, sharingCode.created_by
      );
    }

    // Increment uses
    db.prepare('UPDATE sharing_codes SET uses = uses + 1 WHERE id = ?').run(sharingCode.id);

    res.json({
      message: `Te has unido a ${sharingCode.family_name}`,
      family_id: sharingCode.family_id,
      role: sharingCode.role,
      expires_at: sharingCode.access_duration_hours
        ? new Date(Date.now() + sharingCode.access_duration_hours * 60 * 60 * 1000).toISOString()
        : null
    });
  } catch (error) {
    console.error('Redeem code error:', error);
    res.status(500).json({ error: 'Error al canjear código' });
  }
});

// List family members
router.get('/family/:familyId/members', authenticate, checkFamilyAccess(['read']), (req, res) => {
  const db = getDb();

  const members = db.prepare(`
    SELECT fm.id, fm.role, fm.permissions, fm.expires_at, fm.is_active, fm.created_at,
           u.name, u.email, u.avatar_url
    FROM family_members fm
    JOIN users u ON u.id = fm.user_id
    WHERE fm.family_id = ?
    ORDER BY fm.role, fm.created_at
  `).all(req.params.familyId);

  res.json({ members });
});

// Revoke member access
router.delete('/family/:familyId/members/:memberId', authenticate, checkFamilyAccess(['admin']), (req, res) => {
  const db = getDb();

  const member = db.prepare(`
    SELECT * FROM family_members WHERE id = ? AND family_id = ?
  `).get(req.params.memberId, req.params.familyId);

  if (!member) {
    return res.status(404).json({ error: 'Miembro no encontrado' });
  }

  if (member.role === 'parent') {
    const parentCount = db.prepare(`
      SELECT COUNT(*) as count FROM family_members
      WHERE family_id = ? AND role = 'parent' AND is_active = 1
    `).get(req.params.familyId);

    if (parentCount.count <= 1) {
      return res.status(400).json({ error: 'No puedes eliminar al único padre de la familia' });
    }
  }

  db.prepare('UPDATE family_members SET is_active = 0 WHERE id = ?').run(req.params.memberId);

  res.json({ message: 'Acceso revocado exitosamente' });
});

// Update member permissions
router.patch('/family/:familyId/members/:memberId', authenticate, checkFamilyAccess(['admin']), [
  body('permissions').optional().isArray(),
  body('expires_at').optional().isISO8601(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { permissions, expires_at } = req.body;
  const db = getDb();

  const member = db.prepare(`
    SELECT * FROM family_members WHERE id = ? AND family_id = ?
  `).get(req.params.memberId, req.params.familyId);

  if (!member) {
    return res.status(404).json({ error: 'Miembro no encontrado' });
  }

  const updates = [];
  const values = [];

  if (permissions) {
    updates.push('permissions = ?');
    values.push(JSON.stringify(permissions));
  }
  if (expires_at !== undefined) {
    updates.push('expires_at = ?');
    values.push(expires_at);
  }

  if (updates.length > 0) {
    values.push(req.params.memberId);
    db.prepare(`UPDATE family_members SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  res.json({ message: 'Permisos actualizados' });
});

// List active sharing codes for a family
router.get('/family/:familyId/codes', authenticate, checkFamilyAccess(['admin']), (req, res) => {
  const db = getDb();

  const codes = db.prepare(`
    SELECT sc.*, u.name as created_by_name
    FROM sharing_codes sc
    JOIN users u ON u.id = sc.created_by
    WHERE sc.family_id = ? AND sc.expires_at > datetime('now')
    ORDER BY sc.created_at DESC
  `).all(req.params.familyId);

  res.json({ codes });
});

// Delete/invalidate sharing code
router.delete('/codes/:codeId', authenticate, (req, res) => {
  const db = getDb();

  const code = db.prepare(`
    SELECT sc.* FROM sharing_codes sc
    JOIN family_members fm ON fm.family_id = sc.family_id
    WHERE sc.id = ? AND fm.user_id = ? AND fm.role = 'parent' AND fm.is_active = 1
  `).get(req.params.codeId, req.user.id);

  if (!code) {
    return res.status(404).json({ error: 'Código no encontrado' });
  }

  db.prepare('DELETE FROM sharing_codes WHERE id = ?').run(req.params.codeId);

  res.json({ message: 'Código eliminado' });
});

module.exports = router;
