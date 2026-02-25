import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AppPreferences.css'

function AppPreferences() {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState({
    theme: 'light',
    notifications: true,
    emailUpdates: false
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    try {
      const prefsStr = localStorage.getItem('appPreferences')
      if (prefsStr) {
        const loadedPrefs = JSON.parse(prefsStr)
        setPreferences(loadedPrefs)
        applyTheme(loadedPrefs.theme)
      } else {
        // Apply light theme by default if no preferences saved
        applyTheme('light')
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      applyTheme('light')
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    // Also apply to body for broader compatibility
    document.body.setAttribute('data-theme', theme)
  }

  const handleThemeChange = (theme) => {
    setPreferences({ ...preferences, theme })
    applyTheme(theme)
    savePreferences({ ...preferences, theme })
  }

  const handlePreferenceChange = (key, value) => {
    const updatedPrefs = { ...preferences, [key]: value }
    setPreferences(updatedPrefs)
    savePreferences(updatedPrefs)
  }

  const savePreferences = (prefs) => {
    try {
      localStorage.setItem('appPreferences', JSON.stringify(prefs))
      setMessage('Preferences saved!')
      setMessageType('success')
      setTimeout(() => setMessage(''), 2000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setMessage('Failed to save preferences')
      setMessageType('error')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  return (
    <div className="app-preferences-page page-animate" data-theme={preferences.theme}>
      <header className="prefs-header">
        <button
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">App Preferences</h1>
      </header>

      <main className="prefs-main">
        {message && (
          <div className={`message-alert ${messageType}`}>
            {message}
          </div>
        )}

        {/* Theme Selection */}
        <div className="prefs-card">
          <h2 className="card-title">🌅 Theme</h2>
          <p className="card-description">
            Choose your preferred theme for the application
          </p>

          <div className="toggle-item">
            <label htmlFor="dark-mode" className="toggle-label">
              <span className="toggle-text">Dark Mode</span>
              <span className="toggle-description">
                Toggle on for dark mode, off for light mode
              </span>
            </label>
            <input
              type="checkbox"
              id="dark-mode"
              checked={preferences.theme === 'dark'}
              onChange={(e) => handleThemeChange(e.target.checked ? 'dark' : 'light')}
              className="toggle-checkbox"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="prefs-card">
          <h2 className="card-title">🔔 Notifications</h2>
          <p className="card-description">
            Manage how you receive notifications
          </p>

          <div className="toggle-item">
            <label htmlFor="push-notifications" className="toggle-label">
              <span className="toggle-text">Push Notifications</span>
              <span className="toggle-description">
                Get important alerts and updates
              </span>
            </label>
            <input
              type="checkbox"
              id="push-notifications"
              checked={preferences.notifications}
              onChange={(e) =>
                handlePreferenceChange('notifications', e.target.checked)
              }
              className="toggle-checkbox"
            />
          </div>

          <div className="toggle-item">
            <label htmlFor="email-updates" className="toggle-label">
              <span className="toggle-text">Email Updates</span>
              <span className="toggle-description">
                Receive weekly summaries and tips
              </span>
            </label>
            <input
              type="checkbox"
              id="email-updates"
              checked={preferences.emailUpdates}
              onChange={(e) =>
                handlePreferenceChange('emailUpdates', e.target.checked)
              }
              className="toggle-checkbox"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppPreferences
