import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AppPreferences.css'

function AppPreferences() {
  const navigate = useNavigate()
  const [preferences, setPreferences] = useState({
    theme: 'light',
    colorScheme: 'green',
    notifications: true,
    emailUpdates: false,
    fontSize: 'medium',
    language: 'en'
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
  }

  const handleThemeChange = (theme) => {
    setPreferences({ ...preferences, theme })
    applyTheme(theme)
    savePreferences({ ...preferences, theme })
  }

  const handleColorSchemeChange = (colorScheme) => {
    setPreferences({ ...preferences, colorScheme })
    savePreferences({ ...preferences, colorScheme })
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

          <div className="theme-selector">
            <div className="theme-option">
              <input
                type="radio"
                id="light-theme"
                name="theme"
                value="light"
                checked={preferences.theme === 'light'}
                onChange={() => handleThemeChange('light')}
              />
              <label htmlFor="light-theme" className="theme-label light">
                <div className="theme-preview light-preview">☀️</div>
                <span>Light Mode</span>
                {preferences.theme === 'light' && (
                  <span className="selected-badge">✓ Selected</span>
                )}
              </label>
            </div>

            <div className="theme-option">
              <input
                type="radio"
                id="dark-theme"
                name="theme"
                value="dark"
                checked={preferences.theme === 'dark'}
                onChange={() => handleThemeChange('dark')}
              />
              <label htmlFor="dark-theme" className="theme-label dark">
                <div className="theme-preview dark-preview">🌙</div>
                <span>Dark Mode</span>
                {preferences.theme === 'dark' && (
                  <span className="selected-badge">✓ Selected</span>
                )}
              </label>
            </div>

            <div className="theme-option">
              <input
                type="radio"
                id="auto-theme"
                name="theme"
                value="auto"
                checked={preferences.theme === 'auto'}
                onChange={() => handleThemeChange('auto')}
              />
              <label htmlFor="auto-theme" className="theme-label auto">
                <div className="theme-preview auto-preview">🔄</div>
                <span>Auto (System)</span>
                {preferences.theme === 'auto' && (
                  <span className="selected-badge">✓ Selected</span>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Color Scheme Selection */}
        <div className="prefs-card">
          <h2 className="card-title">🎨 Color Scheme</h2>
          <p className="card-description">
            Select your preferred color theme
          </p>

          <div className="color-selector">
            {[
              { id: 'green', name: 'Green', colors: ['#66bb6a', '#4caf50', '#2e7d32'] },
              { id: 'blue', name: 'Ocean Blue', colors: ['#5c9cff', '#4285f4', '#1f6dd9'] },
              { id: 'purple', name: 'Purple', colors: ['#b39ddb', '#9575cd', '#6a4c93'] },
              { id: 'orange', name: 'Orange', colors: ['#ffb74d', '#ff9800', '#d97e05'] },
              { id: 'pink', name: 'Rose Pink', colors: ['#f06292', '#ec407a', '#c2185b'] },
              { id: 'teal', name: 'Teal', colors: ['#4db6ac', '#26a69a', '#00897b'] }
            ].map((scheme) => (
              <div key={scheme.id} className="color-option">
                <input
                  type="radio"
                  id={`color-${scheme.id}`}
                  name="colorScheme"
                  value={scheme.id}
                  checked={preferences.colorScheme === scheme.id}
                  onChange={() => handleColorSchemeChange(scheme.id)}
                />
                <label
                  htmlFor={`color-${scheme.id}`}
                  className="color-label"
                >
                  <div className="color-preview">
                    {scheme.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="color-dot"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span>{scheme.name}</span>
                  {preferences.colorScheme === scheme.id && (
                    <span className="selected-badge">✓</span>
                  )}
                </label>
              </div>
            ))}
          </div>

          <p className="color-note">
            💡 Colors will be updated soon. This is a preview of available options.
          </p>
        </div>

        {/* Display Settings */}
        <div className="prefs-card">
          <h2 className="card-title">📱 Display</h2>
          <p className="card-description">
            Adjust how content is displayed
          </p>

          <div className="preference-item">
            <label htmlFor="fontSize" className="pref-label">
              Font Size
            </label>
            <select
              id="fontSize"
              value={preferences.fontSize}
              onChange={(e) => handlePreferenceChange('fontSize', e.target.value)}
              className="pref-select"
            >
              <option value="small">Small</option>
              <option value="medium">Medium (Default)</option>
              <option value="large">Large</option>
              <option value="extra-large">Extra Large</option>
            </select>
          </div>

          <div className="preference-item">
            <label htmlFor="language" className="pref-label">
              Language
            </label>
            <select
              id="language"
              value={preferences.language}
              onChange={(e) => handlePreferenceChange('language', e.target.value)}
              className="pref-select"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
            </select>
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

        {/* About */}
        <div className="prefs-card info-card">
          <h2 className="card-title">ℹ️ About</h2>
          <div className="about-content">
            <p>
              <strong>JBFitness</strong>
            </p>
            <p>Version: 2.4.1</p>
            <p>© 2024 JBFitness. All rights reserved.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AppPreferences
