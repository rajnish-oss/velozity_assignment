import clsx from 'clsx'

export default function MetricCard({ label, value, tone = 'default', hint }) {
  const tones = {
    default: 'bg-white ring-line',
    alert: 'bg-rose-50 ring-rose-200',
    accent: 'bg-amber-50 ring-amber-200',
  }
  return (
    <div className={clsx('rounded-xl p-5 shadow-panel ring-1', tones[tone])}>
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className={clsx('mt-2 text-3xl font-bold tracking-tight', tone === 'alert' ? 'text-rose-700' : 'text-ink-900')}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}

// @ts-nocheck
