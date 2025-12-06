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

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAYS_FULL = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍿'
}
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#FFE500',
  lunch: '#00D4FF',
  dinner: '#FF3366',
  snack: '#00FF88'
}

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
    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSavedRecipes(data)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="card-brutal p-8 bg-[#00D4FF] rotate-neg-2">
          <div className="font-display text-4xl">LOADING PLANNER...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay">
      {/* Header */}
      <header className="bg-black text-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#00D4FF] text-black px-4 py-2 border-brutal rotate-neg-2">
                <span className="font-display text-4xl tracking-wider">📅 MEAL</span>
              </div>
              <div className="bg-[#FFE500] text-black px-4 py-2 border-brutal rotate-1">
                <span className="font-display text-4xl tracking-wider">PLANNER</span>
              </div>
            </div>
            <button
              onClick={() => navigate({ to: '/' })}
              className="btn-brutal px-6 py-3 bg-white text-black"
            >
              ← BACK TO SEARCH
            </button>
          </div>
        </div>
      </header>

      {/* Week Navigation */}
      <div className="bg-[#FFE500] border-b-4 border-black py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <button
            onClick={() => {
              const newDate = new Date(currentWeekStart)
              newDate.setDate(newDate.getDate() - 7)
              setCurrentWeekStart(newDate)
            }}
            className="btn-brutal px-6 py-3 bg-black text-white"
          >
            ← PREV WEEK
          </button>
          
          <div className="bg-black text-white px-6 py-3 font-display text-xl tracking-wider">
            {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
            {' → '}
            {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          
          <button
            onClick={() => {
              const newDate = new Date(currentWeekStart)
              newDate.setDate(newDate.getDate() + 7)
              setCurrentWeekStart(newDate)
            }}
            className="btn-brutal px-6 py-3 bg-black text-white"
          >
            NEXT WEEK →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Day Headers */}
            <div className="grid grid-cols-8 gap-2 mb-4">
              <div className="bg-black text-white p-4 border-brutal font-display text-xl text-center">
                MEAL
              </div>
              {weekDates.map((date, idx) => {
                const isToday = formatDate(date) === formatDate(new Date())
                return (
                  <div 
                    key={idx} 
                    className={`p-4 border-brutal text-center ${
                      isToday ? 'bg-[#FF3366] text-white' : 'bg-white'
                    }`}
                  >
                    <div className="font-display text-2xl">{DAYS[idx]}</div>
                    <div className="text-sm uppercase">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                    {isToday && <div className="text-xs mt-1 font-bold">TODAY</div>}
                  </div>
                )
              })}
            </div>

            {/* Meal Rows */}
            {MEAL_TYPES.map(mealType => (
              <div key={mealType} className="grid grid-cols-8 gap-2 mb-2">
                {/* Meal Type Label */}
                <div 
                  className="p-4 border-brutal font-bold uppercase flex items-center justify-center gap-2"
                  style={{ backgroundColor: MEAL_COLORS[mealType] }}
                >
                  <span className="text-xl">{MEAL_ICONS[mealType]}</span>
                  <span className="font-display text-lg">{mealType}</span>
                </div>
                
                {/* Day Slots */}
                {weekDates.map((date, idx) => {
                  const meal = getMealForSlot(date, mealType)
                  const dateStr = formatDate(date)
                  
                  return (
                    <div 
                      key={idx} 
                      className="border-brutal bg-white min-h-[120px] p-2 relative group"
                    >
                      {meal ? (
                        <div className="h-full">
                          <div className="text-xs font-bold uppercase line-clamp-2 mb-1">
                            {meal.recipe_title}
                          </div>
                          {meal.recipe_image && (
                            <img 
                              src={meal.recipe_image} 
                              alt={meal.recipe_title}
                              className="w-full h-16 object-cover border-2 border-black"
                            />
                          )}
                          <button
                            onClick={() => deleteMealPlan(meal.id)}
                            className="absolute top-1 right-1 bg-[#FF3366] text-white w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity border-2 border-black"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowRecipeSelector({ date: dateStr, mealType })}
                          className="w-full h-full flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 transition-colors text-2xl"
                        >
                          +
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          {MEAL_TYPES.map(type => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-6 h-6 border-2 border-black"
                style={{ backgroundColor: MEAL_COLORS[type] }}
              ></div>
              <span className="uppercase text-sm font-bold">{type}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Recipe Selector Modal */}
      {showRecipeSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="card-brutal bg-white p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-black text-[#FFE500] px-3 py-1 font-display text-xl">
                  SELECT
                </div>
                <div className="bg-[#00FF88] text-black px-3 py-1 font-display text-xl">
                  RECIPE
                </div>
              </div>
              <button
                onClick={() => setShowRecipeSelector(null)}
                className="btn-brutal px-4 py-2 bg-[#FF3366] text-white"
              >
                ✕ CLOSE
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-100 border-brutal">
              <span className="uppercase font-bold">
                {showRecipeSelector.mealType} on {new Date(showRecipeSelector.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-8">
                <div className="font-display text-2xl mb-4">NO SAVED RECIPES</div>
                <p className="uppercase text-gray-600 mb-4">Save some recipes first!</p>
                <button
                  onClick={() => {
                    setShowRecipeSelector(null)
                    navigate({ to: '/' })
                  }}
                  className="btn-brutal px-6 py-3 bg-[#00FF88] text-black"
                >
                  FIND RECIPES →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 overflow-y-auto flex-1 pr-2">
                {savedRecipes.map((recipe, index) => (
                  <button
                    key={recipe.id}
                    onClick={() => addMealPlan(recipe.id, showRecipeSelector.date, showRecipeSelector.mealType)}
                    className="card-brutal text-left p-3 hover:bg-gray-50 transition-colors animate-slideUp"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    {recipe.image_url && (
                      <img 
                        src={recipe.image_url} 
                        alt={recipe.title} 
                        className="w-full h-24 object-cover border-2 border-black mb-2"
                      />
                    )}
                    <div className="font-bold text-sm uppercase line-clamp-2">{recipe.title}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}