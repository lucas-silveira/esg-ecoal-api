# ESG EcoAl API

REST API for managing ESG (Environmental, Social, Governance) goals. Built for the EcoAl Android app.

## Tech Stack

- Node.js + Express
- better-sqlite3
- Zod (validation), bcryptjs (passwords), jsonwebtoken (JWT)

## Setup

```bash
npm install
npm run seed
npm start       # runs on port 3000
npm test        # runs all tests
npm run test:watch
```

API documentation (Swagger UI) is available at `http://localhost:3000/api-docs` when the server is running.

## API Routes

### Auth (public)

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/sign-up | Register (requires existing company CNPJ) |
| POST | /api/auth/sign-in | Login, returns JWT |
| GET  | /api/auth/me      | Get user information |

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
| GET | /api/goals | List goals (filters: dimension, created_at) |
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
| GET | /api/analytics/dashboard | Progress as data for dashboard exhibition |

## Entity Schemas

### Company

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| name | string | Company name (required) |
| cnpj | string | Unique CNPJ identifier (required) |
| global_score_goal | number | Target score, defaults to 100 |
| created_at | string | ISO 8601 timestamp |
| updated_at | string | ISO 8601 timestamp |

### User

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| name | string | User name (required) |
| email | string | Unique email address (required) |
| password | string | Bcrypt-hashed password (required) |
| role | string | User role (required) |
| company_id | integer | FK → companies (cascades on delete) |
| department | string | User department on company (required) |
| created_at | string | ISO 8601 timestamp |
| updated_at | string | ISO 8601 timestamp |

### Goal

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| title | string | Goal title (required) |
| description | string | Goal description (optional) |
| dimension | enum | `environmental`, `social`, or `governance` |
| company_id | integer | FK → companies (cascades on delete) |
| created_at | string | ISO 8601 timestamp |
| updated_at | string | ISO 8601 timestamp |

**Constraints:** max 10 goals per dimension per company.

### Task

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| title | string | Task title (required) |
| description | string | Task description (optional) |
| score | number | Score value, defaults to 0 |
| completed | integer | 0 or 1, defaults to 0 |
| completed_at | string | ISO 8601 timestamp when completed (nullable) |
| goal_id | integer | FK → goals (cascades on delete) |
| created_at | string | ISO 8601 timestamp |
| updated_at | string | ISO 8601 timestamp |

**Constraints:** max 10 tasks per goal. Goal completion is derived from its tasks.

### User Contributions

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| user_id | integer | FK → user (cascades on delete) |
| category | string | Category in which user contributed (required) |
| points | number | How many points this contribution gave |
| created_at | string | ISO 8601 timestamp |

### Energy Metrics

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| company_id | integer | FK → companies (cascades on delete) |
| month | string | Month in which the data was collected (required) |
| year | integer | Year in which the data was collected (required) |
| realized_value | number | Realized value of the metric (required) |
| goal_value | number | Value this metric has on the overall goal (required) |
| created_at | string | ISO 8601 timestamp |

### Training Metrics

| Field | Type | Description |
|-------|------|-------------|
| id | integer | Auto-incrementing primary key |
| company_id | integer | FK → companies (cascades on delete) |
| quarter | string | Quarter in which the data was collected (required) |
| year | integer | Year in which the data was collected (required) |
| total_hours | number | How many hours did the training take (required) |
| created_at | string | ISO 8601 timestamp |

## Authentication

All routes except sign-up and sign-in require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```
