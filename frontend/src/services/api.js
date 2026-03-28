import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Get the auth storage and parse it
    const authStorage = localStorage.getItem('auth-storage')
    
    if (authStorage) {
      try {
        const authData = JSON.parse(authStorage)
        // The token is in authData.state.token based on your localStorage
        const token = authData?.state?.token
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('Token attached to request:', config.url)
        } else {
          console.log('No token found in auth storage')
        }
      } catch (error) {
        console.error('Error parsing auth storage:', error)
      }
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'An error occurred'
    
    if (error.response?.status === 401 || error.response?.status === 422) {
      // Only redirect to login if we're not already there
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        localStorage.removeItem('auth-storage')
        window.location.href = '/login'
        toast.error('Session expired. Please login again.')
      }
    } else if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.')
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

export default api