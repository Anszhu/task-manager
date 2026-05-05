# Team Task Manager

Team Task Manager is a full-stack project and task tracking application for small teams. It includes secure authentication, role-based access control, project membership management, task assignment, a delivery dashboard, and a responsive interface that runs as a single deployable web app.

## Stack

- Frontend: Preact + TypeScript + Vite
- Backend: Fastify + TypeScript
- Database: SQLite via `better-sqlite3`
- Auth: JWT bearer tokens with password hashing and logout-driven token invalidation
- Packaging: npm workspaces with a single production server that serves the built frontend

## Features

- Secure signup and login
- Automatic first-user admin bootstrap
- Role-based access:
  - Admin: create/delete projects, add/remove members, create/edit/delete tasks, view all data
  - Member: view assigned projects, view accessible tasks, update status on their own assigned tasks
- Project management with owner tracking and member mapping
- Task management with deadlines, assignees, status updates, and pagination
- Dashboard metrics for total, completed, pending, in-progress, and overdue tasks
- Filterable task views by project, assignee, and status
- Global validation and consistent JSON API responses
- Production-ready Dockerfile for single-service deployment

## Project Structure

```text
team-task-manager/
  server/      Fastify API, SQLite schema, tests, production server
  web/         Preact client and styles
  scripts/     Local development helpers
```

## Local Setup

### Requirements

- Node.js 22+
- npm 10+

### Install

```bash
npm install
```

### Run in Development

```bash
npm run dev
```

This starts:

- API server on `http://127.0.0.1:4300`
- Frontend dev server on `http://127.0.0.1:4301`

### Build for Production

```bash
npm run build
```

### Start the Production App

```bash
npm start
```

The production server serves both the REST API and the built frontend from a single port.

## Environment Variables

Copy `.env.example` to `.env` if you want to override defaults.

| Variable | Default | Description |
| --- | --- | --- |
| `NODE_ENV` | `development` | Runtime mode |
| `PORT` | `4300` | Backend and production frontend port |
| `CLIENT_ORIGINS` | `http://127.0.0.1:4301,http://localhost:4301` | Allowed browser origins for API access |
| `JWT_SECRET` | dev fallback only | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | `12h` | Token lifetime |
| `DB_FILE` | `server/data/team-task-manager.sqlite` | SQLite database file path |

## API Overview

All responses follow this shape:

```json
{
  "success": true,
  "data": {}
}
```

Errors return:

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed."
  }
}
```

### Authentication

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Users

- `GET /api/users?query=&limit=`  
  Admin-only user search for member assignment

### Projects

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/members`
- `POST /api/projects/:id/members`
- `DELETE /api/projects/:id/members/:memberId`

### Tasks

- `GET /api/tasks?page=&pageSize=&status=&projectId=&assigneeId=&search=`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Dashboard

- `GET /api/dashboard/summary?projectId=&assigneeId=`

## Security Notes

- Passwords are hashed with `bcryptjs`
- JWTs include a session version so logout invalidates previously issued tokens
- Bearer-token auth avoids cookie-based CSRF exposure
- Fastify schema validation is applied to all write endpoints
- SQL uses prepared statements to prevent injection
- `@fastify/helmet` and rate limiting are enabled
- Member permissions are enforced at the service layer and rechecked on every task update

## Performance Notes

- SQLite indexes are defined on email, owner, project membership, task project, assignee, status, and deadline
- Task endpoints are paginated
- Dashboard summaries are computed with aggregate queries
- Task and project queries use joins/subqueries instead of per-item lookups
- Frontend routes are lazy loaded and the build footprint stays small

## Testing

Run the API integration tests with:

```bash
npm test
```

The current test suite covers:

- first-user admin bootstrap
- member signup
- project creation
- member assignment
- task creation
- member status update
- dashboard summary calculations

## Deployment

### Docker

Build and run:

```bash
docker build -t team-task-manager .
docker run -p 4300:4300 team-task-manager
```

### Platform Guidance

This app is ready for deployment on any container-friendly platform such as Render, Fly.io, Railway, or a VM. Use a persistent volume for `server/data` if you keep SQLite in production.

For Render specifically, a ready-to-use [`render.yaml`](./render.yaml) blueprint is included.

For a managed production database, the backend can be adapted to PostgreSQL with a repository-layer swap while keeping the controller and service architecture intact.

## Demo

Use [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) as the 2-5 minute walkthrough outline for recording a product demo.
