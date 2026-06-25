require('dotenv').config();
const { sequelize, Role, Permission, RolePermission, User, Plan } = require('../models');
const { PERMISSIONS, ROLE_PERMISSION_MAP } = require('./permission-catalogue');

const DEFAULT_PLANS = [
  {
    code: 'free_trial',
    name: 'Free Trial',
    description: '14-day free trial with core CRM features',
    price_monthly: 0,
    price_yearly: 0,
    currency: 'INR',
    max_users: 3,
    max_leads: 200,
    max_contacts: 200,
    features: { whatsapp: false, meta_lead_ads: false, ai_campaign_analyzer: false, white_label: false },
    sort_order: 0,
  },
  {
    code: 'starter',
    name: 'Starter',
    description: 'For small teams getting started with CRM',
    price_monthly: 999,
    price_yearly: 9999,
    currency: 'INR',
    max_users: 5,
    max_leads: 5000,
    max_contacts: 5000,
    features: { whatsapp: true, meta_lead_ads: false, ai_campaign_analyzer: false, white_label: false },
    sort_order: 1,
  },
  {
    code: 'growth',
    name: 'Growth',
    description: 'For growing sales teams running ad campaigns',
    price_monthly: 2999,
    price_yearly: 29999,
    currency: 'INR',
    max_users: 20,
    max_leads: 50000,
    max_contacts: 50000,
    features: { whatsapp: true, meta_lead_ads: true, ai_campaign_analyzer: true, white_label: false },
    sort_order: 2,
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations needing white-labeling and unlimited scale',
    price_monthly: 9999,
    price_yearly: 99999,
    currency: 'INR',
    max_users: 1000,
    max_leads: 1000000,
    max_contacts: 1000000,
    features: { whatsapp: true, meta_lead_ads: true, ai_campaign_analyzer: true, white_label: true },
    sort_order: 3,
  },
];

async function seed() {
  await sequelize.authenticate();
  console.log('DB connected. Seeding...');

  // 1. Permissions
  const permRecords = {};
  for (const [code, module, description] of PERMISSIONS) {
    const [perm] = await Permission.findOrCreate({
      where: { code },
      defaults: { module, description },
    });
    permRecords[code] = perm;
  }
  console.log(`Permissions ready: ${Object.keys(permRecords).length}`);

  // 2. System role: super_admin (tenant_id = null)
  const [superAdminRole] = await Role.findOrCreate({
    where: { tenant_id: null, code: 'super_admin' },
    defaults: { name: 'Super Admin', is_system_role: true },
  });

  for (const code of ROLE_PERMISSION_MAP.super_admin) {
    await RolePermission.findOrCreate({
      where: { role_id: superAdminRole.id, permission_id: permRecords[code].id },
    });
  }

  // 3. Bootstrap super admin user if none exists
  const existingSuperAdmin = await User.findOne({ where: { tenant_id: null } });
  if (!existingSuperAdmin) {
    await User.create({
      tenant_id: null,
      role_id: superAdminRole.id,
      full_name: 'Super Admin',
      email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@crmcore.com',
      password_hash: process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@123',
      status: 'active',
    });
    console.log(
      `Super admin created: ${process.env.SUPER_ADMIN_EMAIL || 'superadmin@crmcore.com'}`
    );
  } else {
    console.log('Super admin already exists, skipping.');
  }

  console.log('NOTE: Default tenant roles (company_admin, manager, sales_rep) are');
  console.log('created automatically the moment a new tenant signs up (see tenant.service.js).');

  // 4. Default subscription plans
  for (const planData of DEFAULT_PLANS) {
    await Plan.findOrCreate({ where: { code: planData.code }, defaults: planData });
  }
  console.log(`Plans ready: ${DEFAULT_PLANS.length}`);

  console.log('Seed complete.');
}

// IMPORTANT: only run the seed (and exit the process) when this file is executed
// directly, e.g. `node src/seed/seed.js`. If some other module merely *imports*
// this file, none of the code below runs - this prevents server.js from being
// killed by an accidental process.exit() when something requires this module.
if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };