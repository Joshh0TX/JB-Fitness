import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import SignInPage from './pages/SignInPage/SignInPage'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Workouts from './pages/Workouts'
import Settings from './pages/Settings'
import History from './pages/History'
import PersonalInfo from './pages/PersonalInfo'
import AppPreferences from './pages/AppPreferences'
import FAQ from './pages/FAQ'
import ContactSupport from './pages/ContactSupport'
import About from './pages/About'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Badges from './pages/Badges'
import AppNotificationCenter from './components/AppNotificationCenter'
import './App.css'

function App() {
  const location = useLocation()

  // Load saved theme preference on app startup
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const isAuthPage =
        location.pathname === '/login' ||
        location.pathname === '/signin' ||
        location.pathname === '/signup'

      if (!token || isAuthPage) {
        document.documentElement.setAttribute('data-theme', 'light')
        document.body.setAttribute('data-theme', 'light')
        return
      }

      const prefsStr = localStorage.getItem('appPreferences')
      if (prefsStr) {
        const prefs = JSON.parse(prefsStr)
        const theme = prefs.theme === 'dark' ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.body.setAttribute('data-theme', theme)
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
        document.body.setAttribute('data-theme', 'light')
      }
    } catch (error) {
      console.error('Failed to load theme preference:', error)
      document.documentElement.setAttribute('data-theme', 'light')
      document.body.setAttribute('data-theme', 'light')
    }
  }, [location.pathname])

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<SignInPage />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/nutrition" element={<Nutrition />} />
        <Route path="/workouts" element={<Workouts />} />
        <Route path="/badges" element={<Badges />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/personal-info" element={<PersonalInfo />} />
        <Route path="/app-preferences" element={<AppPreferences />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/about" element={<About />} />
        <Route path="/history" element={<History />} />
      </Routes>
      <AppNotificationCenter />
    </>
  )
}

export default App


