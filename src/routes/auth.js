const { Router } = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { signUpSchema, signInSchema } = require('../validation/schemas');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = Router();

router.post('/sign-up', (req, res) => {
  const result = signUpSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { name, email, password, role, cnpj } = result.data;

  const company = req.db.prepare('SELECT id FROM companies WHERE cnpj = ?').get(cnpj);
  if (!company) {
    return res.status(404).json({ error: 'Company not found for the given CNPJ' });
  }

  const existing = req.db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = req.db.prepare(
    'INSERT INTO users (name, email, password, role, company_id) VALUES (?, ?, ?, ?, ?)'
  ).run(name, email, hash, role, company.id);

  const user = req.db.prepare('SELECT id, name, email, role, company_id FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(user);
});

router.post('/sign-in', (req, res) => {
  const result = signInSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { email, password } = result.data;

  const user = req.db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = req.db.prepare('SELECT id, name, email, role, company_id FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

module.exports = router;
