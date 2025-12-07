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
      console.log('Recipe details:', data)
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
          className="fixed inset-0 bg-black bg-opacity-80 flex items-start justify-center p-4 overflow-y-auto"
          style={{ zIndex: 99999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div 
            className="bg-white border-4 border-black w-full max-w-4xl my-8"
            style={{ boxShadow: '12px 12px 0px #000' }}
          >
            {loadingDetails && !selectedRecipe ? (
              <div className="p-12 text-center">
                <div className="font-display text-3xl mb-4">◐ LOADING RECIPE...</div>
                <p className="uppercase text-gray-600">Please wait</p>
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
    <>
      {/* Header with Image */}
      <div className="relative">
        <img 
          src={recipe.image} 
          alt={recipe.title}
          className="w-full h-64 md:h-80 object-cover border-b-4 border-black"
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black text-white w-10 h-10 flex items-center justify-center text-xl font-bold hover:bg-[#FF3366] transition-colors border-2 border-white"
        >
          ✕
        </button>
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
          {recipe.vegetarian && <span className="bg-[#00FF88] text-black px-2 py-1 text-xs font-bold uppercase border-2 border-black">🥬 Vegetarian</span>}
          {recipe.vegan && <span className="bg-[#00FF88] text-black px-2 py-1 text-xs font-bold uppercase border-2 border-black">🌱 Vegan</span>}
          {recipe.glutenFree && <span className="bg-[#FFE500] text-black px-2 py-1 text-xs font-bold uppercase border-2 border-black">🌾 Gluten-Free</span>}
          {recipe.dairyFree && <span className="bg-[#00D4FF] text-black px-2 py-1 text-xs font-bold uppercase border-2 border-black">🥛 Dairy-Free</span>}
        </div>
      </div>

      {/* Title and Meta */}
      <div className="p-6 border-b-4 border-black">
        <h2 className="font-display text-3xl md:text-4xl mb-4 uppercase">{recipe.title}</h2>
        <div className="flex flex-wrap gap-4 mb-4">
          {recipe.readyInMinutes && <span className="bg-black text-white px-3 py-1 text-sm uppercase">⏱ {recipe.readyInMinutes} MIN</span>}
          {recipe.servings && <span className="bg-black text-white px-3 py-1 text-sm uppercase">🍽 {recipe.servings} SERVINGS</span>}
          {recipe.healthScore && <span className="bg-[#00FF88] text-black px-3 py-1 text-sm uppercase border-2 border-black">❤️ Health: {recipe.healthScore}%</span>}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`btn-brutal px-6 py-3 uppercase font-bold ${saved ? 'bg-[#00FF88] text-black' : 'bg-[#FFE500] text-black hover:bg-[#FF3366] hover:text-white'}`}
          >
            {saved ? '✓ SAVED!' : saving ? '◐ SAVING...' : '+ SAVE RECIPE'}
          </button>
          {recipe.sourceUrl && (
            <a href={recipe.sourceUrl} target="_blank" rel="noopener noreferrer" className="btn-brutal px-6 py-3 bg-black text-white uppercase font-bold hover:bg-gray-800">
              VIEW SOURCE →
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b-4 border-black">
        {(['overview', 'ingredients', 'instructions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 font-bold uppercase text-sm transition-colors ${tab !== 'overview' ? 'border-l-4 border-black' : ''} ${activeTab === tab ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-100'}`}
          >
            {tab === 'ingredients' ? `Ingredients (${recipe.extendedIngredients?.length || 0})` : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-6 max-h-96 overflow-y-auto">
        {activeTab === 'overview' && (
          <div>
            {recipe.summary && (
              <div className="mb-6">
                <h3 className="font-display text-xl mb-3 uppercase">About This Recipe</h3>
                <p className="text-gray-700 leading-relaxed">{stripHtml(recipe.summary)}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recipe.cuisines && recipe.cuisines.length > 0 && (
                <div>
                  <h3 className="font-display text-lg mb-2 uppercase">Cuisine</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.cuisines.map((c, i) => <span key={i} className="bg-[#00D4FF] text-black px-3 py-1 text-sm uppercase border-2 border-black">{c}</span>)}
                  </div>
                </div>
              )}
              {recipe.dishTypes && recipe.dishTypes.length > 0 && (
                <div>
                  <h3 className="font-display text-lg mb-2 uppercase">Dish Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {recipe.dishTypes.map((d, i) => <span key={i} className="bg-[#FFE500] text-black px-3 py-1 text-sm uppercase border-2 border-black">{d}</span>)}
                  </div>
                </div>
              )}
            </div>

            {(calories || protein || carbs || fat) && (
              <div className="mt-6">
                <h3 className="font-display text-lg mb-3 uppercase">Nutrition (per serving)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {calories && <div className="border-4 border-black p-3 text-center"><div className="font-display text-2xl">{Math.round(calories.amount)}</div><div className="text-xs uppercase text-gray-600">Calories</div></div>}
                  {protein && <div className="border-4 border-black p-3 text-center bg-[#FF3366] text-white"><div className="font-display text-2xl">{Math.round(protein.amount)}g</div><div className="text-xs uppercase">Protein</div></div>}
                  {carbs && <div className="border-4 border-black p-3 text-center bg-[#FFE500]"><div className="font-display text-2xl">{Math.round(carbs.amount)}g</div><div className="text-xs uppercase">Carbs</div></div>}
                  {fat && <div className="border-4 border-black p-3 text-center bg-[#00D4FF]"><div className="font-display text-2xl">{Math.round(fat.amount)}g</div><div className="text-xs uppercase">Fat</div></div>}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ingredients' && (
          <div>
            <h3 className="font-display text-xl mb-4 uppercase">Ingredients</h3>
            {recipe.extendedIngredients && recipe.extendedIngredients.length > 0 ? (
              <ul className="space-y-2">
                {recipe.extendedIngredients.map((ing, idx) => (
                  <li key={idx} className="flex items-center gap-3 p-3 border-2 border-black hover:bg-gray-50">
                    <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                    <span className="uppercase text-sm">{ing.original}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 uppercase">No ingredient information available</p>
            )}
          </div>
        )}

        {activeTab === 'instructions' && (
          <div>
            <h3 className="font-display text-xl mb-4 uppercase">Instructions</h3>
            {recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0 && recipe.analyzedInstructions[0].steps ? (
              <ol className="space-y-4">
                {recipe.analyzedInstructions[0].steps.map((step) => (
                  <li key={step.number} className="flex gap-4 p-4 border-2 border-black">
                    <span className="w-8 h-8 bg-[#FF3366] text-white flex items-center justify-center font-bold flex-shrink-0">{step.number}</span>
                    <p className="text-sm leading-relaxed">{step.step}</p>
                  </li>
                ))}
              </ol>
            ) : recipe.instructions ? (
              <p className="text-sm leading-relaxed whitespace-pre-line">{stripHtml(recipe.instructions)}</p>
            ) : (
              <p className="text-gray-600 uppercase">No instructions available. Check the source link for full recipe.</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t-4 border-black bg-gray-100 flex justify-between items-center">
        <span className="text-xs uppercase text-gray-600">{recipe.sourceName && `Source: ${recipe.sourceName}`}</span>
        <button onClick={onClose} className="btn-brutal px-6 py-2 bg-black text-white uppercase">Close</button>
      </div>
    </>
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