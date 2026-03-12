const { createTestContext, seedCompany, seedUser, authenticate } = require('./setup');

describe('Companies', () => {
  let ctx, token;

  beforeEach(async () => {
    ctx = createTestContext();
    seedCompany(ctx.db);
    await seedUser(ctx);
    token = await authenticate(ctx);
  });

  describe('POST /api/companies', () => {
    it('creates a new company', async () => {
      const res = await ctx.request
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'New Corp', cnpj: '99999999000100' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('New Corp');
      expect(res.body.cnpj).toBe('99999999000100');
    });

    it('rejects duplicate CNPJ', async () => {
      const res = await ctx.request
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Dup Corp', cnpj: '12345678000100' });

      expect(res.status).toBe(409);
    });

    it('rejects unauthenticated request', async () => {
      const res = await ctx.request
        .post('/api/companies')
        .send({ name: 'X', cnpj: '11111111000100' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/companies/:id', () => {
    it('returns own company', async () => {
      const company = ctx.db.prepare('SELECT * FROM companies').get();
      const res = await ctx.request
        .get(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Test Corp');
    });

    it('forbids access to other company', async () => {
      const other = seedCompany(ctx.db, { name: 'Other', cnpj: '99999999000100' });
      const res = await ctx.request
        .get(`/api/companies/${other.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/companies/:id', () => {
    it('updates own company', async () => {
      const company = ctx.db.prepare('SELECT * FROM companies WHERE cnpj = ?').get('12345678000100');
      const res = await ctx.request
        .put(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Corp', cnpj: '12345678000100', global_score_goal: 200 });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Corp');
      expect(res.body.global_score_goal).toBe(200);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('deletes own company', async () => {
      const company = ctx.db.prepare('SELECT * FROM companies WHERE cnpj = ?').get('12345678000100');
      const res = await ctx.request
        .delete(`/api/companies/${company.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(204);
    });
  });
});
