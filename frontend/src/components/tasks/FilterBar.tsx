import { useSearchParams } from 'react-router-dom'
import { STATUS_ORDER, STATUS_LABELS, PRIORITY_ORDER } from '../../utils/constants'

export default function FilterBar() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || ''
  const priority = params.get('priority') || ''
  const due = params.get('due') || ''

  function update(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const hasFilters = status || priority || due

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white px-4 py-3 shadow-panel ring-1 ring-line">
      <Select
        label="Status"
        value={status}
        onChange={(v) => update('status', v)}
        options={[{ value: '', label: 'All statuses' }, ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] }))]}
      />
      <Select
        label="Priority"
        value={priority}
        onChange={(v) => update('priority', v)}
        options={[{ value: '', label: 'All priorities' }, ...PRIORITY_ORDER.map((p) => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))]}
      />
      <Select
        label="Due"
        value={due}
        onChange={(v) => update('due', v)}
        options={[
          { value: '', label: 'Any due date' },
          { value: 'overdue', label: 'Overdue' },
          { value: '7d', label: 'Next 7 days' },
          { value: '30d', label: 'Next 30 days' },
        ]}
      />
      {hasFilters && (
        <button
          onClick={() => setParams({}, { replace: true })}
          className="ml-auto text-xs font-medium text-ink-500 hover:text-amber-700"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex items-center gap-2 text-xs font-medium text-ink-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-line bg-white px-2 py-1.5 text-xs text-ink-800 focus:border-amber-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// @ts-nocheck
