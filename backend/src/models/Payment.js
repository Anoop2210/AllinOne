const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    invoice_id: { type: DataTypes.UUID, allowNull: false },

    gateway: {
      type: DataTypes.ENUM('razorpay', 'stripe', 'paypal'),
      allowNull: false,
    },

    // Gateway-specific identifiers, used to reconcile webhooks
    gateway_order_id: { type: DataTypes.STRING(255), allowNull: true },
    gateway_payment_id: { type: DataTypes.STRING(255), allowNull: true },
    gateway_signature: { type: DataTypes.STRING(500), allowNull: true },

    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },

    status: {
      type: DataTypes.ENUM('created', 'authorized', 'captured', 'failed', 'refunded'),
      defaultValue: 'created',
    },

    failure_reason: { type: DataTypes.STRING(500), allowNull: true },
    raw_response: { type: DataTypes.JSONB, allowNull: true }, // full gateway payload for audit/debug
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    indexes: [{ fields: ['tenant_id'] }, { fields: ['invoice_id'] }],
  }
);

module.exports = Payment;