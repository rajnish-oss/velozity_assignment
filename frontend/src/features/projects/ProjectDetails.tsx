import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { StatusPill, PriorityBadge, OverdueBadge } from '../../components/common/Badge'
import EmptyState from '../../components/common/EmptyState'
import ProjectModal from '../../components/projects/ProjectModal'
import TaskModal from '../../components/tasks/TaskModal'
import TaskDetailDrawer from '../../components/tasks/TaskDetailDrawer'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { removeProject } from './projectsSlice'
import { formatDueDate, isOverdue, relativeTime } from '../../utils/time'
import { STATUS_ORDER, ROLES } from '../../utils/constants'

export default function ProjectDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const project = useAppSelector((s) => s.projects.items.find((p) => p.id === id))
  const tasks = useAppSelector((s) => s.tasks.items.filter((t) => t.projectId === id))
  const users = useAppSelector((s) => s.users.items)

  const [editOpen, setEditOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [activeTaskId, setActiveTaskId] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="It may have been deleted."
        action={
          <Link to="/projects" className="text-sm font-medium text-amber-700 hover:underline">
            Back to projects
          </Link>
        }
      />
    )
  }

  const canManage = user.role === ROLES.ADMIN || (user.role === ROLES.PM && project.ownerId === user.id)

  async function confirmDelete() {
    setBusy(true)
    await dispatch(removeProject(project.id))
    setBusy(false)
    navigate('/projects')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link to="/projects" className="text-xs font-medium text-ink-500 hover:text-amber-700">
          Back to projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-ink-900">{project.title}</h1>
            <p className="mt-1 text-sm text-ink-500">
              {project.client} - Owned by {users.find((owner) => owner.id === project.ownerId)?.name || 'Unknown'} - Created {relativeTime(project.createdAt)}
            </p>
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-ink-700 ring-1 ring-line hover:bg-canvas"
              >
                Edit
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-line hover:bg-rose-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-panel ring-1 ring-line">
        <h2 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">Scope</h2>
        <p className="text-sm leading-relaxed text-ink-700">{project.scope || 'No scope description provided.'}</p>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Tasks ({tasks.length})</h2>
        {canManage && (
          <button
            onClick={() => setTaskModalOpen(true)}
            className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-ink-900 hover:bg-amber-600"
          >
            + New task
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <EmptyState title="No tasks yet" description="Tasks created for this project will appear here." />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-panel ring-1 ring-line">
          <ul className="divide-y divide-line">
            {tasks
              .sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
              .map((task) => (
                <li key={task.id}>
                  <button onClick={() => setActiveTaskId(task.id)} className="flex w-full items-center gap-4 px-5 py-3.5 text-left hover:bg-canvas/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{task.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">Assigned to {users.find((assignee) => assignee.id === task.assigneeId)?.name || 'Unassigned'}</p>
                    </div>
                    <PriorityBadge priority={task.priority} />
                    <StatusPill status={task.status} />
                    <span className="w-16 shrink-0 text-right text-xs text-ink-500">{formatDueDate(task.dueDate)}</span>
                    {isOverdue(task.dueDate, task.status) && <OverdueBadge />}
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}

      <ProjectModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <TaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} defaultProjectId={project.id} />
      <TaskDetailDrawer taskId={activeTaskId} onClose={() => setActiveTaskId(null)} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Delete this project?"
        description={`"${project.title}" and its ${tasks.length} task(s) association will be removed. This cannot be undone.`}
      />
    </div>
  )
}

// @ts-nocheck
