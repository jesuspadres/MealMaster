import { useState, FormEvent } from 'react'
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

function RecipeSearch() {
  const [query, setQuery] = useState<string>('')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const { token, isAuthenticated } = useAuth()

  const searchRecipes = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/recipes/search?query=${encodeURIComponent(query)}&number=12`, {
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
      {/* Search Form */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🔍 Search Recipes</h2>
        <form onSubmit={searchRecipes} className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try 'pasta carbonara' or 'vegan tacos'..."
            className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-semibold transform hover:-translate-y-0.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span> Searching...
              </span>
            ) : (
              'Search'
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Results */}
      {recipes.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Found {recipes.length} recipes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} token={token} isAuthenticated={isAuthenticated} />
            ))}
          </div>
        </div>
      )}

      {!loading && recipes.length === 0 && query && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No recipes found. Try a different search term.</p>
        </div>
      )}
    </div>
  )
}

interface RecipeCardProps {
  recipe: Recipe
  token: string | null
  isAuthenticated: boolean
}

function RecipeCard({ recipe, token, isAuthenticated }: RecipeCardProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    if (!isAuthenticated || !token) {
      alert('Please login to save recipes')
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
        setTimeout(() => setSaved(false), 3000) // Reset after 3 seconds
      } else if (response.status === 400) {
        alert('Recipe already saved')
        setSaved(true)
      } else {
        throw new Error('Failed to save recipe')
      }
    } catch (error) {
      console.error('Error saving recipe:', error)
      alert('Failed to save recipe')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
      {/* Image */}
      <div className="relative overflow-hidden h-56">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
          {recipe.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          {recipe.readyInMinutes && (
            <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1 rounded-full">
              <span>⏱️</span>
              <span className="font-medium">{recipe.readyInMinutes} min</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-full">
              <span>🍽️</span>
              <span className="font-medium">{recipe.servings} servings</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.dishTypes && recipe.dishTypes.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {recipe.dishTypes.slice(0, 3).map((type, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 text-xs rounded-full font-medium"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Save Button */}
        {isAuthenticated && (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 transform hover:-translate-y-0.5 shadow-md hover:shadow-lg ${
              saved
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400'
            }`}
          >
            {saved ? (
              <span className="flex items-center justify-center gap-2">
                ✓ Saved!
              </span>
            ) : saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Saving...
              </span>
            ) : (
              '+ Save Recipe'
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default RecipeSearch