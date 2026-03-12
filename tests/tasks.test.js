const { createTestContext, seedCompany, seedUser, authenticate } = require('./setup');

describe('Tasks', () => {
  let ctx, token, goalId;

  beforeEach(async () => {
    ctx = createTestContext();
    seedCompany(ctx.db);
    await seedUser(ctx);
    token = await authenticate(ctx);

    const goalRes = await ctx.request
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test Goal', dimension: 'environmental' });
    goalId = goalRes.body.id;
  });

  function createTask(overrides = {}) {
    return ctx.request
      .post(`/api/goals/${goalId}/tasks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Plant trees', ...overrides });
  }

  describe('POST /api/goals/:goalId/tasks', () => {
    it('creates a task', async () => {
      const res = await createTask({ score: 10 });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Plant trees');
      expect(res.body.score).toBe(10);
      expect(res.body.goal_id).toBe(goalId);
    });

    it('enforces max 10 tasks per goal', async () => {
      for (let i = 0; i < 10; i++) {
        await createTask({ title: `Task ${i}` });
      }

      const res = await createTask({ title: 'Task 11' });
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/goals/:goalId/tasks', () => {
    it('lists tasks for a goal', async () => {
      await createTask({ title: 'A' });
      await createTask({ title: 'B' });

      const res = await ctx.request
        .get(`/api/goals/${goalId}/tasks`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('filters by completed status', async () => {
      await createTask({ title: 'Done', completed: true });
      await createTask({ title: 'Pending', completed: false });

      const res = await ctx.request
        .get(`/api/goals/${goalId}/tasks?completed=true`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].title).toBe('Done');
    });
  });

  describe('GET /api/goals/:goalId/tasks/:id', () => {
    it('returns a single task', async () => {
      const taskRes = await createTask();
      const res = await ctx.request
        .get(`/api/goals/${goalId}/tasks/${taskRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Plant trees');
    });

    it('returns 404 for non-existent task', async () => {
      const res = await ctx.request
        .get(`/api/goals/${goalId}/tasks/999`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/goals/:goalId/tasks/:id', () => {
    it('updates a task', async () => {
      const taskRes = await createTask();
      const res = await ctx.request
        .put(`/api/goals/${goalId}/tasks/${taskRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Updated task', completed: true, score: 25 });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated task');
      expect(res.body.completed).toBe(1);
      expect(res.body.score).toBe(25);
    });
  });

  describe('DELETE /api/goals/:goalId/tasks/:id', () => {
    it('deletes a task', async () => {
      const taskRes = await createTask();
      const res = await ctx.request
        .delete(`/api/goals/${goalId}/tasks/${taskRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });
});
