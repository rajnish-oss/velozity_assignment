import { useAppSelector } from '../../app/hooks'
import { Link } from 'react-router-dom'
import MetricCard from './MetricCard'
import ActivityFeed from '../activity/ActivityFeed'
import EmptyState from '../common/EmptyState'
import { PriorityBadge } from '../common/Badge'
import { formatDueDate, isOverdue } from '../../utils/time'
import { PRIORITY_ORDER } from '../../utils/constants'

export default function PMDashboard() {
  const user = useAppSelector((s) => s.auth.user)
  const allProjects = useAppSelector((s) => s.projects.items)
  const allTasks = useAppSelector((s) => s.tasks.items)

  const myProjects = allProjects.filter((p) => p.ownerId === user.id)
  const myProjectIds = new Set(myProjects.map((p) => p.id))
  const myTasks = allTasks.filter((t) => myProjectIds.has(t.projectId))

  const priorityBreakdown = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: myTasks.filter((t) => t.priority === priority && t.status !== 'DONE').length,
  }))

  const upcoming = [...myTasks]
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Your projects</h1>
          <p className="mt-1 text-sm text-ink-500">Metrics and activity scoped to projects you manage.</p>
        </div>
        <Link to="/projects" className="rounded-md bg-ink-800 px-3.5 py-2 text-sm font-medium text-white hover:bg-ink-700">
          Manage projects
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Active projects" value={myProjects.length} />
        <MetricCard label="Open tasks" value={myTasks.filter((t) => t.status !== 'DONE').length} />
        <MetricCard
          label="Overdue"
          value={myTasks.filter((t) => t.status === 'OVERDUE').length}
          tone={myTasks.some((t) => t.status === 'OVERDUE') ? 'alert' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line">
          <h2 className="text-sm font-semibold text-ink-900">Tasks by priority</h2>
          <div className="mt-4 space-y-3">
            {priorityBreakdown.map(({ priority, count }) => (
              <div key={priority} className="flex items-center justify-between">
                <PriorityBadge priority={priority} />
                <span className="text-sm font-medium text-ink-700">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line">
          <h2 className="mb-3 text-sm font-semibold text-ink-900">Upcoming due dates</h2>
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing due soon" description="Tasks approaching their due date will appear here." />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-ink-800">{t.title}</span>
                  <span className={`shrink-0 text-xs font-medium ${isOverdue(t.status) ? 'text-rose-600' : 'text-ink-500'}`}>
                    {formatDueDate(t.dueDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Activity on your projects</h2>
          <div className="max-h-80 overflow-y-auto">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

// @ts-nocheck
