const express = require('express');
const router = express.Router();
const controller = require('../controllers/deal.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requirePermission('deal.view_own', 'deal.view_all'), controller.list);
router.get('/:id', requirePermission('deal.view_own', 'deal.view_all'), controller.getOne);
router.post('/', requirePermission('deal.create'), controller.create);
router.patch('/:id', requirePermission('deal.update'), controller.update);
router.delete('/:id', requirePermission('deal.delete'), controller.remove);

module.exports = router;
