const { Lead } = require('../models');
const buildCrudController = require('./crud.factory');
const { toCsv, parseCsv } = require('../utils/csv');

const base = buildCrudController(Lead, {
  entityType: 'lead',
  viewAllPermission: 'lead.view_all',
  searchableFields: ['full_name', 'email', 'phone', 'company_name'],
});

const EXPORT_COLUMNS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company_name', label: 'Company' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'notes', label: 'Notes' },
];

const VALID_STATUSES = ['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'];

function scopeFilter(req) {
  const where = { tenant_id: req.tenantId, is_deleted: false };
  const canViewAll = req.isSuperAdmin || req.permissions.includes('lead.view_all');
  if (!canViewAll) where.owner_id = req.user.id;
  return where;
}

// GET /api/leads/export   (tenant-scoped) - downloads a CSV of leads currently visible to this user
async function exportCsv(req, res) {
  try {
    const rows = await Lead.findAll({
      where: scopeFilter(req),
      order: [['created_at', 'DESC']],
    });

    const csv = toCsv(rows.map((r) => r.toJSON()), EXPORT_COLUMNS);
    const filename = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    console.error('Lead export error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export leads' });
  }
}

// POST /api/leads/import   (tenant-scoped)
// Body: { csv: "<raw csv text>" }
// Expected columns (case-insensitive header): full_name/name, email, phone, company_name/company, status, source, notes
async function importCsv(req, res) {
  try {
    const { csv } = req.body;
    if (!csv || typeof csv !== 'string') {
      return res.status(400).json({ success: false, message: 'csv text is required' });
    }

    const parsedRows = parseCsv(csv);
    if (parsedRows.length === 0) {
      return res.status(400).json({ success: false, message: 'No rows found in CSV' });
    }
    if (parsedRows.length > 2000) {
      return res.status(400).json({ success: false, message: 'Import limited to 2000 rows at a time' });
    }

    const results = { created: 0, skipped: 0, errors: [] };

    for (let i = 0; i < parsedRows.length; i++) {
      const r = parsedRows[i];
      const fullName = r.full_name || r.name || r['full name'];
      if (!fullName) {
        results.skipped++;
        results.errors.push(`Row ${i + 2}: missing name - skipped`);
        continue;
      }

      const status = VALID_STATUSES.includes((r.status || '').toLowerCase())
        ? r.status.toLowerCase()
        : 'new';

      try {
        await Lead.create({
          tenant_id: req.tenantId,
          owner_id: req.user.id,
          full_name: fullName,
          email: r.email || null,
          phone: r.phone || null,
          company_name: r.company_name || r.company || null,
          status,
          source: r.source || 'manual',
          notes: r.notes || null,
        });
        results.created++;
      } catch (err) {
        results.skipped++;
        results.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    console.error('Lead import error:', err);
    return res.status(500).json({ success: false, message: 'Failed to import leads' });
  }
}

module.exports = { ...base, exportCsv, importCsv };