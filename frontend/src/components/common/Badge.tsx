import clsx from 'clsx'

export function PriorityBadge({ priority }) {
  const styles = {
    CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
    HIGH: 'bg-amber-50 text-amber-700 border-amber-300',
    MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  }
  const dots = { CRITICAL: 'bg-rose-500', HIGH: 'bg-amber-500', MEDIUM: 'bg-sky-500', LOW: 'bg-emerald-500' }
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium', styles[priority])}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', dots[priority])} />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  )
}

export function StatusPill({ status }) {
  const styles = {
    TODO: 'bg-stone-100 text-stone-700',
    TO_DO: 'bg-stone-100 text-stone-700',
    IN_PROGRESS: 'bg-sky-100 text-sky-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    DONE: 'bg-emerald-100 text-emerald-700',
    OVERDUE: 'bg-rose-100 text-rose-700',
  }
  const labels = { TODO: 'To Do', TO_DO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done', OVERDUE: 'Overdue' }
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  )
}

export function OverdueBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-rose-300 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
      Overdue
    </span>
  )
}

// @ts-nocheck
