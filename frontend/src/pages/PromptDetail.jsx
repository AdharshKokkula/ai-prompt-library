import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { promptsApi } from '../api/client'

function ComplexityBar({ value }) {
  return (
    <div className="complexity-bar-wrap">
      <label>Complexity — {value} / 10</label>
      <div className="complexity-track">
        <div className="complexity-fill" style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  )
}

export default function PromptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    promptsApi.get(id)
      .then(r => setPrompt(r.data))
      .catch(e => setError(e.response?.status === 404 ? 'Prompt not found.' : 'Failed to load prompt.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>

  if (error) return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate('/prompts')}>← Back</button>
      <div className="alert error">⚠ {error}</div>
    </div>
  )

  const date = new Date(prompt.created_at).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="page detail-page">
      <button className="back-btn" onClick={() => navigate('/prompts')}>← Back to Library</button>

      <div className="detail-header">
        <h1 className="detail-title">{prompt.title}</h1>
        <div className="detail-meta">
          <span className="detail-date">📅 {date}</span>

          <div className="view-counter">
            👁 Views{' '}
            <span key={prompt.view_count} className="view-count-num">
              {prompt.view_count}
            </span>
          </div>
        </div>

        {prompt.tags.length > 0 && (
          <div className="card-tags" style={{ marginBottom: 0 }}>
            {prompt.tags.map(t => (
              <span key={t} className="tag-badge">#{t}</span>
            ))}
          </div>
        )}
      </div>

      <div className="content-box">{prompt.content}</div>

      <ComplexityBar value={prompt.complexity} />
    </div>
  )
}
