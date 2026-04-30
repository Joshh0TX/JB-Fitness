import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ContactSupport.css'

const SUPPORT_ITEMS = [
  {
    title: 'Email Support',
    content: 'jbfitness.app@gmail.com',
    type: 'email'
  }
]

function ContactSupport() {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)
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

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  return (
    <div className="contact-support-page page-animate" data-theme={theme}>
      <header className="contact-support-header">
        <button className="back-button" onClick={() => navigate('/settings')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">Contact Support</h1>
      </header>

      <main className="contact-support-main">
        <div className="contact-accordion">
          {SUPPORT_ITEMS.map((item, index) => {
            const id = `contact-${index}`
            const isOpen = openId === id
            return (
              <div key={id} className="contact-item">
                <button
                  className={`contact-question ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleItem(id)}
                  aria-expanded={isOpen}
                >
                  <span className="contact-question-text">{item.title}</span>
                  <span className="contact-chevron">{isOpen ? '▼' : '▶'}</span>
                </button>
                <div className={`contact-answer-wrapper ${isOpen ? 'open' : ''}`}>
                  <div className="contact-answer">
                    {item.type === 'email' ? (
                      <a href={`mailto:${item.content}`} className="contact-email-link">
                        {item.content}
                      </a>
                    ) : (
                      item.content
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default ContactSupport
