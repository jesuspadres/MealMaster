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
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <form onSubmit={searchRecipes} className="flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for recipes (e.g., pasta, chicken, vegan)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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

    console.log('Token:', token)
    console.log('API URL:', API_URL)
    console.log('Full URL:', `${API_URL}/api/saved-recipes/`)

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

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const responseText = await response.text()
      console.log('Response body:', responseText)

      if (response.ok) {
        setSaved(true)
        alert('Recipe saved successfully!')
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={recipe.image}
        alt={recipe.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {recipe.title}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          {recipe.readyInMinutes && (
            <span className="flex items-center gap-1">
              ⏱️ {recipe.readyInMinutes} min
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1">
              🍽️ {recipe.servings} servings
            </span>
          )}
        </div>
        {recipe.dishTypes && recipe.dishTypes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {recipe.dishTypes.slice(0, 3).map((type, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        )}
        {isAuthenticated && (
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={`w-full py-2 rounded-lg font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400'
            }`}
          >
            {saved ? '✓ Saved' : saving ? 'Saving...' : '+ Save Recipe'}
          </button>
        )}
      </div>
    </div>
  )
}

export default RecipeSearch