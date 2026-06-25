import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Billing() {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [error, setError] = useState('');
  const [processingPlan, setProcessingPlan] = useState(null);

  async function loadAll() {
    try {
      const [plansRes, subRes, invRes] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
        api.get('/billing/invoices'),
      ]);
      setPlans(plansRes.data.data);
      setSubscription(subRes.data.data);
      setInvoices(invRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load billing info');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleSubscribe(planCode) {
    setError('');
    setProcessingPlan(planCode);
    try {
      const res = await api.post('/billing/subscribe', { planCode, billingCycle });
      const { requiresPayment, razorpayOrder, razorpayKeyId, paymentId } = res.data.data;

      if (!requiresPayment) {
        await loadAll();
        setProcessingPlan(null);
        return;
      }

      if (!window.Razorpay) {
        setError('Razorpay checkout script not loaded. Check your internet connection.');
        setProcessingPlan(null);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        name: 'CRM Core',
        description: `${planCode} plan subscription`,
        handler: async function (response) {
          try {
            await api.post('/billing/verify-payment', {
              paymentId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            await loadAll();
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlan(null);
          },
        },
        theme: { color: '#c5601a' },
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Subscription failed');
      setProcessingPlan(null);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Cancel subscription at the end of the current billing period?')) return;
    try {
      await api.post('/billing/cancel', { immediately: false });
      await loadAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Cancel failed');
    }
  }

  return (
    <div className="resource-page">
      <h2>Billing & Subscription</h2>
      {error && <div className="error-banner">{error}</div>}

      {subscription && (
        <div className="current-plan-card">
          <div>
            <div className="current-plan-label">Current Plan</div>
            <div className="current-plan-name">{subscription.Plan?.name || subscription.plan_id}</div>
          </div>
          <div className="current-plan-meta">
            <span className={`status-badge status-${subscription.status}`}>{subscription.status}</span>
            <span>Renews: {new Date(subscription.current_period_end).toLocaleDateString()}</span>
            {subscription.status === 'active' && !subscription.cancel_at_period_end && (
              <button className="danger-link" onClick={handleCancel}>Cancel subscription</button>
            )}
            {subscription.cancel_at_period_end && <span className="hint-inline">Cancels at period end</span>}
          </div>
        </div>
      )}

      <div className="billing-toggle">
        <button
          className={billingCycle === 'monthly' ? 'toggle-active' : ''}
          onClick={() => setBillingCycle('monthly')}
        >
          Monthly
        </button>
        <button
          className={billingCycle === 'yearly' ? 'toggle-active' : ''}
          onClick={() => setBillingCycle('yearly')}
        >
          Yearly <span className="save-badge">save more</span>
        </button>
      </div>

      <div className="plans-grid">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
          const isCurrent = subscription?.plan_id === plan.id;
          return (
            <div key={plan.id} className={`plan-card ${isCurrent ? 'plan-current' : ''}`}>
              <h3>{plan.name}</h3>
              <p className="plan-desc">{plan.description}</p>
              <div className="plan-price">
                {Number(price) === 0 ? 'Free' : `₹${price}`}
                {Number(price) > 0 && <span>/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span>}
              </div>
              <ul className="plan-limits">
                <li>{plan.max_users} users</li>
                <li>{plan.max_leads.toLocaleString()} leads</li>
                <li>{plan.max_contacts.toLocaleString()} contacts</li>
                {plan.features?.whatsapp && <li>WhatsApp integration</li>}
                {plan.features?.meta_lead_ads && <li>Meta Lead Ads sync</li>}
                {plan.features?.ai_campaign_analyzer && <li>AI Campaign Analyzer</li>}
                {plan.features?.white_label && <li>White-label branding</li>}
              </ul>
              <button
                className="primary-btn"
                disabled={isCurrent || processingPlan === plan.code}
                onClick={() => handleSubscribe(plan.code)}
              >
                {isCurrent ? 'Current Plan' : processingPlan === plan.code ? 'Processing...' : 'Choose Plan'}
              </button>
            </div>
          );
        })}
      </div>

      <h3 className="section-title">Invoices</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Date</th>
            <th>Subtotal</th>
            <th>GST</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 ? (
            <tr><td colSpan={6}>No invoices yet.</td></tr>
          ) : (
            invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{inv.invoice_number}</td>
                <td>{new Date(inv.created_at).toLocaleDateString()}</td>
                <td>₹{inv.subtotal}</td>
                <td>₹{inv.gst_amount} ({inv.gst_rate}%)</td>
                <td>₹{inv.total}</td>
                <td><span className={`status-badge status-${inv.status}`}>{inv.status}</span></td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}