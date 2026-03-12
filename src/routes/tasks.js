const { Router } = require('express');
const { taskSchema } = require('../validation/schemas');
const { authMiddleware } = require('../middleware/auth');

const router = Router({ mergeParams: true });
router.use(authMiddleware);

function getGoal(req, res) {
  const goal = req.db.prepare('SELECT * FROM goals WHERE id = ? AND company_id = ?').get(
    req.params.goalId,
    req.user.companyId
  );
  if (!goal) {
    res.status(404).json({ error: 'Goal not found' });
    return null;
  }
  return goal;
}

router.get('/', (req, res) => {
  const goal = getGoal(req, res);
  if (!goal) return;

  let sql = 'SELECT * FROM tasks WHERE goal_id = ?';
  const params = [goal.id];

  if (req.query.completed !== undefined) {
    sql += ' AND completed = ?';
    params.push(req.query.completed === 'true' ? 1 : 0);
  }
  if (req.query.completed_at) {
    sql += ' AND completed_at IS NOT NULL';
  }
  if (req.query.created_at) {
    sql += ' AND created_at >= ?';
    params.push(req.query.created_at);
  }

  sql += ' ORDER BY created_at DESC';

  const tasks = req.db.prepare(sql).all(...params);
  res.json(tasks);
});

router.post('/', (req, res) => {
  const goal = getGoal(req, res);
  if (!goal) return;

  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const count = req.db.prepare('SELECT COUNT(*) as count FROM tasks WHERE goal_id = ?').get(goal.id).count;
  if (count >= 10) {
    return res.status(422).json({ error: 'Maximum of 10 tasks per goal reached' });
  }

  const { title, description, score, completed, completed_at } = result.data;
  const completedInt = completed ? 1 : 0;

  const info = req.db.prepare(
    'INSERT INTO tasks (title, description, score, completed, completed_at, goal_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description ?? null, score ?? 0, completedInt, completed_at ?? null, goal.id);

  const task = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(task);
});

router.get('/:id', (req, res) => {
  const goal = getGoal(req, res);
  if (!goal) return;

  const task = req.db.prepare('SELECT * FROM tasks WHERE id = ? AND goal_id = ?').get(
    req.params.id,
    goal.id
  );
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json(task);
});

router.put('/:id', (req, res) => {
  const goal = getGoal(req, res);
  if (!goal) return;

  const task = req.db.prepare('SELECT * FROM tasks WHERE id = ? AND goal_id = ?').get(
    req.params.id,
    goal.id
  );
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const result = taskSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: result.error.flatten().fieldErrors });
  }

  const { title, description, score, completed, completed_at } = result.data;
  const completedInt = completed !== undefined ? (completed ? 1 : 0) : task.completed;

  req.db.prepare(
    "UPDATE tasks SET title = ?, description = ?, score = ?, completed = ?, completed_at = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(
    title,
    description ?? null,
    score ?? task.score,
    completedInt,
    completed_at ?? null,
    task.id
  );

  const updated = req.db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const goal = getGoal(req, res);
  if (!goal) return;

  const task = req.db.prepare('SELECT * FROM tasks WHERE id = ? AND goal_id = ?').get(
    req.params.id,
    goal.id
  );
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  req.db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  res.status(204).end();
});

module.exports = router;
