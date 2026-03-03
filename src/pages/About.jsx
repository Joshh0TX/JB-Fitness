import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './About.css'

function About() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState('light')

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
        <button className="back-button" onClick={() => navigate('/settings')}>
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
