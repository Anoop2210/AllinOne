const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Plan extends Model {}

// Plans are global (platform-level), not tenant-scoped. Super admin manages these.
Plan.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // e.g. 'free_trial', 'starter', 'growth', 'enterprise'
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.STRING(500), allowNull: true },

    price_monthly: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    price_yearly: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },

    // Usage limits enforced by usage.middleware.js
    max_users: { type: DataTypes.INTEGER, defaultValue: 5 },
    max_leads: { type: DataTypes.INTEGER, defaultValue: 1000 },
    max_contacts: { type: DataTypes.INTEGER, defaultValue: 1000 },

    // Feature flags - which modules this plan unlocks (future modules included)
    features: {
      type: DataTypes.JSONB,
      defaultValue: {
        whatsapp: false,
        meta_lead_ads: false,
        ai_campaign_analyzer: false,
        white_label: false,
      },
    },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Plan',
    tableName: 'plans',
  }
);

module.exports = Plan;