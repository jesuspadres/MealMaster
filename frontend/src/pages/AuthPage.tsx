import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext.tsx'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, name, password)
      }
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0E8] relative noise-overlay flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute top-20 left-10 bg-[#FFE500] w-32 h-32 border-brutal rotate-12 hidden lg:block"></div>
      <div className="absolute bottom-20 right-10 bg-[#00D4FF] w-24 h-24 border-brutal rotate-neg-12 hidden lg:block"></div>
      <div className="absolute top-40 right-20 bg-[#FF3366] w-16 h-16 border-brutal rotate-6 hidden lg:block"></div>
      <div className="absolute bottom-40 left-20 bg-[#00FF88] w-20 h-20 border-brutal rotate-neg-6 hidden lg:block"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div 
            className="inline-block bg-black text-[#FFE500] px-6 py-4 border-brutal rotate-neg-2 mb-4 cursor-pointer"
            onClick={() => navigate({ to: '/' })}
          >
            <span className="font-display text-5xl tracking-wider">🍳 MEALMASTER</span>
          </div>
          <div className="inline-block bg-[#FF3366] text-white px-4 py-2 border-brutal rotate-1">
            <span className="font-display text-2xl tracking-wider">
              {mode === 'login' ? 'WELCOME BACK' : 'JOIN THE CLUB'}
            </span>
          </div>
        </div>

        {/* Form Card */}
        <div className="card-brutal p-8 bg-white rotate-1">
          {/* Mode Toggle */}
          <div className="flex mb-6 border-brutal overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError('')
              }}
              className={`flex-1 py-3 font-bold uppercase transition-colors ${
                mode === 'login' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              LOGIN
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError('')
              }}
              className={`flex-1 py-3 font-bold uppercase transition-colors border-l-4 border-black ${
                mode === 'register' 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              REGISTER
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[#FF3366] text-white border-brutal uppercase text-sm glitch">
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold uppercase mb-2 tracking-wider">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-brutal w-full px-4 py-3 uppercase placeholder:text-gray-400"
                placeholder="YOUR@EMAIL.COM"
              />
            </div>

            {/* Name (Register only) */}
            {mode === 'register' && (
              <div className="animate-slideUp">
                <label className="block text-sm font-bold uppercase mb-2 tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="input-brutal w-full px-4 py-3 uppercase placeholder:text-gray-400"
                  placeholder="JOHN DOE"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-bold uppercase mb-2 tracking-wider">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-brutal w-full px-4 py-3 uppercase placeholder:text-gray-400"
                placeholder="••••••••"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-brutal w-full py-4 bg-[#00FF88] text-black font-display text-2xl tracking-wider disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  ◐ {mode === 'login' ? 'LOGGING IN...' : 'CREATING...'}
                </span>
              ) : (
                mode === 'login' ? 'ENTER →' : 'CREATE ACCOUNT →'
              )}
            </button>
          </form>

          {/* Footer text */}
          <div className="mt-6 text-center text-sm uppercase text-gray-600">
            {mode === 'login' ? (
              <p>
                New here?{' '}
                <button
                  onClick={() => {
                    setMode('register')
                    setError('')
                    setEmail('')
                    setName('')
                    setPassword('')
                  }}
                  className="font-bold text-black underline hover:text-[#FF3366]"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setMode('login')
                    setError('')
                    setEmail('')
                    setName('')
                    setPassword('')
                  }}
                  className="font-bold text-black underline hover:text-[#FF3366]"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate({ to: '/' })}
            className="btn-brutal px-6 py-2 bg-black text-white"
          >
            ← BACK TO HOME
          </button>
        </div>
      </div>
    </div>
  )
}