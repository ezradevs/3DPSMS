const app = require('./app');
const { initDatabase } = require('./db');

const PORT = process.env.PORT || 4000;

function start() {
  initDatabase();

  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start();
