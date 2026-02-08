import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import NotificationIcon from '../components/NotificationIcon'
import API from '../api'
import './Workouts.css'

function Workouts({ setSummaryData }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  const [savedWorkouts, setSavedWorkouts] = useState([])
  const [weeklySummary, setWeeklySummary] = useState([])

  const recommendedWorkouts = [
    {
      title: 'Full Body Strength',
      description: 'Complete strength training routine targeting all major muscle groups',
      duration: 45,
      calories: 320,
      difficulty: 'Intermediate',
      exercises: 10,
      type: 'Strength',
      equipment: 'Dumbbells, Bench'
    },
    {
      title: 'HIIT Cardio Blast',
      description: 'High-intensity interval training for maximum calorie burn',
      duration: 30,
      calories: 400,
      difficulty: 'Advanced',
      exercises: 8,
      type: 'Cardio',
      equipment: 'None'
    },
    {
      title: 'Yoga Flow',
      description: 'Gentle yoga sequence for flexibility and relaxation',
      duration: 40,
      calories: 150,
      difficulty: 'Beginner',
      exercises: 12,
      type: 'Flexibility',
      equipment: 'Yoga Mat'
    }
  ]

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#66bb6a'
      case 'Intermediate': return '#ffa726'
      case 'Advanced': return '#ef5350'
      default: return '#757575'
    }
  }

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

  // 🔹 Start workout (save to backend)
  const handleStartWorkout = async (workout) => {
    if (!token) {
      alert('Session expired. Please log in again.')
      navigate('/api/login')
      return
    }

    try {
      // recommendedWorkouts don't have ids; send useful fields.
      await API.post(
        '/api/workouts/start',
        {
          // Backend expects { title, duration, calories_burned }
          title: workout.title,
          duration: workout.duration,
          calories_burned: workout.calories,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      alert('Workout added to today')

      // Refresh weekly summary
      const weeklyRes = await API.get('/api/workouts/weekly-summary', {
        headers: { Authorization: `Bearer ${token}` },
      })

      const updatedSummary = weeklyRes.data ?? []
      setWeeklySummary(updatedSummary)

      // Update dashboard summary if provided (route doesn't pass it today)
      const totalWorkoutsThisWeek = updatedSummary.reduce(
        (sum, day) => sum + (day.count ?? day.totalWorkouts ?? 0),
        0,
      )

      if (typeof setSummaryData === 'function') {
        setSummaryData((prev) => ({
          ...prev,
          workouts: {
            current: totalWorkoutsThisWeek,
            goal: 5,
            label: 'Workouts',
          },
        }))
      }
    } catch (error) {
      console.error('Failed to start workout:', error)
      alert(error.response?.data?.message || 'Failed to start workout')
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
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            JD
          </div>
        </div>
      </header>

      <main className="workouts-main">
        <div className="page-header">
          <h2>Recommended Workouts</h2>
          <p className="page-subtitle">
            Choose from a variety of workouts designed to help you reach your fitness goals
          </p>
        </div>

        <div className="workouts-grid">
          {recommendedWorkouts.map((workout, index) => (
            <div key={index} className="workout-card">
              <div className="workout-card-header">
                <div className="workout-badges">
                  <span
                    className="difficulty-badge"
                    style={{
                      backgroundColor: getDifficultyColor(workout.difficulty) + '20',
                      color: getDifficultyColor(workout.difficulty)
                    }}
                  >
                    {workout.difficulty}
                  </span>
                  <span className="type-badge">{workout.type}</span>
                </div>
                <h3 className="workout-title">{workout.title}</h3>
              </div>

              <p className="workout-description">{workout.description}</p>

              <div className="workout-info">
                <div className="info-item">
                  <span>Duration</span>
                  <span>{workout.duration} min</span>
                </div>
                <div className="info-item">
                  <span>Calories</span>
                  <span>{workout.calories} cal</span>
                </div>
                <div className="info-item">
                  <span>Exercises</span>
                  <span>{workout.exercises}</span>
                </div>
                <div className="info-item">
                  <span>Equipment</span>
                  <span>{workout.equipment}</span>
                </div>
              </div>

              <button
                className="start-workout-btn"
                onClick={() => handleStartWorkout(workout)}
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Workouts
