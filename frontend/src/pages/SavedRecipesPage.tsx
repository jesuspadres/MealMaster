import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext.tsx'
import RecipeCard, { Recipe } from '../components/RecipeCard.tsx'
import RecipeDetailModal, { RecipeDetails } from '../components/RecipeDetailModal.tsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface SavedRecipe {
  id: number
  external_id: number
  title: string
  image_url: string | undefined
  ready_in_minutes: number | undefined
  servings: number | undefined
  is_favorite: boolean
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { token, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/auth' })
      return
    }

    fetchSavedRecipes()
  }, [isAuthenticated])

  const fetchSavedRecipes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/`, {
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

  const handleViewDetails = (externalId: number) => {
    setSelectedRecipeId(externalId)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRecipeId(null)
  }

  const handleDelete = async (recipeId: number, recipeTitle: string) => {
    try {
      const response = await fetch(`${API_URL}/api/saved-recipes/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.detail || 'Failed to delete recipe'
        throw new Error(errorMessage)
      }

      setRecipes(prev => prev.filter(r => r.id !== recipeId))
      showToast(`"${recipeTitle}" removed`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete recipe', 'error')
    }
  }

  const handleToggleFavorite = async (recipeId: number, recipeTitle: string) => {
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
      setRecipes(prev => prev.map(r => r.id === recipeId ? updatedRecipe : r))
      showToast(
        updatedRecipe.is_favorite 
          ? `"${recipeTitle}" added to favorites` 
          : `"${recipeTitle}" removed from favorites`,
        'success'
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update favorite', 'error')
    }
  }

  const filteredRecipes = filter === 'favorites' 
    ? recipes.filter(r => r.is_favorite) 
    : recipes

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="border-4 border-black p-8 bg-[#FFE500] rotate-2" style={{ boxShadow: '8px 8px 0px #000' }}>
          <div className="font-display text-4xl">LOADING...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay">
      {/* Header */}
      <header className="bg-black text-white border-b-4 border-black sticky top-0" style={{ zIndex: 50 }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-[#FF3366] text-white px-4 py-2 border-4 border-black rotate-neg-2" style={{ zIndex: 2 }}>
                <span className="font-display text-2xl md:text-4xl tracking-wider">❤️ SAVED</span>
              </div>
              <div className="bg-[#FFE500] text-black px-4 py-2 border-4 border-black rotate-1" style={{ zIndex: 1 }}>
                <span className="font-display text-2xl md:text-4xl tracking-wider">RECIPES</span>
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

      {/* Stats Bar */}
      <div className="bg-[#00D4FF] border-b-4 border-black py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white px-4 py-2 uppercase font-bold text-sm md:text-base">
              Total: {recipes.length}
            </div>
            <span className="text-black font-bold text-xl">|</span>
            <div className="bg-black text-[#FFE500] px-4 py-2 uppercase font-bold text-sm md:text-base">
              Favorites: {recipes.filter(r => r.is_favorite).length}
            </div>
          </div>
          
          {/* Filter Toggle */}
          <div className="flex border-4 border-black overflow-hidden">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-bold uppercase transition-colors text-sm md:text-base ${
                filter === 'all' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-4 py-2 font-bold uppercase transition-colors border-l-4 border-black text-sm md:text-base ${
                filter === 'favorites' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              ★ FAVORITES
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-[#FF3366] text-white border-4 border-black uppercase">
            ⚠ {error}
          </div>
        )}

        {filteredRecipes.length === 0 ? (
          <div className="border-4 border-black p-8 md:p-12 bg-white text-center rotate-1" style={{ boxShadow: '8px 8px 0px #000' }}>
            <div className="font-display text-3xl md:text-5xl mb-4">
              {filter === 'favorites' ? 'NO FAVORITES YET' : 'NO SAVED RECIPES'}
            </div>
            <p className="uppercase text-gray-600 mb-6">
              {filter === 'favorites' 
                ? 'Star some recipes to see them here!' 
                : 'Search and save some delicious recipes!'}
            </p>
            <button
              onClick={() => navigate({ to: '/' })}
              className="btn-brutal px-8 py-4 bg-[#00FF88] text-black font-display text-lg md:text-xl"
            >
              FIND RECIPES →
            </button>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6 md:mb-8">
              <div className="bg-black text-white px-4 py-2 font-display text-xl md:text-2xl rotate-1">
                {filteredRecipes.length} {filter === 'favorites' ? 'FAVORITES' : 'RECIPES'}
              </div>
              <div className="flex-1 h-1 bg-black hidden sm:block"></div>
            </div>

            {/* Recipe Grid */}
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem',
                padding: '0.5rem'
              }}
            >
              {filteredRecipes.map((recipe, index) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  onViewDetails={() => handleViewDetails(recipe.external_id)}
                  onToggleFavorite={() => handleToggleFavorite(recipe.id, recipe.title)}
                  onDelete={() => handleDelete(recipe.id, recipe.title)}
                  showSaveButton={false}
                  showFavoriteButton={true}
                  showDeleteButton={true}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipeId={selectedRecipeId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

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