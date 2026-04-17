import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { promptsApi, tagsApi } from '../api/client'

function ComplexityBadge({ value }) {
  const level = value <= 3 ? 'low' : value <= 6 ? 'mid' : 'high'
  const label = value <= 3 ? '🟢' : value <= 6 ? '🟡' : '🔴'
  return (
    <span className={`complexity-badge ${level}`}>
      {label} Level {value}
    </span>
  )
}

function PromptCard({ prompt, onClick }) {
  const date = new Date(prompt.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
  return (
    <div className="card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <h2 className="card-title">{prompt.title}</h2>
      <div className="card-meta">
        <ComplexityBadge value={prompt.complexity} />
        <span className="card-date">{date}</span>
      </div>
      {prompt.tags.length > 0 && (
        <div className="card-tags">
          {prompt.tags.map(t => (
            <span key={t} className="tag-badge">#{t}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function PromptList() {
  const navigate = useNavigate()
  const [prompts, setPrompts] = useState([])
  const [tags, setTags] = useState([])
  const [activeTag, setActiveTag] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    tagsApi.list().then(r => setTags(r.data.tags)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    promptsApi.list(activeTag)
      .then(r => setPrompts(r.data.prompts))
      .catch(() => setError('Failed to load prompts.'))
      .finally(() => setLoading(false))
  }, [activeTag])

  return (
    <>
      <section className="hero">
        <div className="hero-badge">✦ AI Image Generation</div>
        <h1>The Prompt <span className="gradient-text">Library</span></h1>
        <p>Discover and share hand-crafted prompts for stunning AI-generated imagery.</p>
      </section>

      {tags.length > 0 && (
        <div className="tag-bar">
          <button
            className={`tag-pill ${activeTag === '' ? 'active' : ''}`}
            onClick={() => setActiveTag('')}
          >
            All
          </button>
          {tags.map(tag => (
            <button
              key={tag}
              className={`tag-pill ${activeTag === tag ? 'active' : ''}`}
              onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="spinner-wrap"><div className="spinner" /></div>
      ) : error ? (
        <div className="page">
          <div className="alert error">⚠ {error}</div>
        </div>
      ) : prompts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No prompts found</h3>
          <p>{activeTag ? `No prompts tagged #${activeTag}` : 'Be the first to add a prompt!'}</p>
        </div>
      ) : (
        <div className="prompt-grid">
          {prompts.map(p => (
            <PromptCard
              key={p.id}
              prompt={p}
              onClick={() => navigate(`/prompts/${p.id}`)}
            />
          ))}
        </div>
      )}
    </>
  )
}
