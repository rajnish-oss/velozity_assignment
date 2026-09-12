import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import * as api from '../../api/client'

export const loginUser = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res =  await api.login({ email, password })

    if(!res){
      return rejectWithValue("No login response")
    }

    const accessToken = res.accessToken
    localStorage.setItem('accessToken',accessToken)

    return res;
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const restoreSession = createAsyncThunk('auth/refresh', async (_, { rejectWithValue }) => {
  try {
    const res =  await api.refreshSession()

    if(!res){
      return rejectWithValue("No login response")
    }

    const accessToken = res.accessToken
    localStorage.setItem('accessToken',accessToken)

    return res;
  } catch (err) {
    return rejectWithValue(err.message)
  }
})

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await api.logout()
  return true
})

const initialState = {
  user: null,
  status: 'idle', // idle | loading | succeeded | failed
  bootstrapping: true,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.user = action.payload.user
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Login failed.'
      })
      .addCase(restoreSession.pending, (state) => {
        state.bootstrapping = true
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.bootstrapping = false
      })
      .addCase(restoreSession.rejected, (state) => {
        state.bootstrapping = false
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null
        state.status = 'idle'
      })
  },
})

export default authSlice.reducer

// @ts-nocheck
