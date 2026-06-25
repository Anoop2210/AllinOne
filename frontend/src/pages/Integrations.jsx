import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Integrations() {
  const [status, setStatus] = useState(null);
  const [attribution, setAttribution] = useState([]);
  const [form, setForm] = useState({ pageId: '', pageName: '', pageAccessToken: '', adAccountId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  // WhatsApp Business state
  const [waStatus, setWaStatus] = useState(null);
  const [waForm, setWaForm] = useState({ phoneNumberId: '', accessToken: '', displayPhoneNumber: '', businessAccountId: '' });
  const [waError, setWaError] = useState('');
  const [waSuccess, setWaSuccess] = useState('');
  const [showWaForm, setShowWaForm] = useState(false);

  async function load() {
    try {
      const [statusRes, attrRes] = await Promise.all([
        api.get('/integrations/meta/status'),
        api.get('/integrations/meta/attribution'),
      ]);
      setStatus(statusRes.data.data);
      setAttribution(attrRes.data.data);
    } catch (err) {
      // status/attribution may legitimately be empty - ignore
    }
  }

  async function loadWhatsApp() {
    try {
      const res = await api.get('/whatsapp/status');
      setWaStatus(res.data.data);
    } catch (err) {
      // not connected yet - ignore
    }
  }

  useEffect(() => {
    load();
    loadWhatsApp();
  }, []);

  async function handleConnect(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/integrations/meta/connect', form);
      setSuccess('Meta Lead Ads connected successfully.');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect');
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Meta Lead Ads? Webhook leads will stop syncing.')) return;
    await api.delete('/integrations/meta');
    setStatus(null);
    load();
  }

  async function handleWaConnect(e) {
    e.preventDefault();
    setWaError('');
    setWaSuccess('');
    try {
      await api.post('/whatsapp/connect', waForm);
      setWaSuccess('WhatsApp Business connected successfully.');
      setShowWaForm(false);
      loadWhatsApp();
    } catch (err) {
      setWaError(err.response?.data?.message || 'Failed to connect');
    }
  }

  async function handleWaDisconnect() {
    if (!window.confirm('Disconnect WhatsApp Business? You will stop being able to send/receive messages.')) return;
    await api.delete('/whatsapp');
    setWaStatus(null);
    loadWhatsApp();
  }

  return (
    <div className="resource-page">
      <h2>Integrations</h2>

      <div className="integration-card">
        <div className="integration-header">
          <div>
            <h3>Meta Lead Ads</h3>
            <p className="plan-desc">Sync Facebook and Instagram Lead Ads directly into your Leads.</p>
          </div>
          {status ? (
            <span className="status-badge status-active">Connected</span>
          ) : (
            <span className="status-badge status-cancelled">Not connected</span>
          )}
        </div>

        {error && <div className="error-banner">{error}</div>}
        {success && <div className="hint-text">{success}</div>}

        {status ? (
          <div className="integration-details">
            <div><strong>Page:</strong> {status.page_name || status.page_id}</div>
            <div>
              <strong>Last lead received:</strong>{' '}
              {status.last_webhook_at ? new Date(status.last_webhook_at).toLocaleString() : 'Not yet'}
            </div>
            {status.last_error && <div className="error-banner">Last error: {status.last_error}</div>}
            <button className="danger-link" onClick={handleDisconnect}>Disconnect</button>
          </div>
        ) : (
          <>
            {!showForm ? (
              <button className="primary-btn" onClick={() => setShowForm(true)}>Connect Meta Lead Ads</button>
            ) : (
              <form onSubmit={handleConnect} className="integration-form">
                <div className="form-row">
                  <label>Facebook Page ID</label>
                  <input value={form.pageId} onChange={(e) => setForm({ ...form, pageId: e.target.value })} required />
                </div>
                <div className="form-row">
                  <label>Page Name (optional)</label>
                  <input value={form.pageName} onChange={(e) => setForm({ ...form, pageName: e.target.value })} />
                </div>
                <div className="form-row">
                  <label>Page Access Token</label>
                  <input
                    type="password"
                    value={form.pageAccessToken}
                    onChange={(e) => setForm({ ...form, pageAccessToken: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Ad Account ID (optional, for cost data)</label>
                  <input value={form.adAccountId} onChange={(e) => setForm({ ...form, adAccountId: e.target.value })} />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="primary-btn">Save & Connect</button>
                </div>
              </form>
            )}
            <p className="hint-text" style={{ marginTop: 14 }}>
              Generate a Page Access Token in Meta's Graph API Explorer (developers.facebook.com)
              with leads_retrieval and pages_show_list permissions, then paste it above.
              In your App Dashboard, add a Webhook subscribed to the "leadgen" field, pointing to
              your backend's <code>/api/webhooks/meta</code> URL, using the verify token from
              your backend's <code>.env</code> file (<code>META_WEBHOOK_VERIFY_TOKEN</code>).
            </p>
          </>
        )}
      </div>

      <div className="integration-card" style={{ marginTop: 20 }}>
        <div className="integration-header">
          <div>
            <h3>WhatsApp Business</h3>
            <p className="plan-desc">Send and receive WhatsApp messages with your leads and contacts.</p>
          </div>
          {waStatus ? (
            <span className="status-badge status-active">Connected</span>
          ) : (
            <span className="status-badge status-cancelled">Not connected</span>
          )}
        </div>

        {waError && <div className="error-banner">{waError}</div>}
        {waSuccess && <div className="hint-text">{waSuccess}</div>}

        {waStatus ? (
          <div className="integration-details">
            <div><strong>Number:</strong> {waStatus.display_phone_number || waStatus.phone_number_id}</div>
            <div>
              <strong>Last message received:</strong>{' '}
              {waStatus.last_webhook_at ? new Date(waStatus.last_webhook_at).toLocaleString() : 'Not yet'}
            </div>
            {waStatus.last_error && <div className="error-banner">Last error: {waStatus.last_error}</div>}
            <button className="danger-link" onClick={handleWaDisconnect}>Disconnect</button>
          </div>
        ) : (
          <>
            {!showWaForm ? (
              <button className="primary-btn" onClick={() => setShowWaForm(true)}>Connect WhatsApp Business</button>
            ) : (
              <form onSubmit={handleWaConnect} className="integration-form">
                <div className="form-row">
                  <label>Phone Number ID</label>
                  <input
                    value={waForm.phoneNumberId}
                    onChange={(e) => setWaForm({ ...waForm, phoneNumberId: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Access Token</label>
                  <input
                    type="password"
                    value={waForm.accessToken}
                    onChange={(e) => setWaForm({ ...waForm, accessToken: e.target.value })}
                    required
                  />
                </div>
                <div className="form-row">
                  <label>Display Phone Number (optional)</label>
                  <input
                    value={waForm.displayPhoneNumber}
                    onChange={(e) => setWaForm({ ...waForm, displayPhoneNumber: e.target.value })}
                  />
                </div>
                <div className="form-row">
                  <label>Business Account ID (optional)</label>
                  <input
                    value={waForm.businessAccountId}
                    onChange={(e) => setWaForm({ ...waForm, businessAccountId: e.target.value })}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" onClick={() => setShowWaForm(false)}>Cancel</button>
                  <button type="submit" className="primary-btn">Save & Connect</button>
                </div>
              </form>
            )}
            <p className="hint-text" style={{ marginTop: 14 }}>
              Get the Phone Number ID and a permanent access token from Meta's WhatsApp
              Business Platform (business.facebook.com → WhatsApp → API Setup), using a
              System User token so it doesn't expire like a temporary one.
            </p>
          </>
        )}
      </div>

      <h3 className="section-title">Lead Attribution Report</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Campaign</th>
            <th>Ad Set</th>
            <th>Ad</th>
            <th>Leads</th>
            <th>Converted</th>
          </tr>
        </thead>
        <tbody>
          {attribution.length === 0 ? (
            <tr><td colSpan={5}>No attributed leads yet. Leads synced from Meta will appear here.</td></tr>
          ) : (
            attribution.map((row, i) => (
              <tr key={i}>
                <td>{row.campaign_name || '-'}</td>
                <td>{row.ad_set_name || '-'}</td>
                <td>{row.ad_name || '-'}</td>
                <td>{row.lead_count}</td>
                <td>{row.converted_count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}