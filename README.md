# ESG EcoAl API

REST API for managing ESG (Environmental, Social, Governance) goals. Built for the EcoAl Android app.

## Tech Stack

- Node.js + Express
- better-sqlite3
- Zod (validation), bcryptjs (passwords), jsonwebtoken (JWT)

## Setup

```bash
npm install
npm start       # runs on port 3000
npm test        # runs all tests
npm run test:watch
```

## API Routes

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/sign-up | Register (requires existing company CNPJ) |
| POST | /api/auth/sign-in | Login, returns JWT |

### Companies (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/companies | Create company |
| GET | /api/companies/:id | Get own company |
| PUT | /api/companies/:id | Update own company |
| DELETE | /api/companies/:id | Delete own company |

### Goals (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/goals | List goals (filters: dimension, completed_at, created_at) |
| POST | /api/goals | Create goal (max 10 per dimension per company) |
| GET | /api/goals/:id | Get goal with tasks |
| PUT | /api/goals/:id | Update goal |
| DELETE | /api/goals/:id | Delete goal (cascades tasks) |

### Tasks (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/goals/:goalId/tasks | List tasks (filters: completed, completed_at, created_at) |
| POST | /api/goals/:goalId/tasks | Create task (max 10 per goal) |
| GET | /api/goals/:goalId/tasks/:id | Get task |
| PUT | /api/goals/:goalId/tasks/:id | Update task |
| DELETE | /api/goals/:goalId/tasks/:id | Delete task |

### Analytics (authenticated)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/analytics/dimensions | Progress per ESG dimension (?period=monthly\|quarterly\|annual) |
| GET | /api/analytics/score | Company score (completed tasks score / global goal) |

## Authentication

All routes except sign-up and sign-in require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```
