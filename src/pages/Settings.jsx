import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import SettingsIcon from '../components/SettingsIcon'
import Logo from '../components/Logo'
import API from '../api'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState({ username: 'User', email: 'user@example.com' })
  const [userInitials, setUserInitials] = useState('JD')
  const [subscription, setSubscription] = useState({
    planName: 'No Active Plan',
    priceDisplay: 'Free',
    renewalText: 'Upgrade to premium to unlock subscription benefits',
    status: 'inactive'
  })
  const [isStartingPayment, setIsStartingPayment] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)

  // 🔹 Fetch user data from localStorage on component load
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const username = userData.username || userData.name || 'User'
        setUser({
          username: username,
          email: userData.email || 'user@example.com'
        })
        
        // Calculate initials from username
        const initials = username
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || 'JD')
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error)
    }
  }, [])

  const accountItems = [
    { iconType: 'person', label: 'Personal Information', path: '/personal-info' },
    { iconType: 'settings', label: 'App Preferences', path: '/app-preferences' }
  ]

  const paymentItems = [
    { iconType: 'document', label: 'Billing History' },
    { iconType: 'download', label: 'Download Receipts' }
  ]

  const helpItems = [
    { iconType: 'question', label: 'Frequently Asked Questions', path: '/faq' },
    { iconType: 'headset', label: 'Contact Support', path: '/contact-support' },
    { iconType: 'info', label: 'About JBFitness', path: '/about' }
  ]

  const handleItemClick = (path) => {
    if (path) {
      navigate(path)
    }
  }

  const loadCurrentSubscription = async () => {
    try {
      const { data } = await API.get('/api/payments/subscription/current')
      setSubscription({
        planName: data.planName || 'No Active Plan',
        priceDisplay: data.priceDisplay || 'Free',
        renewalText: data.renewalText || 'Upgrade to premium to unlock subscription benefits',
        status: data.status || 'inactive'
      })
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  useEffect(() => {
    loadCurrentSubscription()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const reference = params.get('reference') || params.get('trxref')

    if (!reference) return

    let isMounted = true

    const verifyPayment = async () => {
      try {
        setIsVerifyingPayment(true)
        await API.get(`/api/payments/paystack/verify/${reference}`)
        if (isMounted) {
          await loadCurrentSubscription()
          window.alert('Payment verified successfully. Your subscription is now active.')
        }
      } catch (error) {
        console.error('Payment verification failed:', error)
        if (isMounted) {
          window.alert(error?.response?.data?.message || 'Unable to verify payment. Please contact support if you were charged.')
        }
      } finally {
        if (isMounted) {
          setIsVerifyingPayment(false)
          navigate('/settings', { replace: true })
        }
      }
    }

    verifyPayment()

    return () => {
      isMounted = false
    }
  }, [location.search, navigate])

  const handleChangePlan = async () => {
    try {
      setIsStartingPayment(true)
      const callbackUrl = `${window.location.origin}/settings`
      const { data } = await API.post('/api/payments/paystack/initialize', {
        plan: 'premium_monthly',
        callbackUrl
      })

      if (!data?.authorizationUrl) {
        throw new Error('No authorization URL returned')
      }

      window.location.href = data.authorizationUrl
    } catch (error) {
      console.error('Failed to initialize payment:', error)
      const errorData = error?.response?.data
      const details = Array.isArray(errorData?.checkedEnvVars)
        ? `\nChecked env vars: ${errorData.checkedEnvVars.join(', ')}`
        : ''
      window.alert((errorData?.message || 'Unable to start payment right now. Please try again.') + details)
      setIsStartingPayment(false)
    }
  }

  const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      navigate('/login')
    }
  }

  return (
    <div className="settings-page page-animate">
      {/* Header */}
      <header className="settings-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="settings-title">Settings</h1>
      </header>

      {/* Main Content */}
      <main className="settings-main">
        {/* Account Section */}
        <div className="settings-card">
          <h2 className="card-title">Account</h2>
          <div className="profile-section">
            <div className="profile-avatar">
              <span className="avatar-initials">{userInitials}</span>
            </div>
            <div className="profile-info">
              <h3 className="profile-name">{user.username}</h3>
              <p className="profile-email">{user.email}</p>
              <a href="#edit" className="edit-profile-link">Edit Profile</a>
            </div>
          </div>
          <div className="settings-list">
            {accountItems.map((item, index) => (
              <div
                key={index}
                className="settings-item"
                onClick={() => handleItemClick(item.path)}
              >
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  {item.status && <span className="item-status">{item.status}</span>}
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payments Section */}
        <div className="settings-card">
          <h2 className="card-title">Payments</h2>
          <div className="current-plan-section">
            <div className="plan-header">
              <h3 className="plan-subtitle">Current Plan</h3>
              <span className="plan-badge">{subscription.status === 'active' ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="plan-details">
              <p className="plan-name">{subscription.planName}</p>
              <p className="plan-price">{subscription.priceDisplay}</p>
              <p className="plan-renewal">{subscription.renewalText}</p>
              <button
                type="button"
                className="change-plan-link"
                onClick={handleChangePlan}
                disabled={isStartingPayment || isVerifyingPayment}
              >
                {isStartingPayment ? 'Redirecting to Paystack...' : isVerifyingPayment ? 'Verifying payment...' : 'Change Plan'}
              </button>
            </div>
          </div>
          <div className="payment-methods-section">
            <div className="payment-methods-header">
              <SettingsIcon type="card" />
              <span className="payment-label">Payment Methods</span>
            </div>
            <div className="payment-card-info">
              <span className="card-number">**** 4242</span>
            </div>
          </div>
          <div className="settings-list">
            {paymentItems.map((item, index) => (
              <div key={index} className="settings-item">
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="settings-card">
          <h2 className="card-title">Help & Support</h2>
          <div className="settings-list">
            {helpItems.map((item, index) => (
              <div
                key={index}
                className="settings-item"
                onClick={() => handleItemClick(item.path)}
              >
                <div className="item-left">
                  <SettingsIcon type={item.iconType} />
                  <span className="item-label">{item.label}</span>
                </div>
                <div className="item-right">
                  <span className="item-arrow">→</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="settings-footer">
        <span className="version">Version 2.4.1</span>
        <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
      </footer>
    </div>
  )
}

export default Settings


