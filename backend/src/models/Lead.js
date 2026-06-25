const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Lead extends Model {}

Lead.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    owner_id: {
      type: DataTypes.UUID, // assigned sales rep / user
      allowNull: true,
    },
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'),
      defaultValue: 'new',
    },
    source: {
      type: DataTypes.STRING(100), // 'manual', 'facebook_lead_ads', 'instagram_lead_ads', 'whatsapp', 'website', etc.
      defaultValue: 'manual',
    },
    // Placeholders for future Meta Lead Ads sync module
    campaign_name: { type: DataTypes.STRING(255), allowNull: true },
    ad_set_name: { type: DataTypes.STRING(255), allowNull: true },
    ad_name: { type: DataTypes.STRING(255), allowNull: true },
    cost_per_lead: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    // External ID from the source system (e.g. Meta's leadgen_id) - used to prevent
    // duplicate leads if a webhook fires more than once for the same submission.
    external_id: { type: DataTypes.STRING(100), allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'Lead',
    tableName: 'leads',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'owner_id'] },
      { fields: ['tenant_id', 'external_id'] },
    ],
  }
);

module.exports = Lead;