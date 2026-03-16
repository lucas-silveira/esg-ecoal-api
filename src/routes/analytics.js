const { Router } = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = Router();
router.use(authMiddleware);

function getDateRange(period) {
  switch (period) {
    case 'monthly':
      return "datetime('now', '-1 month')";
    case 'quarterly':
      return "datetime('now', '-3 months')";
    case 'annual':
      return "datetime('now', '-1 year')";
    default:
      return null;
  }
}

router.get('/dimensions', (req, res) => {
  const companyId = req.user.companyId;
  const period = req.query.period;
  const dateRange = getDateRange(period);

  const dimensions = ['environmental', 'social', 'governance'];
  const result = {};

  for (const dim of dimensions) {
    let totalSql = 'SELECT COUNT(*) as count FROM goals WHERE company_id = ? AND dimension = ?';
    let completedSql = `SELECT COUNT(*) as count FROM goals g
      WHERE g.company_id = ? AND g.dimension = ?
      AND EXISTS (SELECT 1 FROM tasks t WHERE t.goal_id = g.id)
      AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.completed = 0)`;
    const params = [companyId, dim];

    if (dateRange) {
      const dateFilter = ` AND created_at >= ${dateRange}`;
      totalSql += dateFilter;
      completedSql += dateFilter;
    }

    const total = req.db.prepare(totalSql).get(...params).count;
    const completed = req.db.prepare(completedSql).get(...params).count;

    result[dim] = total === 0 ? 0 : completed / total;
  }

  res.json(result);
});

router.get('/score', (req, res) => {
  const companyId = req.user.companyId;

  const company = req.db.prepare('SELECT global_score_goal FROM companies WHERE id = ?').get(companyId);
  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const row = req.db.prepare(`
    SELECT COALESCE(SUM(t.score), 0) as total_score
    FROM tasks t
    JOIN goals g ON t.goal_id = g.id
    WHERE g.company_id = ? AND t.completed = 1
  `).get(companyId);

  const score_progress = company.global_score_goal === 0 ? 0 : row.total_score / company.global_score_goal;

  res.json({ score_progress, total_score: row.total_score, global_score_goal: company.global_score_goal });
});

router.get('/dashboard', (req, res) => {
  const companyId = req.user.companyId;
  const userId = req.user.id;

  try {
    const departmentsData = req.db.prepare(
      `SELECT department, COUNT(id) as count FROM users WHERE company_id = ? AND department IS NOT NULL GROUP BY department`
    ).all(companyId);

    const contributionsData = req.db.prepare(
      `SELECT category, SUM(points) as total_points FROM user_contributions WHERE user_id = ? GROUP BY category`
    ).all(userId);

    const energyData = req.db.prepare(
      `SELECT month, realized_value, goal_value FROM energy_metrics WHERE company_id = ? AND year = 2025 ORDER BY id ASC`
    ).all(companyId);

    const trainingData = req.db.prepare(
      `SELECT quarter, total_hours FROM training_metrics WHERE company_id = ? AND year = 2025 ORDER BY id ASC`
    ).all(companyId);

    res.json({
      departmentParticipation: departmentsData.reduce((acc, curr) => {
        acc[curr.department] = curr.count;
        return acc;
      }, {}),
      
      myContributions: {
        labels: contributionsData.map(c => c.category),
        values: contributionsData.map(c => c.total_points)
      },
      
      energyConsumption: {
        labels: energyData.map(e => e.month),
        realized: energyData.map(e => e.realized_value),
        goal: energyData.map(e => e.goal_value)
      },
      
      trainingEngagement: {
        labels: trainingData.map(t => t.quarter),
        values: trainingData.map(t => t.total_hours)
      }
    });

  } catch (error) {
    console.error("Erro ao pegar os dados:", error);
    res.status(500).json({ error: "Erro interno ao processar dados do dashboard" });
  }
});

module.exports = router;
