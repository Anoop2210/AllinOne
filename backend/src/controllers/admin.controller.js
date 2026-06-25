const { Tenant, User } = require('../models');

// GET /api/admin/tenants
async function listTenants(req, res) {
  try {
    const tenants = await Tenant.findAll({
      where: { is_deleted: false },
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: tenants });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tenants' });
  }
}

// PATCH /api/admin/tenants/:id/status   { status: 'active' | 'suspended' | 'cancelled' }
async function updateTenantStatus(req, res) {
  try {
    const tenant = await Tenant.findByPk(req.params.id);
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

    const { status } = req.body;
    const allowed = ['trial', 'active', 'suspended', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of ${allowed.join(', ')}` });
    }

    tenant.status = status;
    await tenant.save();
    return res.json({ success: true, data: tenant });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update tenant status' });
  }
}

// GET /api/admin/stats - basic platform-wide counters
async function platformStats(req, res) {
  try {
    const [tenantCount, userCount] = await Promise.all([
      Tenant.count({ where: { is_deleted: false } }),
      User.count(),
    ]);
    return res.json({ success: true, data: { tenantCount, userCount } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
}

module.exports = { listTenants, updateTenantStatus, platformStats };
