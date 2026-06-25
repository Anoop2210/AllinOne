const { User, Role } = require('../models');

// GET /api/users  (tenant-scoped)
async function list(req, res) {
  try {
    const users = await User.findAll({
      where: { tenant_id: req.tenantId },
      include: [{ model: Role, attributes: ['code', 'name'] }],
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
}

// POST /api/users/invite
async function invite(req, res) {
  try {
    const { fullName, email, roleCode, temporaryPassword } = req.body;
    if (!fullName || !email || !roleCode || !temporaryPassword) {
      return res.status(400).json({ success: false, message: 'fullName, email, roleCode, temporaryPassword are required' });
    }

    const role = await Role.findOne({ where: { tenant_id: req.tenantId, code: roleCode } });
    if (!role) return res.status(400).json({ success: false, message: 'Invalid role for this tenant' });

    const existing = await User.findOne({ where: { tenant_id: req.tenantId, email } });
    if (existing) return res.status(409).json({ success: false, message: 'User with this email already exists' });

    const user = await User.create({
      tenant_id: req.tenantId,
      role_id: role.id,
      full_name: fullName,
      email,
      password_hash: temporaryPassword,
      status: 'invited',
    });

    return res.status(201).json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    console.error('Invite user error:', err);
    return res.status(500).json({ success: false, message: 'Failed to invite user' });
  }
}

// PATCH /api/users/:id
async function update(req, res) {
  try {
    const user = await User.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { fullName, phone, status, roleCode } = req.body;
    if (roleCode) {
      const role = await Role.findOne({ where: { tenant_id: req.tenantId, code: roleCode } });
      if (!role) return res.status(400).json({ success: false, message: 'Invalid role' });
      user.role_id = role.id;
    }
    if (fullName) user.full_name = fullName;
    if (phone) user.phone = phone;
    if (status) user.status = status;

    await user.save();
    return res.json({ success: true, data: user.toSafeJSON() });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user' });
  }
}

module.exports = { list, invite, update };
