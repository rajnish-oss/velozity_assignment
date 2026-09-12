import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { editTask } from '../../features/tasks/tasksSlice'
import Avatar from '../common/Avatar'
import { PriorityBadge, StatusPill, OverdueBadge } from '../common/Badge'
import { formatDueDate, relativeTime, isOverdue } from '../../utils/time'
import { STATUS_ORDER, STATUS_LABELS, ROLES } from '../../utils/constants'

export default function TaskDetailDrawer({ taskId, onClose }) {
  const dispatch = useAppDispatch()
  const task = useAppSelector((s) => s.tasks.items.find((t) => t.id === taskId))
  const project = useAppSelector((s) => s.projects.items.find((p) => p.id === task?.projectId))
  const user = useAppSelector((s) => s.auth.user)
  const assignee = useAppSelector((s) => s.users.items.find((item) => item.id === task?.assigneeId))

  if (!taskId || !task) return null

  const canEdit = user.role !== ROLES.DEVELOPER || task.assigneeId === user.id
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink-900/40 backdrop-blur-[1px]" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{project?.title}</p>
            <h2 className="mt-0.5 text-base font-semibold text-ink-900">{task.title}</h2>
          </div>
          <button onClick={onClose} aria-label="Close drawer" className="rounded-md p-1 text-ink-500 hover:bg-canvas">
            Close
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusPill status={task.status} />
            {isOverdue(task.status) && <OverdueBadge />}
          </div>

          <div>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Description</h3>
            <p className="text-sm leading-relaxed text-ink-700">{task.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Assignee</h3>
              <div className="flex items-center gap-2">
                <Avatar userId={task.assigneeId} size="sm" />
                <span className="text-sm text-ink-800">{assignee?.name}</span>
              </div>
            </div>
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Due date</h3>
              <p className="text-sm text-ink-800">{formatDueDate(task.dueDate)}</p>
            </div>
          </div>

          {canEdit && (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Update status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    onClick={() => dispatch(editTask({ id: task.id, patch: { status } }))}
                    disabled={status === task.status}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium ring-1 ${
                      status === task.status
                        ? 'cursor-default bg-ink-800 text-white ring-ink-800'
                        : 'bg-white text-ink-700 ring-line hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-300'
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">History</h3>
            {task.changeLog?.length ? (
              <ul className="space-y-2 border-l border-line pl-4">
                {[...task.changeLog].reverse().map((log) => (
                  <li key={log.id} className="relative text-sm text-ink-600">
                    <span className="absolute -left-[21px] top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
                    {log.text}
                    <span className="ml-2 text-xs text-ink-400">{relativeTime(log.at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-500">No changes recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// @ts-nocheck
