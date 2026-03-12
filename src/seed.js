const { createDb } = require('./db');

const db = createDb();

const company = db.prepare(`
  INSERT OR IGNORE INTO companies (name, cnpj, global_score_goal)
  VALUES (?, ?, ?)
`).run('EcoAl Corp', '12345678000100', 100);

if (company.changes > 0) {
  console.log('Default company created (cnpj: 12345678000100)');
} else {
  console.log('Default company already exists, skipping');
}

db.close();
