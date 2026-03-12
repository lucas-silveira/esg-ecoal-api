const { createTestContext, seedCompany } = require('./setup');

describe('Auth', () => {
  let ctx;

  beforeEach(() => {
    ctx = createTestContext();
    seedCompany(ctx.db);
  });

  describe('POST /api/auth/sign-up', () => {
    it('registers a user with a valid CNPJ', async () => {
      const res = await ctx.request.post('/api/auth/sign-up').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        role: 'admin',
        cnpj: '12345678000100',
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: 'Alice',
        email: 'alice@example.com',
        role: 'admin',
      });
      expect(res.body.password).toBeUndefined();
    });

    it('rejects sign-up with unknown CNPJ', async () => {
      const res = await ctx.request.post('/api/auth/sign-up').send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'secret123',
        role: 'admin',
        cnpj: '99999999999999',
      });

      expect(res.status).toBe(404);
    });

    it('rejects duplicate email', async () => {
      await ctx.request.post('/api/auth/sign-up').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        role: 'admin',
        cnpj: '12345678000100',
      });

      const res = await ctx.request.post('/api/auth/sign-up').send({
        name: 'Alice 2',
        email: 'alice@example.com',
        password: 'secret456',
        role: 'admin',
        cnpj: '12345678000100',
      });

      expect(res.status).toBe(409);
    });

    it('rejects invalid body', async () => {
      const res = await ctx.request.post('/api/auth/sign-up').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/sign-in', () => {
    beforeEach(async () => {
      await ctx.request.post('/api/auth/sign-up').send({
        name: 'Alice',
        email: 'alice@example.com',
        password: 'secret123',
        role: 'admin',
        cnpj: '12345678000100',
      });
    });

    it('returns a token for valid credentials', async () => {
      const res = await ctx.request.post('/api/auth/sign-in').send({
        email: 'alice@example.com',
        password: 'secret123',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const res = await ctx.request.post('/api/auth/sign-in').send({
        email: 'alice@example.com',
        password: 'wrong',
      });

      expect(res.status).toBe(401);
    });

    it('rejects unknown email', async () => {
      const res = await ctx.request.post('/api/auth/sign-in').send({
        email: 'nobody@example.com',
        password: 'secret123',
      });

      expect(res.status).toBe(401);
    });
  });
});
