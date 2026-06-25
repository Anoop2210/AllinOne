const { Contact } = require('../models');
const buildCrudController = require('./crud.factory');

module.exports = buildCrudController(Contact, {
  entityType: 'contact',
  viewAllPermission: 'contact.view_all',
  searchableFields: ['full_name', 'email', 'phone', 'company_name'],
});
