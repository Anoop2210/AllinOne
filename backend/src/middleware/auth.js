const { verifyAccessToken } = require('../utils/jwt');
const { User, Role, Permission } = require('../models');

/**
 * Verifies the JWT and attaches req.user (with role + permissions) and req.tenantId.
 * This is the core of tenant isolation: every downstream query MUST filter by req.tenantId.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    }

    const token = header.split(' ')[1];
    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.sub, {
      include: [{ model: Role, include: [Permission] }],
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    req.user = user;
    req.tenantId = user.tenant_id; // null for super admin
    req.permissions = (user.Role?.Permissions || []).map((p) => p.code);
    req.isSuperAdmin = user.tenant_id === null && user.Role?.code === 'super_admin';

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/**
 * Permission check middleware factory.
 * Usage: requirePermission('lead.create')
 * Super admins bypass all permission checks.
 */
function requirePermission(...requiredCodes) {
  return (req, res, next) => {
    if (req.isSuperAdmin) return next();
    const hasPermission = requiredCodes.some((code) => req.permissions.includes(code));
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: requires one of [${requiredCodes.join(', ')}]`,
      });
    }
    next();
  };
}

/** Ensures only the super admin (tenant_id null) can proceed. */
function requireSuperAdmin(req, res, next) {
  if (!req.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Super admin access required' });
  }
  next();
}

module.exports = { authenticate, requirePermission, requireSuperAdmin };
