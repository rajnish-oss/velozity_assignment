import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { editTask } from '../../features/tasks/tasksSlice'
import { PriorityBadge, StatusPill, OverdueBadge } from '../common/Badge'
import EmptyState from '../common/EmptyState'
import TaskDetailDrawer from '../tasks/TaskDetailDrawer'
import { formatDueDate, isOverdue } from '../../utils/time'
import { PRIORITY_ORDER, STATUS_ORDER, STATUS_LABELS } from '../../utils/constants'

export default function DeveloperDashboard() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const tasks = useAppSelector((s) => s.tasks.items)
  const [activeTaskId, setActiveTaskId] = useState(null)

  const myTasks = tasks
    .filter((t) => t.assigneeId === user.id)
    .sort((a, b) => {
      const p = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
      if (p !== 0) return p
      return new Date(a.dueDate) - new Date(b.dueDate)
    })

  function advanceStatus(task) {
    const idx = STATUS_ORDER.indexOf(task.status)
    if (idx >= STATUS_ORDER.length - 1) return
    dispatch(editTask({ id: task.id, patch: { status: STATUS_ORDER[idx + 1] } }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">My focus</h1>
        <p className="mt-1 text-sm text-ink-500">Your assigned tasks, sorted by priority then due date.</p>
      </div>

      {myTasks.length === 0 ? (
        <EmptyState title="No tasks assigned" description="When a task is assigned to you, it will show up here." />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-panel ring-1 ring-line">
          <ul className="divide-y divide-line">
            {myTasks.map((task) => (
              <li key={task.id} className="flex items-center gap-4 px-5 py-4">
                <button onClick={() => setActiveTaskId(task.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-ink-900 hover:text-amber-700">{task.title}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <PriorityBadge priority={task.priority} />
                    <StatusPill status={task.status} />
                    <span className="text-xs text-ink-500">Due {formatDueDate(task.dueDate)}</span>
                    {isOverdue(task.status) && <OverdueBadge />}
                  </div>
                </button>
                {task.status !== 'DONE' && (
                  <button
                    onClick={() => advanceStatus(task)}
                    className="shrink-0 rounded-md bg-canvas px-3 py-1.5 text-xs font-medium text-ink-700 ring-1 ring-line hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-300"
                  >
                    Move to {STATUS_LABELS[STATUS_ORDER[STATUS_ORDER.indexOf(task.status) + 1]]}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <TaskDetailDrawer taskId={activeTaskId} onClose={() => setActiveTaskId(null)} />
    </div>
  )
}

// @ts-nocheck
