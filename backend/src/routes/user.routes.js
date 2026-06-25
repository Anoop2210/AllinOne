const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requirePermission('user.manage', 'user.invite'), controller.list);
router.post('/invite', requirePermission('user.invite'), controller.invite);
router.patch('/:id', requirePermission('user.manage'), controller.update);

module.exports = router;
