import { useNavigate } from 'react-router-dom'
import NotificationIcon from '../components/NotificationIcon'
import './Nutrition.css'

function Nutrition() {
  const navigate = useNavigate()

  const recommendedMeals = [
    {
      title: 'Mediterranean Quinoa Bowl',
      description: 'A balanced meal with quinoa, vegetables, and healthy fats',
      calories: 420,
      protein: 18,
      carbs: 55,
      fats: 12,
      category: 'Lunch',
      prepTime: '25 min'
    },
    {
      title: 'Overnight Oats with Berries',
      description: 'High-fiber breakfast with protein and antioxidants',
      calories: 320,
      protein: 12,
      carbs: 48,
      fats: 8,
      category: 'Breakfast',
      prepTime: '5 min'
    },
    {
      title: 'Grilled Salmon with Vegetables',
      description: 'Lean protein with roasted seasonal vegetables',
      calories: 450,
      protein: 38,
      carbs: 25,
      fats: 20,
      category: 'Dinner',
      prepTime: '30 min'
    },
    {
      title: 'Greek Yogurt Parfait',
      description: 'Protein-rich snack with fresh fruits and granola',
      calories: 280,
      protein: 20,
      carbs: 35,
      fats: 6,
      category: 'Snack',
      prepTime: '5 min'
    },
    {
      title: 'Chicken and Vegetable Stir-Fry',
      description: 'Quick and nutritious meal with lean chicken and colorful veggies',
      calories: 380,
      protein: 35,
      carbs: 32,
      fats: 12,
      category: 'Dinner',
      prepTime: '20 min'
    },
    {
      title: 'Avocado Toast with Eggs',
      description: 'Healthy fats and protein to start your day',
      calories: 350,
      protein: 18,
      carbs: 28,
      fats: 18,
      category: 'Breakfast',
      prepTime: '10 min'
    },
    {
      title: 'Turkey and Hummus Wrap',
      description: 'Lean protein wrap with vegetables and hummus',
      calories: 390,
      protein: 28,
      carbs: 42,
      fats: 12,
      category: 'Lunch',
      prepTime: '10 min'
    },
    {
      title: 'Protein Smoothie Bowl',
      description: 'Refreshing smoothie bowl with protein powder and toppings',
      calories: 310,
      protein: 25,
      carbs: 38,
      fats: 6,
      category: 'Breakfast',
      prepTime: '8 min'
    }
  ]

  const handleAddMeal = (meal) => {
    console.log('Adding meal:', meal.title)
    // Add to today's meals logic here
  }

  return (
    <div className="nutrition-page">
      {/* Header */}
      <header className="nutrition-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <span className="back-arrow">←</span>
        </button>
        <h1 className="nutrition-title">Nutrition</h1>
        <div className="header-right">
          <NotificationIcon />
          <div className="profile-icon" onClick={() => navigate('/settings')}>
            <span>JD</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="nutrition-main">
        <div className="page-header">
          <h2>Recommended Meals</h2>
          <p className="page-subtitle">Discover healthy meal options tailored to your fitness goals</p>
        </div>

        <div className="meals-grid">
          {recommendedMeals.map((meal, index) => (
            <div key={index} className="meal-card">
              <div className="meal-card-header">
                <div>
                  <span className="meal-category">{meal.category}</span>
                  <h3 className="meal-title">{meal.title}</h3>
                </div>
                <span className="prep-time">{meal.prepTime}</span>
              </div>
              <p className="meal-description">{meal.description}</p>
              <div className="meal-nutrition">
                <div className="nutrition-item">
                  <span className="nutrition-label">Calories</span>
                  <span className="nutrition-value">{meal.calories}</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Protein</span>
                  <span className="nutrition-value">{meal.protein}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Carbs</span>
                  <span className="nutrition-value">{meal.carbs}g</span>
                </div>
                <div className="nutrition-item">
                  <span className="nutrition-label">Fats</span>
                  <span className="nutrition-value">{meal.fats}g</span>
                </div>
              </div>
              <button 
                className="add-meal-btn"
                onClick={() => handleAddMeal(meal)}
              >
                Add to Today
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default Nutrition


