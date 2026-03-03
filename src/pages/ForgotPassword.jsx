import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api.js'
import Logo from '../components/Logo'
import './ForgotPassword.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    setError('')
    setLoading(true)
    try {
      await API.post('/api/auth/forgot-password', { email: email.trim() })
      setSubmitted(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-page page-animate">
      <header className="forgot-header">
        <div className="header-left">
          <Logo />
        </div>
        <nav className="header-nav">
          <a href="#about">About</a>
        </nav>
      </header>

      <main className="forgot-main">
        <div className="forgot-card">
          <h1 className="forgot-title">Forgot Password?</h1>
          <p className="forgot-subtitle">
            Enter your email and we&apos;ll send you instructions to reset your password.
          </p>

          {submitted ? (
            <div className="forgot-success">
              <p className="success-message">
                If an account exists with that email, you will receive password reset
                instructions shortly. Please check your inbox.
              </p>
              <button
                type="button"
                className="back-to-signin-btn"
                onClick={() => navigate('/signin')}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="forgot-form">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <span className="input-icon email-icon"></span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              {error && <p className="forgot-error">{error}</p>}
              <button
                type="submit"
                className="forgot-submit-btn"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="sign-in-link">
            Remember your password?{' '}
            <a
              href="#signin"
              onClick={(e) => {
                e.preventDefault()
                navigate('/signin')
              }}
            >
              Sign in
            </a>
          </p>
        </div>

        <a
          href="#back"
          className="back-link"
          onClick={(e) => {
            e.preventDefault()
            navigate('/signin')
          }}
        >
          <span className="back-arrow">←</span> Back to Sign In
        </a>
      </main>

      <footer className="forgot-footer">
        <p className="copyright">© 2026 JBFitness. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default ForgotPassword
