import { useNavigate } from 'react-router-dom'
import NotificationIcon from '../components/NotificationIcon'
import './Workouts.css'

function Workouts() {
  const navigate = useNavigate()

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
    },
    {
      title: 'Upper Body Power',
      description: 'Intense upper body workout focusing on chest, back, and arms',
      duration: 35,
      calories: 280,
      difficulty: 'Intermediate',
      exercises: 9,
      type: 'Strength',
      equipment: 'Dumbbells, Pull-up Bar'
    },
    {
      title: 'Core Crusher',
      description: 'Targeted core workout for a strong and stable midsection',
      duration: 25,
      calories: 200,
      difficulty: 'Intermediate',
      exercises: 7,
      type: 'Core',
      equipment: 'Mat'
    },
    {
      title: 'Leg Day Blast',
      description: 'Comprehensive lower body workout for strength and power',
      duration: 50,
      calories: 380,
      difficulty: 'Advanced',
      exercises: 11,
      type: 'Strength',
      equipment: 'Barbell, Squat Rack'
    },
    {
      title: 'Morning Stretch',
      description: 'Gentle stretching routine to start your day right',
      duration: 20,
      calories: 80,
      difficulty: 'Beginner',
      exercises: 6,
      type: 'Flexibility',
      equipment: 'Mat'
    },
    {
      title: 'Tabata Intervals',
      description: 'Short bursts of high-intensity exercise with rest periods',
      duration: 20,
      calories: 250,
      difficulty: 'Advanced',
      exercises: 4,
      type: 'Cardio',
      equipment: 'None'
    }
  ]

  const handleStartWorkout = (workout) => {
    console.log('Starting workout:', workout.title)
    // Start workout logic here
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner':
        return '#66bb6a'
      case 'Intermediate':
        return '#ffa726'
      case 'Advanced':
        return '#ef5350'
      default:
        return '#757575'
    }
  }

  return (
    <div className="workouts-page">
      {/* Header */}
      <header className="workouts-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="workouts-title">Workouts</h1>
        <div className="header-right">
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            <span>JD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="workouts-main">
        <div className="page-header">
          <h2>Recommended Workouts</h2>
          <p className="page-subtitle">Choose from a variety of workouts designed to help you reach your fitness goals</p>
        </div>

        <div className="workouts-grid">
          {recommendedWorkouts.map((workout, index) => (
            <div key={index} className="workout-card">
              <div className="workout-card-header">
                <div>
                  <div className="workout-badges">
                    <span 
                      className="difficulty-badge"
                      style={{ backgroundColor: getDifficultyColor(workout.difficulty) + '20', color: getDifficultyColor(workout.difficulty) }}
                    >
                      {workout.difficulty}
                    </span>
                    <span className="type-badge">{workout.type}</span>
                  </div>
                  <h3 className="workout-title">{workout.title}</h3>
                </div>
              </div>
              <p className="workout-description">{workout.description}</p>
              <div className="workout-info">
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{workout.duration} min</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Calories</span>
                  <span className="info-value">{workout.calories} cal</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Exercises</span>
                  <span className="info-value">{workout.exercises}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Equipment</span>
                  <span className="info-value">{workout.equipment}</span>
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


