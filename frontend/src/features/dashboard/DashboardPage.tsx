import { useAppSelector } from '../../app/hooks'
import { ROLES } from '../../utils/constants'
import AdminDashboard from '../../components/dashboard/AdminDashboard'
import PMDashboard from '../../components/dashboard/PMDashboard'
import DeveloperDashboard from '../../components/dashboard/DeveloperDashboard'
import { LoadingBlock } from '../../components/common/Spinner'

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user)
  const projectsStatus = useAppSelector((s) => s.projects.status)
  const tasksStatus = useAppSelector((s) => s.tasks.status)

  if (projectsStatus === 'loading' || tasksStatus === 'loading') {
    return <LoadingBlock label="Loading your dashboardâ€¦" />
  }

  if (user.role === ROLES.ADMIN) return <AdminDashboard />
  if (user.role === ROLES.PM) return <PMDashboard />
  return <DeveloperDashboard />
}

// @ts-nocheck
