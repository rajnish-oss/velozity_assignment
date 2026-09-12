import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/client'

export const loadNotifications = createAsyncThunk('notifications/load', async (userId) => api.fetchNotifications(userId))

export const markAllRead = createAsyncThunk('notifications/markAllRead', async (userId) => {
  await api.markNotificationsRead(userId)
  return true
})

export const markOneRead = createAsyncThunk('notifications/markOneRead', async ({ userId, id }) => {
  await api.markNotificationsRead(userId, { id })
  return id
})

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    notificationReceived(state, action) {
      state.items.unshift(action.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => { state.status = 'loading' })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(loadNotifications.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(markAllRead.fulfilled, (state) => {
        state.items.forEach((n) => { n.read = true })
      })
      .addCase(markOneRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n.id === action.payload)
        if (item) item.read = true
      })
  },
})

export const { notificationReceived } = notificationsSlice.actions
export default notificationsSlice.reducer

// @ts-nocheck
