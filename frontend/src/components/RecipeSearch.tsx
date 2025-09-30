import { useState, FormEvent } from 'react'
import axios from 'axios'

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

  const searchRecipes = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get<SearchResponse>(`${API_URL}/api/recipes/search`, {
        params: { query, number: 12 }
      })
      setRecipes(response.data.results)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Failed to search recipes. Please try again.')
      } else {
        setError('An unexpected error occurred.')
      }
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
              <RecipeCard key={recipe.id} recipe={recipe} />
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
}

function RecipeCard({ recipe }: RecipeCardProps) {
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
        <div className="flex items-center gap-4 text-sm text-gray-600">
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
          <div className="mt-3 flex flex-wrap gap-2">
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
      </div>
    </div>
  )
}

export default RecipeSearch