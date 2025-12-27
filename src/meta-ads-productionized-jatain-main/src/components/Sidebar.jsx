import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Sidebar() {
  const { logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <nav className="sidebar">
      <div className="logo">
        <h2>⚡ AdVantage</h2>
      </div>

      <ul className="nav-links">
        <li>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            📊 Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
            📈 Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/campaign" className={({ isActive }) => isActive ? 'active' : ''}>
            🎯 Create Campaign
          </NavLink>
        </li>
        <li>
          <NavLink to="/campaign-generator" className={({ isActive }) => isActive ? 'active' : ''}>
            🤖 AI Campaign Generator
          </NavLink>
        </li>
      </ul>

      <div className="nav-footer">
        <NavLink to="/connect-meta" className="connect-meta-btn">
          🔌 Connect Meta Account
        </NavLink>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Logout
        </button>
      </div>
    </nav>
  )
}
