import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import * as socket from '../api/socket'
import { presenceUpdated, connectionStatusChanged } from '../features/presence/presenceSlice'
import { taskStatusChangedFromSocket } from '../features/tasks/tasksSlice'
import { activityReceived } from '../features/activities/activitiesSlice'
import { notificationReceived } from '../features/notifications/notificationsSlice'

// Mounted once the user is authenticated. Subscribes to the three
// real-time events (presence:update, task:status_changed, notification:new)
// and dispatches them into the relevant slices.
export function useWebSocket() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((s) => s.auth.user)

  useEffect(() => {
    if (!user) return undefined

    const disconnect = socket.connect()
    const offConn = socket.on('connection:status', (status) => dispatch(connectionStatusChanged(status)))
    const offPresence = socket.on('presence:updated', (payload) => dispatch(presenceUpdated(payload)))
    const offTask = socket.on('task:status_changed', ({ task, activity }) => {
      dispatch(taskStatusChangedFromSocket({ ...task, status: task.status === 'TO_DO' ? 'TODO' : task.status }))
      dispatch(activityReceived({ ...activity, at: activity.createdAt, text: `moved Task #${activity.taskId} from ${statusLabel(activity.oldValue)} → ${statusLabel(activity.newValue)}` }))
      localStorage.setItem('lastActivityAt', String(activity.createdAt))
    })
    const offCatchup = socket.on('activity:catchup', ({ activities }) => {
      activities.slice().reverse().forEach((activity: any) => {
        dispatch(activityReceived({ ...activity, at: activity.createdAt, text: `moved Task #${activity.taskId} from ${statusLabel(activity.oldValue)} → ${statusLabel(activity.newValue)}` }))
      })
      const newest = activities[0]
      if (newest) localStorage.setItem('lastActivityAt', String(newest.createdAt))
    })
    const offNotif = socket.on('notification:new', (notification) => {
      if (notification.forUserId && notification.forUserId !== user.id) return
      dispatch(notificationReceived(notification))
    })

    return () => {
      offConn()
      offPresence()
      offTask()
      offCatchup()
      offNotif()
      disconnect()
    }
  }, [user, dispatch])
}

function statusLabel(status: string) {
  return ({ TO_DO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' } as Record<string, string>)[status] ?? status
}

// @ts-nocheck
