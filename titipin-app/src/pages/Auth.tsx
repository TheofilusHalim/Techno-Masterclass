import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'

export function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  const { loginUser, registerUser } = useStore()

  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetFields = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  // Clear all fields whenever the page is mounted or left
  useEffect(() => {
    resetFields()
    return () => {
      resetFields()
    }
  }, [location.pathname])

  const handleTabChange = (newMode: 'signin' | 'signup') => {
    setMode(newMode)
    resetFields()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.')
      return
    }

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    setIsLoading(true)

    try {
      if (mode === 'signin') {
        const res = await loginUser(email, password)
        if (res.success) {
          setSuccessMessage('Login successful! Redirecting...')
          resetFields()
          setTimeout(() => navigate(from, { replace: true }), 700)
        } else {
          setErrorMessage(res.error || 'Failed to sign in. Please check your credentials.')
        }
      } else {
        const res = await registerUser(fullName, email, password)
        if (res.success) {
          if (res.needsEmailConfirmation) {
            setSuccessMessage(
              `Registrasi berhasil! Tautan konfirmasi telah dikirim ke ${email}. Silakan buka Gmail Anda, klik link verifikasinya, lalu Sign In di bawah.`
            )
            setMode('signin')
          } else {
            setSuccessMessage('Account registered successfully! Redirecting...')
            resetFields()
            setTimeout(() => navigate(from, { replace: true }), 700)
          }
        } else {
          setErrorMessage(res.error || 'Failed to register account.')
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Header */}
      <div className="bg-green-700 px-4 pt-12 pb-8 text-white relative">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => {
              resetFields()
              navigate(-1)
            }}
            className="p-2 rounded-full bg-green-600 hover:bg-green-500 transition-colors"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <span className="text-sm font-semibold tracking-wide text-green-200 uppercase">
            Titipin Account
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight">
          {mode === 'signin' ? 'Welcome Back 👋' : 'Create an Account ✨'}
        </h1>
        <p className="text-green-200 text-xs mt-1">
          {mode === 'signin'
            ? 'Sign in to access your digital lockers, bookings, and subscription'
            : 'Register to start renting smart IoT lockers across Surabaya'}
        </p>

        {/* Tab switch */}
        <div className="flex p-1 bg-green-800/70 backdrop-blur rounded-2xl mt-5">
          <button
            type="button"
            onClick={() => handleTabChange('signin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signin' ? 'bg-white text-green-800 shadow-sm' : 'text-green-200 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              mode === 'signup' ? 'bg-white text-green-800 shadow-sm' : 'text-green-200 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 px-5 py-6">
        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-red-700 animate-in fade-in">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{successMessage}</div>
          </div>
        )}

        <form key={mode} onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kevin William"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                  required={mode === 'signup'}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Minimum 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-green-700 hover:bg-green-800 active:scale-98 text-white rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
          By signing in, you agree to Titipin Terms of Service and Privacy Policy. Connected to Supabase Auth.
        </p>
      </div>
    </div>
  )
}
