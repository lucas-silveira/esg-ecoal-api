const { createTestContext, seedCompany, seedUser, authenticate } = require('./setup');

describe('Analytics', () => {
  let ctx, token;

  beforeEach(async () => {
    ctx = createTestContext();
    seedCompany(ctx.db, { global_score_goal: 100 });
    await seedUser(ctx);
    token = await authenticate(ctx);
  });

  describe('GET /api/analytics/dimensions', () => {
    it('returns zeroes when no goals exist', async () => {
      const res = await ctx.request
        .get('/api/analytics/dimensions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ environmental: 0, social: 0, governance: 0 });
    });

    it('calculates progress per dimension', async () => {
      // Create 2 environmental goals, complete 1
      const g1 = await ctx.request
        .post('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'E1', dimension: 'environmental' });

      await ctx.request
        .post('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'E2', dimension: 'environmental' });

      await ctx.request
        .post(`/api/goals/${g1.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'T1', completed: true });

      const res = await ctx.request
        .get('/api/analytics/dimensions')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.environmental).toBe(0.5);
      expect(res.body.social).toBe(0);
      expect(res.body.governance).toBe(0);
    });

    it('accepts a period filter', async () => {
      const res = await ctx.request
        .get('/api/analytics/dimensions?period=monthly')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/analytics/score', () => {
    it('returns zero when no completed tasks', async () => {
      const res = await ctx.request
        .get('/api/analytics/score')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.score_progress).toBe(0);
      expect(res.body.global_score_goal).toBe(100);
    });

    it('calculates score from completed tasks', async () => {
      const goalRes = await ctx.request
        .post('/api/goals')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Goal', dimension: 'environmental' });

      await ctx.request
        .post(`/api/goals/${goalRes.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'T1', score: 30, completed: true });

      await ctx.request
        .post(`/api/goals/${goalRes.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'T2', score: 20, completed: true });

      await ctx.request
        .post(`/api/goals/${goalRes.body.id}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'T3', score: 50, completed: false });

      const res = await ctx.request
        .get('/api/analytics/score')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.score_progress).toBe(0.5);
      expect(res.body.total_score).toBe(50);
    });
  });
});
