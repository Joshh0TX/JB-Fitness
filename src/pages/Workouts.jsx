import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import API from '../api'
import './Workouts.css'

function Workouts({ setSummaryData }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])
  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Selected exercise states
  const [selectedExercise, setSelectedExercise] = useState(null)
  const [reps, setReps] = useState(0)
  const [estimatedCalories, setEstimatedCalories] = useState(0)

  // 🔹 Fetch saved workouts + weekly summary
  useEffect(() => {
    if (!token) {
      navigate('/api/login')
      return
    }

    const fetchData = async () => {
      try {
        const workoutsRes = await API.get('/api/workouts', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setSavedWorkouts(workoutsRes.data ?? [])

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
    setEstimatedCalories(0)
  }

  // 🔹 Update reps and calculate calories
  const handleRepsChange = async (newReps) => {
    setReps(newReps)

    if (newReps > 0 && selectedExercise) {
      try {
        const response = await API.post('/api/exercises/calculate-calories', {
          exerciseName: selectedExercise.name,
          reps: newReps
        }, {
          headers: { Authorization: `Bearer ${token}` }
        })

        setEstimatedCalories(response.data.calories || 0)
      } catch (error) {
        console.error('Calorie calculation error:', error)
      }
    } else {
      setEstimatedCalories(0)
    }
  }

  // 🔹 Add workout with selected exercise and reps
  const handleAddWorkout = async () => {
    if (!selectedExercise || reps <= 0) {
      setError('Please select an exercise and enter reps')
      return
    }

    if (!token) {
      alert('Session expired. Please log in again.')
      navigate('/api/login')
      return
    }

    try {
      await API.post(
        '/api/workouts/start',
        {
          title: `${selectedExercise.name} (${reps} reps)`,
          duration: Math.ceil(reps / 10), // estimate duration: 1 min per 10 reps
          calories_burned: estimatedCalories,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      alert(`✅ ${selectedExercise.name} with ${reps} reps added! (${estimatedCalories} cal burned)`)

      // Reset form
      setSearchQuery('')
      setSearchResults([])
      setSelectedExercise(null)
      setReps(0)
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

  return (
    <div className="workouts-page">
      <header className="workouts-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          ←
        </button>
        <h1 className="workouts-title">Workouts</h1>
        <div className="header-right">
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            JD
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

              {/* Reps Counter */}
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
                disabled={reps === 0}
              >
                Log Workout
              </button>
            </div>
          </section>
        )}

        {/* Today's Workouts */}
        <section className="todays-workouts-section">
          <h2>Today's Workouts ({savedWorkouts.length})</h2>
          {savedWorkouts.length === 0 ? (
            <p className="no-workouts">No workouts logged yet. Search above to add!</p>
          ) : (
            <div className="workouts-list">
              {savedWorkouts.map((workout) => (
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
