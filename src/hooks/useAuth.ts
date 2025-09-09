import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setUser, setLoading, setError, clearUser,  } from '@/store/slices/authSlice'
import { authAPI } from '@/services/api'

export const useAuth = () => {
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  )

  // Check if user is authenticated on app load (session-based auth)
  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check for OAuth errors in URL
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')

      if (error) {
        console.error('OAuth error:', error)
        dispatch(setError('Authentication failed'))
        dispatch(setLoading(false))
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname)
        return
      }

      // Only check auth if we're not already authenticated and not loading
      if (!isAuthenticated && !isLoading) {
        try {
          dispatch(setLoading(true))
          const userData = await authAPI.checkAuth()
          dispatch(setUser(userData))
        } catch (err) {
          console.log('User not authenticated (session-based)')
          // This is normal for session-based auth when not logged in
        } finally {
          dispatch(setLoading(false))
        }
      }
    }

    checkAuthStatus()
  }, []) // Remove isAuthenticated from dependencies to avoid circular dependency

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      dispatch(clearUser())
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    logout,
  }
} 