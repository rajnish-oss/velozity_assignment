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
    const offPresence = socket.on('presence:update', (payload) => dispatch(presenceUpdated(payload)))
    const offTask = socket.on('task:status_changed', ({ task, activity }) => {
      dispatch(taskStatusChangedFromSocket(task))
      dispatch(activityReceived(activity))
    })
    const offNotif = socket.on('notification:new', (notification) => {
      if (notification.forUserId && notification.forUserId !== user.id) return
      dispatch(notificationReceived(notification))
    })

    return () => {
      offConn()
      offPresence()
      offTask()
      offNotif()
      disconnect()
    }
  }, [user, dispatch])
}

// @ts-nocheck
