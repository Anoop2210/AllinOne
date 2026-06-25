const sequelize = require('../config/db');
const Tenant = require('./Tenant');
const Role = require('./Role');
const { Permission, RolePermission } = require('./Permission');
const User = require('./User');
const Lead = require('./Lead');
const Contact = require('./Contact');
const Deal = require('./Deal');
const Activity = require('./Activity');
const Plan = require('./Plan');
const Subscription = require('./Subscription');
const Invoice = require('./Invoice');
const Payment = require('./Payment');
const MetaIntegration = require('./MetaIntegration');
const WhatsAppIntegration = require('./WhatsAppIntegration');
const WhatsAppMessage = require('./WhatsAppMessage');

// ---- Associations ----

// Tenant -> Users
Tenant.hasMany(User, { foreignKey: 'tenant_id' });
User.belongsTo(Tenant, { foreignKey: 'tenant_id' });

// Tenant -> Roles (custom roles per tenant; super_admin role has tenant_id null)
Tenant.hasMany(Role, { foreignKey: 'tenant_id' });
Role.belongsTo(Tenant, { foreignKey: 'tenant_id' });

// Role -> User
Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

// Role <-> Permission (many-to-many via RolePermission)
Role.belongsToMany(Permission, { through: RolePermission, foreignKey: 'role_id' });
Permission.belongsToMany(Role, { through: RolePermission, foreignKey: 'permission_id' });

// Tenant -> Leads / Contacts / Deals
Tenant.hasMany(Lead, { foreignKey: 'tenant_id' });
Lead.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(Contact, { foreignKey: 'tenant_id' });
Contact.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(Deal, { foreignKey: 'tenant_id' });
Deal.belongsTo(Tenant, { foreignKey: 'tenant_id' });

// User (owner) -> Leads / Contacts / Deals
User.hasMany(Lead, { foreignKey: 'owner_id' });
Lead.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(Contact, { foreignKey: 'owner_id' });
Contact.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

User.hasMany(Deal, { foreignKey: 'owner_id' });
Deal.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Lead -> Contact (conversion)
Lead.hasOne(Contact, { foreignKey: 'lead_id' });
Contact.belongsTo(Lead, { foreignKey: 'lead_id' });

// Contact -> Deals
Contact.hasMany(Deal, { foreignKey: 'contact_id' });
Deal.belongsTo(Contact, { foreignKey: 'contact_id' });

// Activities
Tenant.hasMany(Activity, { foreignKey: 'tenant_id' });
Activity.belongsTo(Tenant, { foreignKey: 'tenant_id' });
User.hasMany(Activity, { foreignKey: 'user_id' });
Activity.belongsTo(User, { foreignKey: 'user_id' });

// ---- Billing associations ----
Tenant.hasOne(Subscription, { foreignKey: 'tenant_id' });
Subscription.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Plan.hasMany(Subscription, { foreignKey: 'plan_id' });
Subscription.belongsTo(Plan, { foreignKey: 'plan_id' });

Tenant.hasMany(Invoice, { foreignKey: 'tenant_id' });
Invoice.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Subscription.hasMany(Invoice, { foreignKey: 'subscription_id' });
Invoice.belongsTo(Subscription, { foreignKey: 'subscription_id' });

Invoice.hasMany(Payment, { foreignKey: 'invoice_id' });
Payment.belongsTo(Invoice, { foreignKey: 'invoice_id' });

Tenant.hasMany(Payment, { foreignKey: 'tenant_id' });
Payment.belongsTo(Tenant, { foreignKey: 'tenant_id' });

// ---- Meta Lead Ads integration ----
Tenant.hasOne(MetaIntegration, { foreignKey: 'tenant_id' });
MetaIntegration.belongsTo(Tenant, { foreignKey: 'tenant_id' });

// ---- WhatsApp Business integration ----
Tenant.hasOne(WhatsAppIntegration, { foreignKey: 'tenant_id' });
WhatsAppIntegration.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Tenant.hasMany(WhatsAppMessage, { foreignKey: 'tenant_id' });
WhatsAppMessage.belongsTo(Tenant, { foreignKey: 'tenant_id' });

Lead.hasMany(WhatsAppMessage, { foreignKey: 'lead_id' });
WhatsAppMessage.belongsTo(Lead, { foreignKey: 'lead_id' });

Contact.hasMany(WhatsAppMessage, { foreignKey: 'contact_id' });
WhatsAppMessage.belongsTo(Contact, { foreignKey: 'contact_id' });

User.hasMany(WhatsAppMessage, { foreignKey: 'sent_by_user_id' });
WhatsAppMessage.belongsTo(User, { foreignKey: 'sent_by_user_id', as: 'sentBy' });

module.exports = {
  sequelize,
  Tenant,
  Role,
  Permission,
  RolePermission,
  User,
  Lead,
  Contact,
  Deal,
  Activity,
  Plan,
  Subscription,
  Invoice,
  Payment,
  MetaIntegration,
  WhatsAppIntegration,
  WhatsAppMessage,
};