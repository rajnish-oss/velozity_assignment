import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/client'

export const loadTasks = createAsyncThunk('tasks/load', async () => api.fetchTasks())

export const addTask = createAsyncThunk('tasks/create', async (payload) => api.createTask(payload))

export const editTask = createAsyncThunk('tasks/update', async ({ id, patch }) => api.updateTask(id, patch))

export const removeTask = createAsyncThunk('tasks/delete', async (id) => {
  await api.deleteTask(id)
  return id
})

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    taskStatusChangedFromSocket(state, action) {
      const idx = state.items.findIndex((t) => t.id === action.payload.id)
      if (idx !== -1) state.items[idx] = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadTasks.pending, (state) => { state.status = 'loading' })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(addTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(editTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t.id !== action.payload)
      })
  },
})

export const { taskStatusChangedFromSocket } = tasksSlice.actions
export default tasksSlice.reducer

// @ts-nocheck
