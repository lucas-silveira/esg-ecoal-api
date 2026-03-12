const { z } = require('zod');

const signUpSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string().min(1),
  cnpj: z.string().min(1),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const companySchema = z.object({
  name: z.string().min(1),
  cnpj: z.string().min(1),
  global_score_goal: z.number().positive().optional(),
});

const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  dimension: z.enum(['environmental', 'social', 'governance']),
  completed_at: z.string().nullable().optional(),
});

const taskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  score: z.number().min(0).optional(),
  completed: z.union([z.boolean(), z.literal(0), z.literal(1)]).optional(),
  completed_at: z.string().nullable().optional(),
});

module.exports = {
  signUpSchema,
  signInSchema,
  companySchema,
  goalSchema,
  taskSchema,
};
