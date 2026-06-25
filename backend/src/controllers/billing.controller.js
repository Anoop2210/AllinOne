const { Plan, Subscription, Invoice, Payment } = require('../models');
const billingService = require('../services/billing.service');
const razorpayService = require('../services/razorpay.service');

// GET /api/billing/plans  (public - shown on pricing page)
async function listPlans(req, res) {
  try {
    const plans = await Plan.findAll({ where: { is_active: true }, order: [['sort_order', 'ASC']] });
    return res.json({ success: true, data: plans });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plans' });
  }
}

// GET /api/billing/subscription  (tenant-scoped)
async function getMySubscription(req, res) {
  try {
    const subscription = await Subscription.findOne({
      where: { tenant_id: req.tenantId },
      include: [{ model: Plan }],
    });
    return res.json({ success: true, data: subscription });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
}

// POST /api/billing/subscribe   { planCode, billingCycle }
// Creates/updates the subscription + invoice. If the plan is paid, also creates
// a Razorpay order that the frontend uses to open the checkout widget.
async function subscribe(req, res) {
  try {
    const { planCode, billingCycle } = req.body;
    if (!planCode) return res.status(400).json({ success: false, message: 'planCode is required' });

    const { subscription, invoice, plan } = await billingService.createOrUpdateSubscription({
      tenantId: req.tenantId,
      planCode,
      billingCycle: billingCycle || 'monthly',
    });

    // Free plan: nothing further to do
    if (!invoice) {
      return res.json({ success: true, data: { subscription, plan, requiresPayment: false } });
    }

    // Paid plan: create a Razorpay order for the invoice total
    const order = await razorpayService.createOrder({
      amountInPaise: Math.round(Number(invoice.total) * 100),
      currency: invoice.currency,
      receipt: invoice.invoice_number,
      notes: { tenantId: req.tenantId, invoiceId: invoice.id },
    });

    const payment = await Payment.create({
      tenant_id: req.tenantId,
      invoice_id: invoice.id,
      gateway: 'razorpay',
      gateway_order_id: order.id,
      amount: invoice.total,
      currency: invoice.currency,
      status: 'created',
    });

    return res.json({
      success: true,
      data: {
        subscription,
        invoice,
        requiresPayment: true,
        razorpayOrder: order,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        paymentId: payment.id,
      },
    });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

// POST /api/billing/verify-payment
// Called by the frontend after Razorpay checkout completes successfully.
// Verifies the signature server-side, then marks the invoice paid.
async function verifyPayment(req, res) {
  try {
    const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    const isValid = razorpayService.verifyPaymentSignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    const payment = await Payment.findOne({ where: { id: paymentId, tenant_id: req.tenantId } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    if (!isValid) {
      payment.status = 'failed';
      payment.failure_reason = 'Signature verification failed';
      await payment.save();
      await billingService.recordFailedPayment({
        invoiceId: payment.invoice_id,
        reason: 'Signature verification failed',
      });
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    payment.status = 'captured';
    payment.gateway_payment_id = razorpayPaymentId;
    payment.gateway_signature = razorpaySignature;
    await payment.save();

    const invoice = await billingService.markInvoicePaid({
      invoiceId: payment.invoice_id,
      paymentRecord: payment,
    });

    return res.json({ success: true, data: { invoice, payment } });
  } catch (err) {
    console.error('Verify payment error:', err);
    return res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
}

// POST /api/billing/cancel   { immediately?: boolean }
async function cancel(req, res) {
  try {
    const subscription = await billingService.cancelSubscription({
      tenantId: req.tenantId,
      immediately: !!req.body.immediately,
    });
    return res.json({ success: true, data: subscription });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

// GET /api/billing/invoices  (tenant-scoped)
async function listInvoices(req, res) {
  try {
    const invoices = await Invoice.findAll({
      where: { tenant_id: req.tenantId },
      order: [['created_at', 'DESC']],
    });
    return res.json({ success: true, data: invoices });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
}

// POST /api/billing/webhook  (Razorpay server-to-server webhook, no auth middleware)
async function webhook(req, res) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const isValid = razorpayService.verifyWebhookSignature({
      rawBody: req.rawBody, // captured by express.json verify() in server.js
      signature,
    });

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload?.payment?.entity;

    if (event === 'payment.captured' && paymentEntity) {
      const payment = await Payment.findOne({ where: { gateway_order_id: paymentEntity.order_id } });
      if (payment && payment.status !== 'captured') {
        payment.status = 'captured';
        payment.gateway_payment_id = paymentEntity.id;
        payment.raw_response = paymentEntity;
        await payment.save();
        await billingService.markInvoicePaid({ invoiceId: payment.invoice_id, paymentRecord: payment });
      }
    } else if (event === 'payment.failed' && paymentEntity) {
      const payment = await Payment.findOne({ where: { gateway_order_id: paymentEntity.order_id } });
      if (payment) {
        payment.status = 'failed';
        payment.failure_reason = paymentEntity.error_description;
        await payment.save();
        await billingService.recordFailedPayment({
          invoiceId: payment.invoice_id,
          reason: paymentEntity.error_description,
        });
      }
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ success: false });
  }
}

module.exports = {
  listPlans,
  getMySubscription,
  subscribe,
  verifyPayment,
  cancel,
  listInvoices,
  webhook,
};