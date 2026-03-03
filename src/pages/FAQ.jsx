import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api.js'
import './FAQ.css'

const FALLBACK_FAQ = [
  {
    category: 'For Beginners',
    items: [
      {
        question: 'How do I know how many calories I should eat each day?',
        answer: 'A good starting point is to use an online calculator based on your age, weight, height, and activity level. Most adults need between 1,800–2,500 calories per day. JBFitness uses 2,200 as a default goal—you can adjust this in your settings as you learn what works for you.'
      },
      {
        question: "What's the difference between calories consumed and calories burned?",
        answer: 'Calories consumed are what you eat and drink. Calories burned are what your body uses through daily activity and exercise. To lose weight, you generally need to burn more than you consume. To gain weight or build muscle, you may need to consume more.'
      },
      {
        question: "How do I log a meal if I don't know the exact nutrition info?",
        answer: 'Use the search feature in the Nutrition tab to find similar foods. You can also estimate or enter a best guess—approximate tracking is often better than nothing. Over time, you can refine your estimates as you learn.'
      },
      {
        question: "I'm new to working out—where should I start?",
        answer: 'Start with simple, low-impact activities like walking, light jogging, or bodyweight exercises. Aim for 2–3 sessions per week and gradually increase. The Workouts tab lets you log any activity and track your progress.'
      },
      {
        question: 'How often should I work out to see results?',
        answer: 'Aim for at least 150 minutes of moderate activity per week (about 30 minutes, 5 days). For strength, 2–3 sessions per week is a good start. Consistency matters more than intensity when you first begin.'
      },
      {
        question: 'What are macros (protein, carbs, fats) and why do they matter?',
        answer: 'Macros are the three main nutrients: protein (muscle repair), carbs (energy), and fats (hormones, absorption). A balanced diet helps your body perform and recover. JBFitness uses goals like 200g protein, 300g carbs, and 100g fats—adjust based on your needs.'
      },
      {
        question: 'Is it okay to eat more on days I work out?',
        answer: 'Yes. Many people eat slightly more on workout days to fuel recovery. The key is to stay within your overall weekly goals. You can use the dashboard to see your daily totals and adjust as needed.'
      },
      {
        question: 'How do I set realistic goals for weight loss or muscle gain?',
        answer: 'For weight loss, aim for 0.5–1 lb per week. For muscle gain, aim for 0.25–0.5 lb per week. Set small, achievable goals and celebrate progress. Use the History and Dashboard tabs to track trends over time.'
      }
    ]
  },
  {
    category: 'General App Usage',
    items: [
      {
        question: 'How do I add a workout to my daily log?',
        answer: 'Go to the Workouts tab, search for your exercise, enter the duration or reps, and tap Add. The app will estimate calories burned and add it to your dashboard.'
      },
      {
        question: 'How do I search for and log food or meals?',
        answer: 'Open the Nutrition tab and use the search bar to find foods. Select the food, enter the serving size, and add it to your log. Your daily macros and calories will update on the dashboard.'
      },
      {
        question: 'Can I edit or delete a workout or meal after logging it?',
        answer: 'Yes. From the Workouts or Nutrition tab, find the item in your log and use the edit or delete option. Changes will reflect immediately on your dashboard.'
      },
      {
        question: 'How does the app calculate calories burned during exercise?',
        answer: 'Calories are estimated using formulas based on exercise type, duration, and intensity. For strength exercises, reps and weight may be used. The estimate is a starting point—individual results vary.'
      },
      {
        question: 'Where can I see my weekly progress and trends?',
        answer: 'The Dashboard shows your weekly calories burned from workouts and nutrition breakdown. Use the History tab for a longer view of your workouts and meals over time.'
      },
      {
        question: 'How do I change my calorie or macro goals?',
        answer: 'Go to Settings > App Preferences (or your profile settings) to adjust calorie and macro targets. These goals will update across the app.'
      },
      {
        question: 'Does the app work offline, or do I need internet?',
        answer: 'You need an internet connection to log in and sync data. Some features may be limited offline. We recommend keeping the app updated for the best experience.'
      },
      {
        question: 'How do I turn on dark mode or change app preferences?',
        answer: 'Go to Settings > App Preferences. You can switch between Light and Dark mode and adjust notification preferences there.'
      },
      {
        question: 'Is my data private and secure?',
        answer: 'Yes. We use encryption and secure practices to protect your data. Your information is not shared with third parties for marketing. See our Privacy Policy for full details.'
      },
      {
        question: 'How do I reset my password or recover my account?',
        answer: 'On the Sign In page, use the "Forgot password?" link. You will receive an email with instructions to reset your password. If you have trouble, contact support.'
      }
    ]
  }
]

function FAQ() {
  const navigate = useNavigate()
  const [openId, setOpenId] = useState(null)
  const [theme, setTheme] = useState('light')
  const [faqData, setFaqData] = useState(FALLBACK_FAQ)
  const [loading, setLoading] = useState(true)

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

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        const res = await API.get('/api/faq')
        if (Array.isArray(res.data) && res.data.length > 0) {
          setFaqData(res.data)
        }
      } catch (err) {
        console.error('FAQ fetch failed, using fallback:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFaq()
  }, [])

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id))
  }

  let itemIndex = 0

  return (
    <div className="faq-page page-animate" data-theme={theme}>
      <header className="faq-header">
        <button className="back-button" onClick={() => navigate('/settings')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">Frequently Asked Questions</h1>
      </header>

      <main className="faq-main">
        {loading ? (
          <p className="faq-loading">Loading FAQs...</p>
        ) : (
        faqData.map((section) => (
          <section key={section.category} className="faq-section">
            <h2 className="faq-section-title">{section.category}</h2>
            <div className="faq-accordion">
              {section.items.map((item) => {
                const id = `faq-${itemIndex++}`
                const isOpen = openId === id
                return (
                  <div key={id} className="faq-item">
                    <button
                      className={`faq-question ${isOpen ? 'open' : ''}`}
                      onClick={() => toggleItem(id)}
                      aria-expanded={isOpen}
                    >
                      <span className="faq-question-text">{item.question}</span>
                      <span className="faq-chevron">{isOpen ? '▼' : '▶'}</span>
                    </button>
                    <div className={`faq-answer-wrapper ${isOpen ? 'open' : ''}`}>
                      <div className="faq-answer">{item.answer}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
        )}
      </main>
    </div>
  )
}

export default FAQ
