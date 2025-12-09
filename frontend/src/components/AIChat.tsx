import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import RecipeDetailModal from './RecipeDetailModal'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Recipe {
  id: number
  title: string
  image: string
  readyInMinutes?: number
  servings?: number
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  recipes?: Recipe[]
  timestamp: Date
}

interface AIChatProps {
  isOpen: boolean
  onClose: () => void
}

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'warning'
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey there! 👋 I'm your MealMaster AI assistant. Ask me for recipe ideas and I'll show you real recipes you can save!\n\nTry asking:\n• \"Quick dinner ideas\"\n• \"High protein breakfast\"\n• \"What can I make with chicken?\"\n• \"Vegetarian meal prep\"",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [addingToPlanner, setAddingToPlanner] = useState<number | null>(null)
  const [showPlannerPicker, setShowPlannerPicker] = useState<{ recipeId: number, title: string, image: string } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { token, isAuthenticated } = useAuth()

  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const conversationHistory = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversation_history: conversationHistory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        recipes: data.recipes || undefined,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again! 😅",
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSaveRecipe = async (recipe: Recipe) => {
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
        showToast(`Saved "${recipe.title}"!`, 'success')
      } else if (response.status === 400) {
        showToast('Already saved!', 'warning')
      }
    } catch {
      showToast('Failed to save', 'error')
    }
  }

  const handleAddToPlanner = (recipe: Recipe) => {
    setShowPlannerPicker({ recipeId: recipe.id, title: recipe.title, image: recipe.image })
  }

  const confirmAddToPlanner = async (date: string, mealType: string) => {
    if (!showPlannerPicker) return
    
    setAddingToPlanner(showPlannerPicker.recipeId)
    
    try {
      // First save the recipe
      const saveResponse = await fetch(`${API_URL}/api/saved-recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          external_id: showPlannerPicker.recipeId,
          title: showPlannerPicker.title,
          image_url: showPlannerPicker.image
        })
      })

      let savedRecipeId: number

      if (saveResponse.ok) {
        const saved = await saveResponse.json()
        savedRecipeId = saved.id
      } else if (saveResponse.status === 400) {
        // Already saved, get the existing one
        const existingResponse = await fetch(`${API_URL}/api/saved-recipes/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const existing = await existingResponse.json()
        const found = existing.find((r: any) => r.external_id === showPlannerPicker.recipeId)
        if (!found) throw new Error('Could not find saved recipe')
        savedRecipeId = found.id
      } else {
        throw new Error('Failed to save recipe')
      }

      // Now add to meal plan
      const planResponse = await fetch(`${API_URL}/api/meal-plans/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          saved_recipe_id: savedRecipeId,
          date: date,
          meal_type: mealType,
          servings: 1
        })
      })

      if (planResponse.ok) {
        showToast(`Added to ${mealType}!`, 'success')
      } else {
        throw new Error('Failed to add to planner')
      }
    } catch (err) {
      showToast('Failed to add to planner', 'error')
    } finally {
      setAddingToPlanner(null)
      setShowPlannerPicker(null)
    }
  }

  const handleViewDetails = (recipeId: number) => {
    setSelectedRecipeId(recipeId)
    setIsModalOpen(true)
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! 🧹 What recipes can I help you find?",
      timestamp: new Date()
    }])
  }

  const quickPrompts = [
    "Quick weeknight dinners",
    "Healthy meal prep ideas",
    "High protein recipes",
    "Vegetarian comfort food"
  ]

  const formatMessage = (content: string) => {
    let formatted = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/^• /gm, '<span class="text-[#FF3366]">→</span> ')
    formatted = formatted.replace(/\n/g, '<br/>')
    return formatted
  }

  // Get dates for the next 7 days
  const getNextDays = () => {
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      days.push({
        date: date.toISOString().split('T')[0],
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      })
    }
    return days
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* Main Chat Modal */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 999998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div
          style={{
            backgroundColor: '#F5F0E8',
            border: '4px solid black',
            boxShadow: '12px 12px 0px #000',
            width: '100%',
            maxWidth: '700px',
            height: '90vh',
            maxHeight: '800px',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '4px',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-black text-white p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFE500] rounded-full flex items-center justify-center text-black text-xl">
                🤖
              </div>
              <div>
                <div className="font-display text-xl">MEALMASTER AI</div>
                <div className="text-xs text-gray-400 uppercase">Recipe assistant</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="px-3 py-1 text-xs uppercase bg-gray-800 hover:bg-gray-700 transition-colors border-2 border-gray-600"
              >
                Clear
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-[#FF3366] transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] ${message.role === 'user' ? '' : 'w-full'}`}>
                  <div
                    className={`p-3 border-4 border-black ${
                      message.role === 'user' ? 'bg-[#FFE500]' : 'bg-white'
                    }`}
                    style={{ boxShadow: '4px 4px 0px #000' }}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-gray-200">
                        <span>🤖</span>
                        <span className="font-bold text-xs uppercase text-gray-500">MealMaster AI</span>
                      </div>
                    )}
                    <div
                      className="text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                    />
                  </div>
                  
                  {/* Recipe Cards */}
                  {message.recipes && message.recipes.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {message.recipes.map((recipe) => (
                        <div
                          key={recipe.id}
                          className="bg-white border-3 border-black overflow-hidden hover:shadow-lg transition-shadow"
                          style={{ boxShadow: '3px 3px 0px #000' }}
                        >
                          {/* Recipe Image */}
                          <div 
                            className="relative h-24 cursor-pointer group"
                            onClick={() => handleViewDetails(recipe.id)}
                          >
                            <img
                              src={recipe.image}
                              alt={recipe.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                              <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-bold uppercase">
                                View Details
                              </span>
                            </div>
                          </div>
                          
                          {/* Recipe Info */}
                          <div className="p-2">
                            <h4 className="font-bold text-xs uppercase line-clamp-2 mb-1 leading-tight">
                              {recipe.title}
                            </h4>
                            <div className="flex gap-2 text-[10px] text-gray-600 mb-2">
                              {recipe.readyInMinutes && <span>⏱{recipe.readyInMinutes}m</span>}
                              {recipe.servings && <span>🍽{recipe.servings}</span>}
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSaveRecipe(recipe)}
                                className="flex-1 py-1 text-[10px] font-bold uppercase bg-[#FFE500] border-2 border-black hover:bg-[#00FF88] transition-colors"
                              >
                                ♥ Save
                              </button>
                              <button
                                onClick={() => handleAddToPlanner(recipe)}
                                className="flex-1 py-1 text-[10px] font-bold uppercase bg-[#00D4FF] border-2 border-black hover:bg-[#00FF88] transition-colors"
                              >
                                📅 Plan
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-4 border-4 border-black" style={{ boxShadow: '4px 4px 0px #000' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-[#FF3366] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-[#FF3366] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-[#FF3366] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-gray-500">Finding recipes...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex-shrink-0">
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setInput(prompt); inputRef.current?.focus() }}
                    className="px-3 py-1 text-xs bg-white border-2 border-black hover:bg-[#FFE500] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t-4 border-black bg-white flex-shrink-0">
            <div className="flex gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask for recipe ideas..."
                className="flex-1 border-4 border-black px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FFE500]"
                rows={2}
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="px-6 bg-[#FF3366] text-white font-bold border-4 border-black hover:bg-[#e02555] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                style={{ boxShadow: '4px 4px 0px #000' }}
              >
                {isLoading ? '◐' : '→'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Meal Planner Picker Modal */}
      {showPlannerPicker && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowPlannerPicker(null)}
        >
          <div
            className="bg-white border-4 border-black p-4 w-full max-w-sm"
            style={{ boxShadow: '8px 8px 0px #000' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg">ADD TO PLANNER</h3>
              <button onClick={() => setShowPlannerPicker(null)} className="text-xl hover:text-[#FF3366]">✕</button>
            </div>
            
            <p className="text-xs uppercase text-gray-600 mb-4 line-clamp-1">
              {showPlannerPicker.title}
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {getNextDays().map((day) => (
                <div key={day.date} className="border-2 border-black">
                  <div className="bg-gray-100 px-3 py-1 font-bold text-xs uppercase border-b-2 border-black">
                    {day.label}
                  </div>
                  <div className="flex">
                    {['breakfast', 'lunch', 'dinner'].map((meal) => (
                      <button
                        key={meal}
                        onClick={() => confirmAddToPlanner(day.date, meal)}
                        disabled={addingToPlanner === showPlannerPicker.recipeId}
                        className="flex-1 py-2 text-xs uppercase font-bold hover:bg-[#00FF88] transition-colors border-r-2 border-black last:border-r-0 disabled:opacity-50"
                      >
                        {meal === 'breakfast' ? '🌅' : meal === 'lunch' ? '☀️' : '🌙'}
                        <span className="hidden sm:inline ml-1">{meal}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipeId={selectedRecipeId}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedRecipeId(null) }}
        onSave={async (recipe) => {
          await handleSaveRecipe(recipe as any)
          return true
        }}
      />

      {/* Toasts */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999999, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="px-4 py-2 border-4 border-black font-bold text-sm uppercase"
              style={{
                boxShadow: '4px 4px 0px #000',
                backgroundColor: toast.type === 'success' ? '#00FF88' : toast.type === 'error' ? '#FF3366' : '#FFE500',
                color: toast.type === 'error' ? 'white' : 'black'
              }}
            >
              {toast.type === 'success' && '✓ '}{toast.type === 'error' && '✗ '}{toast.message}
            </div>
          ))}
        </div>
      )}
    </>,
    document.body
  )
}