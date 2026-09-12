import { configureStore } from '@reduxjs/toolkit'
import authReducer from '../features/auth/authSlice'
import projectsReducer from '../features/projects/projectsSlice'
import tasksReducer from '../features/tasks/tasksSlice'
import activitiesReducer from '../features/activities/activitiesSlice'
import notificationsReducer from '../features/notifications/notificationsSlice'
import presenceReducer from '../features/presence/presenceSlice'
import usersReducer from '../features/users/usersSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    projects: projectsReducer,
    tasks: tasksReducer,
    activities: activitiesReducer,
    notifications: notificationsReducer,
    presence: presenceReducer,
    users: usersReducer,
  },
})

// @ts-nocheck
