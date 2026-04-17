import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/prompts" className="nav-brand">
          <span className="brand-icon">✦</span>
          AI Prompt Library
        </Link>

        <div className="nav-links">
          <Link
            to="/prompts"
            className={`nav-link ${pathname === '/prompts' ? 'active' : ''}`}
          >
            Browse
          </Link>

          {user ? (
            <>
              <Link to="/add" className="nav-link cta">
                + New Prompt
              </Link>
              <div className="nav-user">
                <span className="nav-username">👤 {user.username}</span>
                <button className="btn-logout" onClick={logout}>
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-link cta">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
