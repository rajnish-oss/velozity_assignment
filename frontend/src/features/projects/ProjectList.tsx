import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { removeProject } from './projectsSlice'
import { USERS } from '../../api/fixtures'
import ProjectModal from '../../components/projects/ProjectModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import { LoadingBlock } from '../../components/common/Spinner'
import { ROLES } from '../../utils/constants'
import { relativeTime } from '../../utils/time'

export default function ProjectList() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const { items, status } = useAppSelector((s) => s.projects)
  const tasks = useAppSelector((s) => s.tasks.items)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [busy, setBusy] = useState(false)

  const visible = user.role === ROLES.PM ? items.filter((p) => p.ownerId === user.id) : items
  const canManage = user.role === ROLES.ADMIN || user.role === ROLES.PM

  function openCreate() {
    setEditingProject(null)
    setModalOpen(true)
  }
  function openEdit(project) {
    setEditingProject(project)
    setModalOpen(true)
  }
  async function confirmDelete() {
    setBusy(true)
    await dispatch(removeProject(deletingProject.id))
    setBusy(false)
    setDeletingProject(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{user.role === ROLES.ADMIN ? 'All projects' : 'My projects'}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {user.role === ROLES.ADMIN ? 'Every project across the workspace.' : 'Projects you created and manage.'}
          </p>
        </div>
        {canManage && (
          <button
            onClick={openCreate}
            className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-900 hover:bg-amber-600"
          >
            + New project
          </button>
        )}
      </div>

      {status === 'loading' ? (
        <LoadingBlock label="Loading projectsâ€¦" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start assigning tasks to your team."
          action={
            canManage && (
              <button onClick={openCreate} className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-900 hover:bg-amber-600">
                + New project
              </button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-panel ring-1 ring-line">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-canvas/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Project</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Owner</th>
                <th className="px-5 py-3 font-semibold">Tasks</th>
                <th className="px-5 py-3 font-semibold">Created</th>
                {canManage && <th className="px-5 py-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.map((project) => {
                const taskCount = tasks.filter((t) => t.projectId === project.id).length
                return (
                  <tr key={project.id} className="hover:bg-canvas/50">
                    <td className="px-5 py-3.5">
                      <Link to={`/projects/${project.id}`} className="font-medium text-ink-900 hover:text-amber-700">
                        {project.title}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">{project.client}</td>
                    <td className="px-5 py-3.5 text-ink-600">{USERS[project.ownerId]?.name}</td>
                    <td className="px-5 py-3.5 text-ink-600">{taskCount}</td>
                    <td className="px-5 py-3.5 text-ink-500">{relativeTime(project.createdAt)}</td>
                    {canManage && (
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-3">
                          <button onClick={() => openEdit(project)} className="text-xs font-medium text-ink-500 hover:text-amber-700">
                            Edit
                          </button>
                          <button onClick={() => setDeletingProject(project)} className="text-xs font-medium text-ink-500 hover:text-rose-600">
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ProjectModal open={modalOpen} onClose={() => setModalOpen(false)} project={editingProject} />
      <ConfirmDialog
        open={Boolean(deletingProject)}
        onClose={() => setDeletingProject(null)}
        onConfirm={confirmDelete}
        busy={busy}
        title="Delete this project?"
        description={`"${deletingProject?.title}" and its association with existing tasks will be removed. This cannot be undone.`}
      />
    </div>
  )
}

// @ts-nocheck
