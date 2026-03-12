const swaggerUi = require('swagger-ui-express');

const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ESG EcoAl API',
    version: '1.0.0',
    description:
      'API for managing ESG (Environmental, Social, Governance) goals, tasks, and analytics.',
  },
  servers: [{ url: 'http://localhost:3000' }],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SignUpRequest: {
        type: 'object',
        required: ['name', 'email', 'password', 'role', 'cnpj'],
        properties: {
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          role: { type: 'string', minLength: 1 },
          cnpj: { type: 'string', minLength: 1 },
        },
      },
      SignInRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 1 },
        },
      },
      CompanyRequest: {
        type: 'object',
        required: ['name', 'cnpj'],
        properties: {
          name: { type: 'string', minLength: 1 },
          cnpj: { type: 'string', minLength: 1 },
          global_score_goal: { type: 'number', exclusiveMinimum: 0 },
        },
      },
      GoalRequest: {
        type: 'object',
        required: ['title', 'dimension'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          dimension: {
            type: 'string',
            enum: ['environmental', 'social', 'governance'],
          },
        },
      },
      TaskRequest: {
        type: 'object',
        required: ['title'],
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string' },
          score: { type: 'number', minimum: 0 },
          completed: { type: 'boolean' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
        },
      },
      UserResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string' },
          company_id: { type: 'integer' },
        },
      },
      TokenResponse: {
        type: 'object',
        properties: {
          token: { type: 'string' },
        },
      },
      CompanyResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          cnpj: { type: 'string' },
          global_score_goal: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      TaskResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          score: { type: 'number' },
          completed: { type: 'integer', enum: [0, 1] },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
          goal_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      GoalResponse: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          dimension: {
            type: 'string',
            enum: ['environmental', 'social', 'governance'],
          },
          company_id: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
          tasks: {
            type: 'array',
            items: { $ref: '#/components/schemas/TaskResponse' },
          },
        },
      },
      DimensionsResponse: {
        type: 'object',
        properties: {
          environmental: { type: 'number', description: 'Completion ratio 0-1' },
          social: { type: 'number', description: 'Completion ratio 0-1' },
          governance: { type: 'number', description: 'Completion ratio 0-1' },
        },
      },
      ScoreResponse: {
        type: 'object',
        properties: {
          score_progress: { type: 'number', description: 'Ratio: total_score / global_score_goal' },
          total_score: { type: 'number' },
          global_score_goal: { type: 'number' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { oneOf: [{ type: 'string' }, { type: 'object' }] },
        },
      },
    },
  },
  tags: [
    { name: 'Auth', description: 'Authentication endpoints' },
    { name: 'Companies', description: 'Company management' },
    { name: 'Goals', description: 'ESG goal management' },
    { name: 'Tasks', description: 'Task management within goals' },
    { name: 'Analytics', description: 'ESG analytics and scoring' },
  ],
  paths: {
    '/api/auth/sign-up': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignUpRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/UserResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: { description: 'Company not found for the given CNPJ' },
          409: { description: 'Email already in use' },
        },
      },
    },
    '/api/auth/sign-in': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive a JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SignInRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TokenResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/companies': {
      post: {
        tags: ['Companies'],
        summary: 'Create a new company',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompanyRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Company created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          409: { description: 'CNPJ already registered' },
        },
      },
    },
    '/api/companies/{id}': {
      get: {
        tags: ['Companies'],
        summary: 'Get a company by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Company details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyResponse' },
              },
            },
          },
          403: { description: 'Forbidden' },
          404: { description: 'Company not found' },
        },
      },
      put: {
        tags: ['Companies'],
        summary: 'Update a company',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CompanyRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Company updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CompanyResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          403: { description: 'Forbidden' },
          404: { description: 'Company not found' },
          409: { description: 'CNPJ already registered' },
        },
      },
      delete: {
        tags: ['Companies'],
        summary: 'Delete a company',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Company deleted' },
          403: { description: 'Forbidden' },
          404: { description: 'Company not found' },
        },
      },
    },
    '/api/goals': {
      get: {
        tags: ['Goals'],
        summary: 'List goals for the authenticated company',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'dimension',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['environmental', 'social', 'governance'],
            },
            description: 'Filter by ESG dimension',
          },
          {
            name: 'created_at',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter goals created on or after this date',
          },
        ],
        responses: {
          200: {
            description: 'List of goals with nested tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/GoalResponse' },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Goals'],
        summary: 'Create a new goal',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoalRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Goal created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoalResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          422: { description: 'Maximum of 10 goals per dimension reached' },
        },
      },
    },
    '/api/goals/{id}': {
      get: {
        tags: ['Goals'],
        summary: 'Get a goal by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Goal details with nested tasks',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoalResponse' },
              },
            },
          },
          404: { description: 'Goal not found' },
        },
      },
      put: {
        tags: ['Goals'],
        summary: 'Update a goal',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/GoalRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Goal updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GoalResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: { description: 'Goal not found' },
        },
      },
      delete: {
        tags: ['Goals'],
        summary: 'Delete a goal',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Goal deleted' },
          404: { description: 'Goal not found' },
        },
      },
    },
    '/api/goals/{goalId}/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks for a goal',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'completed',
            in: 'query',
            schema: { type: 'string', enum: ['true', 'false'] },
            description: 'Filter by completion status',
          },
          {
            name: 'completed_at',
            in: 'query',
            schema: { type: 'string' },
            description: 'If present, filters to tasks with a completed_at date',
          },
          {
            name: 'created_at',
            in: 'query',
            schema: { type: 'string', format: 'date-time' },
            description: 'Filter tasks created on or after this date',
          },
        ],
        responses: {
          200: {
            description: 'List of tasks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/TaskResponse' },
                },
              },
            },
          },
          404: { description: 'Goal not found' },
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a new task for a goal',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'Task created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: { description: 'Goal not found' },
          422: { description: 'Maximum of 10 tasks per goal reached' },
        },
      },
    },
    '/api/goals/{goalId}/tasks/{id}': {
      get: {
        tags: ['Tasks'],
        summary: 'Get a task by ID',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          200: {
            description: 'Task details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          404: { description: 'Goal or task not found' },
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/TaskRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Task updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TaskResponse' },
              },
            },
          },
          400: {
            description: 'Validation error',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
          404: { description: 'Goal or task not found' },
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'goalId',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer' },
          },
        ],
        responses: {
          204: { description: 'Task deleted' },
          404: { description: 'Goal or task not found' },
        },
      },
    },
    '/api/analytics/dimensions': {
      get: {
        tags: ['Analytics'],
        summary: 'Get completion ratio per ESG dimension',
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'period',
            in: 'query',
            schema: {
              type: 'string',
              enum: ['monthly', 'quarterly', 'annual'],
            },
            description: 'Filter goals by creation period',
          },
        ],
        responses: {
          200: {
            description: 'Dimension completion ratios',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DimensionsResponse' },
              },
            },
          },
        },
      },
    },
    '/api/analytics/score': {
      get: {
        tags: ['Analytics'],
        summary: 'Get overall ESG score progress',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Score progress',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ScoreResponse' },
              },
            },
          },
          404: { description: 'Company not found' },
        },
      },
    },
  },
};

module.exports = { swaggerSpec, swaggerUi };
