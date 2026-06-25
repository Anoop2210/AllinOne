const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Activity extends Model {}

// Generic activity/audit log: who did what, on which record, when.
Activity.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: true },
    entity_type: { type: DataTypes.STRING(50), allowNull: false }, // 'lead', 'contact', 'deal'
    entity_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false }, // 'created', 'updated', 'status_changed', 'note_added'
    description: { type: DataTypes.STRING(500), allowNull: true },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  {
    sequelize,
    modelName: 'Activity',
    tableName: 'activities',
    indexes: [{ fields: ['tenant_id', 'entity_type', 'entity_id'] }],
  }
);

module.exports = Activity;
