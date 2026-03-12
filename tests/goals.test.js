const { createTestContext, seedCompany, seedUser, authenticate } = require('./setup');

describe('Goals', () => {
  let ctx, token;

  beforeEach(async () => {
    ctx = createTestContext();
    seedCompany(ctx.db);
    await seedUser(ctx);
    token = await authenticate(ctx);
  });

  function createGoal(overrides = {}) {
    return ctx.request
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Reduce emissions', dimension: 'environmental', ...overrides });
  }

  describe('POST /api/goals', () => {
    it('creates a goal', async () => {
      const res = await createGoal();

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Reduce emissions');
      expect(res.body.dimension).toBe('environmental');
      expect(res.body.tasks).toEqual([]);
    });

    it('enforces max 10 goals per dimension', async () => {
      for (let i = 0; i < 10; i++) {
        await createGoal({ title: `Goal ${i}` });
      }

      const res = await createGoal({ title: 'Goal 11' });
      expect(res.status).toBe(422);
    });

    it('allows goals in different dimensions', async () => {
      for (let i = 0; i < 10; i++) {
        await createGoal({ title: `Env ${i}` });
      }

      const res = await createGoal({ title: 'Social goal', dimension: 'social' });
      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/goals', () => {
    it('lists goals with tasks', async () => {
      const goalRes = await createGoal();
      const goalId = goalRes.body.id;

      await ctx.request
        .post(`/api/goals/${goalId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1' });

      const res = await ctx.request
        .get('/api/goals')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].tasks).toHaveLength(1);
    });

    it('filters by dimension', async () => {
      await createGoal({ title: 'Env', dimension: 'environmental' });
      await createGoal({ title: 'Social', dimension: 'social' });

      const res = await ctx.request
        .get('/api/goals?dimension=social')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Social');
    });
  });

  describe('GET /api/goals/:id', () => {
    it('returns a single goal with tasks', async () => {
      const goalRes = await createGoal();
      const res = await ctx.request
        .get(`/api/goals/${goalRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.tasks).toEqual([]);
    });

    it('returns 404 for non-existent goal', async () => {
      const res = await ctx.request
        .get('/api/goals/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/goals/:id', () => {
    it('updates a goal', async () => {
      const goalRes = await createGoal();
      const res = await ctx.request
        .put(`/api/goals/${goalRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated', dimension: 'environmental', completed_at: '2026-01-01T00:00:00Z' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated');
      expect(res.body.completed_at).toBe('2026-01-01T00:00:00Z');
    });
  });

  describe('DELETE /api/goals/:id', () => {
    it('deletes a goal and cascades tasks', async () => {
      const goalRes = await createGoal();
      const goalId = goalRes.body.id;

      await ctx.request
        .post(`/api/goals/${goalId}/tasks`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Task 1' });

      const res = await ctx.request
        .delete(`/api/goals/${goalId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);

      const tasks = ctx.db.prepare('SELECT * FROM tasks WHERE goal_id = ?').all(goalId);
      expect(tasks).toHaveLength(0);
    });
  });
});
