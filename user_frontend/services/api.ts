import axios from 'axios'
import AppConfig from '@/appConfig'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || AppConfig.API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Public endpoints that don't require auth
const publicEndpoints = ['contact', 'page/']

// Helper to check if endpoint is public
const isPublicEndpoint = (url: string): boolean => {
  return publicEndpoints.some(endpoint => url.startsWith(endpoint))
}

// Request interceptor — add auth token and API key if exists
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const auth_token = localStorage.getItem('auth_token')
    
    // Add API key for non-public endpoints
    if (!isPublicEndpoint(config.url || '')) {
      config.headers['x-api-key'] = AppConfig.API_KEY
      
      // Add auth token for non-public endpoints
      if (auth_token) {
        config.headers['x-auth-token'] = auth_token
      }
    } else if (config.url === 'contact' && auth_token) {
      // Send auth token for contact endpoint to get user_id
      config.headers['x-auth-token'] = auth_token
    }
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
      }
    }
    return Promise.reject(error)
  }
)

export default api
