const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');

function createTestContext() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');

  const schema = fs.readFileSync(path.join(__dirname, '..', 'src', 'schema.sql'), 'utf-8');
  db.exec(schema);

  const app = createApp(db);

  return { db, app, request: request(app) };
}

function seedCompany(db, { name = 'Test Corp', cnpj = '12345678000100', global_score_goal = 100 } = {}) {
  const info = db.prepare(
    'INSERT INTO companies (name, cnpj, global_score_goal) VALUES (?, ?, ?)'
  ).run(name, cnpj, global_score_goal);
  return db.prepare('SELECT * FROM companies WHERE id = ?').get(info.lastInsertRowid);
}

async function seedUser(ctx, { name = 'Test User', email = 'test@example.com', password = 'password123', role = 'admin', cnpj = '12345678000100' } = {}) {
  const res = await ctx.request.post('/api/auth/sign-up').send({ name, email, password, role, cnpj });
  return res.body;
}

async function authenticate(ctx, { email = 'test@example.com', password = 'password123' } = {}) {
  const res = await ctx.request.post('/api/auth/sign-in').send({ email, password });
  return res.body.token;
}

module.exports = { createTestContext, seedCompany, seedUser, authenticate };
