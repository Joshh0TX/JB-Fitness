import { useState } from 'react';
import API from "../../api.js";
import LockIcon from '../../components/LockIcon.jsx';
import { notify } from '../../components/appNotifications.js';

const EyeIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> );
const EyeOffIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> );

function ResetPasswordForm({ initialEmail, initialChallengeId, onCancel, onSuccess }) {
  const [formData, setFormData] = useState({ otp: '', newPassword: '', confirmPassword: '' });
  const [challengeId, setChallengeId] = useState(initialChallengeId);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleResendResetOtp = async () => {
    if (!challengeId) return;
    setLoading(true);
    try {
      const response = await API.post('/api/auth/resend-password-reset-otp', { challengeId });
      if (response.data?.challengeId) setChallengeId(response.data.challengeId);
      notify('A new OTP has been sent to your email', 'success');
    } catch (error) {
      notify(error?.response?.data?.msg || 'Failed to resend OTP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.otp.length !== 6 || isNaN(formData.otp)) return notify('Please enter a valid 6-digit OTP', 'error');
    if (formData.newPassword.length < 6) return notify('New password must be at least 6 characters', 'error');
    if (formData.newPassword !== formData.confirmPassword) return notify('Passwords do not match', 'error');

    setLoading(true);
    try {
      await API.post('/api/auth/reset-password-with-otp', {
        challengeId,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      notify('Password reset successful', 'success');
      onSuccess(); // Triggers parent to go back to login form
    } catch (error) {
      notify(error?.response?.data?.msg || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="brand-header">
        <div className="profile-placeholder"></div>
        <h1 className="signin-title">Reset Password</h1>
        <p className="signin-subtitle">Enter the OTP sent to {initialEmail}</p>
      </div>

      <form onSubmit={handleSubmit} className="signin-form">
        <div className="form-group">
          <label htmlFor="resetOtp">OTP Code</label>
          <div className="input-wrapper otp-input-wrapper">
            <input type="text" id="resetOtp" name="otp" placeholder="000000" value={formData.otp} onChange={(e) => setFormData(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))} required />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="input-wrapper">
            <span className="input-icon lock-icon"><LockIcon /></span>
            <input type={showPassword ? "text" : "password"} id="newPassword" name="newPassword" placeholder="At least 6 characters" value={formData.newPassword} onChange={handleChange} required />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="input-wrapper">
            <span className="input-icon lock-icon"><LockIcon /></span>
            <input type={showPassword ? "text" : "password"} id="confirmPassword" name="confirmPassword" placeholder="Re-enter new password" value={formData.confirmPassword} onChange={handleChange} required />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? <span className="loader"></span> : 'Reset Password'}
        </button>
      </form>
      
      <div className="otp-actions">
        <button type="button" className="text-action" onClick={handleResendResetOtp} disabled={loading}>Resend OTP</button>
        <button type="button" className="text-action" onClick={onCancel} disabled={loading}>Cancel</button>
      </div>
    </>
  );
}

export default ResetPasswordForm;