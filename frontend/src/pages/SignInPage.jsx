import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import LoginForm from './LoginForm';
import ForgotRequestForm from './ForgetRequestForm';
import ResetPasswordForm from './ResetPasswordForm';
import './SignInPage.css';

function SignInPage() {
  const navigate = useNavigate();
  // State to track which form to show: 'login', 'request', or 'reset'
  const [currentStep, setCurrentStep] = useState('login');
  
  // State to pass data between the forgot password steps
  const [resetData, setResetData] = useState({ email: '', challengeId: '' });

  return (
    <div className="signin-page page-animate">
      {/* Header */}
      <header className="signin-header">
        <div className="header-left">
          <Logo />
        </div>
        <nav className="header-nav">
          <button
            type="button"
            className="nav-link-button"
            onClick={() => navigate('/about', { state: { from: '/signin' } })}
          >
            About
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="signin-main">
        <div className="signin-card">
          
          {currentStep === 'login' && (
            <LoginForm 
              onForgotClick={() => setCurrentStep('request')} 
            />
          )}

          {currentStep === 'request' && (
            <ForgotRequestForm 
              onBack={() => setCurrentStep('login')}
              onSuccess={(email, challengeId) => {
                setResetData({ email, challengeId });
                setCurrentStep('reset');
              }}
            />
          )}

          {currentStep === 'reset' && (
            <ResetPasswordForm 
              initialEmail={resetData.email}
              initialChallengeId={resetData.challengeId}
              onCancel={() => setCurrentStep('login')}
              onSuccess={() => setCurrentStep('login')}
            />
          )}

        </div>
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