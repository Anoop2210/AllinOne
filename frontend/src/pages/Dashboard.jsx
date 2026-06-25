import { useEffect, useState } from 'react';
import api from '../api/client';

export default function Dashboard() {
  const [counts, setCounts] = useState({ leads: 0, contacts: 0, deals: 0, openDeals: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [leads, contacts, deals] = await Promise.all([
          api.get('/leads', { params: { limit: 1 } }),
          api.get('/contacts', { params: { limit: 1 } }),
          api.get('/deals', { params: { limit: 1 } }),
        ]);
        setCounts({
          leads: leads.data.pagination?.total || 0,
          contacts: contacts.data.pagination?.total || 0,
          deals: deals.data.pagination?.total || 0,
        });
      } catch (err) {
        // silently ignore on dashboard
      }
    }
    load();
  }, []);

  return (
    <div className="resource-page">
      <h2>Dashboard</h2>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{counts.leads}</div>
          <div className="stat-label">Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.contacts}</div>
          <div className="stat-label">Contacts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{counts.deals}</div>
          <div className="stat-label">Deals</div>
        </div>
      </div>
      <p className="hint-text">
        This is the Core CRM module. Billing, WhatsApp, Meta Lead Ads, and AI Campaign Analyzer
        modules will plug in here in later phases.
      </p>
    </div>
  );
}
