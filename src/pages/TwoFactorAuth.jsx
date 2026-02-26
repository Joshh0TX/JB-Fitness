import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import API from '../api.js'
import './TwoFactorAuth.css'

function TwoFactorAuth() {
  const navigate = useNavigate()
  const location = useLocation()
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [loginOtpCode, setLoginOtpCode] = useState('')
  const [loginChallenge, setLoginChallenge] = useState(null)
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [backupCodes, setBackupCodes] = useState([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [step, setStep] = useState('initial') // initial, setup, verify, success
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      setIs2FAEnabled(userData.twoFactorEnabled || false)
    }

    const challengeFromRoute =
      location.state?.mode === 'login' && location.state?.challengeId
        ? {
            challengeId: location.state.challengeId,
            email: location.state.email || ''
          }
        : null

    if (challengeFromRoute) {
      localStorage.setItem('pending2FA', JSON.stringify(challengeFromRoute))
      setLoginChallenge(challengeFromRoute)
      return
    }

    const pending2FA = localStorage.getItem('pending2FA')
    if (pending2FA) {
      try {
        setLoginChallenge(JSON.parse(pending2FA))
      } catch {
        localStorage.removeItem('pending2FA')
      }
    }
  }, [location.state])

  const isLoginOtpFlow = Boolean(loginChallenge?.challengeId)

  const handleVerifyLoginOtp = async () => {
    if (loginOtpCode.length !== 6 || isNaN(loginOtpCode)) {
      setMessage('Please enter a valid 6-digit OTP')
      setMessageType('error')
      return
    }

    try {
      setIsVerifyingOtp(true)
      const response = await API.post('/api/auth/verify-login-otp', {
        challengeId: loginChallenge.challengeId,
        otp: loginOtpCode
      })

      const { token, user } = response.data

      localStorage.setItem('token', token)
      if (user) {
        localStorage.setItem('user', JSON.stringify(user))
      }
      localStorage.removeItem('pending2FA')

      setMessage('Verification successful!')
      setMessageType('success')
      navigate('/dashboard')
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'OTP verification failed'
      setMessage(msg)
      setMessageType('error')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendLoginOtp = async () => {
    if (!loginChallenge?.challengeId) return

    try {
      setIsResendingOtp(true)
      await API.post('/api/auth/resend-login-otp', {
        challengeId: loginChallenge.challengeId
      })
      setMessage('A new OTP has been sent to your email')
      setMessageType('success')
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'Failed to resend OTP'
      setMessage(msg)
      setMessageType('error')
    } finally {
      setIsResendingOtp(false)
    }
  }

  const generateSecret = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    let secret = ''
    for (let i = 0; i < 32; i++) {
      secret += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setSecret(secret)

    // Simulate QR code generation (in production, use a proper QR code library)
    const mockQRCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/JBFitness:user@example.com?secret=${secret}&issuer=JBFitness`
    setQrCode(mockQRCode)

    // Generate 10 backup codes
    const codes = []
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase()
      codes.push(code.match(/.{1,4}/g).join('-'))
    }
    setBackupCodes(codes)
  }

  const handleEnable2FA = () => {
    generateSecret()
    setStep('setup')
    setMessage('')
  }

  const handleVerifyCode = () => {
    if (verificationCode.length !== 6 || isNaN(verificationCode)) {
      setMessage('Please enter a valid 6-digit code')
      setMessageType('error')
      return
    }

    // In production, verify with backend
    // For now, accept any valid 6-digit code
    setStep('verify')
    setMessage('Verification code accepted!')
    setMessageType('success')

    setTimeout(() => {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const updatedUser = {
          ...userData,
          twoFactorEnabled: true,
          twoFactorSecret: secret,
          backupCodes: backupCodes
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      setIs2FAEnabled(true)
      setStep('success')
    }, 1500)
  }

  const handleDisable2FA = () => {
    if (window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const updatedUser = {
          ...userData,
          twoFactorEnabled: false,
          twoFactorSecret: null,
          backupCodes: null
        }
        localStorage.setItem('user', JSON.stringify(updatedUser))
      }
      setIs2FAEnabled(false)
      setStep('initial')
      setMessage('Two-Factor Authentication has been disabled')
      setMessageType('warning')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCompleteSetup = () => {
    setStep('initial')
    setVerificationCode('')
    setSecret('')
    setQrCode(null)
    setShowBackupCodes(false)
    setMessage('Two-Factor Authentication is now enabled!')
    setMessageType('success')
    setTimeout(() => setMessage(''), 3000)
  }

  const downloadBackupCodes = () => {
    const content = 'JBFitness 2FA Backup Codes\n\n' + backupCodes.join('\n')
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content))
    element.setAttribute('download', 'jbfitness-backup-codes.txt')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  if (isLoginOtpFlow) {
    return (
      <div className="two-factor-page page-animate">
        <header className="twofa-header">
          <button
            className="back-button"
            onClick={() => {
              localStorage.removeItem('pending2FA')
              navigate('/signin')
            }}
          >
            <span className="back-arrow">←</span>
          </button>
          <h1 className="page-title">Email Verification</h1>
        </header>

        <main className="twofa-main">
          <div className="twofa-card">
            {message && (
              <div className={`message-alert ${messageType}`}>
                {message}
              </div>
            )}

            <div className="setup-section">
              <h2 className="setup-title">Enter OTP</h2>
              <p className="setup-description">
                We sent a 6-digit verification code to <strong>{loginChallenge.email}</strong>. Enter it to complete sign in.
              </p>

              <div className="code-input-group">
                <input
                  type="text"
                  maxLength="6"
                  placeholder="000000"
                  value={loginOtpCode}
                  onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="code-input"
                />
              </div>

              <div className="button-group login-otp-actions">
                <button
                  className="verify-button"
                  onClick={handleVerifyLoginOtp}
                  disabled={isVerifyingOtp}
                >
                  {isVerifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  className="resend-button"
                  onClick={handleResendLoginOtp}
                  disabled={isResendingOtp}
                >
                  {isResendingOtp ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="two-factor-page page-animate">
      <header className="twofa-header">
        <button
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">Two-Factor Authentication</h1>
      </header>

      <main className="twofa-main">
        <div className="twofa-card">
          {message && (
            <div className={`message-alert ${messageType}`}>
              {message}
            </div>
          )}

          {step === 'initial' && (
            <>
              <div className="twofa-info-section">
                <div className="security-icon">🔐</div>
                <h2 className="section-title">Two-Factor Authentication</h2>
                <p className="section-description">
                  Add an extra layer of security to your account. In addition to your password, 
                  you'll need to verify your device using an authenticator app.
                </p>
              </div>

              <div className="status-section">
                <div className="status-item">
                  <span className="status-label">Current Status</span>
                  <span className={`status-badge ${is2FAEnabled ? 'enabled' : 'disabled'}`}>
                    {is2FAEnabled ? '✓ Enabled' : '○ Disabled'}
                  </span>
                </div>
              </div>

              {!is2FAEnabled ? (
                <div className="benefits-section">
                  <h3>Benefits</h3>
                  <ul className="benefits-list">
                    <li>✓ Protect your account from unauthorized access</li>
                    <li>✓ Enhanced security with time-based codes</li>
                    <li>✓ Backup codes for emergency access</li>
                    <li>✓ Works with authenticator apps like Google Authenticator or Authy</li>
                  </ul>
                </div>
              ) : (
                <div className="enabled-info">
                  <p>🎉 Your account is protected with Two-Factor Authentication.</p>
                </div>
              )}

              {!is2FAEnabled && (
                <button
                  className="setup-button"
                  onClick={handleEnable2FA}
                >
                  Set Up Two-Factor Authentication
                </button>
              )}

              {is2FAEnabled && (
                <button
                  className="disable-button"
                  onClick={handleDisable2FA}
                >
                  Disable Two-Factor Authentication
                </button>
              )}
            </>
          )}

          {step === 'setup' && (
            <>
              <div className="setup-section">
                <h2 className="setup-title">Step 1: Scan QR Code</h2>
                <p className="setup-description">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                </p>

                <div className="qr-container">
                  {qrCode && (
                    <img src={qrCode} alt="QR Code" className="qr-code" />
                  )}
                </div>

                <div className="manual-entry">
                  <p className="manual-title">Can't scan? Enter manually:</p>
                  <div className="secret-code">
                    <code>{secret}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(secret)
                      }}
                      className="copy-button"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>

                <hr className="separator" />

                <h2 className="setup-title">Step 2: Verify Code</h2>
                <p className="setup-description">
                  Enter the 6-digit code from your authenticator app to verify the setup
                </p>

                <div className="code-input-group">
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    className="code-input"
                  />
                </div>

                <div className="button-group">
                  <button
                    className="verify-button"
                    onClick={handleVerifyCode}
                  >
                    Verify and Continue
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => {
                      setStep('initial')
                      setVerificationCode('')
                      setSecret('')
                      setQrCode(null)
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 'verify' && (
            <>
              <div className="backup-section">
                <div className="backup-icon">💾</div>
                <h2 className="setup-title">Save Backup Codes</h2>
                <p className="setup-description">
                  Save these backup codes in a secure location. You can use them to access your account 
                  if you lose access to your authenticator app.
                </p>

                <button
                  className="toggle-codes-button"
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                >
                  {showBackupCodes ? '▼ Hide Codes' : '▶ Show Codes'}
                </button>

                {showBackupCodes && (
                  <div className="backup-codes-container">
                    <div className="backup-codes-grid">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="backup-code">{code}</div>
                      ))}
                    </div>
                    <button
                      className="download-button"
                      onClick={downloadBackupCodes}
                    >
                      📥 Download Codes
                    </button>
                  </div>
                )}

                <div className="important-note">
                  ⚠️ <strong>Important:</strong> Store your backup codes somewhere safe. 
                  Once you leave this page, you won't be able to see them again.
                </div>

                <button
                  className="complete-button"
                  onClick={handleCompleteSetup}
                >
                  Complete Setup
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="success-section">
                <div className="success-icon">✅</div>
                <h2 className="success-title">Setup Complete!</h2>
                <p className="success-message">
                  Your account is now protected with Two-Factor Authentication.
                </p>
                <button
                  className="complete-button"
                  onClick={handleCompleteSetup}
                >
                  Return to Settings
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default TwoFactorAuth
