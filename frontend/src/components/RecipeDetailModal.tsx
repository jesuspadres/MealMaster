import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export interface RecipeDetails {
  id: number
  title: string
  image: string
  readyInMinutes?: number
  servings?: number
  sourceUrl?: string
  sourceName?: string
  summary?: string
  instructions?: string
  analyzedInstructions?: Array<{
    name: string
    steps: Array<{
      number: number
      step: string
      ingredients?: Array<{ name: string }>
      equipment?: Array<{ name: string }>
    }>
  }>
  extendedIngredients?: Array<{
    id: number
    name: string
    original: string
    amount: number
    unit: string
  }>
  dishTypes?: string[]
  diets?: string[]
  cuisines?: string[]
  vegetarian?: boolean
  vegan?: boolean
  glutenFree?: boolean
  dairyFree?: boolean
  healthScore?: number
  nutrition?: {
    nutrients?: Array<{
      name: string
      amount: number
      unit: string
    }>
  }
}

interface RecipeDetailModalProps {
  recipeId: number | null
  isOpen: boolean
  onClose: () => void
  onSave?: (recipe: RecipeDetails) => Promise<boolean | undefined>
  token?: string | null
  isAuthenticated?: boolean
}

export default function RecipeDetailModal({ 
  recipeId, 
  isOpen, 
  onClose, 
  onSave
}: RecipeDetailModalProps) {
  const [recipe, setRecipe] = useState<RecipeDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions'>('overview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen && recipeId) {
      fetchRecipeDetails(recipeId)
      setActiveTab('overview')
      setSaved(false)
    } else {
      setRecipe(null)
      setError(null)
    }
  }, [isOpen, recipeId])

  const fetchRecipeDetails = async (id: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_URL}/api/recipes/${id}`)
      if (!response.ok) throw new Error('Failed to fetch recipe details')
      const data = await response.json()
      setRecipe(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load recipe details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!recipe || !onSave) return
    
    setSaving(true)
    const result = await onSave(recipe)
    if (result) setSaved(true)
    setSaving(false)
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getNutrient = (name: string) => {
    if (!recipe?.nutrition?.nutrients) return null
    return recipe.nutrition.nutrients.find(n => n.name === name)
  }

  if (!isOpen) return null

  const calories = recipe ? getNutrient('Calories') : null
  const protein = recipe ? getNutrient('Protein') : null
  const carbs = recipe ? getNutrient('Carbohydrates') : null
  const fat = recipe ? getNutrient('Fat') : null

  const modalContent = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div 
        style={{ 
          backgroundColor: 'white',
          border: '4px solid black',
          boxShadow: '12px 12px 0px #000',
          width: '100%',
          maxWidth: '700px',
          marginTop: '40px',
          marginBottom: '40px',
          padding: '12px',
          borderRadius: '4px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontFamily: 'Bebas Neue, sans-serif', marginBottom: '16px' }}>
              ◐ LOADING RECIPE...
            </div>
            <p style={{ textTransform: 'uppercase', color: '#666' }}>Fetching delicious details</p>
          </div>
        ) : error ? (
          <div style={{ padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontFamily: 'Bebas Neue, sans-serif', marginBottom: '16px', color: '#FF3366' }}>
              ⚠ ERROR
            </div>
            <p style={{ textTransform: 'uppercase', color: '#666' }}>{error}</p>
            <button 
              onClick={onClose}
              style={{ 
                marginTop: '20px', 
                padding: '12px 24px', 
                backgroundColor: 'black', 
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: 'bold'
              }}
            >
              Close
            </button>
          </div>
        ) : recipe ? (
          <div className="relative">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 md:top-4 md:right-4 bg-black text-white w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[#FF3366] transition-colors z-20"
              style={{ borderRadius: '4px' }}
            >
              ✕
            </button>

            {/* Header Image */}
            <div className="relative">
              <img 
                src={recipe.image} 
                alt={recipe.title}
                className="w-full h-48 sm:h-56 md:h-64 object-cover"
              />
              {/* Diet badges */}
              <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 flex flex-wrap gap-1 md:gap-2">
                {recipe.vegetarian && <span className="bg-[#00FF88] text-black px-2 py-0.5 text-xs font-bold uppercase border-2 border-black">🥬 Vegetarian</span>}
                {recipe.vegan && <span className="bg-[#00FF88] text-black px-2 py-0.5 text-xs font-bold uppercase border-2 border-black">🌱 Vegan</span>}
                {recipe.glutenFree && <span className="bg-[#FFE500] text-black px-2 py-0.5 text-xs font-bold uppercase border-2 border-black">🌾 GF</span>}
                {recipe.dairyFree && <span className="bg-[#00D4FF] text-black px-2 py-0.5 text-xs font-bold uppercase border-2 border-black">🥛 DF</span>}
              </div>
            </div>

            {/* Title Section */}
            <div className="p-5 md:p-8 border-t-4 border-b-4 border-black bg-white">
              <h2 className="font-display text-xl sm:text-2xl md:text-3xl mb-4 uppercase leading-tight pr-6">
                {recipe.title}
              </h2>
              
              {/* Meta info */}
              <div className="flex flex-wrap gap-2 mb-4">
                {recipe.readyInMinutes && (
                  <span className="bg-gray-100 border-2 border-black px-2 md:px-3 py-1 text-xs md:text-sm uppercase font-bold">
                    ⏱ {recipe.readyInMinutes} min
                  </span>
                )}
                {recipe.servings && (
                  <span className="bg-gray-100 border-2 border-black px-2 md:px-3 py-1 text-xs md:text-sm uppercase font-bold">
                    🍽 {recipe.servings} servings
                  </span>
                )}
                {recipe.healthScore && recipe.healthScore > 50 && (
                  <span className="bg-[#00FF88] border-2 border-black px-2 md:px-3 py-1 text-xs md:text-sm uppercase font-bold">
                    ❤️ {recipe.healthScore}%
                  </span>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                {onSave && (
                  <button
                    onClick={handleSave}
                    disabled={saving || saved}
                    className={`flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 uppercase font-bold text-sm border-4 border-black transition-all ${
                      saved 
                        ? 'bg-[#00FF88] text-black' 
                        : 'bg-[#FFE500] text-black hover:bg-[#FF3366] hover:text-white'
                    }`}
                    style={{ boxShadow: '3px 3px 0px #000' }}
                  >
                    {saved ? '✓ SAVED!' : saving ? '◐ SAVING...' : '+ SAVE RECIPE'}
                  </button>
                )}
                {recipe.sourceUrl && (
                  <a 
                    href={recipe.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex-1 sm:flex-none px-4 md:px-6 py-2 md:py-3 bg-black text-white uppercase font-bold text-sm text-center border-4 border-black hover:bg-gray-800 transition-all"
                    style={{ boxShadow: '3px 3px 0px #333' }}
                  >
                    VIEW SOURCE →
                  </a>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-4 border-black bg-white">
              {(['overview', 'ingredients', 'instructions'] as const).map((tab, idx) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 md:py-3 font-bold uppercase text-xs md:text-sm transition-colors ${
                    idx > 0 ? 'border-l-2 md:border-l-4 border-black' : ''
                  } ${
                    activeTab === tab 
                      ? 'bg-black text-white' 
                      : 'bg-white text-black hover:bg-gray-100'
                  }`}
                >
                  {tab === 'ingredients' ? (
                    <span>Ingredients ({recipe.extendedIngredients?.length || 0})</span>
                  ) : (
                    <span className="capitalize">{tab}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-6 bg-gray-50 overflow-y-auto" style={{ maxHeight: '50vh', minHeight: '200px' }}>
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {recipe.summary && (
                    <div>
                      <h3 className="font-display text-lg md:text-xl mb-2 uppercase">About</h3>
                      <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                        {stripHtml(recipe.summary)}
                      </p>
                    </div>
                  )}

                  {recipe.dishTypes && recipe.dishTypes.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg mb-2 uppercase">Dish Type</h3>
                      <div className="flex flex-wrap gap-2">
                        {recipe.dishTypes.slice(0, 5).map((d, i) => (
                          <span key={i} className="bg-[#FFE500] text-black px-2 md:px-3 py-1 text-xs md:text-sm uppercase border-2 border-black">
                            {d}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recipe.cuisines && recipe.cuisines.length > 0 && (
                    <div>
                      <h3 className="font-display text-lg mb-2 uppercase">Cuisine</h3>
                      <div className="flex flex-wrap gap-2">
                        {recipe.cuisines.map((c, i) => (
                          <span key={i} className="bg-[#00D4FF] text-black px-2 md:px-3 py-1 text-xs md:text-sm uppercase border-2 border-black">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {(calories || protein || carbs || fat) && (
                    <div>
                      <h3 className="font-display text-lg mb-3 uppercase">
                        Nutrition <span className="text-gray-500 text-sm">(per serving)</span>
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        {calories && (
                          <div className="border-2 md:border-4 border-black p-2 md:p-3 text-center bg-white">
                            <div className="font-display text-xl md:text-2xl">{Math.round(calories.amount)}</div>
                            <div className="text-xs uppercase text-gray-600">Calories</div>
                          </div>
                        )}
                        {protein && (
                          <div className="border-2 md:border-4 border-black p-2 md:p-3 text-center bg-[#FF3366] text-white">
                            <div className="font-display text-xl md:text-2xl">{Math.round(protein.amount)}g</div>
                            <div className="text-xs uppercase">Protein</div>
                          </div>
                        )}
                        {carbs && (
                          <div className="border-2 md:border-4 border-black p-2 md:p-3 text-center bg-[#FFE500]">
                            <div className="font-display text-xl md:text-2xl">{Math.round(carbs.amount)}g</div>
                            <div className="text-xs uppercase">Carbs</div>
                          </div>
                        )}
                        {fat && (
                          <div className="border-2 md:border-4 border-black p-2 md:p-3 text-center bg-[#00D4FF]">
                            <div className="font-display text-xl md:text-2xl">{Math.round(fat.amount)}g</div>
                            <div className="text-xs uppercase">Fat</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ingredients' && (
                <div>
                  {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 ? (
                    <ul className="space-y-2">
                      {recipe.extendedIngredients.map((ing, idx) => (
                        <li key={ing.id} className="flex gap-3 bg-white border-2 border-black">
                        <span className="bg-[#FF3366] text-white flex items-center justify-center font-bold text-sm p-[8px]">
                            {idx + 1}
                        </span>

                        <span className="text-sm md:text-base p-[8px]">{ing.original}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 uppercase text-center py-8">No ingredient information available</p>
                  )}
                </div>
              )}

              {activeTab === 'instructions' && (
                <div>
                  {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && recipe.analyzedInstructions[0].steps ? (
                    <ol className="space-y-3">
                      {recipe.analyzedInstructions[0].steps.map((step) => (
                        <li key={step.number} className="flex gap-3 p-3 md:p-4 bg-white border-2 border-black">
                          <span className="flex md:w-8 md:h-8 bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm p-[8px]">
                            {step.number}
                          </span>
                          <p className="text-sm md:text-base leading-relaxed flex-1 p-[8px]">{step.step}</p>
                        </li>
                      ))}
                    </ol>
                  ) : recipe.instructions ? (
                    <div className="bg-white border-2 border-black p-4">
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{stripHtml(recipe.instructions)}</p>
                    </div>
                  ) : (
                    <p className="text-gray-600 uppercase text-center py-8">
                      No instructions available.<br/>
                      <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#FF3366] underline">
                        Check the source for full recipe →
                      </a>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 md:p-4 border-t-4 border-black bg-white flex justify-between items-center">
              <span className="text-xs uppercase text-gray-500 truncate max-w-[50%]">
                {recipe.sourceName && `Source: ${recipe.sourceName}`}
              </span>
              <button 
                onClick={onClose} 
                className="px-4 md:px-6 py-2 bg-black text-white uppercase font-bold text-sm border-2 border-black hover:bg-gray-800"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}