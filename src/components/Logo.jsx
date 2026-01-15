import './Logo.css'

function Logo({ className = '' }) {
  return (
    <div className={`logo-container ${className}`}>
      <div className="logo-icon">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logoGradient)" />
          <path d="M16 8L20 16L16 24L12 16L16 8Z" fill="white" opacity="0.9" />
          <circle cx="16" cy="16" r="3" fill="white" />
          <defs>
            <linearGradient id="logoGradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#66bb6a" />
              <stop offset="50%" stopColor="#4caf50" />
              <stop offset="100%" stopColor="#2e7d32" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="logo-text">JBFitness</span>
      <div className="logo-accent"></div>
    </div>
  )
}

export default Logo


