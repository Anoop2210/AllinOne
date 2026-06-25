const { sequelize, Tenant, Plan, Subscription, Invoice, Payment } = require('../models');

const GST_RATE = 18.0; // India standard GST % for SaaS services

function addInterval(date, cycle) {
  const d = new Date(date);
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

async function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const count = await Invoice.count();
  return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
}

/**
 * Computes subtotal/GST/total for a plan + billing cycle.
 */
function calculateAmounts(plan, billingCycle) {
  const subtotal =
    billingCycle === 'yearly' ? Number(plan.price_yearly) : Number(plan.price_monthly);
  const gstAmount = Math.round(subtotal * (GST_RATE / 100) * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;
  return { subtotal, gstAmount, total };
}

/**
 * Creates (or returns existing) subscription for a tenant, and generates the
 * first invoice. Used both at signup (free trial -> no invoice needed) and
 * when a tenant picks a paid plan.
 */
async function createOrUpdateSubscription({ tenantId, planCode, billingCycle = 'monthly' }) {
  return sequelize.transaction(async (t) => {
    const plan = await Plan.findOne({ where: { code: planCode, is_active: true }, transaction: t });
    if (!plan) throw new Error(`Plan "${planCode}" not found or inactive`);

    const tenant = await Tenant.findByPk(tenantId, { transaction: t });
    if (!tenant) throw new Error('Tenant not found');

    let subscription = await Subscription.findOne({ where: { tenant_id: tenantId }, transaction: t });

    const now = new Date();
    const periodEnd = addInterval(now, billingCycle);
    const isFreePlan = Number(plan.price_monthly) === 0 && Number(plan.price_yearly) === 0;

    if (subscription) {
      subscription.plan_id = plan.id;
      subscription.billing_cycle = billingCycle;
      subscription.status = isFreePlan ? 'active' : 'past_due'; // becomes 'active' once payment captured
      subscription.current_period_start = now;
      subscription.current_period_end = periodEnd;
      await subscription.save({ transaction: t });
    } else {
      subscription = await Subscription.create(
        {
          tenant_id: tenantId,
          plan_id: plan.id,
          billing_cycle: billingCycle,
          status: isFreePlan ? 'active' : 'past_due',
          current_period_start: now,
          current_period_end: periodEnd,
        },
        { transaction: t }
      );
    }

    tenant.plan = plan.code;
    tenant.status = isFreePlan ? tenant.status : tenant.status; // unchanged until payment captured
    await tenant.save({ transaction: t });

    let invoice = null;
    if (!isFreePlan) {
      const { subtotal, gstAmount, total } = calculateAmounts(plan, billingCycle);
      invoice = await Invoice.create(
        {
          tenant_id: tenantId,
          subscription_id: subscription.id,
          invoice_number: await generateInvoiceNumber(),
          subtotal,
          gst_rate: GST_RATE,
          gst_amount: gstAmount,
          total,
          currency: plan.currency,
          billing_name: tenant.company_name,
          status: 'pending',
          due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          line_items: [
            {
              description: `${plan.name} Plan - ${billingCycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
              quantity: 1,
              unit_price: subtotal,
              amount: subtotal,
            },
          ],
        },
        { transaction: t }
      );
    }

    return { subscription, invoice, plan };
  });
}

/**
 * Marks an invoice as paid and activates the tenant's subscription.
 * Called after a payment gateway confirms a successful capture.
 */
async function markInvoicePaid({ invoiceId, paymentRecord }) {
  return sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
    if (!invoice) throw new Error('Invoice not found');

    invoice.status = 'paid';
    invoice.paid_at = new Date();
    await invoice.save({ transaction: t });

    const subscription = await Subscription.findByPk(invoice.subscription_id, { transaction: t });
    if (subscription) {
      subscription.status = 'active';
      subscription.failed_payment_attempts = 0;
      await subscription.save({ transaction: t });

      const tenant = await Tenant.findByPk(invoice.tenant_id, { transaction: t });
      if (tenant && tenant.status !== 'active') {
        tenant.status = 'active';
        await tenant.save({ transaction: t });
      }
    }

    return invoice;
  });
}

/**
 * Records a failed payment attempt and flags the subscription as past_due.
 * After 3 consecutive failures, the subscription is suspended (failed payment recovery flow).
 */
async function recordFailedPayment({ invoiceId, reason }) {
  return sequelize.transaction(async (t) => {
    const invoice = await Invoice.findByPk(invoiceId, { transaction: t });
    if (!invoice) throw new Error('Invoice not found');

    invoice.status = 'failed';
    await invoice.save({ transaction: t });

    const subscription = await Subscription.findByPk(invoice.subscription_id, { transaction: t });
    if (subscription) {
      subscription.failed_payment_attempts += 1;
      subscription.status = subscription.failed_payment_attempts >= 3 ? 'past_due' : 'past_due';
      await subscription.save({ transaction: t });

      if (subscription.failed_payment_attempts >= 3) {
        const tenant = await Tenant.findByPk(invoice.tenant_id, { transaction: t });
        if (tenant) {
          tenant.status = 'suspended';
          await tenant.save({ transaction: t });
        }
      }
    }

    return invoice;
  });
}

async function cancelSubscription({ tenantId, immediately = false }) {
  const subscription = await Subscription.findOne({ where: { tenant_id: tenantId } });
  if (!subscription) throw new Error('No active subscription found');

  if (immediately) {
    subscription.status = 'cancelled';
    subscription.cancelled_at = new Date();
  } else {
    subscription.cancel_at_period_end = true;
  }
  await subscription.save();
  return subscription;
}

module.exports = {
  GST_RATE,
  calculateAmounts,
  createOrUpdateSubscription,
  markInvoicePaid,
  recordFailedPayment,
  cancelSubscription,
  generateInvoiceNumber,
};