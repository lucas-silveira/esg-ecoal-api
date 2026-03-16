const { createTestContext, seedCompany } = require('./setup');

describe('Department Validation', () => {
  let ctx;

  beforeEach(() => {
    ctx = createTestContext();
    seedCompany(ctx.db);
  });

  it('deve falhar ao cadastrar usuário sem departamento', async () => {
    const res = await ctx.request.post('/api/auth/sign-up').send({
      name: 'User Sem Dept',
      email: 'no-dept@example.com',
      password: 'password123',
      role: 'employee',
      cnpj: '12345678000100'
      // department faltando
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toHaveProperty('department');
  });

  it('deve salvar o departamento corretamente no banco', async () => {
    await ctx.request.post('/api/auth/sign-up').send({
      name: 'User Com Dept',
      email: 'dept@example.com',
      password: 'password123',
      role: 'employee',
      cnpj: '12345678000100',
      department: 'Logística'
    });

    const user = ctx.db.prepare('SELECT * FROM users WHERE email = ?').get('dept@example.com');
    expect(user.department).toBe('Logística');
  });
});