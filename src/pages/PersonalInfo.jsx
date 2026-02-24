import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './PersonalInfo.css'

function PersonalInfo() {
  const navigate = useNavigate()
  const [user, setUser] = useState({
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(user)
  const [message, setMessage] = useState('')

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const userInfo = {
          username: userData.username || userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth || '',
          gender: userData.gender || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          zipCode: userData.zipCode || '',
          country: userData.country || ''
        }
        setUser(userInfo)
        setFormData(userInfo)
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error)
    }
  }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSave = () => {
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const userData = JSON.parse(userStr)
        const updatedUser = { ...userData, ...formData }
        localStorage.setItem('user', JSON.stringify(updatedUser))
        setUser(formData)
        setIsEditing(false)
        setMessage('Profile updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      console.error('Failed to save user:', error)
      setMessage('Failed to save changes')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleCancel = () => {
    setFormData(user)
    setIsEditing(false)
  }

  return (
    <div className="personal-info-page page-animate">
      <header className="personal-info-header">
        <button
          className="back-button"
          onClick={() => navigate('/settings')}
        >
          <span className="back-arrow">←</span>
        </button>
        <h1 className="page-title">Personal Information</h1>
      </header>

      <main className="personal-info-main">
        <div className="info-card">
          {message && <div className="message-alert">{message}</div>}

          {!isEditing ? (
            <>
              <div className="info-section">
                <h2 className="section-title">Basic Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label className="info-label">Name</label>
                    <p className="info-value">{user.username || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Email</label>
                    <p className="info-value">{user.email || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Phone</label>
                    <p className="info-value">{user.phone || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Date of Birth</label>
                    <p className="info-value">{user.dateOfBirth || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Gender</label>
                    <p className="info-value">{user.gender || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h2 className="section-title">Address</h2>
                <div className="info-grid">
                  <div className="info-item full-width">
                    <label className="info-label">Street Address</label>
                    <p className="info-value">{user.address || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">City</label>
                    <p className="info-value">{user.city || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">State</label>
                    <p className="info-value">{user.state || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Zip Code</label>
                    <p className="info-value">{user.zipCode || 'Not set'}</p>
                  </div>
                  <div className="info-item">
                    <label className="info-label">Country</label>
                    <p className="info-value">{user.country || 'Not set'}</p>
                  </div>
                </div>
              </div>

              <button
                className="edit-button"
                onClick={() => setIsEditing(true)}
              >
                Edit Information
              </button>
            </>
          ) : (
            <>
              <div className="info-section">
                <h2 className="section-title">Basic Information</h2>
                <div className="form-grid">
                  <div className="form-item">
                    <label htmlFor="username" className="form-label">
                      Name
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="phone" className="form-label">
                      Phone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="dateOfBirth" className="form-label">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="gender" className="form-label">
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-input"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer-not-to-say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h2 className="section-title">Address</h2>
                <div className="form-grid">
                  <div className="form-item full-width">
                    <label htmlFor="address" className="form-label">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="city" className="form-label">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="state" className="form-label">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="zipCode" className="form-label">
                      Zip Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-item">
                    <label htmlFor="country" className="form-label">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button className="save-button" onClick={handleSave}>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default PersonalInfo
