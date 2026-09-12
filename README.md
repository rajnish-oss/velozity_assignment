# Velozity Assignment

A role-based project and task management application built with React, Express, TypeScript, Prisma ORM for PostgreSQL, and Socket.IO.

## Local Setup

### Prerequisites

- Node.js 20 or newer
- PostgreSQL 15 or newer
- Git

### 1. Configure PostgreSQL

Create a local PostgreSQL database named `velozity`, then use its connection string in `backend/.env`:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/velozity
```

If PostgreSQL is running on another host or port, use the corresponding connection string instead.

### 2. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/velozity"
JWT_SECRET="replace-with-a-long-random-access-token-secret"
REFRESH_JWT_SECRET="replace-with-a-different-long-random-refresh-token-secret"
CLIENT_ORIGIN="http://localhost:5173"
PORT=8000
NODE_ENV=development
```

Do not commit `.env` or real credentials.

### 3. Install dependencies and seed the database

In one terminal:

```bash
cd backend
npm install
npx prisma@latest contract emit
npx tsx src/prisma/seed.ts
npm run dev
```

For a non-watch start, use `npm start`. The backend uses `tsx` so its TypeScript ESM imports resolve correctly without requiring manual `.js` extensions in source files.

The seed is destructive: it clears existing application rows before inserting demo data.

Demo login after seeding:

```text
Email: admin@agency.com
Password: password123
```

Other seeded users use the same password:

- `sarah.pm@agency.com`
- `alex.pm@agency.com`
- `ravi.dev@agency.com`
- `elena.dev@agency.com`
- `michael.dev@agency.com`
- `priya.dev@agency.com`

### 4. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

The frontend uses `VITE_API_BASE_URL`. For local development, create `frontend/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Database Design

The database is PostgreSQL-backed and defined in `backend/src/prisma/contract.prisma`.

```mermaid
erDiagram
    USER ||--o{ PROJECT : owns
    USER ||--o{ TASK : assigned_to
    USER ||--o{ ACTIVITY_LOG : creates
    USER ||--o{ NOTIFICATION : receives
    USER ||--o{ REFRESH_TOKEN : has
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ ACTIVITY_LOG : records

    USER {
      string id PK
      string email UK
      string passwordHash
      enum role
      datetime createdAt
    }
    PROJECT {
      string id PK
      string ownerId FK
      string name
      datetime createdAt
    }
    TASK {
      string id PK
      string projectId FK
      string assigneeId FK
      enum status
      enum priority
      datetime dueDate
    }
    ACTIVITY_LOG {
      string id PK
      string taskId FK
      string userId FK
      string action
      datetime createdAt
    }
    NOTIFICATION {
      string id PK
      string userId FK
      boolean isRead
      datetime createdAt
    }
    REFRESH_TOKEN {
      string id PK
      string userId FK
      string token UK
      datetime expiresAt
    }
```

Important relationship rules:

- A project belongs to one owner and contains many tasks.
- A task belongs to one project and may be assigned to one developer.
- Deleting a project cascades to its tasks and their activity logs.
- Activity logs identify both the task and the user who performed the action.
- Refresh tokens are persisted per user and revoked during refresh rotation or logout.
- Indexes support project ownership, task project/assignee/status/due-date filtering, activity lookup, and notification lookup.

## Architectural Decisions

### API and authorization

Express routes authenticate bearer access tokens with middleware. Controllers enforce resource ownership and role-specific rules at the API boundary; frontend route guards are only a user-experience layer. Admins have global visibility, project managers can manage projects they own, and developers can access assigned tasks.

### WebSocket library

Socket.IO was chosen because it provides authenticated connections, named events, rooms, reconnect behavior, and browser/client support without building those protocol details manually. Users join scoped rooms:

- `admin-feed` for administrators
- `project:<id>` for project managers who own the project
- `user:<id>` for assigned developers and personal events

Task status changes are persisted before being emitted. On connection, the server sends a bounded, role-filtered activity catch-up payload so a client can recover recent events after disconnecting.

### Job queue

No job queue is used. The assignment only requires request/response operations, persisted activity, notifications, and real-time delivery. Adding Redis/BullMQ would introduce another operational dependency without a current asynchronous workload. A queue would be appropriate later for email, push notifications, exports, or scheduled cleanup.

### Token storage

Access tokens are short-lived JWTs with a 15-minute lifetime. The frontend keeps the current access token in its API client state and sends it as a bearer token; the Socket.IO client passes it during the handshake. Refresh tokens are rotated and persisted in the database, then delivered in an `HttpOnly`, `SameSite=Strict` cookie. Refresh-token rotation invalidates the previous token.

In production, HTTPS should be used and the refresh cookie should be configured with `secure: true`.

### Data access

Controllers use the generated Prisma ORM contract rather than embedding raw SQL. Database connection setup is isolated in `backend/src/prisma/db.ts`; controllers, routes, authentication middleware, and socket handling remain separate.

## Known Limitations

- The seed script is intentionally destructive and is for local/demo use only.
- Activity catch-up is bounded to the most recent 50 visible activities; it is not a complete event stream or cursor-based replay protocol.
- The current socket catch-up uses recent persisted activity rather than a durable per-client offset. Events older than the replay window may be missed.
- Notifications are persisted and exposed through REST, but the current backend does not yet emit every notification type through Socket.IO.
- There is no background job queue, scheduled refresh-token cleanup, email delivery, or push-notification service.
- There are no automated backend integration tests in the repository yet.
- Local development requires a running PostgreSQL instance.
- The application does not include production deployment manifests, TLS termination, rate limiting, or centralized observability.

## Project Layout

```text
backend/
  main.ts                 Express and Socket.IO entry point
  src/controllers/        HTTP business logic
  src/routes/             API route definitions
  src/middlerware/        Authentication and role middleware
  src/sockets/            Socket.IO rooms and real-time events
  src/prisma/             Database contract, client, and seed script
frontend/
  src/api/                REST and Socket.IO clients
  src/features/           Redux feature slices and pages
  src/components/         Reusable UI components
```
