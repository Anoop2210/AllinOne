require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');

const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const contactRoutes = require('./routes/contact.routes');
const dealRoutes = require('./routes/deal.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const billingRoutes = require('./routes/billing.routes');
const metaIntegrationRoutes = require('./routes/meta-integration.routes');
const metaWebhookRoutes = require('./routes/meta-webhook.routes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const reportsRoutes = require('./routes/reports.routes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(
  express.json({
    limit: '2mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString(); // needed for Razorpay webhook signature verification
    },
  })
);
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// Basic rate limiting on auth endpoints to slow down brute force attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/integrations/meta', metaIntegrationRoutes);
app.use('/api/webhooks/meta', metaWebhookRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
    app.listen(PORT, () => {
      console.log(`CRM Core backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to connect to database:', err);
    process.exit(1);
  }
})();

module.exports = app;