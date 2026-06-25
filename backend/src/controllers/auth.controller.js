const { Op } = require('sequelize');
const { User, Role, Permission, Tenant } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { createTenantWithAdmin } = require('../services/tenant.service');

// POST /api/auth/signup  -> creates a new tenant (company) + its first admin user
async function signup(req, res) {
  try {
    const { companyName, adminFullName, adminEmail, adminPassword } = req.body;

    if (!companyName || !adminFullName || !adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const existing = await User.findOne({ where: { email: adminEmail } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already in use' });
    }

    const { tenant, adminUser } = await createTenantWithAdmin({
      companyName,
      adminFullName,
      adminEmail,
      adminPassword,
    });

    const accessToken = signAccessToken(adminUser);
    const refreshToken = signRefreshToken(adminUser);

    return res.status(201).json({
      success: true,
      data: {
        tenant: { id: tenant.id, company_name: tenant.company_name, slug: tenant.slug, status: tenant.status },
        user: adminUser.toSafeJSON(),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Signup failed' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, include: [Permission] }],
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Account is not active' });
    }

    user.last_login_at = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      success: true,
      data: {
        user: user.toSafeJSON(),
        role: { code: user.Role.code, name: user.Role.name },
        permissions: (user.Role.Permissions || []).map((p) => p.code),
        accessToken,
        refreshToken,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Login failed' });
  }
}

// POST /api/auth/refresh
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'refreshToken is required' });
    }
    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findByPk(payload.sub);
    if (!user || user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    const accessToken = signAccessToken(user);
    return res.json({ success: true, data: { accessToken } });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  return res.json({
    success: true,
    data: {
      user: req.user.toSafeJSON(),
      role: { code: req.user.Role?.code, name: req.user.Role?.name },
      permissions: req.permissions,
      isSuperAdmin: req.isSuperAdmin,
    },
  });
}

module.exports = { signup, login, refresh, me };
