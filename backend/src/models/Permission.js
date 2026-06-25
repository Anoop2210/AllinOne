const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Permission extends Model {}

// Static catalogue of permissions, e.g. 'lead.create', 'lead.delete', 'deal.view_all'
Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING(50), // 'lead', 'contact', 'deal', 'user', 'billing', etc.
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Permission',
    tableName: 'permissions',
  }
);

class RolePermission extends Model {}

RolePermission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role_id: { type: DataTypes.UUID, allowNull: false },
    permission_id: { type: DataTypes.UUID, allowNull: false },
  },
  {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'role_permissions',
    indexes: [{ unique: true, fields: ['role_id', 'permission_id'] }],
  }
);

module.exports = { Permission, RolePermission };
