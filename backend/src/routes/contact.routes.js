const express = require('express');
const router = express.Router();
const controller = require('../controllers/contact.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

router.use(authenticate);
router.get('/', requirePermission('contact.view_own', 'contact.view_all'), controller.list);
router.get('/:id', requirePermission('contact.view_own', 'contact.view_all'), controller.getOne);
router.post('/', requirePermission('contact.create'), controller.create);
router.patch('/:id', requirePermission('contact.update'), controller.update);
router.delete('/:id', requirePermission('contact.delete'), controller.remove);

module.exports = router;
