import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext.tsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SavedRecipe {
  id: number
  external_id: number
  title: string
  image_url: string | null
  ready_in_minutes: number | null
  servings: number | null
  is_favorite: boolean
}

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { token, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth' })
      return
    }

    fetchSavedRecipes()
  }, [isAuthenticated])

  const fetchSavedRecipes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/my-recipes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch saved recipes')
      }

      const data = await response.json()
      setRecipes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (recipeId: number) => {
    if (!confirm('Are you sure you want to remove this recipe?')) return

    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete recipe')
      }

      setRecipes(recipes.filter(r => r.id !== recipeId))
      alert('Recipe removed successfully!')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete recipe')
    }
  }

  const handleToggleFavorite = async (recipeId: number) => {
    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/${recipeId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to toggle favorite')
      }

      const updatedRecipe = await response.json()
      setRecipes(recipes.map(r => r.id === recipeId ? updatedRecipe : r))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update favorite')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl text-gray-600">Loading your recipes...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Saved Recipes</h1>
        <p className="text-gray-600 mt-2">
          {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} saved
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-600 mb-4">No saved recipes yet!</p>
          <button
            onClick={() => navigate({ to: '/' })}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search for Recipes
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {recipe.image_url && (
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-gray-900 flex-1">
                    {recipe.title}
                  </h3>
                  <button
                    onClick={() => handleToggleFavorite(recipe.id)}
                    className="text-2xl ml-2"
                  >
                    {recipe.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  {recipe.ready_in_minutes && (
                    <span className="flex items-center gap-1">
                      ⏱️ {recipe.ready_in_minutes} min
                    </span>
                  )}
                  {recipe.servings && (
                    <span className="flex items-center gap-1">
                      🍽️ {recipe.servings} servings
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(recipe.id)}
                  className="w-full py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  🗑️ Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}