import axios from 'axios'

// In Docker/local: VITE_API_URL is unset → uses nginx proxy at /api
// On Render: VITE_API_URL = https://your-backend.onrender.com (no trailing slash)
const BASE = import.meta.env.VITE_API_URL ?? '/api'

const client = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const promptsApi = {
  list: (tag) => client.get('/prompts/', { params: tag ? { tag } : {} }),
  get:  (id)  => client.get(`/prompts/${id}/`),
  create: (data) => client.post('/prompts/', data),
}

export const tagsApi = {
  list: () => client.get('/prompts/tags/'),
}

export const authApi = {
  login:    (data) => client.post('/auth/login/', data),
  register: (data) => client.post('/auth/register/', data),
}

export default client
