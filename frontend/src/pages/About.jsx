import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './About.css'

function About() {
  const navigate = useNavigate()
  const location = useLocation()
  const [theme, setTheme] = useState('light')

  const fromPath = location.state?.from

  const handleBack = () => {
    if (typeof fromPath === 'string' && fromPath.startsWith('/')) {
      navigate(fromPath, { replace: true })
      return
    }

    const hasToken = Boolean(localStorage.getItem('token'))
    navigate(hasToken ? '/settings' : '/login', { replace: true })
  }

  useEffect(() => {
    try {
      const prefsStr = localStorage.getItem('appPreferences')
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr)
        setTheme(prefs.theme || 'light')
      }
    } catch {
      setTheme('light')
    }
  }, [])

  return (
    <div className="about-page page-animate" data-theme={theme}>
      <header className="about-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">About JBFitness</h1>
      </header>

      <main className="about-main">
        <div className="about-card">
          <p className="about-text">
            JB Fitness is an intelligent, web-based fitness and wellness tracking platform
            designed to help users monitor workouts, nutrition, and health metrics in one
            centralized system.
          </p>
        </div>
      </main>
    </div>
  )
}

export default About
