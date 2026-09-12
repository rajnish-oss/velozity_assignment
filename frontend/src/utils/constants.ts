export const ROLES = {
  ADMIN: 'ADMIN',
  PM: 'PM',
  DEVELOPER: 'DEVELOPER',
}

export const ROLE_LABELS = {
  ADMIN: 'Admin',
  PM: 'Project Manager',
  DEVELOPER: 'Developer',
}

export const STATUS_LABELS = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  IN_REVIEW: 'In Review',
  DONE: 'Done',
}

export const STATUS_ORDER = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE']

export const PRIORITY_ORDER = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']

export const PRIORITY_STYLES = {
  CRITICAL: 'bg-rose-50 text-rose-700 border-rose-200',
  HIGH: 'bg-amber-50 text-amber-700 border-amber-300',
  MEDIUM: 'bg-sky-50 text-sky-700 border-sky-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export const STATUS_STYLES = {
  TODO: 'bg-stone-100 text-stone-700',
  IN_PROGRESS: 'bg-sky-100 text-sky-700',
  IN_REVIEW: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
}

// @ts-nocheck
