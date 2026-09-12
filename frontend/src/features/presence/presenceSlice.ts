import { createSlice } from '@reduxjs/toolkit'

const presenceSlice = createSlice({
  name: 'presence',
  initialState: { onlineCount: 0, connectionStatus: 'connecting' }, // connecting | open | closed
  reducers: {
    presenceUpdated(state, action) {
      state.onlineCount = action.payload.onlineCount
    },
    connectionStatusChanged(state, action) {
      state.connectionStatus = action.payload
    },
  },
})

export const { presenceUpdated, connectionStatusChanged } = presenceSlice.actions
export default presenceSlice.reducer

// @ts-nocheck
