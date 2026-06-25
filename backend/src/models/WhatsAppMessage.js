const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class WhatsAppMessage extends Model {}

// Stores every inbound/outbound WhatsApp message so the team gets a shared inbox
// view, and so conversation history is attached to CRM records (matched by phone).
WhatsAppMessage.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },

    // Loosely linked - a lead/contact may not exist yet for inbound messages from
    // unknown numbers; phone_number is the durable join key either way.
    lead_id: { type: DataTypes.UUID, allowNull: true },
    contact_id: { type: DataTypes.UUID, allowNull: true },

    phone_number: { type: DataTypes.STRING(30), allowNull: false }, // the customer's WhatsApp number (E.164)
    direction: { type: DataTypes.ENUM('inbound', 'outbound'), allowNull: false },

    message_type: {
      type: DataTypes.ENUM('text', 'template', 'image', 'document', 'audio', 'video', 'other'),
      defaultValue: 'text',
    },
    body: { type: DataTypes.TEXT, allowNull: true },
    template_name: { type: DataTypes.STRING(100), allowNull: true },

    status: {
      type: DataTypes.ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received'),
      defaultValue: 'received',
    },

    sent_by_user_id: { type: DataTypes.UUID, allowNull: true }, // which team member sent it (outbound only)
    wa_message_id: { type: DataTypes.STRING(255), allowNull: true }, // Meta's message id, for status webhook matching
    raw_payload: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'WhatsAppMessage',
    tableName: 'whatsapp_messages',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'phone_number'] },
      { fields: ['wa_message_id'] },
    ],
  }
);

module.exports = WhatsAppMessage;