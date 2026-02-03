import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from "../api.js"
import LockIcon from '../components/LockIcon'
import Logo from '../components/Logo'
import './SignInPage.css'

function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate()

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
  e.preventDefault();
    console.log("LOGIN SUBMITTED");
  setLoading(true);

  try {
    const response = await API.post("/auth/login", {
      email: formData.email,
      password: formData.password,
    });

    // Save token
    const token = response.data.token;
    localStorage.setItem("token", token);

    // Redirect to dashboard
    navigate("/dashboard");

  } catch (error) {
    console.error(error);
    alert(error.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`)
    navigate('/dashboard')
  }

  return (
    <div className="signin-page page-animate">
      {/* Header */}
      <header className="signin-header">
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
      <main className="signin-main">
        <div className="signin-card">
          <h1 className="signin-title">Welcome Back</h1>
          <p className="signin-subtitle">Sign in to continue your fitness journey</p>

          <form onSubmit={handleSubmit} className="signin-form">
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
              <div className="password-label-row">
                <label htmlFor="password">Password</label>
                <a href="#forgot" className="forgot-password-link">Forgot password?</a>
              </div>
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
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                />
                <span>Remember me</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" className="signin-btn">Sign In</button>
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

          {/* Sign Up Link */}
          <p className="sign-up-link">
            Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Create account</a>
          </p>
        </div>

        {/* Back to Home Link */}
        <a href="#back" className="back-link" onClick={(e) => { e.preventDefault(); navigate('/login') }}>
          <span className="back-arrow">←</span> Back to Create Account
        </a>
      </main>

      {/* Footer */}
      <footer className="signin-footer">
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

export default SignInPage


