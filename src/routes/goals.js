const { Router } = require('express');
const { goalSchema } = require('../validation/schemas');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  let sql = 'SELECT * FROM goals WHERE company_id = ?';
  const params = [req.user.companyId];

  if (req.query.dimension) {
    sql += ' AND dimension = ?';
    params.push(req.query.dimension);
  }
  if (req.query.completed_at) {
    sql += ' AND completed_at IS NOT NULL';
  }
  if (req.query.created_at) {
    sql += ' AND created_at >= ?';
    params.push(req.query.created_at);
  }

  sql += ' ORDER BY created_at DESC';

  const goals = req.db.prepare(sql).all(...params);

  const tasksStmt = req.db.prepare('SELECT * FROM tasks WHERE goal_id = ?');
  const result = goals.map((goal) => ({
    ...goal,
    tasks: tasksStmt.all(goal.id),
  }));

  res.json(result);
});

router.post('/', (req, res) => {
  const result = goalSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { title, description, dimension } = result.data;
  const companyId = req.user.companyId;

  const count = req.db.prepare(
    'SELECT COUNT(*) as count FROM goals WHERE company_id = ? AND dimension = ?'
  ).get(companyId, dimension).count;

  if (count >= 10) {
    return res.status(422).json({ error: `Maximum of 10 goals per dimension reached` });
  }

  const info = req.db.prepare(
    'INSERT INTO goals (title, description, dimension, company_id) VALUES (?, ?, ?, ?)'
  ).run(title, description ?? null, dimension, companyId);

  const goal = req.db.prepare('SELECT * FROM goals WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ ...goal, tasks: [] });
});

router.get('/:id', (req, res) => {
  const goal = req.db.prepare('SELECT * FROM goals WHERE id = ? AND company_id = ?').get(
    req.params.id,
    req.user.companyId
  );
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const tasks = req.db.prepare('SELECT * FROM tasks WHERE goal_id = ?').all(goal.id);
  res.json({ ...goal, tasks });
});

router.put('/:id', (req, res) => {
  const goal = req.db.prepare('SELECT * FROM goals WHERE id = ? AND company_id = ?').get(
    req.params.id,
    req.user.companyId
  );
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  const result = goalSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { title, description, dimension, completed_at } = result.data;

  req.db.prepare(
    "UPDATE goals SET title = ?, description = ?, dimension = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(title, description ?? null, dimension, completed_at ?? null, goal.id);

  const updated = req.db.prepare('SELECT * FROM goals WHERE id = ?').get(goal.id);
  const tasks = req.db.prepare('SELECT * FROM tasks WHERE goal_id = ?').all(goal.id);
  res.json({ ...updated, tasks });
});

router.delete('/:id', (req, res) => {
  const goal = req.db.prepare('SELECT * FROM goals WHERE id = ? AND company_id = ?').get(
    req.params.id,
    req.user.companyId
  );
  if (!goal) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  req.db.prepare('DELETE FROM goals WHERE id = ?').run(goal.id);
  res.status(204).end();
});

module.exports = router;
