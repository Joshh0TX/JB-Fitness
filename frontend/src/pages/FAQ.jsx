import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api.js'
import './FAQ.css'

const FALLBACK_FAQ = [
  {
    category: 'For Beginners',
    items: [
      { question: 'How do I know how many calories I should eat each day?', answer: 'Most adults need between 1,800–2,500 calories per day. JBFitness uses 2,200 as a default—you can adjust this in settings.' },
      { question: "What's the difference between calories consumed and burned?", answer: 'Consumed = what you eat. Burned = what you use via activity. Balance is key to your goal.' },
      { question: "I'm new—where should I start?", answer: 'Start with 2–3 low-impact sessions per week. The Workouts tab helps you log and track progress easily.' }
    ]
  },
  {
    category: 'App Usage',
    items: [
      { question: 'How do I add a workout?', answer: 'Go to Workouts, search for an exercise, enter reps/duration, and tap Log.' },
      { question: 'Is my data private?', answer: 'Yes. We use industry-standard encryption to protect your health data.' }
    ]
  }
];

function FAQ() {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)
  const [theme, setTheme] = useState('light')
  const [faqData, setFaqData] = useState(FALLBACK_FAQ)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const prefs = JSON.parse(localStorage.getItem('appPreferences') || '{}')
      setTheme(prefs.theme || 'light')
    } catch { setTheme('light') }
  }, [])

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const res = await API.get('/api/faq')
        if (Array.isArray(res.data) && res.data.length > 0) setFaqData(res.data)
      } catch (err) { console.error('Using fallback FAQ') }
      finally { setLoading(false) }
    }
    fetchFaq()
  }, [])

  const toggleItem = (id) => setOpenId(prev => (prev === id ? null : id))

  return (
    <div className="faq-page" data-theme={theme}>
      {/* --- MATURED HEADER --- */}
      <header className="faq-header">
        <button className="icon-btn-back" onClick={() => navigate('/settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">Help Center</h1>
      </header>

      <main className="faq-main">
        <div className="faq-intro">
          <h2>How can we help?</h2>
          <p>Find answers to common questions about JBFitness.</p>
        </div>

        {loading ? (
          <div className="faq-loading">Loading FAQs...</div>
        ) : (
          faqData.map((section, sIdx) => (
            <section key={sIdx} className="faq-section">
              <h3 className="faq-category-title">{section.category}</h3>
              <div className="faq-list">
                {section.items.map((item, iIdx) => {
                  const id = `faq-${sIdx}-${iIdx}`;
                  const isOpen = openId === id;
                  return (
                    <div key={id} className={`faq-card ${isOpen ? 'is-open' : ''}`}>
                      <button className="faq-trigger" onClick={() => toggleItem(id)}>
                        <span>{item.question}</span>
                        <svg className="faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="6 9 12 15 18 9" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <div className="faq-content">
                        <div className="faq-text">{item.answer}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
        <div className="settings-bottom-spacer"></div>
      </main>
    </div>
  )
}

export default FAQ;