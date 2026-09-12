import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { restoreSession } from './features/auth/authSlice'
import LoginPage from './features/auth/LoginPage'
import DashboardPage from './features/dashboard/DashboardPage'
import ProjectList from './features/projects/ProjectList'
import ProjectDetails from './features/projects/ProjectDetails'
import TaskBoard from './components/tasks/TaskBoard'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './routes/ProtectedRoute'
import RoleRoute from './routes/RoleRoute'
import { ROLES } from './utils/constants'

export default function App() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    dispatch(restoreSession())
  }, [dispatch])

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tasks" element={<TaskBoard />} />
        <Route
          path="projects"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.PM]}>
              <ProjectList />
            </RoleRoute>
          }
        />
        <Route
          path="projects/:id"
          element={
            <RoleRoute allow={[ROLES.ADMIN, ROLES.PM]}>
              <ProjectDetails />
            </RoleRoute>
          }
        />
        <Route path="*" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

// @ts-nocheck
