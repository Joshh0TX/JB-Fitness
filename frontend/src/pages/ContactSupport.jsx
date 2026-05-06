import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ContactSupport.css'

const SUPPORT_ITEMS = [
  {
    title: 'Email Support',
    content: 'jbfitness.app@gmail.com',
    desc: 'Get a response within 24 hours',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  }
]

function ContactSupport() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('appPreferences') || '{}')
      setTheme(prefs.theme || 'light')
    } catch { setTheme('light') }
  }, [])

  return (
    <div className="support-page" data-theme={theme}>
      {/* --- MATURED HEADER --- */}
      <header className="support-header">
        <button className="icon-btn-back" onClick={() => navigate('/settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">Support</h1>
      </header>

      <main className="support-main">
        <div className="support-intro">
          <h2>Get in Touch</h2>
          <p>Have a question or feedback? Our team is here to help you stay on track.</p>
        </div>

        <div className="support-grid">
          {SUPPORT_ITEMS.map((item, index) => (
            <a key={index} href={`mailto:${item.content}`} className="support-action-card">
              <div className="support-icon-box">
                {item.icon}
              </div>
              <div className="support-text">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span className="support-link-text">{item.content}</span>
              </div>
              <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          ))}
        </div>

        <div className="support-social-note">
          <p>Follow us for tips and updates</p>
          <div className="social-placeholder">JBFitness Community</div>
        </div>

        <div className="settings-bottom-spacer"></div>
      </main>
    </div>
  )
}

export default ContactSupport