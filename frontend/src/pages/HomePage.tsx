import { useNavigate } from 'react-router-dom'
import RecipeSearch from '../components/RecipeSearch.tsx'
import { useAuth } from '../context/AuthContext.tsx'

export default function HomePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/auth')
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay">
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
                  <div className="text-right hidden md:block mr-4">
                    <p className="text-sm font-bold uppercase">{user.name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-brutal px-4 py-2 bg-[#FF3366] text-white"
                  >
                    EXIT
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <RecipeSearch />
      </main>

      {/* Footer */}
      <footer className="bg-black text-white border-t-4 border-black mt-16">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <p className="uppercase text-sm text-gray-400">
            MealMaster — Built with React & FastAPI
          </p>
        </div>
      </footer>
    </div>
  )
}