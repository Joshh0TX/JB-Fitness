import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NotificationIcon from "../components/NotificationIcon";
import LockIcon from "../components/LockIcon";
import Logo from "../components/Logo";
import API from "../api.js";
import "./LoginPage.css";

function LoginPage() {
  const [formData, setFormData] = useState({
    username: "", // renamed from 'name'
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [loading, setLoading] = useState(false);
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

    // Validation
    if (!formData.username.trim()) {
      alert("Username is required");
      return;
    }
    if (!formData.email.trim()) {
      alert("Email is required");
      return;
    }

    try {
      await API.post("/api/auth/validate-email", {
        email: formData.email,
      });
    } catch (error) {
      const validationMsg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Email doesn't exist";
      alert(validationMsg);
      return;
    }

    if (formData.password.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords must match!");
      return;
    }
    if (!formData.agreeToTerms) {
      alert("You must agree to the Terms of Service and Privacy Policy.");
      return;
    }

    setLoading(true);

    try {
      const response = await API.post("/api/auth/register", {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Save JWT token & user info
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      const msg =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Registration failed";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    console.log(`Login with ${provider}`);
    navigate("/dashboard");
  };

  return (
    <div className="login-page page-animate">
      {/* Header */}
      <header className="login-header">
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
      <main className="login-main">
        <div className="login-card">
          <div className="profile-placeholder"></div>

          <h1 className="login-title">Create Your Account</h1>
          <p className="login-subtitle">
            Join JBFitness and start your fitness journey today.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username */}
            <div className="form-group">
              <label htmlFor="username">Full Name</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="John Doe"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
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

            {/* Password */}
            <div className="form-group">
              <label htmlFor="password">Password</label>
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
                  minLength="8"
                />
              </div>
              <small className="password-hint">
                Must be at least 8 characters.
              </small>
            </div>

            {/* Confirm Password */}
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
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Terms */}
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
                  I agree to the <a href="#terms">Terms of Service</a> and{" "}
                  <a href="#privacy">Privacy Policy</a>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="create-account-btn"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <p className="sign-in-link">
            Already have an account?{" "}
            <a
              href="#signin"
              onClick={(e) => {
                e.preventDefault();
                navigate("/signin");
              }}
            >
              Sign in here
            </a>
          </p>
        </div>
      </main>

      <footer className="login-footer">
        <div className="footer-content">
          <p>© 2026 JBFitness. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default LoginPage;