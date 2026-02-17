import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api'
import Logo from '../components/Logo'
import HistoryCalendarModal from '../components/HistoryCalendarModal'
import './Workouts.css'

function Workouts({ setSummaryData }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  // User initials for avatar
  const [userInitials, setUserInitials] = useState('JD')

  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])
  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Calendar history states
  const [showCalendar, setShowCalendar] = useState(false)
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0])
  const [allWorkouts, setAllWorkouts] = useState([]) // All workouts for history
  const [historyWorkouts, setHistoryWorkouts] = useState([]) // Workouts for selected date
  
  // Selected exercise states
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [reps, setReps] = useState(0)
  const [distance, setDistance] = useState(0) // For running/swimming (km or miles)
  const [distanceUnit, setDistanceUnit] = useState('km') // km or miles
  const [estimatedCalories, setEstimatedCalories] = useState(0)

  // Check if selected exercise is running or swimming
  const isCardioDistance = selectedExercise && (
    selectedExercise.name.toLowerCase().includes('running') ||
    selectedExercise.name.toLowerCase().includes('swimming')
  )

  // 🔹 Fetch saved workouts + weekly summary
  useEffect(() => {
    if (!token) {
      navigate('/api/login')
      return
    }

    // 🔹 Get user initials from localStorage
    try {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        const user = JSON.parse(userStr)
        const username = user.username || user.name || 'User'
        const initials = username
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
        setUserInitials(initials || 'JD')
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage:', error)
    }

    const fetchData = async () => {
      try {
        const workoutsRes = await API.get('/api/workouts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const workoutsData = workoutsRes.data ?? []
        setSavedWorkouts(workoutsData)
        setAllWorkouts(workoutsData) // Store all workouts for history

        const weeklyRes = await API.get('/api/workouts/weekly-summary', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setWeeklySummary(weeklyRes.data ?? [])
      } catch (error) {
        console.error('Failed to fetch workouts:', error)
      }
    }

    fetchData()
  }, [navigate, token])

  // 🔹 Search for exercises
  const searchExercises = async (e) => {
    e.preventDefault()
    
    if (!searchQuery.trim()) {
      setError('Please enter an exercise name')
      return
    }

    setLoading(true)
    setError('')
    setSearchResults([])
    setSelectedExercise(null)
    setReps(0)
    setEstimatedCalories(0)

    try {
      const response = await API.post('/api/exercises/search', {
        query: searchQuery
      })

      if (response.data.results && response.data.results.length > 0) {
        setSearchResults(response.data.results)
      } else {
        setError('No exercises found. Try a different search.')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError(err.response?.data?.message || 'Failed to search exercises. Try again.')
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Select an exercise and update rep counter
  const handleSelectExercise = (exercise) => {
    setSelectedExercise(exercise)
    setReps(0)
    setDistance(0)
    setDistanceUnit('km')
    setEstimatedCalories(0)
  }

  // 🔹 Update reps/distance and calculate calories
  const handleRepsChange = async (newReps) => {
    setReps(newReps)
    calculateCalories(newReps, 0) // distance = 0 for reps-based exercises
  }

  const handleDistanceChange = async (newDistance) => {
    setDistance(newDistance)
    calculateCalories(0, newDistance) // reps = 0 for distance-based exercises
  }

  // Calculate calories based on exercise type
  const calculateCalories = async (repValue, distanceValue) => {
    if (!selectedExercise) {
      setEstimatedCalories(0)
      return
    }

    try {
      const bodyData = {
        exerciseName: selectedExercise.name
      }

      if (isCardioDistance && distanceValue > 0) {
        // For running/swimming: use distance
        bodyData.distance = distanceValue
        bodyData.distanceUnit = distanceUnit
      } else if (!isCardioDistance && repValue > 0) {
        // For reps-based exercises
        bodyData.reps = repValue
      } else {
        setEstimatedCalories(0)
        return
      }

      const response = await API.post('/api/exercises/calculate-calories', bodyData, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setEstimatedCalories(response.data.calories || 0)
    } catch (error) {
      console.error('Calorie calculation error:', error)
      setEstimatedCalories(0)
    }
  }

  // 🔹 Add workout with selected exercise and reps/distance
  const handleAddWorkout = async () => {
    if (!selectedExercise) {
      setError('Please select an exercise')
      return
    }

    // Validate based on exercise type
    if (isCardioDistance) {
      if (distance <= 0) {
        setError('Please enter a valid distance')
        return
      }
    } else {
      if (reps <= 0) {
        setError('Please select an exercise and enter reps')
        return
      }
    }

    if (!token) {
      alert('Session expired. Please log in again.')
      navigate('/api/login')
      return
    }

    try {
      // Build title based on exercise type
      let title
      if (isCardioDistance) {
        title = `${selectedExercise.name} (${distance} ${distanceUnit})`
      } else {
        title = `${selectedExercise.name} (${reps} reps)`
      }

      const estimatedDuration = isCardioDistance ? Math.ceil(distance * 10) : Math.ceil(reps / 10)

      await API.post(
        '/api/workouts/start',
        {
          title: title,
          duration: estimatedDuration,
          calories_burned: estimatedCalories,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      const exerciseDesc = isCardioDistance
        ? `${selectedExercise.name} - ${distance} ${distanceUnit}`
        : `${selectedExercise.name} - ${reps} reps`

      alert(`✅ ${exerciseDesc} added! (${estimatedCalories} cal burned)`)

      // Reset form
      setSearchQuery('')
      setSearchResults([])
      setSelectedExercise(null)
      setReps(0)
      setDistance(0)
      setDistanceUnit('km')
      setEstimatedCalories(0)
      setError('')

      // Refresh weekly summary
      const weeklyRes = await API.get('/api/workouts/weekly-summary', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const updatedSummary = weeklyRes.data ?? []
      setWeeklySummary(updatedSummary)

      // Update dashboard summary
      const totalWorkoutsThisWeek = updatedSummary.reduce(
        (sum, day) => sum + (day.totalWorkouts ?? 0),
        0,
      )

      if (typeof setSummaryData === 'function') {
        setSummaryData((prev) => ({
          ...prev,
          workouts: {
            current: totalWorkoutsThisWeek,
            goal: 7,
            label: 'Workouts',
          },
        }))
      }

      // Refresh saved workouts
      const workoutsRes = await API.get('/api/workouts', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSavedWorkouts(workoutsRes.data ?? [])
      // Notify other pages (dashboard) a workout was added
      try {
        window.dispatchEvent(new CustomEvent('workoutAdded', { detail: { exercise: selectedExercise.name, reps, calories: estimatedCalories } }));
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Failed to add workout:', error)
      setError(error.response?.data?.message || 'Failed to add workout')
    }
  }

  // 🔹 Delete workout
  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Delete this workout?')) return

    try {
      await API.delete(`/api/workouts/${workoutId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId))
      setAllWorkouts(prev => prev.filter(w => w.id !== workoutId))

      // Refresh weekly summary
      const weeklyRes = await API.get('/api/workouts/weekly-summary', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setWeeklySummary(weeklyRes.data ?? [])
    } catch (error) {
      console.error('Failed to delete workout:', error)
      alert('Failed to delete workout')
    }
  }

  // 🔹 Handle history date selection from calendar
  const handleHistoryDateSelect = (dateStr) => {
    setHistoryDate(dateStr)
    const workoutsThatDay = allWorkouts.filter(w => {
      const workoutDate = w.created_at ? w.created_at.split('T')[0] : null
      return workoutDate === dateStr
    })
    setHistoryWorkouts(workoutsThatDay)
  }

  // Build object showing which dates have workout data
  const workoutsByDate = {}
  allWorkouts.forEach(w => {
    const workoutDate = w.created_at ? w.created_at.split('T')[0] : null
    if (workoutDate) {
      workoutsByDate[workoutDate] = true
    }
  })

  return (
    <div className="workouts-page">
      <header className="workouts-header">
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ←
        </button>
        <h1 className="workouts-title">Workouts</h1>
        <div className="header-right">
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            {userInitials}
          </div>
        </div>
      </header>

      <main className="workouts-main">
        {/* Search Section */}
        <section className="search-section">
          <div className="page-header">
            <h2>Find & Log Workout</h2>
            <p className="page-subtitle">
              Search for an exercise, set your reps, and track calories burned
            </p>
          </div>

          <form onSubmit={searchExercises} className="search-form">
            <input
              type="text"
              placeholder="Search for an exercise (e.g., sit ups, push ups, running)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-btn" disabled={loading}>
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {error && <p className="error-message">{error}</p>}
        </section>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedExercise && (
          <section className="search-results-section">
            <h2>Found {searchResults.length} Exercise(s)</h2>
            <div className="results-grid">
              {searchResults.map((result, index) => (
                <div key={index} className="result-card">
                  <h4>{result.name}</h4>
                  <p className="exercise-type">{result.type}</p>
                  <div className="exercise-info">
                    <span className="info-badge">{result.muscle}</span>
                    <span className="info-badge">{result.equipment}</span>
                    <span className="info-badge difficulty">{result.difficulty}</span>
                  </div>
                  {result.instructions && (
                    <p className="instructions">{result.instructions}</p>
                  )}
                  <button
                    className="select-exercise-btn"
                    onClick={() => handleSelectExercise(result)}
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Exercise Detail & Rep Counter */}
        {selectedExercise && (
          <section className="exercise-detail-section">
            <div className="exercise-card">
              <button 
                className="back-btn"
                onClick={() => {
                  setSelectedExercise(null)
                  setReps(0)
                  setEstimatedCalories(0)
                }}
              >
                ← Back
              </button>

              <h2>{selectedExercise.name}</h2>
              <div className="exercise-info-grid">
                <div className="info-item">
                  <span className="label">Type</span>
                  <span className="value">{selectedExercise.type}</span>
                </div>
                <div className="info-item">
                  <span className="label">Muscle Group</span>
                  <span className="value">{selectedExercise.muscle}</span>
                </div>
                <div className="info-item">
                  <span className="label">Equipment</span>
                  <span className="value">{selectedExercise.equipment}</span>
                </div>
                <div className="info-item">
                  <span className="label">Difficulty</span>
                  <span className="value">{selectedExercise.difficulty}</span>
                </div>
              </div>

              {selectedExercise.instructions && (
                <div className="instructions-section">
                  <h3>How to perform:</h3>
                  <p>{selectedExercise.instructions}</p>
                </div>
              )}

              {/* Input Section: Reps or Distance based on exercise type */}
              {!isCardioDistance ? (
                /* Reps Counter for strength exercises */
                <div className="reps-section">
                  <h3>Set Your Reps</h3>
                  <div className="rep-counter">
                    <button
                      className="counter-btn"
                      onClick={() => handleRepsChange(Math.max(0, reps - 1))}
                    >
                      −
                    </button>
                    <span className="rep-value">{reps}</span>
                    <button
                      className="counter-btn"
                      onClick={() => handleRepsChange(reps + 1)}
                    >
                      +
                    </button>
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={reps}
                    onChange={(e) => handleRepsChange(parseInt(e.target.value) || 0)}
                    className="rep-input"
                    placeholder="Enter reps"
                  />
                </div>
              ) : (
                /* Distance Input for running/swimming */
                <div className="distance-section">
                  <h3>Set Your Distance</h3>
                  <div className="distance-input-group">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={distance}
                      onChange={(e) => handleDistanceChange(parseFloat(e.target.value) || 0)}
                      className="distance-input"
                      placeholder="Enter distance"
                    />
                    <select 
                      value={distanceUnit} 
                      onChange={(e) => {
                        setDistanceUnit(e.target.value)
                        if (distance > 0) {
                          handleDistanceChange(distance)
                        }
                      }}
                      className="distance-unit"
                    >
                      <option value="km">km</option>
                      <option value="miles">miles</option>
                      <option value="laps">laps</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Calorie Display */}
              {reps > 0 && (
                <div className="calories-summary">
                  <div className="calorie-card">
                    <p className="label">Estimated Calories Burned</p>
                    <p className="calories-value">{estimatedCalories} cal</p>
                  </div>
                </div>
              )}

              {/* Add Workout Button */}
              <button
                className="add-workout-btn"
                onClick={handleAddWorkout}
                disabled={isCardioDistance ? distance === 0 : reps === 0}
              >
                Log Workout
              </button>
            </div>
          </section>
        )}

        {/* Today's Workouts / History */}
        <section className="todays-workouts-section">
          <div className="workouts-section-header">
            <h2>{historyDate === new Date().toISOString().split('T')[0] ? "Today's Workouts" : "Workouts on " + new Date(historyDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ({showCalendar ? historyWorkouts.length : savedWorkouts.length})</h2>
            <button 
              className="history-btn" 
              onClick={() => setShowCalendar(!showCalendar)}
              title="View workout history"
            >
              📅 History
            </button>
          </div>

          {showCalendar && (
            <HistoryCalendarModal 
              isOpen={showCalendar}
              onClose={() => setShowCalendar(false)}
              selectedDate={historyDate}
              onDateSelect={handleHistoryDateSelect}
              hasDataByDate={workoutsByDate}
            />
          )}

          {/* Display either today's workouts or history workouts */}
          {(showCalendar ? historyWorkouts.length === 0 : savedWorkouts.length === 0) ? (
            <p className="no-workouts">No workouts logged yet. Search above to add!</p>
          ) : (
            <div className="workouts-list">
              {(showCalendar ? historyWorkouts : savedWorkouts).map((workout) => (
                <div key={workout.id} className="workout-item">
                  <div className="workout-info">
                    <h4>{workout.title}</h4>
                    <div className="workout-stats">
                      <span>{workout.duration} min</span>
                      <span>{workout.calories_burned} cal</span>
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteWorkout(workout.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly Summary */}
        {weeklySummary.length > 0 && (
          <section className="weekly-summary-section">
            <h2>This Week's Workouts</h2>
            <div className="weekly-grid">
              {weeklySummary.map((day, index) => (
                <div key={index} className="day-card">
                  <p className="day-label">
                    {new Date(day.day).toLocaleDateString('en-US', { weekday: 'short' })}
                  </p>
                  <p className="day-value">{day.totalWorkouts}</p>
                  <p className="day-stat">{day.totalCalories} cal</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default Workouts
