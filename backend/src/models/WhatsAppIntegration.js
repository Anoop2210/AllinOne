const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class WhatsAppIntegration extends Model {}

// One row per tenant. Credentials come from Meta's WhatsApp Business Platform
// (business.facebook.com -> WhatsApp -> API Setup). Same Meta Developer App
// used for Lead Ads can host the WhatsApp product too.
WhatsAppIntegration.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false, unique: true },

    phone_number_id: { type: DataTypes.STRING(50), allowNull: false }, // WhatsApp Business phone number ID
    display_phone_number: { type: DataTypes.STRING(30), allowNull: true },
    business_account_id: { type: DataTypes.STRING(50), allowNull: true },
    access_token: { type: DataTypes.TEXT, allowNull: false }, // permanent System User token recommended

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    auto_welcome_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
    welcome_message: {
      type: DataTypes.TEXT,
      defaultValue: 'Hi {{name}}! Thanks for your interest. Our team will reach out shortly.',
    },

    last_webhook_at: { type: DataTypes.DATE, allowNull: true },
    last_error: { type: DataTypes.STRING(500), allowNull: true },
  },
  {
    sequelize,
    modelName: 'WhatsAppIntegration',
    tableName: 'whatsapp_integrations',
  }
);

module.exports = WhatsAppIntegration;