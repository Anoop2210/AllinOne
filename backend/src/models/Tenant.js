const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Tenant extends Model {}

Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // used for subdomain / tenant identification
    },
    status: {
      type: DataTypes.ENUM('trial', 'active', 'suspended', 'cancelled'),
      defaultValue: 'trial',
    },
    plan: {
      type: DataTypes.STRING(50),
      defaultValue: 'free_trial',
    },
    trial_ends_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // White-label fields (placeholders for future module)
    custom_domain: { type: DataTypes.STRING(255), allowNull: true },
    logo_url: { type: DataTypes.STRING(500), allowNull: true },
    theme_color: { type: DataTypes.STRING(20), allowNull: true },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Tenant',
    tableName: 'tenants',
    paranoid: false,
  }
);

module.exports = Tenant;
