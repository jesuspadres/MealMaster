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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="text-4xl">🍳</div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent">
                  MealMaster
                </h1>
                <p className="text-xs text-gray-500">Plan. Cook. Enjoy.</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  <button
                    onClick={() => navigate({ to: '/meal-planner' })}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    📅 Planner
                  </button>
                  <button
                    onClick={() => navigate({ to: '/saved-recipes' })}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    ❤️ Saved
                  </button>
                  
                  {/* User Menu */}
                  <div className="flex items-center gap-3 ml-2 pl-3 border-l border-gray-200">
                    <div className="text-right hidden md:block">
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate({ to: '/auth' })}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg"
                >
                  Login
                </button>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      {!isAuthenticated && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-pink-100 opacity-50"></div>
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Discover Your Next
              <span className="bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent"> Favorite Meal</span>
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Search thousands of recipes, plan your meals, and create shopping lists - all in one place
            </p>
            <button
              onClick={() => navigate({ to: '/auth' })}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-full text-lg font-semibold hover:from-orange-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Get Started Free
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <RecipeSearch />
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm mt-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Built with ❤️ using React, FastAPI, and Tailwind CSS
            </p>
            <p className="text-sm text-gray-500">
              © 2025 MealMaster. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App