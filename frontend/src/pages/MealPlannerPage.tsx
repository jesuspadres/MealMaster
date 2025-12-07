import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

interface DeleteConfirmation {
  mealPlan: MealPlan
  dayName: string
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [deletingId, setDeletingId] = useState<number | null>(null)
  
  const { token, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

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

  function getDayIndex(dateStr: string): number {
    const date = new Date(dateStr + 'T12:00:00')
    const day = date.getDay()
    return day === 0 ? 6 : day - 1
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
        const recipe = savedRecipes.find(r => r.id === recipeId)
        showToast(`Added "${recipe?.title}" to your meal plan`, 'success')
      }
    } catch (error) {
      console.error('Error adding meal plan:', error)
      showToast('Failed to add meal', 'error')
    }
  }

  const handleDeleteClick = (meal: MealPlan) => {
    const dayIndex = getDayIndex(meal.date)
    setDeleteConfirmation({
      mealPlan: meal,
      dayName: DAYS_FULL[dayIndex]
    })
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return
    
    const { mealPlan } = deleteConfirmation
    setDeletingId(mealPlan.id)

    try {
      const response = await fetch(`${API_URL}/api/meal-plans/${mealPlan.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        setMealPlans(mealPlans.filter(mp => mp.id !== mealPlan.id))
        showToast(`Removed "${mealPlan.recipe_title}" from ${deleteConfirmation.dayName}`, 'success')
      } else {
        showToast('Failed to remove meal', 'error')
      }
    } catch (error) {
      console.error('Error deleting meal plan:', error)
      showToast('Failed to remove meal', 'error')
    } finally {
      setDeletingId(null)
      setDeleteConfirmation(null)
    }
  }

  const getMealForSlot = (date: Date, mealType: string): MealPlan | undefined => {
    return mealPlans.find(mp => mp.date === formatDate(date) && mp.meal_type === mealType)
  }

  const weekDates = getWeekDates()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="card-brutal p-8 bg-[#00D4FF]" style={{ transform: 'rotate(-1deg)' }}>
          <div className="font-display text-4xl">LOADING PLANNER...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay">
      {/* Header */}
      <header className="bg-black text-white border-b-4 border-black" style={{ position: 'relative', zIndex: 30 }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#00D4FF] text-black px-4 py-2 border-brutal" style={{ transform: 'rotate(-1deg)' }}>
                <span className="font-display text-4xl tracking-wider">📅 MEAL</span>
              </div>
              <div className="bg-[#FFE500] text-black px-4 py-2 border-brutal" style={{ transform: 'rotate(0.5deg)' }}>
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
      <div className="bg-[#FFE500] border-b-4 border-black py-4" style={{ position: 'relative', zIndex: 20 }}>
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
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
            <div className="grid grid-cols-8 gap-2 mb-4" style={{ position: 'relative', zIndex: 10 }}>
              <div className="bg-black text-white p-4 border-brutal font-display text-xl text-center flex items-center justify-center">
                MEAL
              </div>
              {weekDates.map((date, idx) => {
                const isToday = formatDate(date) === formatDate(new Date())
                return (
                  <div 
                    key={idx} 
                    className={`p-4 border-brutal text-center flex flex-col items-center justify-center ${
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
            {MEAL_TYPES.map((mealType, rowIdx) => (
              <div key={mealType} className="grid grid-cols-8 gap-2 mb-2" style={{ position: 'relative', zIndex: 5 - rowIdx }}>
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
                      className="border-brutal bg-white min-h-[120px] relative group transition-all duration-200 hover:shadow-lg"
                      style={{ zIndex: meal ? 2 : 1 }}
                    >
                      {meal ? (
                        <>
                          {/* Delete button - top right corner of cell */}
                          <button
                            onClick={() => handleDeleteClick(meal)}
                            className="bg-[#FF3366] text-white w-6 h-6 rounded-full text-xs font-bold 
                                     border-2 border-black shadow-md
                                     opacity-0 group-hover:opacity-100 
                                     hover:bg-red-700 hover:scale-110
                                     transition-all duration-200
                                     flex items-center justify-center"
                            style={{ 
                              position: 'absolute', 
                              top: '4px', 
                              right: '4px', 
                              zIndex: 10 
                            }}
                            title="Remove meal"
                          >
                            ✕
                          </button>
                          
                          <div className="h-full flex flex-col">
                            {/* Meal Image */}
                            {meal.recipe_image && (
                              <img 
                                src={meal.recipe_image} 
                                alt={meal.recipe_title}
                                className="w-full h-16 object-cover border-b-2 border-black"
                              />
                            )}
                            {/* Meal Title */}
                            <div className="p-2 flex-1 flex flex-col">
                              <div className="text-xs font-bold uppercase line-clamp-2 leading-tight pr-5">
                                {meal.recipe_title}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => setShowRecipeSelector({ date: dateStr, mealType })}
                          className="w-full h-full min-h-[120px] flex flex-col items-center justify-center text-gray-500 
                                   hover:text-black hover:bg-gray-50 transition-all duration-200 group/add"
                        >
                          <span className="text-3xl group-hover/add:scale-125 transition-transform duration-200">+</span>
                          <span className="text-xs uppercase mt-1 opacity-0 group-hover/add:opacity-100 transition-opacity">Add meal</span>
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4"
          style={{ zIndex: 100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowRecipeSelector(null)
          }}
        >
          <div 
            className="bg-white border-4 border-black p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-black text-[#FFE500] px-3 py-1 font-display text-xl">
                  SELECT
                </div>
                <div className="bg-[#00FF88] text-black px-3 py-1 font-display text-xl border-2 border-black">
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
            
            <div className="mb-4 p-3 bg-gray-100 border-4 border-black">
              <span className="uppercase font-bold">
                {MEAL_ICONS[showRecipeSelector.mealType]} {showRecipeSelector.mealType} on {new Date(showRecipeSelector.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
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
                    className="border-4 border-black bg-white text-left p-3 hover:bg-[#00FF88] transition-all duration-200 animate-slideUp hover:-translate-y-1"
                    style={{ 
                      animationDelay: `${index * 0.03}s`,
                      boxShadow: '4px 4px 0px #000'
                    }}
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

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4"
          style={{ zIndex: 100 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteConfirmation(null)
          }}
        >
          <div 
            className="bg-white border-4 border-black p-6 max-w-md w-full animate-slideUp"
            style={{ boxShadow: '8px 8px 0px #000' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#FF3366] text-white px-3 py-1 font-display text-xl">
                REMOVE
              </div>
              <div className="bg-black text-white px-3 py-1 font-display text-xl">
                MEAL?
              </div>
            </div>

            {/* Meal Preview */}
            <div className="border-4 border-black p-4 mb-6 bg-gray-50">
              <div className="flex gap-4 items-center">
                {deleteConfirmation.mealPlan.recipe_image && (
                  <img 
                    src={deleteConfirmation.mealPlan.recipe_image}
                    alt={deleteConfirmation.mealPlan.recipe_title}
                    className="w-20 h-20 object-cover border-2 border-black flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold uppercase text-sm line-clamp-2 mb-1">
                    {deleteConfirmation.mealPlan.recipe_title}
                  </div>
                  <div className="text-xs uppercase text-gray-600">
                    {MEAL_ICONS[deleteConfirmation.mealPlan.meal_type]} {deleteConfirmation.mealPlan.meal_type} • {deleteConfirmation.dayName}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="btn-brutal flex-1 py-3 bg-white text-black hover:bg-gray-100"
                disabled={deletingId !== null}
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId !== null}
                className="btn-brutal flex-1 py-3 bg-[#FF3366] text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deletingId ? '◐ REMOVING...' : '🗑 REMOVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && createPortal(
        <div 
          style={{ 
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{ 
                border: '4px solid #000',
                padding: '16px 24px',
                minWidth: '300px',
                maxWidth: '400px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: '14px',
                fontFamily: 'Space Mono, monospace',
                boxShadow: '6px 6px 0px #000',
                animation: 'slideUp 0.3s ease-out',
                backgroundColor: toast.type === 'success' ? '#00FF88' : toast.type === 'error' ? '#FF3366' : '#FFE500',
                color: toast.type === 'error' ? 'white' : 'black'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <span>
                  {toast.type === 'success' && '✓ '}
                  {toast.type === 'error' && '✗ '}
                  {toast.type === 'warning' && '⚠ '}
                  {toast.message}
                </span>
                <span style={{ fontSize: '18px' }}>×</span>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}