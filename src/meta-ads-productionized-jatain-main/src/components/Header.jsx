import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Header({ title }) {
  const { currentUser } = useAuth()
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <header className="top-header">
      <h1>{title}</h1>
      <div className="header-actions">
        <button
          id="themeToggle"
          className="theme-toggle"
          onClick={toggleTheme}
          title="Toggle Theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <div className="user-info">
          <span>👤 {currentUser?.email?.split('@')[0] || 'User'}</span>
        </div>
      </div>
    </header>
  )
}
