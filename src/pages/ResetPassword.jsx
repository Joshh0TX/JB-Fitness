import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../api.js'
import LockIcon from '../components/LockIcon'
import Logo from '../components/Logo'
import './ResetPassword.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.')
    }
  }, [token])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token) return
    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await API.post('/api/auth/reset-password', {
        token,
        newPassword: formData.newPassword,
      })
      setSuccess(true)
    } catch (err) {
      const msg =
        err.response?.data?.msg ||
        err.response?.data?.message ||
        'Failed to reset password. The link may have expired.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="reset-password-page page-animate">
        <header className="reset-header">
          <Logo />
        </header>
        <main className="reset-main">
          <div className="reset-card">
            <p className="reset-error">{error}</p>
            <button
              type="button"
              className="reset-btn"
              onClick={() => navigate('/forgot-password')}
            >
              Request New Reset Link
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (success) {
    return (
      <div className="reset-password-page page-animate">
        <header className="reset-header">
          <Logo />
        </header>
        <main className="reset-main">
          <div className="reset-card">
            <h1 className="reset-title">Password Reset</h1>
            <p className="reset-success-msg">
              Your password has been reset successfully. You can now sign in with
              your new password.
            </p>
            <button
              type="button"
              className="reset-btn"
              onClick={() => navigate('/signin')}
            >
              Sign In
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="reset-password-page page-animate">
      <header className="reset-header">
        <Logo />
      </header>

      <main className="reset-main">
        <div className="reset-card">
          <h1 className="reset-title">Set New Password</h1>
          <p className="reset-subtitle">
            Enter your new password below. It must be at least 8 characters.
          </p>

          <form onSubmit={handleSubmit} className="reset-form">
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon lock-icon">
                  <LockIcon />
                </span>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>
            </div>
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
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            {error && <p className="reset-error">{error}</p>}
            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

export default ResetPassword
