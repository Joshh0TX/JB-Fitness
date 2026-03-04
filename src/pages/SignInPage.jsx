import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../api.js";
import LockIcon from '../components/LockIcon';
import Logo from '../components/Logo';
import './SignInPage.css';

function SignInPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [loginOtpCode, setLoginOtpCode] = useState('');
  const [loginChallenge, setLoginChallenge] = useState(null);
  const [forgotFlow, setForgotFlow] = useState({
    step: 'none',
    email: '',
    challengeId: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isLoginOtpStep = Boolean(loginChallenge?.challengeId);
  const isForgotStep = forgotFlow.step !== 'none';

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email.trim() || !formData.password.trim()) {
      alert("Email and password are required");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/api/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      if (response.data?.requiresOtp && response.data?.challengeId) {
        const loginOtpChallenge = {
          challengeId: response.data.challengeId,
          email: response.data.email || formData.email,
        };
        setLoginChallenge(loginOtpChallenge);
        setLoginOtpCode('');
        return;
      }

      const { token, user } = response.data;

      // Save token & user info
      localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      const msg = error.response?.data?.msg || error.response?.data?.message || "Login failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e) => {
    e.preventDefault();

    if (loginOtpCode.length !== 6 || isNaN(loginOtpCode)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/auth/verify-login-otp', {
        challengeId: loginChallenge.challengeId,
        otp: loginOtpCode,
      });

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', JSON.stringify(user));

      setLoginChallenge(null);
      setLoginOtpCode('');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'OTP verification failed';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (!loginChallenge?.challengeId) return;

    setLoading(true);
    try {
      const response = await API.post('/api/auth/resend-login-otp', {
        challengeId: loginChallenge.challengeId,
      });

      if (response.data?.challengeId) {
        setLoginChallenge((prev) => ({
          ...prev,
          challengeId: response.data.challengeId,
        }));
      }

      alert('A new OTP has been sent to your email');
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'Failed to resend OTP';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = (e) => {
    e.preventDefault();
    setForgotFlow({
      step: 'request',
      email: formData.email || '',
      challengeId: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const closeForgotPassword = () => {
    setForgotFlow({
      step: 'none',
      email: '',
      challengeId: '',
      otp: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotFlow((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestResetOtp = async (e) => {
    e.preventDefault();
    if (!forgotFlow.email.trim()) {
      alert('Email is required');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/auth/request-password-reset-otp', {
        email: forgotFlow.email,
      });

      if (!response.data?.challengeId) {
        alert(response.data?.msg || 'If the email exists, an OTP has been sent.');
        return;
      }

      setForgotFlow((prev) => ({
        ...prev,
        step: 'reset',
        challengeId: response.data.challengeId,
        otp: '',
        newPassword: '',
        confirmPassword: '',
      }));
      alert('OTP sent to your email');
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'Failed to send OTP';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (!forgotFlow.challengeId) return;

    setLoading(true);
    try {
      const response = await API.post('/api/auth/resend-password-reset-otp', {
        challengeId: forgotFlow.challengeId,
      });

      if (response.data?.challengeId) {
        setForgotFlow((prev) => ({ ...prev, challengeId: response.data.challengeId }));
      }

      alert('A new OTP has been sent to your email');
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'Failed to resend OTP';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (forgotFlow.otp.length !== 6 || isNaN(forgotFlow.otp)) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    if (!forgotFlow.newPassword || forgotFlow.newPassword.length < 6) {
      alert('New password must be at least 6 characters');
      return;
    }

    if (forgotFlow.newPassword !== forgotFlow.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await API.post('/api/auth/reset-password-with-otp', {
        challengeId: forgotFlow.challengeId,
        otp: forgotFlow.otp,
        newPassword: forgotFlow.newPassword,
      });

      alert(response.data?.msg || 'Password reset successful');
      setFormData((prev) => ({ ...prev, email: forgotFlow.email, password: '' }));
      closeForgotPassword();
    } catch (error) {
      const msg = error.response?.data?.msg || error.response?.data?.message || 'Failed to reset password';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    navigate('/dashboard');
  };

  return (
    <div className="signin-page page-animate">
      {/* Header */}
      <header className="signin-header">
        <div className="header-left">
          <Logo />
        </div>
        <nav className="header-nav">
          <a href="/about" onClick={(e) => { e.preventDefault(); navigate('/about') }}>About</a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="signin-main">
        <div className="signin-card">
          {!isLoginOtpStep && !isForgotStep && (
            <>
              <h1 className="signin-title">Welcome Back</h1>
              <p className="signin-subtitle">Sign in to continue your fitness journey</p>

              <form onSubmit={handleSubmit} className="signin-form">
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

                <div className="form-group">
                  <div className="password-label-row">
                    <label htmlFor="password">Password</label>
                    <a href="#forgot" className="forgot-password-link" onClick={openForgotPassword}>Forgot password?</a>
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

                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </form>
            </>
          )}

          {isLoginOtpStep && (
            <>
              <h1 className="signin-title">Enter OTP</h1>
              <p className="signin-subtitle">We sent a 6-digit code to {loginChallenge.email}</p>
              <form onSubmit={handleVerifyLoginOtp} className="signin-form">
                <div className="form-group">
                  <label htmlFor="loginOtpCode">Verification Code</label>
                  <div className="input-wrapper otp-input-wrapper">
                    <input
                      type="text"
                      id="loginOtpCode"
                      name="loginOtpCode"
                      placeholder="000000"
                      value={loginOtpCode}
                      onChange={(e) => setLoginOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>

              <div className="otp-actions">
                <button type="button" className="text-action" onClick={handleResendLoginOtp} disabled={loading}>Resend OTP</button>
                <button type="button" className="text-action" onClick={() => setLoginChallenge(null)} disabled={loading}>Back to sign in</button>
              </div>
            </>
          )}

          {isForgotStep && forgotFlow.step === 'request' && (
            <>
              <h1 className="signin-title">Forgot Password</h1>
              <p className="signin-subtitle">Enter your email to receive a reset OTP</p>
              <form onSubmit={handleRequestResetOtp} className="signin-form">
                <div className="form-group">
                  <label htmlFor="forgotEmail">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon email-icon"></span>
                    <input
                      type="email"
                      id="forgotEmail"
                      name="email"
                      placeholder="you@example.com"
                      value={forgotFlow.email}
                      onChange={handleForgotChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
              <div className="otp-actions">
                <button type="button" className="text-action" onClick={closeForgotPassword} disabled={loading}>Back to sign in</button>
              </div>
            </>
          )}

          {isForgotStep && forgotFlow.step === 'reset' && (
            <>
              <h1 className="signin-title">Reset Password</h1>
              <p className="signin-subtitle">Enter the OTP sent to {forgotFlow.email}</p>
              <form onSubmit={handleResetPassword} className="signin-form">
                <div className="form-group">
                  <label htmlFor="resetOtp">OTP Code</label>
                  <div className="input-wrapper otp-input-wrapper">
                    <input
                      type="text"
                      id="resetOtp"
                      name="otp"
                      placeholder="000000"
                      value={forgotFlow.otp}
                      onChange={(e) => setForgotFlow((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      required
                    />
                  </div>
                </div>

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
                      placeholder="At least 6 characters"
                      value={forgotFlow.newPassword}
                      onChange={handleForgotChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon lock-icon">
                      <LockIcon />
                    </span>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Re-enter new password"
                      value={forgotFlow.confirmPassword}
                      onChange={handleForgotChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="signin-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
              <div className="otp-actions">
                <button type="button" className="text-action" onClick={handleResendResetOtp} disabled={loading}>Resend OTP</button>
                <button type="button" className="text-action" onClick={closeForgotPassword} disabled={loading}>Cancel</button>
              </div>
            </>
          )}

          {/* (social login removed) */}

          {!isLoginOtpStep && !isForgotStep && (
            <p className="sign-up-link">
              Don't have an account? <a href="#signup" onClick={(e) => { e.preventDefault(); navigate('/login') }}>Create account</a>
            </p>
          )}
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
        </div>
      </footer>
    </div>
  );
}

export default SignInPage;