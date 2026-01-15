import { useNavigate } from 'react-router-dom'
import NotificationIcon from '../components/NotificationIcon'
import Logo from '../components/Logo'
import './Dashboard.css'

function Dashboard() {
  const navigate = useNavigate()

  const summaryData = {
    calories: { current: 1850, goal: 2200, label: 'Cal' },
    workouts: { current: 4, goal: 5, label: 'Workouts' },
    water: { current: 6, goal: 8, label: 'Glasses' }
  }

  const weeklyData = [
    { day: 'Mon', burned: 2800, consumed: 2100 },
    { day: 'Tue', burned: 3000, consumed: 2200 },
    { day: 'Wed', burned: 3200, consumed: 2000 },
    { day: 'Thu', burned: 3400, consumed: 2300 },
    { day: 'Fri', burned: 2900, consumed: 2100 },
    { day: 'Sat', burned: 2500, consumed: 1900 },
    { day: 'Sun', burned: 2400, consumed: 1850 }
  ]

  const savedWorkouts = [
    {
      title: 'Upper Body Strength',
      description: '45 minutes - 8 exercises',
      calories: 250,
      duration: 45
    },
    {
      title: 'HIIT Cardio Blast',
      description: '30 minutes - 6 exercises',
      calories: 300,
      duration: 30
    }
  ]

  const savedMeals = [
    {
      title: 'Protein Power Bowl',
      description: 'Lunch - High Protein',
      calories: 450,
      protein: 35,
      carbs: 22
    },
    {
      title: 'Green Smoothie',
      description: 'Breakfast - Low Cal',
      calories: 280,
      protein: 8,
      carbs: 32
    },
    {
      title: 'Grilled Chicken Salad',
      description: 'Dinner - Balanced',
      calories: 380,
      protein: 42,
      carbs: 18
    }
  ]

  const calculateProgress = (current, goal) => {
    return Math.min((current / goal) * 100, 100)
  }

  const maxCalories = Math.max(...weeklyData.map(d => Math.max(d.burned, d.consumed)))

  return (
    <div className="dashboard page-animate">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <Logo />
        </div>
        <div className="header-tabs">
          <button
            className="tab"
            onClick={() => navigate('/nutrition')}
          >
            Nutrition
          </button>
          <button
            className="tab"
            onClick={() => navigate('/workouts')}
          >
            Workout
          </button>
        </div>
        <div className="header-right">
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            <span>JD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-header">
              <h3>Daily Calories</h3>
              <span className="card-icon">{summaryData.calories.label}</span>
            </div>
            <div className="card-content">
              <div className="card-value">
                <span className="current">{summaryData.calories.current}</span>
                <span className="goal">of {summaryData.calories.goal} goal</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${calculateProgress(summaryData.calories.current, summaryData.calories.goal)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-header">
              <h3>Workouts This Week</h3>
              <span className="card-icon">{summaryData.workouts.label}</span>
            </div>
            <div className="card-content">
              <div className="card-value">
                <span className="current">{summaryData.workouts.current}</span>
                <span className="goal">of {summaryData.workouts.goal} planned</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${calculateProgress(summaryData.workouts.current, summaryData.workouts.goal)}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-header">
              <h3>Water Intake</h3>
              <span className="card-icon">{summaryData.water.label}</span>
            </div>
            <div className="card-content">
              <div className="card-value">
                <span className="current">{summaryData.water.current}</span>
                <span className="goal">of {summaryData.water.goal} glasses</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${calculateProgress(summaryData.water.current, summaryData.water.goal)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress Graph */}
        <div className="weekly-progress">
          <h2 className="section-title">Weekly Progress</h2>
          <div className="graph-container">
            <div className="graph-legend">
              <div className="legend-item">
                <span className="legend-line burned"></span>
                <span>Calories Burned</span>
              </div>
              <div className="legend-item">
                <span className="legend-line consumed"></span>
                <span>Calories Consumed</span>
              </div>
            </div>
            <div className="graph">
              <div className="graph-y-axis">
                {[0, 2000, 2500, 3000, 3500].map(value => (
                  <div key={value} className="y-tick">{value}</div>
                ))}
              </div>
              <div className="graph-content">
                <svg className="graph-svg" viewBox="0 0 700 200" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 50, 100, 150, 200].map((y, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={y}
                      x2="700"
                      y2={y}
                      stroke="#f5f5f5"
                      strokeWidth="1"
                    />
                  ))}
                  {/* Calories Burned Line */}
                  <polyline
                    points={weeklyData.map((d, i) => `${(i * 100) + 50},${200 - (d.burned / maxCalories) * 180}`).join(' ')}
                    fill="none"
                    stroke="#424242"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Calories Consumed Line */}
                  <polyline
                    points={weeklyData.map((d, i) => `${(i * 100) + 50},${200 - (d.consumed / maxCalories) * 180}`).join(' ')}
                    fill="none"
                    stroke="#bdbdbd"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="graph-x-axis">
                  {weeklyData.map((d, i) => (
                    <div key={i} className="x-tick">{d.day}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Workouts */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Saved Workouts</h2>
            <a href="#view-all" className="view-all-link">View all</a>
          </div>
          <div className="workout-cards">
            {savedWorkouts.map((workout, index) => (
              <div key={index} className="workout-card">
                <div className="workout-header">
                  <h3>{workout.title}</h3>
                  <span className="options-icon">⋮</span>
                </div>
                <p className="workout-description">{workout.description}</p>
                <div className="workout-stats">
                  <span className="stat">
                    <span className="stat-label">Calories:</span>
                    {workout.calories} cal
                  </span>
                  <span className="stat">
                    <span className="stat-label">Duration:</span>
                    {workout.duration} min
                  </span>
                </div>
                <button className="workout-btn">Start Workout</button>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Meals */}
        <div className="saved-section">
          <div className="section-header">
            <h2 className="section-title">Saved Meals</h2>
            <a href="#view-all" className="view-all-link">View all</a>
          </div>
          <div className="meal-cards">
            {savedMeals.map((meal, index) => (
              <div key={index} className="meal-card">
                <h3>{meal.title}</h3>
                <p className="meal-description">{meal.description}</p>
                <div className="meal-stats">
                  <span className="stat">
                    <span className="stat-label">Calories:</span>
                    {meal.calories} cal
                  </span>
                  <span className="stat">
                    <span className="stat-label">Protein:</span>
                    {meal.protein}g
                  </span>
                  <span className="stat">
                    <span className="stat-label">Carbs:</span>
                    {meal.carbs}g
                  </span>
                </div>
                <button className="meal-btn">Add to Today</button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard


