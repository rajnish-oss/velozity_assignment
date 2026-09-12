# Basecamp Flow — PM/Task Dashboard

React (Vite) + Tailwind CSS + Redux Toolkit frontend for a role-based project & task management tool, with a Slack-inspired shell (dark sidebar, top bar, live presence/notifications) in a distinct ink-teal / amber palette.

## Setup

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

## Demo logins

The app ships with a mock backend (no server required) so you can log in immediately:

| Role      | Email             | Password |
|-----------|-------------------|----------|
| Admin     | priya@flow.app    | admin123 |
| PM        | arjun@flow.app    | pm123    |
| Developer | ravi@flow.app     | dev123   |

The login screen also has one-click buttons to fill these in.

## What's mocked vs. real

Everything in `src/api/` is a **mock implementation you're meant to replace**:

- `src/api/fixtures.js` — seed data (users, projects, tasks, activity, notifications).
- `src/api/client.js` — implements every REST endpoint from the spec (`/auth/*`, `/projects*`, `/tasks*`, `/activities`, `/notifications*`) against the in-memory fixtures, with simulated latency. Function names and return shapes match what a real fetch call would return, so swapping the internals for real `fetch()`/`axios` calls against your backend should not require touching any slice or component.
- `src/api/socket.js` — simulates a WebSocket connection and emits the three real-time events from the spec (`presence:update`, `task:status_changed`, `notification:new`) on intervals. Swap `connect()` for a real `new WebSocket(url)` wired to the same event names.

Everything else (Redux slices, components, routing) is written against that contract and doesn't know it's talking to mocks.

## Architecture

```
src/
  api/            mock REST client + mock WebSocket transport + fixtures
  app/            Redux store, typed-ish hooks
  features/       Redux slices + top-level page components, grouped by domain
    auth/         login form, session slice
    projects/     project list/detail pages, slice
    tasks/        (slice only — UI lives in components/tasks)
    activities/   activity feed slice
    notifications/notifications slice
    presence/     live presence + connection status slice
    dashboard/    DashboardPage — routes to the right role view
  components/
    layout/       AppShell, Sidebar, Header, NotificationDropdown
    dashboard/    AdminDashboard, PMDashboard, DeveloperDashboard, MetricCard
    projects/     ProjectModal
    tasks/        TaskBoard (Kanban), FilterBar (URL-synced), TaskModal, TaskDetailDrawer
    activity/     ActivityFeed (role-scoped)
    common/       Avatar, Badge, Spinner, EmptyState, Modal, ConfirmDialog, ErrorBoundary
  hooks/          useWebSocket — wires the mock socket into Redux
  routes/         ProtectedRoute (auth gate), RoleRoute (role gate)
  utils/          constants (roles/status/priority), time formatting helpers
```

### Role-based access

- **Admin**: full nav (`Dashboard`, `All Projects`, `All Tasks`), sees every project/task, global activity feed, live online-user count in the header.
- **PM**: `Dashboard`, `My Projects`, `Tasks`. Can create/edit/delete projects they own, create tasks. Activity feed and metrics scoped to owned projects.
- **Developer**: `My Focus`, `My Tasks` only — no Projects nav item, and `/projects` routes redirect home if hit directly (see `RoleRoute`). Task board and dashboard scoped to tasks assigned to them; activity feed scoped to those tasks.

### Real-time behavior

`useWebSocket` (mounted once in `AppShell`) subscribes to the mock socket and dispatches into the `presence`, `tasks`, and `activities`/`notifications` slices as events arrive — this is where you'd point at your real WebSocket server. The activity feed prepends new items with a small entrance animation; the notification bell updates its unread badge live.

### URL-synced task filters

`FilterBar` reads/writes `status`, `priority`, and `due` directly to the URL query string via `useSearchParams`, so filtered views are shareable/bookmarkable (`/tasks?status=IN_PROGRESS&priority=HIGH`).

### Empty / loading / error states

- Loading: `Spinner` / `LoadingBlock`, used while initial data loads per slice `status`.
- Empty: `EmptyState` component, used for no-projects, no-tasks, no-activity, no-notifications, filtered-to-nothing.
- Errors: `ErrorBoundary` wraps routed page content in `AppShell`; form-level errors (login, project/task modals) render inline.

## Customizing the theme

Palette lives in `tailwind.config.js` under `theme.extend.colors` (`ink` = sidebar/dark chrome, `amber` = accent/CTA, `canvas`/`line` = light surface + borders). Swap those hex values to reskin without touching component markup.
