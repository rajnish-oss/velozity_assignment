import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete', busy = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-sm"
      footer={
        <>
          <button onClick={onClose} className="rounded-md px-3.5 py-2 text-sm font-medium text-ink-600 hover:bg-canvas">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-md bg-rose-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{description}</p>
    </Modal>
  )
}

// @ts-nocheck
