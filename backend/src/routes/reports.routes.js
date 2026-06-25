const express = require('express');
const router = express.Router();
const controller = require('../controllers/reports.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);
router.get('/overview', requirePermission('lead.view_all', 'deal.view_all'), controller.overview);

module.exports = router;