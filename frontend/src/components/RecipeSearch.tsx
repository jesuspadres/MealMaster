import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.tsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Recipe {
  id: number
  title: string
  image: string
  readyInMinutes?: number
  servings?: number
  dishTypes?: string[]
}

interface RecipeDetails {
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

interface SearchResponse {
  results: Recipe[]
  total: number
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

function RecipeSearch() {
  const [query, setQuery] = useState('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeDetails | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { token, isAuthenticated } = useAuth()

  const showToast = (message: string, type: Toast['type'] = 'error') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const searchRecipes = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/recipes/search?query=${encodeURIComponent(query)}&number=24`)
      if (!response.ok) throw new Error('Failed to search recipes')
      const data: SearchResponse = await response.json()
      setRecipes(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search recipes')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipeDetails = async (recipeId: number) => {
    setLoadingDetails(true)
    setSelectedRecipe(null)
    
    try {
      const response = await fetch(`${API_URL}/api/recipes/${recipeId}`)
      if (!response.ok) throw new Error('Failed to fetch recipe details')
      const data = await response.json()
      setSelectedRecipe(data)
    } catch (err) {
      console.error('Error:', err)
      showToast('Failed to load recipe details', 'error')
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedRecipe(null)
    setLoadingDetails(false)
  }

  const handleSaveRecipe = async (recipe: Recipe | RecipeDetails) => {
    if (!isAuthenticated || !token) {
      showToast('Please login to save recipes', 'warning')
      return
    }

    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          external_id: recipe.id,
          title: recipe.title,
          image_url: recipe.image,
          ready_in_minutes: recipe.readyInMinutes,
          servings: recipe.servings
        })
      })

      if (response.ok) {
        showToast(`"${recipe.title}" saved!`, 'success')
        return true
      } else if (response.status === 400) {
        showToast('Recipe already saved', 'warning')
        return true
      }
      return false
    } catch (error) {
      showToast('Failed to save recipe', 'error')
      return false
    }
  }

  const stripHtml = (html: string) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  // Get nutrition value helper
  const getNutrient = (name: string) => {
    if (!selectedRecipe?.nutrition?.nutrients) return null
    return selectedRecipe.nutrition.nutrients.find(n => n.name === name)
  }

  return (
    <div>
      {/* Search Form */}
      <div className="border-4 border-black p-6 md:p-8 mb-8 bg-white" style={{ boxShadow: '8px 8px 0px #000' }}>
        <form onSubmit={searchRecipes} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH RECIPES... (E.G. PASTA, CHICKEN, SALAD)"
            className="flex-1 border-4 border-black px-4 py-4 md:py-5 text-base md:text-lg uppercase placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-[#FFE500]"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-brutal px-8 md:px-10 py-4 md:py-5 bg-[#FF3366] text-white text-lg md:text-xl font-display tracking-wider disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? '◐ SEARCHING...' : '🔍 SEARCH'}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm uppercase text-gray-600">Try:</span>
          {['Chicken', 'Pasta', 'Salad', 'Soup', 'Vegetarian', 'Dessert'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="px-3 py-1 border-2 border-black text-sm uppercase hover:bg-black hover:text-white transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-[#FF3366] text-white border-4 border-black uppercase text-sm">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {recipes.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-4 mb-6 md:mb-8">
            <div className="bg-black text-white px-4 py-2 font-display text-xl md:text-2xl">
              FOUND {recipes.length} RECIPES
            </div>
            <div className="flex-1 h-1 bg-black hidden sm:block"></div>
          </div>
          
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '2rem',
              padding: '0.5rem'
            }}
          >
            {recipes.map((recipe, index) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                index={index}
                onSave={() => handleSaveRecipe(recipe)}
                onViewDetails={() => fetchRecipeDetails(recipe.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && recipes.length === 0 && query && (
        <div className="border-4 border-black p-8 md:p-12 bg-white text-center" style={{ boxShadow: '8px 8px 0px #000' }}>
          <div className="font-display text-3xl md:text-4xl mb-4">NO RESULTS</div>
          <p className="uppercase text-gray-600">Try a different search term</p>
        </div>
      )}

      {!loading && recipes.length === 0 && !query && (
        <div className="text-center py-12">
          <div className="inline-block bg-black text-white px-6 py-3 font-display text-2xl md:text-3xl mb-6">
            👆 START BY SEARCHING ABOVE
          </div>
          <p className="text-gray-600 uppercase max-w-md mx-auto">
            Enter a dish name, ingredient, or cuisine type to discover delicious recipes
          </p>
        </div>
      )}

      {/* Recipe Detail Modal */}
      {(selectedRecipe || loadingDetails) && (
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
            padding: '0px',
            overflowY: 'auto'
          }}
          onClick={closeModal}
        >
          <div 
            style={{ 
              backgroundColor: 'white',
              border: '4px solid black',
              boxShadow: '12px 12px 0px #000',
              width: '100%',
              maxWidth: '800px',
              marginTop: '40px',
              marginBottom: '40px',
              borderRadius: '4px',
              padding: '15px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetails && !selectedRecipe ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontFamily: 'Bebas Neue, sans-serif', marginBottom: '16px' }}>
                  ◐ LOADING RECIPE...
                </div>
                <p style={{ textTransform: 'uppercase', color: '#666' }}>Fetching delicious details</p>
              </div>
            ) : selectedRecipe ? (
              <ModalContent 
                recipe={selectedRecipe}
                onClose={closeModal}
                onSave={() => handleSaveRecipe(selectedRecipe)}
                stripHtml={stripHtml}
                getNutrient={getNutrient}
              />
            ) : null}
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toasts.length > 0 && createPortal(
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999999, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              onClick={() => removeToast(toast.id)}
              style={{ 
                border: '4px solid #000',
                padding: '16px 24px',
                minWidth: 300,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontWeight: 'bold',
                fontSize: 14,
                boxShadow: '6px 6px 0px #000',
                backgroundColor: toast.type === 'success' ? '#00FF88' : toast.type === 'error' ? '#FF3366' : '#FFE500',
                color: toast.type === 'error' ? 'white' : 'black'
              }}
            >
              {toast.type === 'success' && '✓ '}
              {toast.type === 'error' && '✗ '}
              {toast.type === 'warning' && '⚠ '}
              {toast.message}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

// Modal Content Component
function ModalContent({ recipe, onClose, onSave, stripHtml, getNutrient }: {
  recipe: RecipeDetails
  onClose: () => void
  onSave: () => Promise<boolean | undefined>
  stripHtml: (html: string) => string
  getNutrient: (name: string) => { name: string; amount: number; unit: string } | null | undefined
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'ingredients' | 'instructions'>('overview')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const result = await onSave()
    if (result) setSaved(true)
    setSaving(false)
  }

  const calories = getNutrient('Calories')
  const protein = getNutrient('Protein')
  const carbs = getNutrient('Carbohydrates')
  const fat = getNutrient('Fat')

  return (
    <div className="relative">
      {/* Close button - always visible */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 md:top-4 md:right-4 bg-black text-white w-10 h-10 flex items-center justify-center text-lg font-bold hover:bg-[#FF3366] transition-colors z-20"
        style={{ borderRadius: '0px' }}
      >
        ✕
      </button>

      <div className="p-4 sm:p-6 md:p-8">

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

        {/* Tab Content - Scrollable */}
        <div className="p-4 md:p-6 bg-gray-50 overflow-y-auto" style={{ maxHeight: '50vh', minHeight: '200px' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary */}
              {recipe.summary && (
                <div>
                  <h3 className="font-display text-lg md:text-xl mb-2 uppercase">About</h3>
                  <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                    {stripHtml(recipe.summary)}
                  </p>
                </div>
              )}

              {/* Dish Types */}
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

              {/* Cuisines */}
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

              {/* Nutrition */}
              {(calories || protein || carbs || fat) && (
                <div>
                  <h3 className="font-display text-lg mb-3 uppercase">Nutrition <span className="text-gray-500 text-sm">(per serving)</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                    {calories && (
                      <div className="border-3 md:border-4 border-black p-2 md:p-3 text-center bg-white">
                        <div className="font-display text-xl md:text-2xl">{Math.round(calories.amount)}</div>
                        <div className="text-xs uppercase text-gray-600">Calories</div>
                      </div>
                    )}
                    {protein && (
                      <div className="border-3 md:border-4 border-black p-2 md:p-3 text-center bg-[#FF3366] text-white">
                        <div className="font-display text-xl md:text-2xl">{Math.round(protein.amount)}g</div>
                        <div className="text-xs uppercase">Protein</div>
                      </div>
                    )}
                    {carbs && (
                      <div className="border-3 md:border-4 border-black p-2 md:p-3 text-center bg-[#FFE500]">
                        <div className="font-display text-xl md:text-2xl">{Math.round(carbs.amount)}g</div>
                        <div className="text-xs uppercase">Carbs</div>
                      </div>
                    )}
                    {fat && (
                      <div className="border-3 md:border-4 border-black p-2 md:p-3 text-center bg-[#00D4FF]">
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
                    <li key={idx} className="flex items-start gap-3 p-2 md:p-3 bg-white border-2 border-black">
                      <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="text-sm md:text-base">{ing.original}</span>
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
                      <span className="w-7 h-7 md:w-8 md:h-8 bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0 text-sm">
                        {step.number}
                      </span>
                      <p className="text-sm md:text-base leading-relaxed flex-1">{step.step}</p>
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

      
    </div>
  )
}

// Recipe Card Component
function RecipeCard({ recipe, index, onSave, onViewDetails }: {
  recipe: Recipe
  index: number
  onSave: () => void
  onViewDetails: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const rotations = ['rotate-1', 'rotate-neg-1', 'rotate-2', 'rotate-neg-2', '', 'rotate-neg-1']
  const rotation = rotations[index % rotations.length]
  const accents = ['#FFE500', '#00D4FF', '#FF3366', '#00FF88', '#FFE500', '#00D4FF']
  const accent = accents[index % accents.length]

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setSaving(true)
    onSave()
    setSaved(true)
    setSaving(false)
  }

  return (
    <div 
      className={`bg-white overflow-hidden ${rotation} flex flex-col border-4 border-black transition-all duration-300 cursor-pointer`}
      style={{ 
        boxShadow: isHovered ? '12px 12px 0px #000' : '8px 8px 0px #000',
        position: 'relative',
        zIndex: isHovered ? 20 : 1,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onViewDetails}
    >
      <div className="relative overflow-hidden border-b-4 border-black" style={{ aspectRatio: '4/3' }}>
        <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" />
        <div className="absolute top-2 right-2 px-2 py-0.5 font-display text-sm border-2 border-black" style={{ backgroundColor: accent }}>#{index + 1}</div>
        <div className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <span className="bg-white text-black px-4 py-2 font-bold uppercase text-sm border-2 border-black">👁 View Recipe</span>
        </div>
      </div>

      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base uppercase mb-2 md:mb-3 line-clamp-2 leading-tight">{recipe.title}</h3>

        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3">
          {recipe.readyInMinutes && <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">⏱ {recipe.readyInMinutes}MIN</div>}
          {recipe.readyInMinutes && recipe.servings && <span className="text-gray-400">•</span>}
          {recipe.servings && <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">🍽 {recipe.servings}PPL</div>}
        </div>

        <div className="flex-1"></div>

        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`btn-brutal w-full py-2 md:py-3 uppercase font-bold text-sm transition-all duration-150 ${saved ? 'bg-[#00FF88] text-black' : 'bg-[#FFE500] text-black hover:bg-[#FF3366] hover:text-white'}`}
        >
          {saved ? '✓ SAVED!' : saving ? '◐ ...' : '+ SAVE'}
        </button>
      </div>
    </div>
  )
}

export default RecipeSearch