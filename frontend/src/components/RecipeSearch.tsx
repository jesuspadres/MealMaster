import { useState, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext.tsx'
import RecipeCard, { Recipe } from './RecipeCard.tsx'
import RecipeDetailModal, { RecipeDetails } from './RecipeDetailModal.tsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

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
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
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

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/recipes/search?query=${encodeURIComponent(searchQuery)}&number=24`)
      if (!response.ok) throw new Error('Failed to search recipes')
      const data: SearchResponse = await response.json()
      setRecipes(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search recipes')
    } finally {
      setLoading(false)
    }
  }

  const searchRecipes = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    performSearch(query)
  }

  const handleQuickSearch = (term: string) => {
    setQuery(term)
    performSearch(term)
  }

  const handleViewDetails = (recipeId: number) => {
    setSelectedRecipeId(recipeId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecipeId(null)
  }

  const handleSaveRecipe = async (recipe: Recipe | RecipeDetails) => {
    if (!isAuthenticated || !token) {
      showToast('Please login to save recipes', 'warning')
      return false
    }

    try {
      const imageUrl = 'image' in recipe ? recipe.image : recipe.image_url
      const response = await fetch(`${API_URL}/api/saved-recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          external_id: recipe.id,
          title: recipe.title,
          image_url: imageUrl,
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
              onClick={() => handleQuickSearch(s)}
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
                onViewDetails={() => handleViewDetails(recipe.id)}
                showSaveButton={true}
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
      <RecipeDetailModal
        recipeId={selectedRecipeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRecipe}
        token={token}
        isAuthenticated={isAuthenticated}
      />

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

export default RecipeSearch