import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import NotificationIcon from '../components/NotificationIcon'
import LockIcon from '../components/LockIcon'
import Logo from '../components/Logo'
import './LoginPage.css'

function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  })
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.password === formData.confirmPassword && formData.agreeToTerms) {
      navigate('/dashboard')
    }
  }

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`)
    navigate('/dashboard')
  }

  return (
    <div className="login-page page-animate">
      {/* Header */}
      <header className="login-header">
        <div className="header-left">
          <Logo />
        </div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#about">About</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="login-main">
        <div className="login-card">
          {/* Profile Placeholder */}
          <div className="profile-placeholder"></div>

          <h1 className="login-title">Create Your Account</h1>
          <p className="login-subtitle">Join JBFitness and start your fitness journey today.</p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon email-icon"></span>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon lock-icon">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
              </div>
              <small className="password-hint">Must be at least 8 characters.</small>
            </div>

            {/* Confirm Password Field */}
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon lock-icon">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  required
                />
                <span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a></span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="create-account-btn">Create Account</button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>Or continue with</span>
          </div>

          {/* Social Login Buttons */}
          <div className="social-login">
            <button 
              className="social-btn google-btn"
              onClick={() => handleSocialLogin('Google')}
              type="button"
            >
              <span className="google-icon">G</span>
              <span>Google</span>
            </button>
            <button 
              className="social-btn facebook-btn"
              onClick={() => handleSocialLogin('Facebook')}
              type="button"
            >
              <span className="facebook-icon">f</span>
              <span>Facebook</span>
            </button>
          </div>

          {/* Sign In Link */}
          <p className="sign-in-link">
            Already have an account? <a href="#signin" onClick={(e) => { e.preventDefault(); navigate('/signin') }}>Sign in here</a>
          </p>
        </div>

        {/* Back to Login Link */}
        <a href="#back" className="back-link" onClick={(e) => { e.preventDefault(); navigate('/login') }}>
          <span className="back-arrow">←</span> Back to Login
        </a>
      </main>

      {/* Footer */}
      <footer className="login-footer">
        <div className="footer-content">
          <p className="copyright">© 2026 JBFitness. All rights reserved.</p>
          <nav className="footer-nav">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </nav>
        </div>
      </footer>
    </div>
  )
}

export default LoginPage


