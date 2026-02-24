import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import SettingsIcon from '../components/SettingsIcon'
import Logo from '../components/Logo'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const [user, setUser] = useState({ username: 'User', email: 'user@example.com' })
  const [userInitials, setUserInitials] = useState('JD')

  // 🔹 Fetch user data from localStorage on component load
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const username = userData.username || userData.name || 'User'
        setUser({
          username: username,
          email: userData.email || 'user@example.com'
        })
        
        // Calculate initials from username
        const initials = username
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || 'JD')
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error)
    }
  }, [])

  const accountItems = [
    { iconType: 'person', label: 'Personal Information', path: '/personal-info' },
    { iconType: 'lock', label: 'Privacy & Security', path: '/privacy' },
    { iconType: 'shield', label: 'Two-Factor Authentication', status: 'Enabled', path: '/two-factor-auth' },
    { iconType: 'settings', label: 'App Preferences', path: '/app-preferences' }
  ]

  const paymentItems = [
    { iconType: 'document', label: 'Billing History' },
    { iconType: 'download', label: 'Download Receipts' }
  ]

  const helpItems = [
    { iconType: 'question', label: 'Frequently Asked Questions' },
    { iconType: 'headset', label: 'Contact Support' },
    { iconType: 'book', label: 'User Guide' },
    { iconType: 'forum', label: 'Community Forum' },
    { iconType: 'info', label: 'About JBFitness' }
  ]

  const handleItemClick = (path) => {
    if (path) {
      navigate(path)
    }
  }

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      navigate('/login')
    }
  }

  return (
    <div className="settings-page page-animate">
      {/* Header */}
      <header className="settings-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="settings-title">Settings</h1>
      </header>

      {/* Main Content */}
      <main className="settings-main">
        {/* Account Section */}
        <div className="settings-card">
          <h2 className="card-title">Account</h2>
          <div className="profile-section">
            <div className="profile-avatar">
              <span className="avatar-initials">{userInitials}</span>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{user.username}</h3>
              <p className="profile-email">{user.email}</p>
              <a href="#edit" className="edit-profile-link">Edit Profile</a>
            </div>
          </div>
          <div className="settings-list">
            {accountItems.map((item, index) => (
              <div
                key={index}
                className="settings-item"
                onClick={() => handleItemClick(item.path)}
              >
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  {item.status && <span className="item-status">{item.status}</span>}
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Section */}
        <div className="settings-card">
          <h2 className="card-title">Payments</h2>
          <div className="current-plan-section">
            <div className="plan-header">
              <h3 className="plan-subtitle">Current Plan</h3>
              <span className="plan-badge">Active</span>
            </div>
            <div className="plan-details">
              <p className="plan-name">Premium Monthly</p>
              <p className="plan-price">$9.99/month</p>
              <p className="plan-renewal">Renews Dec 15, 2024</p>
              <a href="#change" className="change-plan-link">Change Plan</a>
            </div>
          </div>
          <div className="payment-methods-section">
            <div className="payment-methods-header">
              <SettingsIcon type="card" />
              <span className="payment-label">Payment Methods</span>
            </div>
            <div className="payment-card-info">
              <span className="card-number">**** 4242</span>
            </div>
          </div>
          <div className="settings-list">
            {paymentItems.map((item, index) => (
              <div key={index} className="settings-item">
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="settings-card">
          <h2 className="card-title">Help & Support</h2>
          <div className="settings-list">
            {helpItems.map((item, index) => (
              <div key={index} className="settings-item">
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="settings-footer">
        <span className="version">Version 2.4.1</span>
        <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
      </footer>
    </div>
  )
}

export default Settings


