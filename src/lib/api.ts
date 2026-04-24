import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://kaapilibre-admin-panel-backend.onrender.com/api/v1'

// Token helpers — localStorage only runs in browser
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('kl_admin_token')
}

export const setToken = (token: string): void => {
  if (typeof window !== 'undefined') localStorage.setItem('kl_admin_token', token)
}

export const removeToken = (): void => {
  if (typeof window !== 'undefined') localStorage.removeItem('kl_admin_token')
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,          // no cookies — use Bearer token instead
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — unwrap envelope + handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const message =
      error.response?.data?.message ||
      (error.code === 'ERR_NETWORK' ? 'Cannot reach server — is the backend running on port 5000?' : error.message) ||
      'Something went wrong'

    if (status === 401) {
      removeToken()
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    if (status === 403) {
      if (typeof window !== 'undefined') {
        window.location.href = '/unauthorized'
      }
    }

    return Promise.reject(new Error(message))
  }
)

export const API_URL_BASE = API_URL
