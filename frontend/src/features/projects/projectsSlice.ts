import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/client'

export const loadProjects = createAsyncThunk('projects/load', async () => api.fetchProjects())

export const addProject = createAsyncThunk('projects/create', async (payload) => api.createProject(payload))

export const editProject = createAsyncThunk('projects/update', async ({ id, patch }) => api.updateProject(id, patch))

export const removeProject = createAsyncThunk('projects/delete', async (id) => {
  await api.deleteProject(id)
  return id
})

const projectsSlice = createSlice({
  name: 'projects',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadProjects.pending, (state) => { state.status = 'loading' })
      .addCase(loadProjects.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(loadProjects.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
      .addCase(addProject.fulfilled, (state, action) => {
        state.items.unshift(action.payload)
      })
      .addCase(editProject.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(removeProject.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload)
      })
  },
})

export default projectsSlice.reducer

// @ts-nocheck
