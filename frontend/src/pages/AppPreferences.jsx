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
        applyTheme('light')
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
      applyTheme('light')
    }
  }, [])

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    document.body.setAttribute('data-theme', theme)
  }

  const handleThemeChange = (theme) => {
    const updated = { ...preferences, theme }
    setPreferences(updated)
    applyTheme(theme)
    savePreferences(updated)
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
      setMessage('Failed to save preferences')
      setMessageType('error')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  return (
    <div className="app-preferences-page">
      {/* --- MATURED HEADER --- */}
      <header className="prefs-header">
        <button className="icon-btn-back" onClick={() => navigate('/settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">App Preferences</h1>
      </header>

      <main className="prefs-main">
        {message && (
          <div className={`message-alert ${messageType}`}>
            {message}
          </div>
        )}

        {/* --- THEME SECTION --- */}
        <section className="prefs-card">
          <h2 className="card-title">Appearance</h2>
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-text">Dark Mode</span>
              <span className="toggle-description">Switch between light and dark themes</span>
            </div>
            <div className="switch-wrapper">
              <input
                type="checkbox"
                id="dark-mode"
                checked={preferences.theme === 'dark'}
                onChange={(e) => handleThemeChange(e.target.checked ? 'dark' : 'light')}
                className="ios-switch"
              />
              <label htmlFor="dark-mode" className="switch-label"></label>
            </div>
          </div>
        </section>

        {/* --- NOTIFICATIONS SECTION --- */}
        <section className="prefs-card">
          <h2 className="card-title">Notifications</h2>
          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-text">Push Notifications</span>
              <span className="toggle-description">Get alerts for workouts and meals</span>
            </div>
            <div className="switch-wrapper">
              <input
                type="checkbox"
                id="push-notifications"
                checked={preferences.notifications}
                onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                className="ios-switch"
              />
              <label htmlFor="push-notifications" className="switch-label"></label>
            </div>
          </div>

          <div className="toggle-item">
            <div className="toggle-info">
              <span className="toggle-text">Email Updates</span>
              <span className="toggle-description">Weekly health summaries and tips</span>
            </div>
            <div className="switch-wrapper">
              <input
                type="checkbox"
                id="email-updates"
                checked={preferences.emailUpdates}
                onChange={(e) => handlePreferenceChange('emailUpdates', e.target.checked)}
                className="ios-switch"
              />
              <label htmlFor="email-updates" className="switch-label"></label>
            </div>
          </div>
        </section>

        <div className="settings-bottom-spacer"></div>
      </main>
    </div>
  )
}

export default AppPreferences