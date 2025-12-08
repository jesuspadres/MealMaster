import { useState } from 'react'

export interface Recipe {
  id: number
  external_id?: number
  title: string
  image?: string
  image_url?: string
  readyInMinutes?: number
  ready_in_minutes?: number
  servings?: number
  dishTypes?: string[]
  is_favorite?: boolean
}

interface RecipeCardProps {
  recipe: Recipe
  index: number
  onSave?: () => void
  onViewDetails?: () => void
  onToggleFavorite?: () => void
  onDelete?: () => void
  showFavoriteButton?: boolean
  showDeleteButton?: boolean
  showSaveButton?: boolean
}

export default function RecipeCard({ 
  recipe, 
  index, 
  onSave, 
  onViewDetails,
  onToggleFavorite,
  onDelete,
  showFavoriteButton = false,
  showDeleteButton = false,
  showSaveButton = true
}: RecipeCardProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const rotations = ['rotate-1', 'rotate-neg-1', 'rotate-2', 'rotate-neg-2', '', 'rotate-neg-1']
  const rotation = rotations[index % rotations.length]
  const accents = ['#FFE500', '#00D4FF', '#FF3366', '#00FF88', '#FFE500', '#00D4FF']
  const accent = accents[index % accents.length]

  // Handle both API response format and saved recipe format
  const imageUrl = recipe.image || recipe.image_url || ''
  const readyInMinutes = recipe.readyInMinutes || recipe.ready_in_minutes

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onSave) return
    setSaving(true)
    await onSave()
    setSaved(true)
    setSaving(false)
  }

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleFavorite?.()
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.()
  }

  const handleClick = () => {
    onViewDetails?.()
  }

  return (
    <div 
      className={`bg-white overflow-hidden ${rotation} flex flex-col border-4 border-black transition-all duration-300 ${onViewDetails ? 'cursor-pointer' : ''}`}
      style={{ 
        boxShadow: isHovered ? '12px 12px 0px #000' : '8px 8px 0px #000',
        position: 'relative',
        zIndex: isHovered ? 20 : 1,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : undefined
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Image */}
      <div className="relative overflow-hidden border-b-4 border-black" style={{ aspectRatio: '4/3' }}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={recipe.title} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" 
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-4xl">🍽</span>
          </div>
        )}
        
        {/* Index badge */}
        <div 
          className="absolute top-2 right-2 px-2 py-0.5 font-display text-sm border-2 border-black" 
          style={{ backgroundColor: accent }}
        >
          #{index + 1}
        </div>
        
        {/* Favorite badge */}
        {recipe.is_favorite && (
          <div className="absolute top-2 left-2 bg-[#FFE500] text-black px-2 py-0.5 font-bold text-xs uppercase border-2 border-black">
            ★ FAV
          </div>
        )}
        
        {/* Hover overlay */}
        {onViewDetails && (
          <div className={`absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <span className="bg-white text-black px-4 py-2 font-bold uppercase text-sm border-2 border-black">
              👁 View Recipe
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 md:p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base uppercase mb-2 md:mb-3 line-clamp-2 leading-tight">
          {recipe.title}
        </h3>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3">
          {readyInMinutes && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              ⏱ {readyInMinutes}MIN
            </div>
          )}
          {readyInMinutes && recipe.servings && <span className="text-gray-400">•</span>}
          {recipe.servings && (
            <div className="bg-black text-white px-2 py-0.5 text-xs uppercase">
              🍽 {recipe.servings}PPL
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {showSaveButton && onSave && (
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className={`btn-brutal flex-1 py-2 md:py-3 uppercase font-bold text-sm transition-all duration-150 ${
                saved 
                  ? 'bg-[#00FF88] text-black' 
                  : 'bg-[#FFE500] text-black hover:bg-[#FF3366] hover:text-white'
              }`}
            >
              {saved ? '✓ SAVED!' : saving ? '◐ ...' : '+ SAVE'}
            </button>
          )}
          
          {showFavoriteButton && onToggleFavorite && (
            <button
              onClick={handleFavorite}
              className={`btn-brutal flex-1 py-2 md:py-3 uppercase font-bold text-xs md:text-sm transition-all duration-150 ${
                recipe.is_favorite 
                  ? 'bg-[#FFE500] text-black' 
                  : 'bg-white text-black hover:bg-[#FFE500]'
              }`}
            >
              {recipe.is_favorite ? '★ FAVORITED' : '☆ FAVORITE'}
            </button>
          )}
          
          {showDeleteButton && onDelete && (
            <button
              onClick={handleDelete}
              className="btn-brutal px-3 md:px-4 py-2 md:py-3 bg-[#FF3366] text-white hover:bg-red-700 transition-colors"
            >
              🗑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}