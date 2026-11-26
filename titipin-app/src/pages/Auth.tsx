import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'

export function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  const { loginUser, registerUser, logoutUser } = useStore()

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot' | 'reset'>('signin')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetFields = () => {
    setFullName('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  // Clear all fields whenever the page is mounted or left
  useEffect(() => {
    resetFields()
    const params = new URLSearchParams(location.search)
    if (params.get('reset') === '1') {
      setMode('reset')
      setSuccessMessage('Silakan masukkan kata sandi baru untuk akun Anda.')
    } else if (params.get('password_updated') === '1') {
      setMode('signin')
      setSuccessMessage(
        'Kata sandi berhasil diperbarui! Sesi sebelumnya telah dikeluarkan, silakan masuk kembali menggunakan kata sandi baru Anda.'
      )
    } else if (params.get('verified') === '1') {
      setMode('signin')
      setSuccessMessage('Email berhasil dikonfirmasi! Silakan masuk dengan email dan kata sandi Anda.')
    }
    return () => {
      resetFields()
    }
  }, [location.pathname, location.search])

  const handleTabChange = (newMode: 'signin' | 'signup') => {
    if (location.search) {
      navigate('/auth', { replace: true })
    }
    setMode(newMode)
    resetFields()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Please enter your registered email address.')
        return
      }
      setIsLoading(true)
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: 'https://theofilushalim.github.io/Techno-Masterclass/email-confirmed.html?type=recovery',
        })
        if (error) {
          setErrorMessage(error.message)
        } else {
          setSuccessMessage(
            `Tautan reset kata sandi telah dikirim ke ${email.trim()}. Silakan cek kotak masuk atau folder spam email Anda.`
          )
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (mode === 'reset') {
      if (password.length < 6) {
        setErrorMessage('Kata sandi baru minimal 6 karakter.')
        return
      }
      if (password !== confirmPassword) {
        setErrorMessage('Konfirmasi kata sandi tidak cocok.')
        return
      }
      setIsLoading(true)
      try {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) {
          if (error.message.toLowerCase().includes('different from the old password')) {
            setErrorMessage('Kata sandi baru harus berbeda dari kata sandi sebelumnya.')
          } else {
            setErrorMessage(error.message)
          }
        } else {
          // Sign out sesi lama/recovery dengan rapi agar user login ulang menggunakan kata sandi baru
          await logoutUser()
          setPassword('')
          setConfirmPassword('')
          navigate('/auth?password_updated=1', { replace: true })
        }
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : String(err))
      } finally {
        setIsLoading(false)
      }
      return
    }

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
          resetFields()
          setSuccessMessage('Login successful! Redirecting...')
          setTimeout(() => navigate(from, { replace: true }), 700)
        } else {
          setErrorMessage(res.error || 'Failed to sign in. Please check your credentials.')
        }
      } else {
        const res = await registerUser(fullName, email, password)
        if (res.success) {
          setSuccessMessage(
            `Registrasi berhasil! Tautan konfirmasi telah dikirim ke ${email}. Silakan buka email Anda, klik konfirmasi, lalu Sign In di tab Sign In.`
          )
          setMode('signin')
        } else {
          setErrorMessage(res.error || 'Gagal mendaftarkan akun.')
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
          {mode === 'signin'
            ? 'Welcome Back'
            : mode === 'signup'
            ? 'Create an Account'
            : mode === 'forgot'
            ? 'Forgot Password'
            : 'Set New Password'}
        </h1>
        <p className="text-green-200 text-xs mt-1">
          {mode === 'signin'
            ? 'Sign in to access your digital lockers, bookings, and subscription'
            : mode === 'signup'
            ? 'Register to start renting smart IoT lockers across Surabaya'
            : mode === 'forgot'
            ? 'Enter your email address and we will send you a password reset link'
            : 'Choose a strong new password for your Titipin account'}
        </p>

        {/* Tab switch */}
        {mode !== 'reset' && (
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
        )}
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

          {mode !== 'reset' && (
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
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-gray-700">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null)
                    setSuccessMessage(null)
                    setMode('forgot')
                  }}
                  className="text-xs font-semibold text-green-700 hover:text-green-800 hover:underline"
                >
                  Forgot password?
                </button>
              )}
            </div>
            {mode !== 'forgot' && (
              <>
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
              </>
            )}
          </div>

          {mode === 'reset' && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white transition-all"
                  required
                />
              </div>
            </div>
          )}

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
            ) : mode === 'signup' ? (
              'Create Account'
            ) : mode === 'forgot' ? (
              'Send Reset Link'
            ) : (
              'Save New Password'
            )}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null)
                setSuccessMessage(null)
                setMode('signin')
                if (location.search) {
                  navigate('/auth', { replace: true })
                }
              }}
              className="w-full py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 transition-colors"
            >
              Back to Sign In
            </button>
          )}
        </form>

        <p className="text-center text-[11px] text-gray-400 mt-6 leading-relaxed">
          {mode === 'signin' ? 'By signing in' : 'By signing up'}, you agree to Titipin Terms of Service and Privacy Policy. Connected to Supabase Auth.
        </p>
      </div>
    </div>
  )
}
