const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayClient = null;

function getClient() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error(
      'Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env ' +
        '(sign up free at https://razorpay.com to get test mode keys).'
    );
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayClient;
}

/**
 * Creates a Razorpay Order for a one-time charge (used for the first payment of
 * a subscription, plan upgrades, or manual invoice payment).
 * Amount must be in the smallest currency unit (paise for INR).
 */
async function createOrder({ amountInPaise, currency = 'INR', receipt, notes = {} }) {
  const client = getClient();
  return client.orders.create({
    amount: amountInPaise,
    currency,
    receipt,
    notes,
  });
}

/**
 * Verifies the signature Razorpay sends back after checkout completes.
 * This MUST be done server-side before marking a payment as captured -
 * never trust the client's "payment succeeded" callback alone.
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/**
 * Verifies a Razorpay webhook payload signature (separate secret from the
 * checkout key_secret - set in the Razorpay dashboard webhook settings).
 */
function verifyWebhookSignature({ rawBody, signature }) {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature };