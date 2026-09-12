import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { editTask } from '../../features/tasks/tasksSlice'
import { PriorityBadge, OverdueBadge } from '../common/Badge'
import Avatar from '../common/Avatar'
import EmptyState from '../common/EmptyState'
import { LoadingBlock } from '../common/Spinner'
import FilterBar from './FilterBar'
import TaskDetailDrawer from './TaskDetailDrawer'
import TaskModal from './TaskModal'
import { formatDueDate, isOverdue } from '../../utils/time'
import { STATUS_ORDER, STATUS_LABELS, ROLES } from '../../utils/constants'

export default function TaskBoard() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { items: tasks, status } = useAppSelector((s) => s.tasks)
  const [params] = useSearchParams()
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)

  const scoped = user.role === ROLES.DEVELOPER ? tasks.filter((t) => t.assigneeId === user.id) : tasks

  const filtered = scoped.filter((t) => {
    const statusF = params.get('status')
    const priorityF = params.get('priority')
    const dueF = params.get('due')
    if (statusF && t.status !== statusF) return false
    if (priorityF && t.priority !== priorityF) return false
    if (dueF === 'overdue' && !isOverdue(t.dueDate, t.status)) return false
    if (dueF === '7d' && new Date(t.dueDate) - Date.now() > 7 * 86400000) return false
    if (dueF === '30d' && new Date(t.dueDate) - Date.now() > 30 * 86400000) return false
    return true
  })

  function moveTask(task, direction) {
    const idx = STATUS_ORDER.indexOf(task.status)
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= STATUS_ORDER.length) return
    dispatch(editTask({ id: task.id, patch: { status: STATUS_ORDER[nextIdx] } }))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{user.role === ROLES.DEVELOPER ? 'My tasks' : 'Tasks'}</h1>
          <p className="mt-1 text-sm text-ink-500">Filters stay in the URL so views can be bookmarked or shared.</p>
        </div>
        {user.role !== ROLES.DEVELOPER && (
          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-900 hover:bg-amber-600"
          >
            + New task
          </button>
        )}
      </div>

      <FilterBar />

      {status === 'loading' ? (
        <LoadingBlock label="Loading tasksâ€¦" />
      ) : filtered.length === 0 ? (
        <EmptyState title="No tasks match these filters" description="Try clearing a filter, or create a new task." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((column) => {
            const columnTasks = filtered.filter((t) => t.status === column)
            return (
              <div key={column} className="rounded-xl bg-white/70 p-3 ring-1 ring-line">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-500">{STATUS_LABELS[column]}</h2>
                  <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-500">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group rounded-lg bg-white p-3 shadow-panel ring-1 ring-line transition hover:ring-amber-300"
                    >
                      <button onClick={() => setActiveTaskId(task.id)} className="block w-full text-left">
                        <p className="text-sm font-medium text-ink-900">{task.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <PriorityBadge priority={task.priority} />
                          {isOverdue(task.dueDate, task.status) && <OverdueBadge />}
                        </div>
                        <div className="mt-2.5 flex items-center justify-between">
                          <Avatar userId={task.assigneeId} size="sm" />
                          <span className="text-xs text-ink-500">{formatDueDate(task.dueDate)}</span>
                        </div>
                      </button>
                      <div className="mt-2 flex justify-between opacity-0 transition group-hover:opacity-100">
                        <button
                          onClick={() => moveTask(task, -1)}
                          disabled={STATUS_ORDER.indexOf(task.status) === 0}
                          className="text-xs text-ink-400 hover:text-amber-700 disabled:invisible"
                        >
                          â† Back
                        </button>
                        <button
                          onClick={() => moveTask(task, 1)}
                          disabled={STATUS_ORDER.indexOf(task.status) === STATUS_ORDER.length - 1}
                          className="text-xs text-ink-400 hover:text-amber-700 disabled:invisible"
                        >
                          Advance â†’
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskDetailDrawer taskId={activeTaskId} onClose={() => setActiveTaskId(null)} />
      <TaskModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

// @ts-nocheck
