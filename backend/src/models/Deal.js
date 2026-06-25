const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Deal extends Model {}

Deal.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    owner_id: { type: DataTypes.UUID, allowNull: true },
    contact_id: { type: DataTypes.UUID, allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    value: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    stage: {
      type: DataTypes.ENUM(
        'prospecting',
        'qualification',
        'proposal',
        'negotiation',
        'won',
        'lost'
      ),
      defaultValue: 'prospecting',
    },
    probability: { type: DataTypes.INTEGER, defaultValue: 10 }, // % chance of closing
    expected_close_date: { type: DataTypes.DATEONLY, allowNull: true },
    closed_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'Deal',
    tableName: 'deals',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'stage'] },
      { fields: ['tenant_id', 'owner_id'] },
    ],
  }
);

module.exports = Deal;
