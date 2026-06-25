import { useEffect, useState } from 'react';
import api from '../api/client';

const STATUS_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  unqualified: 'Unqualified',
  converted: 'Converted',
  lost: 'Lost',
};

const STAGE_LABELS = {
  prospecting: 'Prospecting',
  qualification: 'Qualification',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const SOURCE_LABELS = {
  manual: 'Manual',
  facebook_lead_ads: 'Facebook Ads',
  instagram_lead_ads: 'Instagram Ads',
  meta_lead_ads: 'Meta Ads',
  whatsapp: 'WhatsApp',
  website: 'Website',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0);
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/reports/overview');
        setData(res.data.data);
      } catch (err) {
        // leave data null - empty state below handles it
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="full-screen-loader">Loading analytics…</div>;
  if (!data) return <div className="resource-page"><h2>Analytics</h2><p className="hint-text">Could not load analytics right now.</p></div>;

  const { totals, leadFunnel, dealPipeline, sourceBreakdown, monthlyTrend } = data;
  const maxFunnel = Math.max(1, ...leadFunnel.map((r) => r.count));
  const maxTrend = Math.max(1, ...monthlyTrend.map((r) => r.count));
  const maxSource = Math.max(1, ...sourceBreakdown.map((r) => r.count));
  const pipelineTotal = Math.max(1, dealPipeline.reduce((s, d) => s + d.count, 0));

  return (
    <div className="resource-page">
      <h2>Analytics</h2>

      <div className="stat-grid analytics-kpis">
        <div className="stat-card">
          <div className="stat-value">{totals.totalLeads}</div>
          <div className="stat-label">Total Leads</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.conversionRate}%</div>
          <div className="stat-label">Lead Conversion Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{formatCurrency(totals.pipelineValue)}</div>
          <div className="stat-label">Open Pipeline Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{formatCurrency(totals.wonValue)}</div>
          <div className="stat-label">Won Value</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.totalDeals}</div>
          <div className="stat-label">Total Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totals.winRate}%</div>
          <div className="stat-label">Deal Win Rate</div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="chart-card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Lead Funnel</h3>
          <div className="bar-chart">
            {leadFunnel.map((row) => (
              <div className="bar-row" key={row.status}>
                <span className="bar-label">{STATUS_LABELS[row.status]}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill bar-${row.status}`}
                    style={{ width: `${(row.count / maxFunnel) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{row.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Leads Trend (last 6 months)</h3>
          <div className="trend-chart">
            {monthlyTrend.map((row) => (
              <div className="trend-col" key={row.month}>
                <div className="trend-bar-wrap">
                  <div className="trend-bar" style={{ height: `${(row.count / maxTrend) * 100}%` }} />
                </div>
                <span className="trend-count">{row.count}</span>
                <span className="trend-month">{row.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Deal Pipeline by Stage</h3>
          <div className="bar-chart">
            {dealPipeline.map((row) => (
              <div className="bar-row" key={row.stage}>
                <span className="bar-label">{STAGE_LABELS[row.stage]}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill bar-stage-${row.stage}`}
                    style={{ width: `${(row.count / pipelineTotal) * 100}%` }}
                  />
                </div>
                <span className="bar-value">{row.count} · ₹{formatCurrency(row.totalValue)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card">
          <h3 className="section-title" style={{ marginTop: 0 }}>Lead Source Breakdown</h3>
          {sourceBreakdown.length === 0 ? (
            <p className="hint-text">No leads yet — once leads come in, their source will show here.</p>
          ) : (
            <div className="bar-chart">
              {sourceBreakdown.map((row) => (
                <div className="bar-row" key={row.source}>
                  <span className="bar-label">{SOURCE_LABELS[row.source] || row.source}</span>
                  <div className="bar-track">
                    <div className="bar-fill bar-source" style={{ width: `${(row.count / maxSource) * 100}%` }} />
                  </div>
                  <span className="bar-value">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}