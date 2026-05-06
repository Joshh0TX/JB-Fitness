import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import './PersonalInfo.css'

function PersonalInfo() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    username: '', email: '', phone: '', dateOfBirth: '',
    gender: '', address: '', city: '', state: '', zipCode: '', country: ''
  })
  const [formData, setFormData] = useState(user)
  const [message, setMessage] = useState('')
  const token = localStorage.getItem('token')

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) { navigate('/login'); return; }

      try {
        const profileRes = await API.get('/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        })

        const profile = profileRes.data || {}
        const userInfo = {
          username: profile.username || profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          country: profile.country || ''
        }

        setUser(userInfo)
        setFormData(userInfo)

        const existing = JSON.parse(localStorage.getItem('user') || '{}')
        localStorage.setItem('user', JSON.stringify({ ...existing, ...userInfo }))
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    };
    fetchProfile()
  }, [navigate, token])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = async () => {
    if (!token) { navigate('/login'); return; }
    try {
      const response = await API.put('/api/users/me', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const saved = response?.data?.user || formData
      const normalizedSaved = {
        username: saved.username || saved.name || '',
        email: saved.email || '',
        phone: saved.phone || '',
        dateOfBirth: saved.dateOfBirth || '',
        gender: saved.gender || '',
        address: saved.address || '',
        city: saved.city || '',
        state: saved.state || '',
        zipCode: saved.zipCode || '',
        country: saved.country || ''
      }
      localStorage.setItem('user', JSON.stringify(normalizedSaved))
      setUser(normalizedSaved)
      setFormData(normalizedSaved)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Failed to save changes')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  return (
    <div className="personal-info-page">
      {/* --- MATURED HEADER --- */}
      <header className="personal-info-header">
        <button className="icon-btn-back" onClick={() => navigate('/settings')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">Personal Info</h1>
      </header>

      <main className="personal-info-main">
        <section className="info-card">
          {message && <div className="message-alert">{message}</div>}

          <div className="info-section">
            <h2 className="card-title">Basic Details</h2>
            <div className="form-grid">
              <div className="form-item">
                <label className="form-label">Full Name</label>
                <input type="text" name="username" value={formData.username} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">Date of Birth</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="form-input">
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2 className="card-title">Address & Location</h2>
            <div className="form-grid">
              <div className="form-item full-width">
                <label className="form-label">Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">State / Region</label>
                <input type="text" name="state" value={formData.state} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-item">
                <label className="form-label">Country</label>
                <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="form-input" />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn-save-profile" onClick={handleSave}>Save Changes</button>
            <button className="btn-cancel-profile" onClick={() => setFormData(user)}>Reset</button>
          </div>
        </section>
        
        <div className="settings-bottom-spacer"></div>
      </main>
    </div>
  )
}

export default PersonalInfo