const express = require('express');
const cors = require('cors');
const notificationsRouter = require('./routes/notifications');
const preferencesRouter = require('./routes/preferences');
const internalRouter = require('./routes/internal');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    service: 'notification-service',
    message: 'Notification service is running',
    endpoints: {
      health: '/health',
      notifications: '/api/v1/notifications',
      preferences: '/api/v1/preferences',
      internal: '/api/v1/internal',
    },
  });
});

app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/v1/notifications', notificationsRouter);
app.use('/api/v1/preferences', preferencesRouter);
app.use('/api/v1/internal', internalRouter);

app.use(errorHandler);

module.exports = app;
