const { Lead, Deal, sequelize } = require('../models');

// GET /api/reports/overview   (tenant-scoped)
// Single endpoint that powers the Analytics page: lead funnel, deal pipeline,
// source breakdown, conversion rate, and a 6-month trend line.
exports.overview = async (req, res) => {
  try {
    const tenantId = req.tenantId;

    // ---- Lead funnel (count per status) ----
    const leadStatusRows = await Lead.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'],
      raw: true,
    });

    const STATUS_ORDER = ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'];
    const leadFunnel = STATUS_ORDER.map((status) => ({
      status,
      count: parseInt(leadStatusRows.find((r) => r.status === status)?.count || 0, 10),
    }));

    const totalLeads = leadFunnel.reduce((sum, r) => sum + r.count, 0);
    const convertedLeads = leadFunnel.find((r) => r.status === 'converted')?.count || 0;
    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 1000) / 10 : 0;

    // ---- Deal pipeline (count + total value per stage) ----
    const dealStageRows = await Deal.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      attributes: [
        'stage',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('value')), 'total_value'],
      ],
      group: ['stage'],
      raw: true,
    });

    const STAGE_ORDER = ['prospecting', 'qualification', 'proposal', 'negotiation', 'won', 'lost'];
    const dealPipeline = STAGE_ORDER.map((stage) => {
      const row = dealStageRows.find((r) => r.stage === stage);
      return {
        stage,
        count: parseInt(row?.count || 0, 10),
        totalValue: parseFloat(row?.total_value || 0),
      };
    });

    const openDeals = dealPipeline.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const pipelineValue = openDeals.reduce((sum, d) => sum + d.totalValue, 0);
    const wonValue = dealPipeline.find((d) => d.stage === 'won')?.totalValue || 0;
    const totalDeals = dealPipeline.reduce((sum, d) => sum + d.count, 0);
    const wonDeals = dealPipeline.find((d) => d.stage === 'won')?.count || 0;
    const winRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 1000) / 10 : 0;

    // ---- Source breakdown (leads grouped by source) ----
    const sourceRows = await Lead.findAll({
      where: { tenant_id: tenantId, is_deleted: false },
      attributes: ['source', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['source'],
      order: [[sequelize.literal('count'), 'DESC']],
      raw: true,
    });
    const sourceBreakdown = sourceRows.map((r) => ({
      source: r.source || 'manual',
      count: parseInt(r.count, 10),
    }));

    // ---- 6-month lead trend ----
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const trendRows = await Lead.findAll({
      where: {
        tenant_id: tenantId,
        is_deleted: false,
        created_at: { [require('sequelize').Op.gte]: sixMonthsAgo },
      },
      attributes: [
        [sequelize.fn('to_char', sequelize.col('created_at'), 'YYYY-MM'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: [sequelize.fn('to_char', sequelize.col('created_at'), 'YYYY-MM')],
      raw: true,
    });

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const row = trendRows.find((r) => r.month === key);
      monthlyTrend.push({
        month: d.toLocaleString('en-US', { month: 'short' }),
        count: parseInt(row?.count || 0, 10),
      });
    }

    return res.json({
      success: true,
      data: {
        totals: { totalLeads, totalDeals, pipelineValue, wonValue, conversionRate, winRate },
        leadFunnel,
        dealPipeline,
        sourceBreakdown,
        monthlyTrend,
      },
    });
  } catch (err) {
    console.error('Reports overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate analytics' });
  }
};