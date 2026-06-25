const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Subscription extends Model {}

Subscription.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false, unique: true }, // one active subscription per tenant
    plan_id: { type: DataTypes.UUID, allowNull: false },

    billing_cycle: {
      type: DataTypes.ENUM('monthly', 'yearly'),
      defaultValue: 'monthly',
    },

    status: {
      type: DataTypes.ENUM('trialing', 'active', 'past_due', 'cancelled', 'expired'),
      defaultValue: 'trialing',
    },

    current_period_start: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    current_period_end: { type: DataTypes.DATE, allowNull: false },

    auto_renew: { type: DataTypes.BOOLEAN, defaultValue: true },
    cancel_at_period_end: { type: DataTypes.BOOLEAN, defaultValue: false },
    cancelled_at: { type: DataTypes.DATE, allowNull: true },

    // Razorpay subscription reference (for recurring auto-billing), if used
    gateway: { type: DataTypes.STRING(20), allowNull: true }, // 'razorpay' | 'stripe' | 'paypal'
    gateway_subscription_id: { type: DataTypes.STRING(255), allowNull: true },

    // Tracks consecutive failed renewal attempts -> used for failed payment recovery
    failed_payment_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    sequelize,
    modelName: 'Subscription',
    tableName: 'subscriptions',
  }
);

module.exports = Subscription;
