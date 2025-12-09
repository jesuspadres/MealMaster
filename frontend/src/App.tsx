import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import RecipeSearch from './components/RecipeSearch.tsx'
import AIChat from './components/AIChat.tsx'
import { useAuth } from './context/AuthContext.tsx'

function App() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [showAIChat, setShowAIChat] = useState(false)

  const handleLogout = () => {
    logout()
    navigate({ to: '/auth' })
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay" style={{ maxWidth: '1800px', margin: '0 auto' }}>
      {/* Brutalist Header */}
      <header className="bg-black text-white border-b-4 border-black sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="bg-[#FFE500] text-black px-3 py-2 border-brutal text-4xl font-bold rotate-neg-2">
                🍳
              </div>
              <div>
                <h1 className="font-display text-4xl tracking-wider">
                  MEALMASTER
                </h1>
                <p className="text-xs uppercase tracking-[0.3em] text-gray-400">
                  Plan • Cook • Enjoy
                </p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={() => navigate({ to: '/meal-planner' })}
                    className="btn-brutal px-4 py-2 bg-[#00D4FF] text-black"
                  >
                    📅 PLANNER
                  </button>
                  <button
                    onClick={() => navigate({ to: '/saved-recipes' })}
                    className="btn-brutal px-4 py-2 bg-[#00FF88] text-black"
                  >
                    ❤️ SAVED
                  </button>
                  
                  {/* User Menu */}
                  <div className="flex items-center gap-3 ml-2 pl-4 border-l-4 border-white">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-bold uppercase">{user.name}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="btn-brutal px-4 py-2 bg-[#FF3366] text-white"
                    >
                      EXIT
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate({ to: '/auth' })}
                  className="btn-brutal px-6 py-2 bg-[#FFE500] text-black"
                >
                  LOGIN →
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Banner - Search Focus */}
      <div className="bg-black text-white py-8 md:py-12 border-b-4 border-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl tracking-wider mb-4">
            FIND YOUR NEXT
            <span className="block bg-[#FFE500] text-black px-4 py-2 mt-2 inline-block">FAVORITE RECIPE</span>
          </h2>
          <p className="text-lg md:text-xl uppercase text-gray-300 max-w-2xl mx-auto mt-4">
            Search thousands of recipes, save your favorites, and plan your meals
          </p>
        </div>
      </div>

      {/* Main Content - Search is the star */}
      <main className="mx-auto px-4 md:px-6 lg:px-12 py-8" style={{ maxWidth: '1600px' }}>
        <RecipeSearch />
      </main>

      {/* Features Section - Only show for non-authenticated users */}
      {!isAuthenticated && (
        <div className="bg-white border-t-4 border-b-4 border-black py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="inline-block bg-black text-white px-4 py-2 font-display text-2xl">
                WHY MEALMASTER?
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-4 border-black p-6 bg-[#FFE500]">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-display text-xl mb-2">SEARCH RECIPES</h3>
                <p className="text-sm uppercase">Find recipes from a massive database. Filter by ingredients, cuisine, or diet.</p>
              </div>
              <div className="border-4 border-black p-6 bg-[#00FF88]">
                <div className="text-4xl mb-4">❤️</div>
                <h3 className="font-display text-xl mb-2">SAVE FAVORITES</h3>
                <p className="text-sm uppercase">Build your personal cookbook. Access your saved recipes anytime.</p>
              </div>
              <div className="border-4 border-black p-6 bg-[#00D4FF]">
                <div className="text-4xl mb-4">📅</div>
                <h3 className="font-display text-xl mb-2">PLAN MEALS</h3>
                <p className="text-sm uppercase">Organize your week with our meal planner. Never wonder "what's for dinner?"</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <button
                onClick={() => navigate({ to: '/auth' })}
                className="btn-brutal px-8 py-4 bg-[#FF3366] text-white text-xl font-display tracking-wider"
              >
                CREATE FREE ACCOUNT →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-black mt-8">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-display text-2xl mb-4">MEALMASTER</h3>
              <p className="text-sm text-gray-400 uppercase">
                Built with React, FastAPI, and raw determination.
              </p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-white border-b-2 border-[#FFE500] pb-1 inline-block">Stack</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>→ React + TypeScript</li>
                <li>→ TanStack Router</li>
                <li>→ Tailwind CSS</li>
                <li>→ FastAPI Backend</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-white border-b-2 border-[#00D4FF] pb-1 inline-block">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>→ Recipe Search</li>
                <li>→ Meal Planning</li>
                <li>→ AI Assistant</li>
                <li>→ Save Favorites</li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-gray-800 mt-8 pt-4 text-center text-sm text-gray-500">
            © 2025 MEALMASTER — ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>

      {/* AI Chat Floating Button */}
      {isAuthenticated && (
        <button
          onClick={() => setShowAIChat(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-[#FF3366] text-white rounded-full border-4 border-black flex items-center justify-center text-2xl hover:scale-110 transition-transform z-50 group"
          style={{ boxShadow: '6px 6px 0px #000' }}
          title="Chat with AI Assistant"
        >
          <span className="group-hover:scale-110 transition-transform">🤖</span>
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full border-4 border-[#FF3366] animate-ping opacity-20"></span>
        </button>
      )}

      {/* AI Chat Modal */}
      <AIChat isOpen={showAIChat} onClose={() => setShowAIChat(false)} />
    </div>
  )
}

export default App