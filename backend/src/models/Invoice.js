const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Invoice extends Model {}

Invoice.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    subscription_id: { type: DataTypes.UUID, allowNull: true },

    invoice_number: { type: DataTypes.STRING(50), allowNull: false, unique: true }, // e.g. INV-2026-000123

    // Amounts
    subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    gst_rate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.0 }, // % - India GST default
    gst_amount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    total: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },

    // GST / billing details snapshot (captured at invoice time, tenant details can change later)
    billing_name: { type: DataTypes.STRING(255), allowNull: true },
    gstin: { type: DataTypes.STRING(20), allowNull: true }, // customer's GST number, if provided
    billing_address: { type: DataTypes.STRING(500), allowNull: true },

    status: {
      type: DataTypes.ENUM('draft', 'pending', 'paid', 'failed', 'void'),
      defaultValue: 'pending',
    },

    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },

    line_items: {
      // [{ description, quantity, unit_price, amount }]
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  },
  {
    sequelize,
    modelName: 'Invoice',
    tableName: 'invoices',
    indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'status'] }],
  }
);

module.exports = Invoice;