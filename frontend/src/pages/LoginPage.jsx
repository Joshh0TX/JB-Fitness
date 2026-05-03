import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationIcon from "../components/NotificationIcon";
import LockIcon from "../components/LockIcon";
import Logo from "../components/Logo";
import API from "../api.js";
import { notify } from "../components/appNotifications";
import "./LoginPage.css";

// SVG Icons for the Show/Hide Password Toggle
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
);
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

function LoginPage() {
  const [formData, setFormData] = useState({
    username: "", 
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle visibility state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Logic preserved exactly as original
    if (!formData.username.trim()) {
      notify("Username is required", "error");
      return;
    }
    if (!formData.email.trim()) {
      notify("Email is required", "error");
      return;
    }
    if (formData.password.length < 8) {
      notify("Password must be at least 8 characters", "error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notify("Passwords must match!", "error");
      return;
    }
    if (!formData.agreeToTerms) {
      notify("You must agree to the Terms of Service and Privacy Policy.", "error");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/api/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      const msg = error.response?.data?.msg || error.response?.data?.message || "Registration failed";
      notify(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page page-animate">
      <header className="login-header">
        {/* 1. The Back Arrow */}
        <button 
          className="header-back-btn" 
          onClick={() => navigate("/signin")}
          title="Back to Sign In"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        {/* 2. The Centered Logo */}
        <div className="header-center-logo">
          <Logo />
        </div>

        {/* 3. The About Link */}
        <nav className="header-nav">
          <button
            type="button"
            className="nav-link-button"
            onClick={() => navigate('/about', { state: { from: '/login' } })}
          >
            About
          </button>
        </nav>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="profile-placeholder"></div>

          <h1 className="login-title">Create Your Account</h1>
          <p className="login-subtitle">
            Join JBFitness and start your fitness journey today.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Full Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="John Doe"
                  autoComplete="name"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  inputMode="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <span className="input-icon lock-icon"><LockIcon /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                />
                {/* Replaced Text with Icon */}
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              <small className="password-hint">At least 8 characters.</small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon lock-icon"><LockIcon /></span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {/* Added the exact same toggle to the confirm field */}
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  required
                />
                <span>
                  I agree to the <a href="#terms">Terms</a> & <a href="#privacy">Privacy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className={`create-account-btn ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {loading ? <span className="loader"></span> : "Create Account"}
            </button>
          </form>

          <div className="divider"><span>Or continue with</span></div>
          
          <p className="sign-in-link">
            Already have an account?{" "}
            <a href="#signin" onClick={(e) => { e.preventDefault(); navigate("/signin"); }}>
              Sign in
            </a>
          </p>
        </div>
      </main>

      <footer className="login-footer">
        <p>© 2026 JBFitness. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default LoginPage;