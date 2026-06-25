const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');

router.use(authenticate, requireSuperAdmin);
router.get('/tenants', controller.listTenants);
router.patch('/tenants/:id/status', controller.updateTenantStatus);
router.get('/stats', controller.platformStats);

module.exports = router;
