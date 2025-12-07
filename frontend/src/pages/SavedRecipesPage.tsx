import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

interface RecipeCardProps {
  recipe: SavedRecipe
  index: number
  rotations: string[]
  accents: string[]
  onToggleFavorite: (id: number, title: string) => void
  onDelete: (id: number, title: string) => void
}

function RecipeCard({ recipe, index, rotations, accents, onToggleFavorite, onDelete }: RecipeCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  const rotation = rotations[index % rotations.length]
  const accent = accents[index % accents.length]

  return (
    <div 
      className={`bg-white overflow-hidden ${rotation} animate-slideUp flex flex-col border-4 border-black transition-all duration-300`}
      style={{ 
        animationDelay: `${index * 0.03}s`,
        boxShadow: isHovered ? '12px 12px 0px #000' : '8px 8px 0px #000',
        maxWidth: '100%',
        position: 'relative',
        zIndex: isHovered ? 20 : 1,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      {recipe.image_url && (
        <div className="relative overflow-hidden border-b-4 border-black" style={{ aspectRatio: '4/3' }}>
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            style={{ display: 'block' }}
          />
          {/* Index Badge */}
          <div 
            className="absolute top-2 right-2 px-2 py-0.5 font-display text-sm md:text-base border-2 border-black"
            style={{ backgroundColor: accent }}
          >
            #{index + 1}
          </div>
          {/* Favorite Badge */}
          {recipe.is_favorite && (
            <div className="absolute top-2 left-2 bg-[#FFE500] text-black px-2 py-0.5 font-bold text-xs uppercase border-2 border-black">
              ★ FAV
            </div>
          )}
        </div>
      )}
      
      {/* Content */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base uppercase mb-2 md:mb-3 line-clamp-2 leading-tight flex-shrink-0">
          {recipe.title}
        </h3>
        
        {/* Meta Info */}
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 flex-shrink-0">
          {recipe.ready_in_minutes && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              ⏱ {recipe.ready_in_minutes}MIN
            </div>
          )}
          {recipe.servings && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              🍽 {recipe.servings}PPL
            </div>
          )}
        </div>

        {/* Spacer to push buttons to bottom */}
        <div className="flex-1"></div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onToggleFavorite(recipe.id, recipe.title)}
            className={`btn-brutal flex-1 py-2 md:py-3 uppercase font-bold text-xs md:text-sm transition-all duration-150 ${
              recipe.is_favorite 
                ? 'bg-[#FFE500] text-black' 
                : 'bg-white text-black hover:bg-[#FFE500]'
            }`}
          >
            {recipe.is_favorite ? '★ FAVORITED' : '☆ FAVORITE'}
          </button>
          <button
            onClick={() => onDelete(recipe.id, recipe.title)}
            className="btn-brutal px-3 md:px-4 py-2 md:py-3 bg-[#FF3366] text-white hover:bg-red-700 transition-colors"
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SavedRecipesPage() {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'favorites'>('all')
  const [toasts, setToasts] = useState<Toast[]>([])
  
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

  // Alternate rotations and accents for broken grid effect
  const rotations = ['rotate-1', 'rotate-neg-1', 'rotate-2', 'rotate-neg-2', '', 'rotate-neg-1']
  const accents = ['#FFE500', '#00D4FF', '#FF3366', '#00FF88', '#FFE500', '#00D4FF']

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E8] flex items-center justify-center">
        <div className="card-brutal p-8 bg-[#FFE500] rotate-2">
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
              <div className="bg-[#FF3366] text-white px-4 py-2 border-brutal rotate-neg-2" style={{ zIndex: 2 }}>
                <span className="font-display text-2xl md:text-4xl tracking-wider">❤️ SAVED</span>
              </div>
              <div className="bg-[#FFE500] text-black px-4 py-2 border-brutal rotate-1" style={{ zIndex: 1 }}>
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
          <div className="flex border-brutal overflow-hidden">
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
          <div className="mb-6 p-4 bg-[#FF3366] text-white border-brutal uppercase">
            ⚠ {error}
          </div>
        )}

        {filteredRecipes.length === 0 ? (
          <div className="card-brutal p-8 md:p-12 bg-white text-center rotate-1">
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

            {/* Responsive Grid - Matches RecipeSearch */}
            <div 
              className="card-grid-wrapper"
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
                  rotations={rotations}
                  accents={accents}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </main>

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