import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api'
import Logo from '../components/Logo'
import HistoryCalendarModal from '../components/HistoryCalendarModal'
import { notify } from '../components/appNotifications'
import './Workouts.css'

function Workouts({ setSummaryData }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [userInitials, setUserInitials] = useState('JD')
  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [showCalendar, setShowCalendar] = useState(false)
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0])
  const [allWorkouts, setAllWorkouts] = useState([])
  const [historyWorkouts, setHistoryWorkouts] = useState([])
  
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [reps, setReps] = useState(0)
  const [distance, setDistance] = useState(0)
  const [distanceUnit, setDistanceUnit] = useState('km')
  const [estimatedCalories, setEstimatedCalories] = useState(0)

  const isCardioDistance = selectedExercise && (
    selectedExercise.name.toLowerCase().includes('running') ||
    selectedExercise.name.toLowerCase().includes('swimming')
  )

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const user = JSON.parse(userStr)
      const name = user.username || user.name || 'User'
      setUserInitials(name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2))
    }

    const fetchData = async () => {
      try {
        const workoutsRes = await API.get('/api/workouts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        // ✅ Ensure we are only saving an array
        const workoutsData = Array.isArray(workoutsRes.data) ? workoutsRes.data : []
        setSavedWorkouts(workoutsData)
        setAllWorkouts(workoutsData) 

        const weeklyRes = await API.get('/api/workouts/weekly-summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setWeeklySummary(Array.isArray(weeklyRes.data) ? weeklyRes.data : [])
      } catch (error) {
        console.error('Failed to fetch workouts:', error)
        setAllWorkouts([]) // Safety default on error
      }
    }
    fetchData()
  }, [token])

  const searchExercises = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) { setError('Enter exercise name'); return; }
    setLoading(true); setError(''); setSearchResults([]);
    try {
      const res = await API.post('/api/exercises/search', { query: searchQuery })
      setSearchResults(res.data.results || [])
    } catch (err) { setError('Search failed'); } finally { setLoading(false); }
  }

  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise); setReps(0); setDistance(0); setEstimatedCalories(0);
  }

  const calculateCalories = async (repValue, distanceValue) => {
    if (!selectedExercise) return;
    try {
      const bodyData = { exerciseName: selectedExercise.name }
      if (isCardioDistance) { bodyData.distance = distanceValue; bodyData.distanceUnit = distanceUnit; }
      else { bodyData.reps = repValue; }

      const res = await API.post('/api/exercises/calculate-calories', bodyData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEstimatedCalories(res.data.calories || 0)
    } catch (e) { setEstimatedCalories(0); }
  }

  const handleAddWorkout = async () => {
    if (!selectedExercise || (!isCardioDistance && reps <= 0) || (isCardioDistance && distance <= 0)) {
      setError('Complete fields'); return;
    }
    try {
      const title = isCardioDistance ? `${selectedExercise.name} (${distance} ${distanceUnit})` : `${selectedExercise.name} (${reps} reps)`
      const duration = isCardioDistance ? Math.ceil(distance * 10) : Math.ceil(reps / 10)

      await API.post('/api/workouts/start', { title, duration, calories_burned: estimatedCalories }, 
        { headers: { Authorization: `Bearer ${token}` } })

      notify('Workout logged!', 'success')
      setSearchQuery(''); setSelectedExercise(null); fetchSummaries();
    } catch (e) { setError('Failed to add'); }
  }

  const deleteWorkout = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await API.delete(`/api/workouts/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      setSavedWorkouts(p => p.filter(w => w.id !== id))
    } catch (e) { notify('Error deleting', 'error'); }
  }

  const handleHistoryDateSelect = (dateStr) => {
    setHistoryDate(dateStr)
    setHistoryWorkouts(allWorkouts.filter(w => (w.created_at?.split('T')[0]) === dateStr))
  }

  const workoutsByDate = {}
  if (Array.isArray(allWorkouts)) {
    allWorkouts.forEach(w => {
      const workoutDate = w.created_at ? w.created_at.split('T')[0] : null
      if (workoutDate) {
        workoutsByDate[workoutDate] = true
      }
    })
  }

  return (
    <div className="workouts-page">
      <header className="workouts-header">
        <button className="icon-btn-back" onClick={() => navigate("/dashboard")}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <h1 className="page-title">Workouts</h1>
        <div className="header-right">
          <div className="profile-initials-circle" onClick={() => navigate('/settings')}>{userInitials}</div>
        </div>
      </header>

      <main className="workouts-content">
        {/* --- WEEKLY PROGRESS HERO --- */}
        <section className="weekly-progress-hero">
          <div className="progress-card">
            <h3>Weekly Activity</h3>
            <div className="progress-grid">
              {weeklySummary.map((day, i) => (
                <div key={i} className="progress-day">
                  <span className="day-name">{new Date(day.day).toLocaleDateString('en-US', { weekday: 'S' })}</span>
                  <div className={`progress-bar ${day.totalWorkouts > 0 ? 'active' : ''}`}>
                    <div className="fill" style={{ height: `${Math.min(day.totalWorkouts * 20, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SEARCH SECTION --- */}
        <section className="search-container">
          <form onSubmit={searchExercises} className="modern-search-bar">
            <input 
              type="text" 
              placeholder="Search exercises (e.g. Push ups)" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <button type="submit">{loading ? '...' : 'Find'}</button>
          </form>

          {searchResults.length > 0 && !selectedExercise && (
            <div className="results-dropdown">
              {searchResults.map((res, i) => (
                <div key={i} className="workout-result-item" onClick={() => handleSelectExercise(res)}>
                  <div className="res-info">
                    <h4>{res.name}</h4>
                    <span>{res.muscle} • {res.difficulty}</span>
                  </div>
                  <div className="res-plus">+</div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- EXERCISE CONFIGURATION --- */}
        {selectedExercise && (
          <section className="exercise-config-card">
            <div className="config-header">
              <h3>{selectedExercise.name}</h3>
              <button className="close-config" onClick={() => setSelectedExercise(null)}>✕</button>
            </div>

            {!isCardioDistance ? (
              <div className="tactile-counter">
                <button onClick={() => { const n = Math.max(0, reps-1); setReps(n); calculateCalories(n, 0); }}>−</button>
                <div className="counter-display">
                  <span>{reps}</span>
                  <label>Reps</label>
                </div>
                <button onClick={() => { const n = reps+1; setReps(n); calculateCalories(n, 0); }}>+</button>
              </div>
            ) : (
              <div className="distance-config">
                <input 
                  type="number" 
                  value={distance} 
                  onChange={(e) => { const v = parseFloat(e.target.value) || 0; setDistance(v); calculateCalories(0, v); }}
                />
                <select value={distanceUnit} onChange={(e) => setDistanceUnit(e.target.value)}>
                  <option value="km">km</option>
                  <option value="miles">mi</option>
                </select>
              </div>
            )}

            <div className="config-footer">
              <div className="cal-preview">{estimatedCalories} <span>kcal</span></div>
              <button className="btn-log-workout" onClick={handleAddWorkout}>Log Workout</button>
            </div>
          </section>
        )}

        {/* --- LOGGED WORKOUTS --- */}
        <section className="workout-log-list">
          <div className="log-header">
            <h3>Recent Activity</h3>
            {/* UPDATED BUTTON WITH ICON */}
    <button className="history-btn-small" onClick={() => setShowCalendar(true)}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      History
    </button>
  
          </div>
          <div className="list-wrapper">
            {(showCalendar ? historyWorkouts : savedWorkouts).map(w => (
              <div key={w.id} className="workout-log-card">
                <div className="log-icon">🔥</div>
                <div className="log-details">
                  <h4>{w.title}</h4>
                  <p>{w.duration} min • {w.calories_burned} kcal</p>
                </div>
                <button className="btn-del" onClick={() => deleteWorkout(w.id)}>
                   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {showCalendar && (
          <HistoryCalendarModal 
            isOpen={showCalendar} 
            onClose={() => setShowCalendar(false)}
            selectedDate={historyDate}
            onDateSelect={handleHistoryDateSelect}
            hasDataByDate={workoutsByDate}
          />
        )}
      </main>
    </div>
  )
}

export default Workouts