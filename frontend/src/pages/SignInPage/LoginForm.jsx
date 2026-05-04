import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../../api.js";
import LockIcon from '../../components/LockIcon.jsx';
import { notify } from '../../components/appNotifications.js';

const EyeIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> );
const EyeOffIcon = () => ( <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> );

function LoginForm({ onForgotClick }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim()) {
      return notify("Email and password are required", "error");
    }

    setLoading(true);
    try {
      const response = await API.post("/api/auth/login", { email: formData.email, password: formData.password });
      localStorage.setItem("token", response.data.token);
      if (response.data.user) localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      notify(error?.response?.data?.msg || error?.response?.data?.message || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="brand-header">
        <div className="profile-placeholder"></div>
        <h1 className="signin-title">Welcome Back</h1>
        <p className="signin-subtitle">Sign in to continue your fitness journey</p>
      </div>

      <form onSubmit={handleSubmit} className="signin-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon email-icon"></span>
            <input type="email" id="email" name="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <div className="password-label-row">
            <label htmlFor="password">Password</label>
            <a href="#forgot" className="forgot-password-link" onClick={(e) => { e.preventDefault(); onForgotClick(); }}>Forgot password?</a>
          </div>
          <div className="input-wrapper">
            <span className="input-icon lock-icon"><LockIcon /></span>
            <input type={showPassword ? "text" : "password"} id="password" name="password" placeholder="Enter your password" value={formData.password} onChange={handleChange} required onFocus={() => setShowPassword(true)}   onBlur={() => setShowPassword(false)} />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input type="checkbox" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} />
            <span>Remember me</span>
          </label>
        </div>

        <button type="submit" className="signin-btn" disabled={loading}>
          {loading ? <span className="loader"></span> : "Sign In"}
        </button>
      </form>

      <div className="divider"><span>Or continue with</span></div>

      <p className="sign-up-link">
        New to JBFitness? <a href="#signup" onClick={(e) => { e.preventDefault(); navigate('/signup'); }}>Create account</a>
      </p>
    </>
  );
}

export default LoginForm;