import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { addProject, editProject } from '../../features/projects/projectsSlice'
import Modal from '../common/Modal'

export default function ProjectModal({ open, onClose, project }) {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)
  const isEdit = Boolean(project)

  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [scope, setScope] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setTitle(project?.title || '')
      setClient(project?.client || '')
      setScope(project?.scope || '')
      setError('')
    }
  }, [open, project])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return setError('Give the project a name.')
    if (!client.trim()) return setError('Add a client or team name.')
    setSubmitting(true)
    try {
      if (isEdit) {
        await dispatch(editProject({ id: project.id, patch: { title, client, scope } })).unwrap()
      } else {
        await dispatch(addProject({ title, client, scope, ownerId: user.id })).unwrap()
      }
      onClose()
    } catch {
      setError('Could not save the project. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit project' : 'Create project'}
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-600 hover:bg-canvas">
            Cancel
          </button>
          <button
            form="project-form"
            type="submit"
            disabled={submitting}
            className="rounded-md bg-amber-500 px-3.5 py-2 text-sm font-semibold text-ink-900 hover:bg-amber-600 disabled:opacity-60"
          >
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create project'}
          </button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Project name">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Orion Mobile Revamp"
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
          />
        </Field>
        <Field label="Client">
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="e.g. Northwind Retail"
            className="w-full rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
          />
        </Field>
        <Field label="Scope">
          <textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            rows={3}
            placeholder="What is this project covering?"
            className="w-full resize-none rounded-md border border-line px-3 py-2 text-sm focus:border-amber-500"
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
