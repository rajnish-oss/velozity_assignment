import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addTask } from '../../features/tasks/tasksSlice'
import { USERS } from '../../api/fixtures'
import Modal from '../common/Modal'
import { PRIORITY_ORDER } from '../../utils/constants'

const DEV_IDS = Object.values(USERS).filter((u) => u.role === 'DEVELOPER').map((u) => u.id)

export default function TaskModal({ open, onClose, defaultProjectId }) {
  const dispatch = useAppDispatch()
  const projects = useAppSelector((s) => s.projects.items)

  const [title, setTitle] = useState('')
  const [projectId, setProjectId] = useState(defaultProjectId || '')
  const [assigneeId, setAssigneeId] = useState(DEV_IDS[0])
  const [priority, setPriority] = useState('MEDIUM')
  const [dueDate, setDueDate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle('')
      setProjectId(defaultProjectId || projects[0]?.id || '')
      setAssigneeId(DEV_IDS[0])
      setPriority('MEDIUM')
      setDueDate('')
      setError('')
    }
  }, [open, defaultProjectId, projects])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return setError('Give the task a title.')
    if (!projectId) return setError('Choose a project.')
    if (!dueDate) return setError('Set a due date.')
    setSubmitting(true)
    try {
      await dispatch(
        addTask({
          title: title.trim(),
          projectId,
          assigneeId,
          priority,
          status: 'TODO',
          dueDate: new Date(dueDate).toISOString(),
        })
      ).unwrap()
      onClose()
    } catch {
      setError('Could not create the task. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create task"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-600 hover:bg-canvas">
            Cancel
          </button>
          <button
            form="task-form"
            type="submit"
            disabled={submitting}
            className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-900 hover:bg-amber-600 disabled:opacity-60"
          >
            {submitting ? 'Creatingâ€¦' : 'Create task'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix login redirect bug"
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
          />
        </Field>
        <Field label="Project">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Assignee">
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
            >
              {DEV_IDS.map((id) => (
                <option key={id} value={id}>
                  {USERS[id].name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
            >
              {PRIORITY_ORDER.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Due date">
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
          />
        </Field>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </form>
    </Modal>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink-700">{label}</span>
      {children}
    </label>
  )
}

// @ts-nocheck
