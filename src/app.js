const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const goalsRoutes = require('./routes/goals');
const tasksRoutes = require('./routes/tasks');
const analyticsRoutes = require('./routes/analytics');
const { swaggerSpec, swaggerUi } = require('./swagger');

function createApp(db) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use((req, _res, next) => {
    req.db = db;
    next();
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/companies', companiesRoutes);
  app.use('/api/goals', goalsRoutes);
  app.use('/api/goals/:goalId/tasks', tasksRoutes);
  app.use('/api/analytics', analyticsRoutes);

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  return app;
}

module.exports = { createApp };
