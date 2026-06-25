const { v4: uuidv4 } = require('uuid');
const { sequelize, Tenant, Role, Permission, RolePermission, User, Plan, Subscription } = require('../models');
const { ROLE_PERMISSION_MAP } = require('../seed/permission-catalogue');

function slugify(name) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + uuidv4().slice(0, 6)
  );
}

/**
 * Creates a new tenant (company), its default roles (company_admin, manager, sales_rep),
 * and the first admin user for that company. Runs in a transaction so a partial
 * failure never leaves an orphaned tenant.
 */
async function createTenantWithAdmin({ companyName, adminFullName, adminEmail, adminPassword }) {
  return sequelize.transaction(async (t) => {
    const tenant = await Tenant.create(
      {
        company_name: companyName,
        slug: slugify(companyName),
        status: 'trial',
        plan: 'free_trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      },
      { transaction: t }
    );

    // Create default roles scoped to this tenant
    const roleCodes = ['company_admin', 'manager', 'sales_rep'];
    const rolesByCode = {};
    for (const code of roleCodes) {
      const role = await Role.create(
        {
          tenant_id: tenant.id,
          code,
          name: code
            .split('_')
            .map((w) => w[0].toUpperCase() + w.slice(1))
            .join(' '),
        },
        { transaction: t }
      );
      rolesByCode[code] = role;

      // Attach permissions for this role from the seed map
      const permCodes = ROLE_PERMISSION_MAP[code] || [];
      const perms = await Permission.findAll({ where: { code: permCodes } });
      for (const perm of perms) {
        await RolePermission.create(
          { role_id: role.id, permission_id: perm.id },
          { transaction: t }
        );
      }
    }

    // Create the first admin user for this tenant
    const adminUser = await User.create(
      {
        tenant_id: tenant.id,
        role_id: rolesByCode.company_admin.id,
        full_name: adminFullName,
        email: adminEmail,
        password_hash: adminPassword, // hashed by the User model hook
        status: 'active',
      },
      { transaction: t }
    );

    // Attach the free trial subscription record so billing endpoints work immediately
    const freeTrialPlan = await Plan.findOne({ where: { code: 'free_trial' }, transaction: t });
    if (freeTrialPlan) {
      await Subscription.create(
        {
          tenant_id: tenant.id,
          plan_id: freeTrialPlan.id,
          billing_cycle: 'monthly',
          status: 'trialing',
          current_period_start: new Date(),
          current_period_end: tenant.trial_ends_at,
        },
        { transaction: t }
      );
    }

    return { tenant, adminUser };
  });
}

module.exports = { createTenantWithAdmin, slugify };