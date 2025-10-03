const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes');
const { uploadsDir } = require('./utils/files');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(uploadsDir));

app.use('/api', apiRouter);

app.get('/', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
