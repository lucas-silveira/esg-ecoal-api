const { Router } = require('express');
const { companySchema } = require('../validation/schemas');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

router.post('/', (req, res) => {
  const result = companySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { name, cnpj, global_score_goal } = result.data;

  const existing = req.db.prepare('SELECT id FROM companies WHERE cnpj = ?').get(cnpj);
  if (existing) {
    return res.status(409).json({ error: 'CNPJ already registered' });
  }

  const info = req.db.prepare(
    'INSERT INTO companies (name, cnpj, global_score_goal) VALUES (?, ?, ?)'
  ).run(name, cnpj, global_score_goal ?? 100);

  const company = req.db.prepare('SELECT * FROM companies WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(company);
});

router.get('/:id', (req, res) => {
  const company = req.db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  if (company.id !== req.user.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  res.json(company);
});

router.put('/:id', (req, res) => {
  const company = req.db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  if (company.id !== req.user.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const result = companySchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { name, cnpj, global_score_goal } = result.data;

  const duplicate = req.db.prepare('SELECT id FROM companies WHERE cnpj = ? AND id != ?').get(cnpj, company.id);
  if (duplicate) {
    return res.status(409).json({ error: 'CNPJ already registered' });
  }

  req.db.prepare(
    "UPDATE companies SET name = ?, cnpj = ?, global_score_goal = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(name, cnpj, global_score_goal ?? company.global_score_goal, company.id);

  const updated = req.db.prepare('SELECT * FROM companies WHERE id = ?').get(company.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const company = req.db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }
  if (company.id !== req.user.companyId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  req.db.prepare('DELETE FROM companies WHERE id = ?').run(company.id);
  res.status(204).end();
});

module.exports = router;
