const { Deal } = require('../models');
const buildCrudController = require('./crud.factory');

module.exports = buildCrudController(Deal, {
  entityType: 'deal',
  viewAllPermission: 'deal.view_all',
  searchableFields: ['title'],
});
