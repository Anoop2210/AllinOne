// Static permission catalogue and role->permission mapping.
// This file has NO side effects and is safe to import from anywhere
// (seed.js and tenant.service.js both depend on it).

const PERMISSIONS = [
  // module: lead
  ['lead.view_own', 'lead', 'View own leads'],
  ['lead.view_all', 'lead', 'View all leads in tenant'],
  ['lead.create', 'lead', 'Create leads'],
  ['lead.update', 'lead', 'Update leads'],
  ['lead.delete', 'lead', 'Delete leads'],
  ['lead.assign', 'lead', 'Assign leads to users'],
  // module: contact
  ['contact.view_own', 'contact', 'View own contacts'],
  ['contact.view_all', 'contact', 'View all contacts in tenant'],
  ['contact.create', 'contact', 'Create contacts'],
  ['contact.update', 'contact', 'Update contacts'],
  ['contact.delete', 'contact', 'Delete contacts'],
  // module: deal
  ['deal.view_own', 'deal', 'View own deals'],
  ['deal.view_all', 'deal', 'View all deals in tenant'],
  ['deal.create', 'deal', 'Create deals'],
  ['deal.update', 'deal', 'Update deals'],
  ['deal.delete', 'deal', 'Delete deals'],
  // module: user / tenant management
  ['user.invite', 'user', 'Invite new users'],
  ['user.manage', 'user', 'Manage users (edit/deactivate)'],
  ['role.manage', 'role', 'Manage roles and permissions'],
  ['tenant.manage', 'tenant', 'Manage tenant settings'],
  ['tenant.manage_all', 'tenant', 'Manage all tenants (super admin only)'],
  ['billing.view', 'billing', 'View billing info'],
  ['billing.manage', 'billing', 'Manage billing/subscription'],
];

const ROLE_PERMISSION_MAP = {
  super_admin: PERMISSIONS.map((p) => p[0]), // everything
  company_admin: PERMISSIONS.filter((p) => p[1] !== 'tenant' || p[0] === 'tenant.manage').map(
    (p) => p[0]
  ),
  manager: [
    'lead.view_all', 'lead.create', 'lead.update', 'lead.assign',
    'contact.view_all', 'contact.create', 'contact.update',
    'deal.view_all', 'deal.create', 'deal.update',
    'user.invite',
  ],
  sales_rep: [
    'lead.view_own', 'lead.create', 'lead.update',
    'contact.view_own', 'contact.create', 'contact.update',
    'deal.view_own', 'deal.create', 'deal.update',
  ],
};

module.exports = { PERMISSIONS, ROLE_PERMISSION_MAP };