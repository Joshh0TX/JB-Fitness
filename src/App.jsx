import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import SignInPage from './pages/SignInPage'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Workouts from './pages/Workouts'
import Settings from './pages/Settings'
import History from './pages/History'
import PersonalInfo from './pages/PersonalInfo'
import TwoFactorAuth from './pages/TwoFactorAuth'
import AppPreferences from './pages/AppPreferences'
import './App.css'

function App() {
  const location = useLocation()

  // Load saved theme preference on app startup
  useEffect(() => {
    try {
      const token = localStorage.getItem('token')
      const isAuthPage = location.pathname === '/login' || location.pathname === '/signin'

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
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/nutrition" element={<Nutrition />} />
      <Route path="/workouts" element={<Workouts />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/personal-info" element={<PersonalInfo />} />
      <Route path="/two-factor-auth" element={<TwoFactorAuth />} />
      <Route path="/app-preferences" element={<AppPreferences />} />
      <Route path="/history" element={<History />} />
    </Routes>
  )
}

export default App


