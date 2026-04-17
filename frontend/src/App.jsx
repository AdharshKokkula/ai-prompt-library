import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import PromptList from './pages/PromptList'
import PromptDetail from './pages/PromptDetail'
import AddPrompt from './pages/AddPrompt'
import Login from './pages/Login'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/prompts" replace />} />
              <Route path="/prompts" element={<PromptList />} />
              <Route path="/prompts/:id" element={<PromptDetail />} />
              <Route path="/add" element={<AddPrompt />} />
              <Route path="/login" element={<Login />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}
