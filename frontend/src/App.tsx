import RecipeSearch from './components/RecipeSearch'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🍳 MealMaster
          </h1>
          <p className="text-gray-600 mt-1">Your personal recipe and meal planning assistant</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <RecipeSearch />
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 border-t">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center text-gray-500">
          <p>MealMaster - Built with React & FastAPI</p>
        </div>
      </footer>
    </div>
  )
}

export default App