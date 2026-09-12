import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { useWebSocket } from '../../hooks/useWebSocket'
import { loadProjects } from '../../features/projects/projectsSlice'
import { loadTasks } from '../../features/tasks/tasksSlice'
import { loadActivities } from '../../features/activities/activitiesSlice'
import { loadNotifications } from '../../features/notifications/notificationsSlice'
import Sidebar from './Sidebar'
import Header from './Header'
import ErrorBoundary from '../common/ErrorBoundary'

export default function AppShell() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  useWebSocket()

  useEffect(() => {
    if (!user) return
    dispatch(loadProjects())
    dispatch(loadTasks())
    dispatch(loadActivities())
    dispatch(loadNotifications(user.id))
  }, [user, dispatch])

  return (
    <div className="flex h-screen w-full bg-canvas">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

// @ts-nocheck
