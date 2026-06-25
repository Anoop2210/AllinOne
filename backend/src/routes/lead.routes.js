const express = require('express');
const router = express.Router();
const controller = require('../controllers/lead.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);

// Specific routes must come before /:id, otherwise Express treats
// "export"/"import" as an :id value and the wrong handler runs.
router.get('/export', requirePermission('lead.view_own', 'lead.view_all'), controller.exportCsv);
router.post('/import', requirePermission('lead.create'), controller.importCsv);

router.get('/', requirePermission('lead.view_own', 'lead.view_all'), controller.list);
router.get('/:id', requirePermission('lead.view_own', 'lead.view_all'), controller.getOne);
router.post('/', requirePermission('lead.create'), controller.create);
router.patch('/:id', requirePermission('lead.update'), controller.update);
router.delete('/:id', requirePermission('lead.delete'), controller.remove);

module.exports = router;