import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [tab, setTab] = useState('login')
  const [form, setForm] = useState({ username: '', password: '', email: '' })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const e = {}
    if (form.username.length < 3) e.username = 'At least 3 characters required.'
    if (form.password.length < 8) e.password = 'At least 8 characters required.'
    return e
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    setApiError('')
    try {
      if (tab === 'login') {
        await login(form.username, form.password)
      } else {
        await register(form.username, form.password, form.email)
      }
      navigate('/prompts')
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setApiError(data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="logo-icon">✦</div>
          <h1>AI Prompt Library</h1>
          <p>{tab === 'login' ? 'Welcome back!' : 'Create your account'}</p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrors({}); setApiError('') }}
          >
            Login
          </button>
          <button
            className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => { setTab('register'); setErrors({}); setApiError('') }}
          >
            Register
          </button>
        </div>

        {apiError && <div className="alert error">⚠ {apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="auth-username">Username</label>
            <input
              id="auth-username"
              className={`input ${errors.username ? 'error' : ''}`}
              placeholder="your_username"
              value={form.username}
              onChange={set('username')}
              autoComplete="username"
            />
            {errors.username && <div className="field-error">⚠ {errors.username}</div>}
          </div>

          {tab === 'register' && (
            <div className="field">
              <label htmlFor="auth-email">Email <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(optional)</span></label>
              <input
                id="auth-email"
                type="email"
                className="input"
                placeholder="you@example.com"
                value={form.email}
                onChange={set('email')}
                autoComplete="email"
              />
            </div>
          )}

          <div className="field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              className={`input ${errors.password ? 'error' : ''}`}
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            />
            {errors.password && <div className="field-error">⚠ {errors.password}</div>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Please wait…' : tab === 'login' ? 'Login →' : 'Create Account →'}
          </button>
        </form>

        {tab === 'login' && (
          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-3)', fontSize: '.82rem' }}>
            Demo credentials: <strong style={{ color: 'var(--text-2)' }}>admin / admin123</strong>
          </p>
        )}
      </div>
    </div>
  )
}
