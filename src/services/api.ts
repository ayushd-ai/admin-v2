import axios from 'axios'
import { BACKEND_API_URL } from '@/lib/constants'

// Create axios instance for session-based authentication
export const api = axios.create({
  baseURL: BACKEND_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Essential for session cookies
})

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // For session-based auth, just redirect to login
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  // Get current user info (for session-based auth)
  getCurrentUser: async () => {
    const response = await api.get('/auth/user')
    // Handle nested user structure
    return response.data.user || response.data
  },

  // Logout
  logout: async () => {
    const response = await api.get('/auth/logout')
    return response.data
  },

  // Check if user is authenticated (for session-based auth)
  checkAuth: async () => {
    try {
      const response = await api.get('/auth/user')
      // Handle nested user structure
      return response.data.user
    } catch (error) {
      throw error
    }
  },
} 