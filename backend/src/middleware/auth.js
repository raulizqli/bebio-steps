const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const checkBabyAccess = async (req, res, next) => {
  try {
    const babyId = req.params.babyId || req.body.babyId;
    const userId = req.user.id;

    // Check if user is the parent
    const baby = await prisma.baby.findFirst({
      where: {
        id: babyId,
        parentId: userId
      }
    });

    if (baby) {
      req.baby = baby;
      req.isParent = true;
      return next();
    }

    // Check if user has shared access
    const sharedAccess = await prisma.sharedAccess.findFirst({
      where: {
        babyId: babyId,
        userId: userId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } }
        ]
      },
      include: {
        baby: true
      }
    });

    if (sharedAccess) {
      req.baby = sharedAccess.baby;
      req.sharedAccess = sharedAccess;
      req.isParent = false;
      return next();
    }

    res.status(403).json({ error: 'Access denied to this baby' });
  } catch (error) {
    res.status(500).json({ error: 'Error checking access' });
  }
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (req.isParent) {
      return next();
    }

    if (req.sharedAccess && req.sharedAccess.permissions.includes(permission)) {
      return next();
    }

    res.status(403).json({ error: 'Insufficient permissions' });
  };
};

module.exports = {
  authenticate,
  checkBabyAccess,
  checkPermission
};
