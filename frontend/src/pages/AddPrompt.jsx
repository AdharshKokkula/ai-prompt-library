import { useState, useRef, KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { promptsApi } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const COMPLEXITY_LABELS = {
  1: 'Minimal', 2: 'Simple', 3: 'Easy',
  4: 'Moderate', 5: 'Balanced', 6: 'Intermediate',
  7: 'Complex', 8: 'Advanced', 9: 'Expert', 10: 'Master',
}

export default function AddPrompt() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const tagInputRef = useRef(null)

  const [form, setForm] = useState({ title: '', content: '', complexity: 5 })
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="page form-page">
        <div className="form-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🔒</div>
          <h2 className="form-title">Login Required</h2>
          <p className="form-subtitle">You must be logged in to add prompts.</p>
          <button className="btn-primary" onClick={() => navigate('/login')} style={{ maxWidth: 200, margin: '0 auto' }}>
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  const validate = () => {
    const e = {}
    if (form.title.trim().length < 3) e.title = 'Title must be at least 3 characters.'
    if (form.content.trim().length < 20) e.content = 'Content must be at least 20 characters.'
    if (form.complexity < 1 || form.complexity > 10) e.complexity = 'Complexity must be 1–10.'
    return e
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-')
    if (t && !tags.includes(t) && tags.length < 8) {
      setTags(prev => [...prev, t])
      setTagInput('')
    }
  }

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag))

  const handleTagKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
    if (e.key === 'Backspace' && !tagInput && tags.length) {
      setTags(prev => prev.slice(0, -1))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSubmitting(true)
    setApiError('')
    try {
      const payload = { ...form, complexity: Number(form.complexity), tags }
      const { data } = await promptsApi.create(payload)
      navigate(`/prompts/${data.id}`)
    } catch (err) {
      const serverErrors = err.response?.data?.errors
      if (serverErrors) setErrors(serverErrors)
      else setApiError(err.response?.data?.error || 'Failed to create prompt.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBlur = (field) => {
    const errs = validate()
    setErrors(prev => ({ ...prev, [field]: errs[field] }))
  }

  return (
    <div className="page form-page">
      <div className="form-card">
        <h1 className="form-title">New Prompt ✦</h1>
        <p className="form-subtitle">Craft a prompt for the library. All fields are required.</p>

        {apiError && <div className="alert error">⚠ {apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              className={`input ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Cyberpunk City Rain"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              onBlur={() => handleBlur('title')}
            />
            {errors.title && <div className="field-error">⚠ {errors.title}</div>}
          </div>

          {/* Content */}
          <div className="field">
            <label htmlFor="content">Prompt Content</label>
            <p className="field-hint">Write the full image generation prompt (min 20 characters)</p>
            <textarea
              id="content"
              className={`textarea ${errors.content ? 'error' : ''}`}
              placeholder="A cinematic shot of a neon-lit cyberpunk city at night, rain-soaked streets reflecting colorful holograms..."
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              onBlur={() => handleBlur('content')}
              rows={5}
            />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {errors.content
                ? <div className="field-error">⚠ {errors.content}</div>
                : <span />}
              <span className="field-hint">{form.content.length} chars</span>
            </div>
          </div>

          {/* Complexity */}
          <div className="field">
            <label>Complexity</label>
            <div className="complexity-display">{form.complexity}</div>
            <p className="field-hint" style={{ textAlign:'center', marginBottom: 10 }}>
              {COMPLEXITY_LABELS[form.complexity]}
            </p>
            <input
              type="range" min="1" max="10" step="1"
              className="slider"
              value={form.complexity}
              onChange={e => setForm(p => ({ ...p, complexity: Number(e.target.value) }))}
            />
            <div className="slider-labels"><span>1 — Minimal</span><span>10 — Master</span></div>
            {errors.complexity && <div className="field-error">⚠ {errors.complexity}</div>}
          </div>

          {/* Tags */}
          <div className="field">
            <label>Tags <span style={{ color:'var(--text-3)', fontWeight:400 }}>(optional)</span></label>
            <div className="tags-input-wrap" onClick={() => tagInputRef.current?.focus()}>
              {tags.map(t => (
                <span key={t} className="tag-chip">
                  #{t}
                  <button type="button" onClick={() => removeTag(t)}>×</button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                className="tag-chip-input"
                placeholder={tags.length < 8 ? 'Add tag, press Enter…' : ''}
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKey}
                onBlur={addTag}
                disabled={tags.length >= 8}
              />
            </div>
            <p className="field-hint">Press Enter or comma to add. Max 8 tags.</p>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Prompt →'}
          </button>
        </form>
      </div>
    </div>
  )
}
