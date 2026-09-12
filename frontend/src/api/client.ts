type ApiErrorBody = { error?: string; message?: string }
type ApiOptions = Omit<RequestInit, 'body' | 'headers'> & { body?: unknown; headers?: HeadersInit }

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
let accessToken = localStorage.getItem('accessToken')

const toClientRole = (role: string) => role === 'PROJECT_MANAGER' ? 'PM' : role
const fromClientStatus = (status: string) => status === 'TODO' ? 'TO_DO' : status
const toClientStatus = (status: string) => status === 'TO_DO' ? 'TODO' : status
const projectForClient = (project: any) => ({ ...project, title: project.name, scope: project.description ?? '', client: project.client ?? '' })
const taskForClient = (task: any) => ({ ...task, status: toClientStatus(task.status) })
const notificationForClient = (notification: any) => ({ ...notification, text: notification.message, read: notification.isRead, at: notification.createdAt })
const activityForClient = (activity: any) => ({ ...activity, at: activity.createdAt, text: activity.action === 'STATUS_CHANGED' ? `changed a task from ${toClientStatus(activity.oldValue)} to ${toClientStatus(activity.newValue)}` : activity.action })

async function request<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...init } = options
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({} as ApiErrorBody)) as ApiErrorBody
    throw new Error(error.error ?? error.message ?? `Request failed (${response.status})`)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

async function currentUser() {
  const { user } = await request<{ user: any }>('/auth/me')
  return { ...user, role: toClientRole(user.role) }
}

export async function login({ email, password }: { email: string; password: string }) {
  const response = await request<{ accessToken: string }>('/auth/login', { method: 'POST', body: { email, password } })
  accessToken = response.accessToken
  return { ...response, user: await currentUser() }
}

export async function refreshSession() {
  const response = await request<{ accessToken: string }>('/auth/refresh', { method: 'POST' })
  accessToken = response.accessToken
  return { ...response, user: await currentUser() }
}

export async function logout() {
  try { await request<void>('/auth/logout', { method: 'POST' }) } finally { accessToken = null }
}

export async function fetchProjects() {
  const { projects } = await request<{ projects: any[] }>('/projects')
  return projects.map(projectForClient)
}
export async function createProject(payload: any) {
  const { project } = await request<{ project: any }>('/projects', { method: 'POST', body: { name: payload.title, description: payload.scope } })
  return projectForClient(project)
}
export async function getProject(id: string) {
  const { project } = await request<{ project: any }>(`/projects/${id}`)
  return projectForClient(project)
}
export async function updateProject(id: string, patch: any) {
  const { project } = await request<{ project: any }>(`/projects/${id}`, { method: 'PATCH', body: { ...(patch.title === undefined ? {} : { name: patch.title }), ...(patch.scope === undefined ? {} : { description: patch.scope }) } })
  return projectForClient(project)
}
export async function deleteProject(id: string) { return request<void>(`/projects/${id}`, { method: 'DELETE' }) }

export async function fetchTasks(filters: Record<string, string> = {}) {
  const search = new URLSearchParams(filters)
  const { tasks } = await request<{ tasks: any[] }>(`/tasks${search.size ? `?${search}` : ''}`)
  return tasks.map(taskForClient)
}
export async function createTask(payload: any) {
  const { task } = await request<{ task: any }>('/tasks', { method: 'POST', body: { ...payload, status: undefined } })
  return taskForClient(task)
}
export async function getTask(id: string) {
  const { task } = await request<{ task: any }>(`/tasks/${id}`)
  return taskForClient(task)
}
export async function updateTask(id: string, patch: { status: string }) {
  const { task } = await request<{ task: any }>(`/tasks/${id}`, { method: 'PATCH', body: { status: fromClientStatus(patch.status) } })
  return taskForClient(task)
}
export async function deleteTask(id: string) { return request<void>(`/tasks/${id}`, { method: 'DELETE' }) }

export async function fetchActivities() {
  const { activities } = await request<{ activities: any[] }>('/activities')
  return activities.map(activityForClient)
}
export async function fetchNotifications(_userId?: string) {
  const { notifications } = await request<{ notifications: any[] }>('/notifications')
  return notifications.map(notificationForClient)
}
export async function markNotificationsRead(_userId?: string, payload: { id?: string; ids?: string[] } = {}) {
  const { notifications } = await request<{ notifications: any[] }>('/notifications/read', { method: 'PATCH', body: payload })
  return notifications.map(notificationForClient)
}
