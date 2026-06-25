const express = require('express');
const router = express.Router();
const controller = require('../controllers/billing.controller');
const { authenticate, requirePermission } = require('../middleware/auth');

// Public - pricing page
router.get('/plans', controller.listPlans);

// Webhook - no auth middleware (Razorpay calls this server-to-server)
router.post('/webhook', controller.webhook);

// Tenant-scoped, requires auth
router.use(authenticate);
router.get('/subscription', requirePermission('billing.view', 'billing.manage'), controller.getMySubscription);
router.post('/subscribe', requirePermission('billing.manage'), controller.subscribe);
router.post('/verify-payment', requirePermission('billing.manage'), controller.verifyPayment);
router.post('/cancel', requirePermission('billing.manage'), controller.cancel);
router.get('/invoices', requirePermission('billing.view', 'billing.manage'), controller.listInvoices);

module.exports = router;