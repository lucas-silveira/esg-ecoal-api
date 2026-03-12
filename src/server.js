const { createDb } = require('./db');
const { createApp } = require('./app');

const db = createDb();
const app = createApp(db);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ESG EcoAl API running on port ${PORT}`);
});
