import { useLocation, useNavigate  } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import SettingsIcon from '../components/SettingsIcon'
import Logo from '../components/Logo'
import API from '../api'
import { notify } from '../components/appNotifications'
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
  const fileInputRef = useRef(null);
  const [profileImage, setProfileImage] = useState(null)

  const deriveInitials = (value) => {
    const text = String(value || '').trim()
    if (!text) return '??'

    const words = text.split(/\s+/).filter(Boolean)
    if (words.length > 1) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase()
    }

    const letters = text.replace(/[^A-Za-z]/g, '')
    return letters.slice(0, 2).toUpperCase() || text.slice(0, 2).toUpperCase()
  }

  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) setProfileImage(savedImage);
  }, []);
  // 🔹 Fetch user data from localStorage on component load
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const displayName = userData.name || userData.username || userData.email || 'User'
        setUser({
          username: displayName,
          email: userData.email || 'user@example.com'
        })

        const initials = deriveInitials(displayName)
        setUserInitials(initials)
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
      if (path === '/about') {
        navigate(path, { state: { from: '/settings' } })
        return
      }

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
          notify('Payment verified successfully. Your subscription is now active.', 'success')
        }
      } catch (error) {
        console.error('Payment verification failed:', error)
        if (isMounted) {
          // More professional error messaging
          const msg = error?.response?.status === 404 
            ? 'Transaction not found. If you were charged, please contact support.' 
            : 'Unable to verify payment at this moment.';
         notify(msg, 'error');
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
      notify((errorData?.message || 'Unable to start payment right now. Please try again.') + details, 'error')
      setIsStartingPayment(false)
    }
  }

    const handleSignOut = () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      // 1. Wipe the sensitive data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Note: We usually keep 'appPreferences' so the app 
      // stays in Dark Mode even after they log out.

      // 2. Use { replace: true } so they can't "Back Button" into the app
      navigate('/login', { replace: true });
    
      notify('Signed out successfully', 'success');
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current.click(); // Triggers the hidden file input
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
     const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String); // Reflects immediately in UI
        localStorage.setItem('profileImage', base64String); // Persists on refresh
     };
     reader.readAsDataURL(file);
    }
  };

 return (
    <div className="settings-page page-animate">
      {/* --- MATURED HEADER --- */}
      <header className="settings-header">
        <button className="icon-btn-back" onClick={() => navigate('/dashboard')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">Settings</h1>
      </header>

      <main className="settings-main">
        {/* --- ACCOUNT SECTION --- */}
        <section className="settings-card">
          <h2 className="card-title">Account</h2>
          <div className="profile-section">
  <div className="profile-avatar" onClick={handleAvatarClick} title="Change Profile Picture">
    {profileImage ? (
      <img src={profileImage} alt="Profile" className="avatar-img" />
    ) : (
      <span className="avatar-initials">{userInitials}</span>
    )}
    {/* Hidden File Input */}
    <input 
      type="file" 
      ref={fileInputRef} 
      onChange={handleFileChange} 
      accept="image/*" 
      style={{ display: 'none' }} 
    />
    <div className="avatar-overlay">
      <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
        <path d="M12 15c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3z"/>
        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
      </svg>
    </div>
  </div>
  <div className="profile-info">
    <h3 className="profile-name">{user.username}</h3>
    <p className="profile-email">{user.email}</p>
    <button className="edit-profile-btn" onClick={handleAvatarClick}>Change Photo</button>
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
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- PAYMENTS SECTION --- */}
        <section className="settings-card">
          <h2 className="card-title">Payments</h2>
          <div className="current-plan-section">
            <div className="plan-header">
              <h3 className="plan-subtitle">Current Plan</h3>
              <span className={`plan-badge status-${subscription.status}`}>
                {subscription.status === 'active' ? 'Active' : 'Inactive'}
              </span>
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
                {isStartingPayment ? 'Redirecting...' : isVerifyingPayment ? 'Verifying...' : 'Change Plan'}
              </button>
            </div>
          </div>

          <div className="payment-methods-section">
            <div className="payment-methods-header">
              <SettingsIcon type="card" />
              <span className="payment-label">Payment Methods</span>
            </div>
            <div className="payment-card-info">
              <span className="card-number">•••• 4242</span>
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
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- HELP & SUPPORT SECTION --- */}
        <section className="settings-card">
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
                  <svg className="chevron-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- SPACER FOR BOTTOM NAV --- */}
        <div className="settings-bottom-spacer"></div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="settings-footer">
        <span className="version">Version 1.2</span>
        <button className="sign-out-btn" onClick={handleSignOut}>Sign Out</button>
      </footer>
    </div>
  );
}

export default Settings


