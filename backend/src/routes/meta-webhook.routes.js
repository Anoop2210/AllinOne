const express = require('express');
const router = express.Router();
const controller = require('../controllers/meta.controller');

// No authenticate middleware here - Meta's servers call these directly,
// they can't send our JWT. Trust boundary is the verify_token (GET) and
// the fact that we only act on data for pages that are explicitly connected.
router.get('/', controller.webhookVerify);
router.post('/', controller.webhookReceive);

module.exports = router;