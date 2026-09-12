import 'dotenv/config';
import 'temporal-polyfill/full/global';
import { Temporal } from '@js-temporal/polyfill';
import bcrypt from 'bcrypt';
import { db } from './db';

type TaskStatus = 'TO_DO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE' | 'OVERDUE';
type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not defined');

  console.log('Seeding database...');
  await db.connect({ url: databaseUrl });

  // Delete dependents first to satisfy foreign-key constraints.
  await db.orm.public.ActivityLog.where((activity) => activity.id.neq('')).delete();
  await db.orm.public.Notification.where((notification) => notification.id.neq('')).delete();
  await db.orm.public.Task.where((task) => task.id.neq('')).delete();
  await db.orm.public.Project.where((project) => project.id.neq('')).delete();
  await db.orm.public.User.where((user) => user.id.neq('')).delete();

  const passwordHash = await bcrypt.hash('password123', 10);
  const [admin, sarah, alex, ravi, elena, michael, priya] = await Promise.all([
    db.orm.public.User.create({ name: 'Admin User', email: 'admin@agency.com', passwordHash, role: 'ADMIN' }),
    db.orm.public.User.create({ name: 'Sarah PM', email: 'sarah.pm@agency.com', passwordHash, role: 'PROJECT_MANAGER' }),
    db.orm.public.User.create({ name: 'Alex PM', email: 'alex.pm@agency.com', passwordHash, role: 'PROJECT_MANAGER' }),
    db.orm.public.User.create({ name: 'Ravi Developer', email: 'ravi.dev@agency.com', passwordHash, role: 'DEVELOPER' }),
    db.orm.public.User.create({ name: 'Elena Developer', email: 'elena.dev@agency.com', passwordHash, role: 'DEVELOPER' }),
    db.orm.public.User.create({ name: 'Michael Developer', email: 'michael.dev@agency.com', passwordHash, role: 'DEVELOPER' }),
    db.orm.public.User.create({ name: 'Priya Developer', email: 'priya.dev@agency.com', passwordHash, role: 'DEVELOPER' }),
  ]);

  const [commerce, banking, healthcare] = await Promise.all([
    db.orm.public.Project.create({
      name: 'E-Commerce Platform Redesign',
      description: 'Modernize the retail storefront and order-management platform.',
      ownerId: sarah.id,
    }),
    db.orm.public.Project.create({
      name: 'Mobile Banking App',
      description: 'Build secure mobile banking flows and transaction experiences.',
      ownerId: sarah.id,
    }),
    db.orm.public.Project.create({
      name: 'Healthcare Analytics Dashboard',
      description: 'Deliver hospital reporting and patient-capacity analytics.',
      ownerId: alex.id,
    }),
  ]);

  const now = Temporal.Now.instant();
  const createTask = (input: {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueInHours: number;
    projectId: string;
    assigneeId: string;
  }) => db.orm.public.Task.create({
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: now.add({ hours: input.dueInHours }),
    projectId: input.projectId,
    assigneeId: input.assigneeId,
  });

  const [commerceTasks, bankingTasks, healthcareTasks] = await Promise.all([
    Promise.all([
      createTask({ title: 'Design Database Schema', description: 'Model products, orders, and inventory.', status: 'DONE', priority: 'HIGH', dueInHours: -120, projectId: commerce.id, assigneeId: ravi.id }),
      createTask({ title: 'Implement JWT Authentication', description: 'Implement access and refresh token flows.', status: 'IN_PROGRESS', priority: 'CRITICAL', dueInHours: 48, projectId: commerce.id, assigneeId: ravi.id }),
      createTask({ title: 'Integrate Payment Gateway', description: 'Connect payment webhooks and transaction states.', status: 'TO_DO', priority: 'HIGH', dueInHours: 120, projectId: commerce.id, assigneeId: elena.id }),
      createTask({ title: 'Set Up Redis Rate Limiter', description: 'Protect authentication endpoints from abuse.', status: 'IN_REVIEW', priority: 'MEDIUM', dueInHours: 72, projectId: commerce.id, assigneeId: elena.id }),
      createTask({ title: 'Cart State Management', description: 'Add optimistic cart state updates.', status: 'TO_DO', priority: 'LOW', dueInHours: 168, projectId: commerce.id, assigneeId: michael.id }),
    ]),
    Promise.all([
      createTask({ title: 'Biometric Authentication', description: 'Support Face ID and fingerprint sign-in.', status: 'IN_PROGRESS', priority: 'CRITICAL', dueInHours: -48, projectId: banking.id, assigneeId: michael.id }),
      createTask({ title: 'Push Notifications Module', description: 'Configure transaction alerts.', status: 'TO_DO', priority: 'MEDIUM', dueInHours: 72, projectId: banking.id, assigneeId: priya.id }),
      createTask({ title: 'Account Summary Dashboard', description: 'Render account balances and charts.', status: 'DONE', priority: 'HIGH', dueInHours: -168, projectId: banking.id, assigneeId: michael.id }),
      createTask({ title: 'PDF Statement Exporter', description: 'Generate monthly account statements.', status: 'TO_DO', priority: 'LOW', dueInHours: 144, projectId: banking.id, assigneeId: priya.id }),
      createTask({ title: 'Security Audit Remediation', description: 'Resolve findings from the security audit.', status: 'IN_REVIEW', priority: 'CRITICAL', dueInHours: 96, projectId: banking.id, assigneeId: ravi.id }),
    ]),
    Promise.all([
      createTask({ title: 'Patient Data Ingestion', description: 'Import scheduled EHR data feeds.', status: 'IN_PROGRESS', priority: 'HIGH', dueInHours: 48, projectId: healthcare.id, assigneeId: elena.id }),
      createTask({ title: 'HIPAA Compliance Logging', description: 'Record protected health-data access.', status: 'TO_DO', priority: 'CRITICAL', dueInHours: 96, projectId: healthcare.id, assigneeId: priya.id }),
      createTask({ title: 'Bed Capacity Heatmap', description: 'Visualize ICU capacity in real time.', status: 'IN_REVIEW', priority: 'HIGH', dueInHours: 72, projectId: healthcare.id, assigneeId: elena.id }),
      createTask({ title: 'Doctor Schedule Sync', description: 'Synchronize clinician duty schedules.', status: 'TO_DO', priority: 'MEDIUM', dueInHours: 144, projectId: healthcare.id, assigneeId: michael.id }),
      createTask({ title: 'Export Patient Reports', description: 'Export filtered reports as CSV and JSON.', status: 'DONE', priority: 'LOW', dueInHours: -72, projectId: healthcare.id, assigneeId: priya.id }),
    ]),
  ]);

  await Promise.all([
    db.orm.public.ActivityLog.create({ taskId: commerceTasks[0].id, userId: ravi.id, action: 'STATUS_CHANGED', oldValue: 'IN_REVIEW', newValue: 'DONE' }),
    db.orm.public.ActivityLog.create({ taskId: commerceTasks[1].id, userId: ravi.id, action: 'STATUS_CHANGED', oldValue: 'TO_DO', newValue: 'IN_PROGRESS' }),
    db.orm.public.ActivityLog.create({ taskId: bankingTasks[2].id, userId: michael.id, action: 'STATUS_CHANGED', oldValue: 'IN_REVIEW', newValue: 'DONE' }),
    db.orm.public.ActivityLog.create({ taskId: bankingTasks[4].id, userId: ravi.id, action: 'STATUS_CHANGED', oldValue: 'IN_PROGRESS', newValue: 'IN_REVIEW' }),
    db.orm.public.ActivityLog.create({ taskId: healthcareTasks[2].id, userId: elena.id, action: 'STATUS_CHANGED', oldValue: 'IN_PROGRESS', newValue: 'IN_REVIEW' }),
  ]);

  void admin;
  console.log('Database successfully seeded.');
  console.log('Login: admin@agency.com / password123');
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
