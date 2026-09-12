import { useAppSelector } from '../../app/hooks'
import MetricCard from './MetricCard'
import ActivityFeed from '../activity/ActivityFeed'
import { STATUS_ORDER, STATUS_LABELS } from '../../utils/constants'

export default function AdminDashboard() {
  const projects = useAppSelector((s) => s.projects.items)
  const tasks = useAppSelector((s) => s.tasks.items)
  const onlineCount = useAppSelector((s) => s.presence.onlineCount)

  const overdueCount = tasks.filter((t) => t.status === 'OVERDUE').length
  const statusBreakdown = STATUS_ORDER.map((status) => ({
    status,
    count: tasks.filter((t) => t.status === status).length,
  }))
  const maxCount = Math.max(1, ...statusBreakdown.map((s) => s.count))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Workspace overview</h1>
        <p className="mt-1 text-sm text-ink-500">Global visibility across every project and team member.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Total projects" value={projects.length} />
        <MetricCard label="Team members online" value={onlineCount ? onlineCount : '-'} tone="accent" hint="Updates live via WebSocket" />
        <MetricCard label="Overdue tasks" value={overdueCount} tone={overdueCount > 0 ? 'alert' : 'default'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink-900">Tasks by status</h2>
          <div className="mt-4 space-y-3">
            {statusBreakdown.map(({ status, count }) => (
              <div key={status} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-ink-600">{STATUS_LABELS[status]}</span>
                <div className="h-2.5 flex-1 rounded-full bg-canvas">
                  <div
                    className="h-2.5 rounded-full bg-amber-500"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-ink-500">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line">
          <h2 className="mb-2 text-sm font-semibold text-ink-900">Live activity</h2>
          <div className="max-h-96 overflow-y-auto">
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  )
}

// @ts-nocheck
