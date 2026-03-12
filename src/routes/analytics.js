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
    let completedSql = 'SELECT COUNT(*) as count FROM goals WHERE company_id = ? AND dimension = ? AND completed_at IS NOT NULL';
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

  const score = company.global_score_goal === 0 ? 0 : row.total_score / company.global_score_goal;

  res.json({ score, total_score: row.total_score, global_score_goal: company.global_score_goal });
});

module.exports = router;
