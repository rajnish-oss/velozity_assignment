import { useAppSelector } from '../../app/hooks'
import Avatar from '../common/Avatar'
import EmptyState from '../common/EmptyState'
import { LoadingBlock } from '../common/Spinner'
import { relativeTime } from '../../utils/time'
import { ROLES } from '../../utils/constants'

// Applies the role-based visibility rule described in the spec:
// Admin sees everything, PM sees only their own projects' activity,
// Developer sees only activity tied to tasks assigned to them.
function useScopedActivities() {
  const { items, status } = useAppSelector((s) => s.activities)
  const user = useAppSelector((s) => s.auth.user)
  const projects = useAppSelector((s) => s.projects.items)
  const tasks = useAppSelector((s) => s.tasks.items)

  if (!user) return { items: [], status }

  if (user.role === ROLES.ADMIN) return { items, status }

  if (user.role === ROLES.PM) {
    const ownedProjectIds = new Set(projects.filter((p) => p.ownerId === user.id).map((p) => p.id))
    return { items: items.filter((a) => ownedProjectIds.has(a.projectId)), status }
  }

  // DEVELOPER: only activity on tasks assigned to them
  const myTaskIds = new Set(tasks.filter((t) => t.assigneeId === user.id).map((t) => t.id))
  return { items: items.filter((a) => a.taskId && myTaskIds.has(a.taskId)), status }
}

export default function ActivityFeed({ compact = false }) {
  const { items, status } = useScopedActivities()

  if (status === 'loading') return <LoadingBlock label="Loading activity..." />

  if (items.length === 0) {
    return <EmptyState title="No activity yet" description="Updates on tasks and projects will appear here in real time." />
  }

  return (
    <ul className={compact ? 'space-y-1' : 'space-y-1'}>
      {items.map((activity) => {
        return (
          <li key={activity.id} className="animate-feed-in flex items-start gap-3 rounded-md px-2 py-2 hover:bg-canvas">
            <Avatar userId={activity.userId} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-ink-800">
                <span className="font-medium text-ink-900">{activity.actorName || 'Someone'}</span> {activity.text} <span className="text-ink-500">- {relativeTime(activity.at)}</span>
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// @ts-nocheck
