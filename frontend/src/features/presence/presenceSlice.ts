import { createSlice } from '@reduxjs/toolkit'

const presenceSlice = createSlice({
  name: 'presence',
  initialState: { onlineCount: 0, connectionStatus: 'connecting' }, // connecting | open | closed
  reducers: {
    presenceUpdated(state, action) {
      // `onlineConnectionCount` was emitted by older backend versions. Accept
      // it during a rolling restart, while the current socket contract uses
      // `onlineCount` to match this state field.
      state.onlineCount = action.payload.onlineCount ?? action.payload.onlineConnectionCount ?? 0
    },
    connectionStatusChanged(state, action) {
      state.connectionStatus = action.payload
    },
  },
})

export const { presenceUpdated, connectionStatusChanged } = presenceSlice.actions
export default presenceSlice.reducer

// @ts-nocheck
