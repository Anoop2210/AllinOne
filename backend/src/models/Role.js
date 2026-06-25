const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Role extends Model {}

// Roles are tenant-scoped, except for the system-level "super_admin" role (tenant_id = null)
Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true, // null = system role (super_admin)
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    // e.g. 'super_admin', 'company_admin', 'manager', 'sales_rep'
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    is_system_role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Role',
    tableName: 'roles',
    indexes: [{ unique: true, fields: ['tenant_id', 'code'] }],
  }
);

module.exports = Role;
