import { useState } from 'react';
import API from "../../api.js";
import { notify } from '../../components/appNotifications.js';

function ForgotRequestForm({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return notify('Email is required', 'error');

    setLoading(true);
    try {
      const response = await API.post('/api/auth/request-password-reset-otp', { email });
      if (!response.data?.challengeId) {
        return notify(response.data?.msg || 'If the email exists, an OTP has been sent.', 'info');
      }
      notify('OTP sent to your email', 'success');
      onSuccess(email, response.data.challengeId); // Send data to parent
    } catch (error) {
      notify(error?.response?.data?.msg || 'Failed to send OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="brand-header">
        <div className="profile-placeholder"></div>
        <h1 className="signin-title">Forgot Password</h1>
        <p className="signin-subtitle">Enter your email to receive a reset OTP</p>
      </div>

      <form onSubmit={handleSubmit} className="signin-form">
        <div className="form-group">
          <label htmlFor="forgotEmail">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon email-icon"></span>
            <input type="email" id="forgotEmail" name="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? <span className="loader"></span> : 'Send OTP'}
        </button>
      </form>
      
      <div className="otp-actions">
        <button type="button" className="text-action" onClick={onBack} disabled={loading}>Back to sign in</button>
      </div>
    </>
  );
}

export default ForgotRequestForm;