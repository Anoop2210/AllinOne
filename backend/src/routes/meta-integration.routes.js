const express = require('express');
const router = express.Router();
const controller = require('../controllers/meta.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);
router.post('/connect', requirePermission('tenant.manage'), controller.connect);
router.get('/status', requirePermission('tenant.manage', 'lead.view_all'), controller.status);
router.delete('/', requirePermission('tenant.manage'), controller.disconnect);
router.get('/attribution', requirePermission('lead.view_all'), controller.attributionReport);

module.exports = router;