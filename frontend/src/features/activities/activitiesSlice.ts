import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/client'

export const loadActivities = createAsyncThunk('activities/load', async () => api.fetchActivities())

const activitiesSlice = createSlice({
  name: 'activities',
  initialState: { items: [], status: 'idle', error: null },
  reducers: {
    activityReceived(state, action) {
      if (state.items.some((activity) => activity.id === action.payload.id)) return
      state.items.unshift(action.payload)
      if (state.items.length > 50) state.items.pop()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadActivities.pending, (state) => { state.status = 'loading' })
      .addCase(loadActivities.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(loadActivities.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })
  },
})

export const { activityReceived } = activitiesSlice.actions
export default activitiesSlice.reducer

// @ts-nocheck
