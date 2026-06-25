const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class MetaIntegration extends Model {}

// One row per tenant. Holds the credentials needed to receive webhooks and pull
// full lead details from the Graph API. Page Access Token is generated manually
// by the tenant in Meta's Developer Console (App Review is required for a fully
// automated OAuth flow, which is out of scope for this phase).
MetaIntegration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false, unique: true },

    page_id: { type: DataTypes.STRING(50), allowNull: false },
    page_name: { type: DataTypes.STRING(255), allowNull: true },
    page_access_token: { type: DataTypes.TEXT, allowNull: false },

    // A secret the tenant sets here AND in Meta's webhook config dashboard.
    // Meta echoes this back during webhook verification (GET request) so we
    // can confirm the subscription request is legitimate.
    verify_token: { type: DataTypes.STRING(100), allowNull: false },

    ad_account_id: { type: DataTypes.STRING(50), allowNull: true }, // for cost/campaign lookups

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    last_webhook_at: { type: DataTypes.DATE, allowNull: true },
    last_error: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    modelName: 'MetaIntegration',
    tableName: 'meta_integrations',
  }
);

module.exports = MetaIntegration;