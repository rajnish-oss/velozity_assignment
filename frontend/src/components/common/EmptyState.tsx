export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-1 text-3xl">{icon}</div>}
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}

// @ts-nocheck
