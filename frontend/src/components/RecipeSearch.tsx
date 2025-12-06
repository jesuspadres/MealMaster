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
  const [query, setQuery] = useState<string>('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
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
      const response = await fetch(`${API_URL}/api/recipes/search?query=${encodeURIComponent(query)}&number=24`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to search recipes: ${response.statusText}`)
      }

      const data: SearchResponse = await response.json()
      setRecipes(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search recipes. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Search Form - Brutalist Style */}
      <div className="card-brutal p-6 md:p-8 mb-8 bg-white rotate-neg-1">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="bg-black text-[#FFE500] px-3 py-1 font-display text-2xl md:text-3xl">
            SEARCH
          </div>
          <div className="bg-[#FF3366] text-white px-3 py-1 font-display text-2xl md:text-3xl">
            RECIPES
          </div>
        </div>
        
        <form onSubmit={searchRecipes} className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="TRY 'PASTA CARBONARA' OR 'VEGAN TACOS'..."
            className="input-brutal flex-1 px-4 md:px-6 py-3 md:py-4 text-base md:text-lg uppercase placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-brutal px-6 md:px-8 py-3 md:py-4 bg-[#00FF88] text-black text-base md:text-lg font-display tracking-wider disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                ◐ SEARCHING...
              </span>
            ) : (
              'FIND FOOD →'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-[#FF3366] text-white border-brutal uppercase text-sm">
            ⚠ {error}
          </div>
        )}
      </div>

      {/* Results */}
      {recipes.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center gap-4 mb-6 md:mb-8">
            <div className="bg-black text-white px-4 py-2 font-display text-xl md:text-2xl rotate-1">
              FOUND {recipes.length} RECIPES
            </div>
            <div className="flex-1 h-1 bg-black hidden sm:block"></div>
          </div>
          
          {/* Responsive Grid - More columns on wider screens */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {recipes.map((recipe, index) => (
              <RecipeCard 
                key={recipe.id} 
                recipe={recipe} 
                token={token} 
                isAuthenticated={isAuthenticated}
                index={index}
                showToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && recipes.length === 0 && query && (
        <div className="card-brutal p-8 md:p-12 bg-white text-center">
          <div className="font-display text-3xl md:text-4xl mb-4">NO RESULTS</div>
          <p className="uppercase text-gray-600">Try a different search term</p>
        </div>
      )}

      {!loading && recipes.length === 0 && !query && (
        <div className="card-brutal p-8 md:p-12 bg-[#FFE500] text-center rotate-1">
          <div className="font-display text-3xl md:text-4xl mb-4">START SEARCHING</div>
          <p className="uppercase">Enter a dish name above to discover recipes</p>
        </div>
      )}

      {/* Toast Notifications - Portaled to body */}
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

interface RecipeCardProps {
  recipe: Recipe
  token: string | null
  isAuthenticated: boolean
  index: number
  showToast: (message: string, type: 'success' | 'error' | 'warning') => void
}

function RecipeCard({ recipe, token, isAuthenticated, index, showToast }: RecipeCardProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Alternate rotations for broken grid effect
  const rotations = ['rotate-1', 'rotate-neg-1', 'rotate-2', 'rotate-neg-2', '', 'rotate-neg-1']
  const rotation = rotations[index % rotations.length]
  
  // Alternate accent colors
  const accents = ['#FFE500', '#00D4FF', '#FF3366', '#00FF88', '#FFE500', '#00D4FF']
  const accent = accents[index % accents.length]

  const handleSave = async () => {
    console.log('handleSave called', { isAuthenticated, token })
    if (!isAuthenticated || !token) {
      showToast('Please login to save recipes', 'warning')
      return
    }

    setSaving(true)
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
        setSaved(true)
        showToast(`"${recipe.title}" saved!`, 'success')
      } else if (response.status === 400) {
        showToast('Recipe already saved', 'warning')
        setSaved(true)
      } else {
        throw new Error('Failed to save recipe')
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      showToast('Failed to save recipe', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div 
      className={`bg-white overflow-hidden ${rotation} animate-slideUp flex flex-col border-4 border-black transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]`}
      style={{ 
        animationDelay: `${index * 0.03}s`,
        boxShadow: '8px 8px 0px #000',
        maxWidth: '100%'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '12px 12px 0px #000'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '8px 8px 0px #000'
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden border-b-4 border-black" style={{ aspectRatio: '4/3' }}>
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          style={{ display: 'block' }}
        />
        <div 
          className="absolute top-2 right-2 px-2 py-0.5 font-display text-sm md:text-base"
          style={{ backgroundColor: accent }}
        >
          #{index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base uppercase mb-2 md:mb-3 line-clamp-2 leading-tight flex-shrink-0">
          {recipe.title}
        </h3>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 flex-shrink-0">
          {recipe.readyInMinutes && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              ⏱ {recipe.readyInMinutes}MIN
            </div>
          )}
          {recipe.servings && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              🍽 {recipe.servings}PPL
            </div>
          )}
        </div>

        {/* Tags - Hidden on smaller cards */}
        {recipe.dishTypes && recipe.dishTypes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5 flex-shrink-0 hidden lg:flex">
            {recipe.dishTypes.slice(0, 2).map((type, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 text-xs uppercase border-2 border-black"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Save Button - Always visible */}
        <button
          onClick={handleSave}
          disabled={saving || saved}
          className={`btn-brutal w-full py-2 md:py-3 uppercase font-bold text-sm transition-all duration-150 flex-shrink-0 ${
            saved
              ? 'bg-[#00FF88] text-black'
              : 'bg-[#FFE500] text-black hover:bg-[#FF3366] hover:text-white disabled:bg-gray-300'
          }`}
        >
          {saved ? (
            '✓ SAVED!'
          ) : saving ? (
            '◐ ...'
          ) : (
            '+ SAVE'
          )}
        </button>
      </div>
    </div>
  )
}

export default RecipeSearch