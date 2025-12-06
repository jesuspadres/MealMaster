import { useNavigate } from '@tanstack/react-router'
import RecipeSearch from './components/RecipeSearch.tsx'
import { useAuth } from './context/AuthContext.tsx'

function App() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

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

      {/* Marquee Banner */}
      <div className="bg-[#FFE500] border-b-4 border-black overflow-hidden py-2">
        <div className="animate-marquee whitespace-nowrap">
          <span className="font-display text-2xl tracking-wider mx-8">
            ★ DISCOVER RECIPES ★ PLAN YOUR MEALS ★ EAT BETTER ★ COOK SMARTER ★ DISCOVER RECIPES ★ PLAN YOUR MEALS ★ EAT BETTER ★ COOK SMARTER ★
          </span>
          <span className="font-display text-2xl tracking-wider mx-8">
            ★ DISCOVER RECIPES ★ PLAN YOUR MEALS ★ EAT BETTER ★ COOK SMARTER ★ DISCOVER RECIPES ★ PLAN YOUR MEALS ★ EAT BETTER ★ COOK SMARTER ★
          </span>
        </div>
      </div>

      {/* Hero Section */}
      {!isAuthenticated && (
        <div className="relative py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left side - broken grid text */}
              <div className="space-y-6">
                <div className="inline-block bg-black text-white px-4 py-2 rotate-neg-1 border-brutal">
                  <span className="font-display text-6xl md:text-8xl tracking-wider">
                    DISCOVER
                  </span>
                </div>
                <div className="inline-block bg-[#FF3366] text-white px-4 py-2 rotate-1 border-brutal ml-8">
                  <span className="font-display text-6xl md:text-8xl tracking-wider">
                    YOUR NEXT
                  </span>
                </div>
                <div className="inline-block bg-[#00D4FF] text-black px-4 py-2 rotate-neg-2 border-brutal">
                  <span className="font-display text-6xl md:text-8xl tracking-wider">
                    FAVORITE
                  </span>
                </div>
                <div className="inline-block bg-[#FFE500] text-black px-4 py-2 rotate-1 border-brutal ml-12">
                  <span className="font-display text-6xl md:text-8xl tracking-wider">
                    MEAL
                  </span>
                </div>
              </div>
              
              {/* Right side - CTA box */}
              <div className="card-brutal p-8 bg-white rotate-1">
                <p className="text-lg mb-6 uppercase">
                  Search thousands of recipes, plan your meals, and create shopping lists — all in one place.
                </p>
                <button
                  onClick={() => navigate({ to: '/auth' })}
                  className="btn-brutal w-full py-4 bg-[#00FF88] text-black text-xl font-display tracking-wider"
                >
                  GET STARTED FREE →
                </button>
                <div className="mt-4 flex gap-4 text-sm uppercase">
                  <span className="bg-black text-white px-2 py-1">✓ Free</span>
                  <span className="bg-black text-white px-2 py-1">✓ No Ads</span>
                  <span className="bg-black text-white px-2 py-1">✓ Unlimited</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto px-6 lg:px-12 py-8" style={{ maxWidth: '1600px' }}>
        <RecipeSearch />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-black mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-display text-2xl mb-4">MEALMASTER</h3>
              <p className="text-sm text-gray-400 uppercase">
                Built with React, FastAPI, and raw determination.
              </p>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-[#FFE500]">Stack</h4>
              <ul className="space-y-2 text-sm">
                <li>→ React + TypeScript</li>
                <li>→ TanStack Router</li>
                <li>→ Tailwind CSS</li>
                <li>→ FastAPI Backend</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold uppercase mb-4 text-[#00D4FF]">Features</h4>
              <ul className="space-y-2 text-sm">
                <li>→ Recipe Search</li>
                <li>→ Meal Planning</li>
                <li>→ Save Favorites</li>
                <li>→ Shopping Lists</li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-gray-800 mt-8 pt-4 text-center text-sm text-gray-500">
            © 2025 MEALMASTER — ALL RIGHTS RESERVED
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App