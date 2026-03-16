const { createDb } = require('./db');
const bcrypt = require('bcryptjs');

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

const companyId = 1;

const passwordHash = bcrypt.hashSync('senha123', 10);
const users = [
  { name: 'Bia', email: 'bia@ecoal.com', dept: 'Design' },
  { name: 'Miranda', email: 'miranda@ecoal.com', dept: 'Logística' },
  { name: 'Leo', email: 'leo@ecoal.com', dept: 'Operações' },
  { name: 'Lucas', email: 'lucas@ecoal.com', dept: 'Operações' },
  { name: 'Sandra', email: 'sandra@ecoal.com', dept: 'Logística' }
];
const categories = [
  'Reciclagem',
  'Econ. Energia',
  'Uso de Água',
  'Ação Social'
];

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role, company_id, department)
  VALUES (?, ?, ?, ?, ?, ?)
`);

users.forEach(u => insertUser.run(u.name, u.email, passwordHash, 'employee', companyId, u.dept));

const insertContribution = db.prepare(`
  INSERT INTO user_contributions (user_id, category, points)
  VALUES (?, ?, ?)
`);

const userRows = db.prepare(`SELECT id FROM users`).all();

userRows.forEach(user => {
  categories.forEach(category => {
    const points = Math.floor(Math.random() * 50);
    insertContribution.run(user.id, category, points);
  });
});

const insertEnergy = db.prepare(`
  INSERT INTO energy_metrics (company_id, month, year, realized_value, goal_value) 
  VALUES (?, ?, ?, ?, ?)
`);
insertEnergy.run(companyId, 'Jan', 2025, 115, 100);
insertEnergy.run(companyId, 'Fev', 2025, 108, 100);
insertEnergy.run(companyId, 'Mar', 2025, 102, 100);
insertEnergy.run(companyId, 'Abr', 2025, 95, 100);

const insertTraining = db.prepare(`
  INSERT INTO training_metrics (company_id, quarter, year, total_hours)
  VALUES (?, ?, ?, ?)
`);
insertTraining.run(companyId, 'Trim 1', 2025, 120);
insertTraining.run(companyId, 'Trim 2', 2025, 150);
insertTraining.run(companyId, 'Trim 3', 2025, 200);
insertTraining.run(companyId, 'Trim 4', 2025, 180);

console.log('Database with mocked data created');

db.close();
