const { Op } = require('sequelize');
const { MetaIntegration, Lead, sequelize } = require('../models');
const metaService = require('../services/meta.service');

// POST /api/integrations/meta/connect   (tenant-scoped)
// Tenant pastes in the Page ID + Page Access Token they generated in Meta's
// Developer Console (Graph API Explorer or System User token).
async function connect(req, res) {
  try {
    const { pageId, pageName, pageAccessToken, adAccountId } = req.body;
    if (!pageId || !pageAccessToken) {
      return res.status(400).json({ success: false, message: 'pageId and pageAccessToken are required' });
    }

    const [integration] = await MetaIntegration.findOrCreate({
      where: { tenant_id: req.tenantId },
      defaults: {
        tenant_id: req.tenantId,
        page_id: pageId,
        page_name: pageName,
        page_access_token: pageAccessToken,
        verify_token: process.env.META_WEBHOOK_VERIFY_TOKEN || 'crm-core-verify',
        ad_account_id: adAccountId,
      },
    });

    if (integration.page_id !== pageId || integration.page_access_token !== pageAccessToken) {
      integration.page_id = pageId;
      integration.page_name = pageName;
      integration.page_access_token = pageAccessToken;
      integration.ad_account_id = adAccountId;
      integration.is_active = true;
      integration.last_error = null;
      await integration.save();
    }

    return res.json({ success: true, data: integration });
  } catch (err) {
    console.error('Meta connect error:', err);
    return res.status(500).json({ success: false, message: 'Failed to save Meta integration' });
  }
}

// GET /api/integrations/meta/status   (tenant-scoped)
async function status(req, res) {
  try {
    const integration = await MetaIntegration.findOne({ where: { tenant_id: req.tenantId } });
    if (!integration) return res.json({ success: true, data: null });

    // Never send the access token back to the frontend
    const { page_access_token, ...safe } = integration.toJSON();
    return res.json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch integration status' });
  }
}

// DELETE /api/integrations/meta   (tenant-scoped)
async function disconnect(req, res) {
  try {
    await MetaIntegration.destroy({ where: { tenant_id: req.tenantId } });
    return res.json({ success: true, message: 'Meta integration disconnected' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to disconnect' });
  }
}

// GET /api/webhooks/meta   - Meta's one-time webhook verification handshake.
// Meta calls this with hub.mode=subscribe, hub.verify_token, hub.challenge when
// you click "Verify and Save" in the App Dashboard's Webhooks config.
async function webhookVerify(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'crm-core-verify';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Verification failed');
}

// POST /api/webhooks/meta   - Real-time lead notifications from Meta.
// Payload shape: { entry: [{ id: pageId, changes: [{ field: 'leadgen', value: { leadgen_id, ad_id, form_id, page_id } }] }] }
async function webhookReceive(req, res) {
  // Always respond 200 fast - Meta retries aggressively on non-2xx/timeout.
  res.status(200).json({ received: true });

  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      const pageId = entry.id;
      const integration = await MetaIntegration.findOne({ where: { page_id: pageId, is_active: true } });
      if (!integration) continue; // no tenant has connected this page

      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen') continue;
        await processLeadgenEvent(change.value, integration);
      }
    }
  } catch (err) {
    console.error('Meta webhook processing error:', err);
  }
}

async function processLeadgenEvent(value, integration) {
  const { leadgen_id, ad_id } = value;

  try {
    // Skip if we've already created a Lead for this leadgen_id (Meta can fire duplicate webhooks)
    const existing = await Lead.findOne({
      where: { tenant_id: integration.tenant_id, external_id: leadgen_id },
    });
    if (existing) return;

    const leadDetails = await metaService.fetchLeadDetails(leadgen_id, integration.page_access_token);
    const fields = metaService.flattenFieldData(leadDetails.field_data);
    const attribution = await metaService.fetchAdAttribution(ad_id, integration.page_access_token);

    await Lead.create({
      tenant_id: integration.tenant_id,
      full_name: fields.full_name || fields.name || 'Unknown',
      email: fields.email || null,
      phone: fields.phone_number || fields.phone || null,
      company_name: fields.company_name || null,
      status: 'new',
      source: value.page_id ? 'facebook_lead_ads' : 'meta_lead_ads',
      campaign_name: attribution.campaignName || null,
      ad_set_name: attribution.adSetName || null,
      ad_name: attribution.adName || null,
      external_id: leadgen_id,
      notes: `Auto-imported from Meta Lead Ads (form: ${leadDetails.form_id || 'n/a'})`,
    });

    integration.last_webhook_at = new Date();
    integration.last_error = null;
    await integration.save();
  } catch (err) {
    console.error('Failed to process leadgen event:', err);
    integration.last_error = err.message;
    await integration.save();
  }
}

// GET /api/integrations/meta/attribution   (tenant-scoped)
// Groups leads by campaign for a simple attribution report.
async function attributionReport(req, res) {
  try {
    const rows = await Lead.findAll({
      where: {
        tenant_id: req.tenantId,
        is_deleted: false,
        campaign_name: { [Op.ne]: null },
      },
      attributes: [
        'campaign_name',
        'ad_set_name',
        'ad_name',
        [sequelize.fn('COUNT', sequelize.col('id')), 'lead_count'],
        [
          sequelize.fn('SUM', sequelize.literal(`CASE WHEN status = 'converted' THEN 1 ELSE 0 END`)),
          'converted_count',
        ],
      ],
      group: ['campaign_name', 'ad_set_name', 'ad_name'],
      order: [[sequelize.literal('lead_count'), 'DESC']],
      raw: true,
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Attribution report error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate attribution report' });
  }
}

module.exports = { connect, status, disconnect, webhookVerify, webhookReceive, attributionReport };