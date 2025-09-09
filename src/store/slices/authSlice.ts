import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role?: 'user' | 'admin' | 'superadmin'
  title?: string
  function?: string
  onboardingComplete?: boolean
  lastSynced?: string
  organization?: {
    id: string
    name: string
    emailDomain: string
    verified: boolean
    allowModelChange: boolean
  }
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      state.isAuthenticated = true
      state.error = null
    },
    clearUser: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.error = null
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setLoading, setUser, clearUser, setError, clearError } = authSlice.actions
export default authSlice.reducer 