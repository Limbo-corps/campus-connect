import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

const api = axios.create({ 
  baseURL: BASE_URL,
  withCredentials: true
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        // Send a post request with withCredentials: true to send the HttpOnly refresh cookie
        const { data } = await axios.post(`${BASE_URL}/auth/refresh/`, {}, { withCredentials: true })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export async function googleLogin(accessToken: string) {
  const { data } = await api.post<{ access: string }>('/auth/google/', { access_token: accessToken })
  return data
}

export default api

