const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/db');

class Contact extends Model {}

Contact.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    owner_id: { type: DataTypes.UUID, allowNull: true },
    lead_id: { type: DataTypes.UUID, allowNull: true }, // converted from a lead, if applicable
    full_name: { type: DataTypes.STRING(150), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: true },
    phone: { type: DataTypes.STRING(20), allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: true },
    job_title: { type: DataTypes.STRING(150), allowNull: true },
    address: { type: DataTypes.STRING(500), allowNull: true },
    tags: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    notes: { type: DataTypes.TEXT, allowNull: true },
    is_deleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    sequelize,
    modelName: 'Contact',
    tableName: 'contacts',
    indexes: [{ fields: ['tenant_id'] }, { fields: ['tenant_id', 'owner_id'] }],
  }
);

module.exports = Contact;
