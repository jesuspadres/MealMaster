import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext.tsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SavedRecipe {
  id: number
  title: string
  image_url: string
}

interface MealPlan {
  id: number
  saved_recipe_id: number
  date: string
  meal_type: string
  servings: number
  recipe_title: string
  recipe_image: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function MealPlannerPage() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([])
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([])
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()))
  const [loading, setLoading] = useState(true)
  const [showRecipeSelector, setShowRecipeSelector] = useState<{ date: string; mealType: string } | null>(null)
  
  const { token, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth' })
      return
    }
    fetchMealPlans()
    fetchSavedRecipes()
  }, [currentWeekStart, isAuthenticated])

  function getMonday(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  function getWeekDates(): Date[] {
    const dates: Date[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart)
      date.setDate(currentWeekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const fetchMealPlans = async () => {
    const weekDates = getWeekDates()
    const startDate = formatDate(weekDates[0])
    const endDate = formatDate(weekDates[6])

    try {
      const response = await fetch(
        `${API_URL}/api/meal-plans/?start_date=${startDate}&end_date=${endDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (response.ok) {
        setMealPlans(await response.json())
      }
    } catch (error) {
      console.error('Error fetching meal plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSavedRecipes = async () => {
  console.log('Fetching saved recipes...')
  try {
    const response = await fetch(`${API_URL}/api/saved-recipes/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    console.log('Response status:', response.status)
    if (response.ok) {
      const data = await response.json()
      console.log('Saved recipes:', data)
      setSavedRecipes(data)
    } else {
      console.log('Failed to fetch recipes')
    }
  } catch (error) {
    console.error('Error fetching saved recipes:', error)
  }
}

  const addMealPlan = async (recipeId: number, date: string, mealType: string) => {
    try {
      const response = await fetch(`${API_URL}/api/meal-plans/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          saved_recipe_id: recipeId,
          date: date,
          meal_type: mealType,
          servings: 1
        })
      })

      if (response.ok) {
        await fetchMealPlans()
        setShowRecipeSelector(null)
      }
    } catch (error) {
      console.error('Error adding meal plan:', error)
    }
  }

  const deleteMealPlan = async (mealPlanId: number) => {
    if (!confirm('Remove this meal?')) return

    try {
      const response = await fetch(`${API_URL}/api/meal-plans/${mealPlanId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setMealPlans(mealPlans.filter(mp => mp.id !== mealPlanId))
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error)
    }
  }

  const getMealForSlot = (date: Date, mealType: string): MealPlan | undefined => {
    return mealPlans.find(mp => mp.date === formatDate(date) && mp.meal_type === mealType)
  }

  const weekDates = getWeekDates()

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">📅 Meal Planner</h1>
            <button
              onClick={() => navigate({ to: '/' })}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              const newDate = new Date(currentWeekStart)
              newDate.setDate(newDate.getDate() - 7)
              setCurrentWeekStart(newDate)
            }}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold">
            {weekDates[0].toLocaleDateString()} - {weekDates[6].toLocaleDateString()}
          </h2>
          <button
            onClick={() => {
              const newDate = new Date(currentWeekStart)
              newDate.setDate(newDate.getDate() + 7)
              setCurrentWeekStart(newDate)
            }}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Next →
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 w-32">Meal</th>
                {weekDates.map((date, idx) => (
                  <th key={idx} className="border p-2">
                    <div className="font-semibold">{DAYS[idx]}</div>
                    <div className="text-xs text-gray-600">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MEAL_TYPES.map(mealType => (
                <tr key={mealType}>
                  <td className="border p-2 bg-gray-50 font-medium capitalize">{mealType}</td>
                  {weekDates.map((date, idx) => {
                    const meal = getMealForSlot(date, mealType)
                    const dateStr = formatDate(date)
                    
                    return (
                      <td key={idx} className="border p-2 h-32 align-top">
                        {meal ? (
                          <div className="relative group">
                            <div className="text-sm font-medium mb-1">{meal.recipe_title}</div>
                            <button
                              onClick={() => deleteMealPlan(meal.id)}
                              className="absolute top-0 right-0 text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowRecipeSelector({ date: dateStr, mealType })}
                            className="w-full h-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            + Add
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recipe Selector Modal */}
      {showRecipeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Select a Recipe</h3>
            {savedRecipes.length === 0 ? (
              <p className="text-gray-600">No saved recipes. Save some recipes first!</p>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {savedRecipes.map(recipe => (
                  <button
                    key={recipe.id}
                    onClick={() => addMealPlan(recipe.id, showRecipeSelector.date, showRecipeSelector.mealType)}
                    className="text-left p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <img src={recipe.image_url} alt={recipe.title} className="w-full h-24 object-cover rounded mb-2" />
                    <div className="font-medium text-sm">{recipe.title}</div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowRecipeSelector(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}