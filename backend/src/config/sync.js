require('dotenv').config();
const { sequelize } = require('../models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection established.');
    await sequelize.sync({ alter: true });
    console.log('All tables synced successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Unable to sync database:', err);
    process.exit(1);
  }
})();
