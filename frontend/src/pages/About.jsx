import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
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
      const prefs = JSON.parse(localStorage.getItem('appPreferences') || '{}')
      setTheme(prefs.theme || 'light')
    } catch { setTheme('light') }
  }, [])

  return (
    <div className="about-page" data-theme={theme}>
      {/* --- CLEAN CORPORATE HEADER --- */}
      <header className="about-header">
        <button className="icon-btn-back" onClick={handleBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">About JBFitness</h1>
      </header>

      <main className="about-main">
        {/* --- BRANDING --- */}
        <section className="about-hero">

          <h2 className="brand-name">JBFitness</h2>
          <p className="version-tag">Version 1.2 Build 2026</p>
        </section>

        {/* --- SYSTEM OVERVIEW --- */}
        <section className="about-card">
          <h3 className="about-section-label">Product Overview</h3>
          <p className="about-text">
            JBFitness is a high-performance wellness tracking ecosystem. 
            The platform provides a centralized interface for multi-dimensional 
            health monitoring, utilizing real-time data processing to synchronize 
            nutritional intake and physical activity.
          </p>
        </section>

        {/* --- DATA & SECURITY --- */}
        <section className="about-card">
          <h3 className="about-section-label">Infrastructure & Security</h3>
          <p className="about-text-small">
            Built on a full-stack JavaScript architecture, JBFitness employs 
            industry-standard encryption and secure token-based authentication 
            to ensure absolute data integrity and user privacy.
          </p>
        </section>

        {/* --- CORPORATE FOOTER --- */}
        <section className="about-card">
          <h3 className="about-section-label">Enterprise Information</h3>
          <p className="about-text-small">
            © 2026 JBFitness Engineering. All rights reserved. 
            Unauthorized reproduction or distribution of this software is 
            strictly prohibited under international intellectual property laws.
          </p>
        </section>
        
        <div className="settings-bottom-spacer"></div>
      </main>
    </div>
  )
}

export default About