const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

class User extends Model {
  async validatePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password_hash);
  }

  toSafeJSON() {
    const { password_hash, ...rest } = this.toJSON();
    return rest;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: true, // null only for the Super Admin (system-level) user
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'invited'),
      defaultValue: 'active',
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    indexes: [{ unique: true, fields: ['tenant_id', 'email'] }],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, 10);
        }
      },
    },
  }
);

module.exports = User;
