const { Activity } = require('../models');

/**
 * Builds a standard set of CRUD handlers for a tenant-scoped model.
 *
 * @param {Model} model - Sequelize model (Lead, Contact, Deal)
 * @param {Object} opts
 *   entityType: string used in activity log ('lead' | 'contact' | 'deal')
 *   viewAllPermission: permission code that grants visibility into all tenant records
 *   searchableFields: fields used for simple text search (?q=)
 */
function buildCrudController(model, { entityType, viewAllPermission, searchableFields = [] }) {
  function scopeFilter(req) {
    // Super admin should never hit these tenant-scoped endpoints directly without a tenant
    // context, but as a safeguard we always require tenant_id.
    const base = { tenant_id: req.tenantId, is_deleted: false };
    const canViewAll = req.isSuperAdmin || req.permissions.includes(viewAllPermission);
    if (!canViewAll) {
      base.owner_id = req.user.id;
    }
    return base;
  }

  return {
    async list(req, res) {
      try {
        const { Op } = require('sequelize');
        const where = scopeFilter(req);

        if (req.query.q && searchableFields.length) {
          where[Op.or] = searchableFields.map((f) => ({
            [f]: { [Op.iLike]: `%${req.query.q}%` },
          }));
        }
        if (req.query.status) where.status = req.query.status;
        if (req.query.stage) where.stage = req.query.stage;

        const page = parseInt(req.query.page || '1', 10);
        const limit = parseInt(req.query.limit || '25', 10);

        const { count, rows } = await model.findAndCountAll({
          where,
          limit,
          offset: (page - 1) * limit,
          order: [['created_at', 'DESC']],
        });

        return res.json({
          success: true,
          data: rows,
          pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) },
        });
      } catch (err) {
        console.error(`${entityType} list error:`, err);
        return res.status(500).json({ success: false, message: `Failed to fetch ${entityType}s` });
      }
    },

    async getOne(req, res) {
      try {
        const record = await model.findOne({
          where: { id: req.params.id, tenant_id: req.tenantId, is_deleted: false },
        });
        if (!record) return res.status(404).json({ success: false, message: `${entityType} not found` });
        return res.json({ success: true, data: record });
      } catch (err) {
        return res.status(500).json({ success: false, message: `Failed to fetch ${entityType}` });
      }
    },

    async create(req, res) {
      try {
        const record = await model.create({
          ...req.body,
          tenant_id: req.tenantId,
          owner_id: req.body.owner_id || req.user.id,
        });

        await Activity.create({
          tenant_id: req.tenantId,
          user_id: req.user.id,
          entity_type: entityType,
          entity_id: record.id,
          action: 'created',
          description: `${entityType} created`,
        });

        return res.status(201).json({ success: true, data: record });
      } catch (err) {
        console.error(`${entityType} create error:`, err);
        return res.status(400).json({ success: false, message: err.message });
      }
    },

    async update(req, res) {
      try {
        const record = await model.findOne({
          where: { id: req.params.id, tenant_id: req.tenantId, is_deleted: false },
        });
        if (!record) return res.status(404).json({ success: false, message: `${entityType} not found` });

        await record.update(req.body);

        await Activity.create({
          tenant_id: req.tenantId,
          user_id: req.user.id,
          entity_type: entityType,
          entity_id: record.id,
          action: 'updated',
          description: `${entityType} updated`,
          metadata: { changedFields: Object.keys(req.body) },
        });

        return res.json({ success: true, data: record });
      } catch (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
    },

    async remove(req, res) {
      try {
        const record = await model.findOne({
          where: { id: req.params.id, tenant_id: req.tenantId, is_deleted: false },
        });
        if (!record) return res.status(404).json({ success: false, message: `${entityType} not found` });

        await record.update({ is_deleted: true });

        await Activity.create({
          tenant_id: req.tenantId,
          user_id: req.user.id,
          entity_type: entityType,
          entity_id: record.id,
          action: 'deleted',
          description: `${entityType} soft-deleted`,
        });

        return res.json({ success: true, message: `${entityType} deleted` });
      } catch (err) {
        return res.status(500).json({ success: false, message: `Failed to delete ${entityType}` });
      }
    },
  };
}

module.exports = buildCrudController;
