import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'
import { GoogleLogin } from '@react-oauth/google'

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/_/g, '-')
const isAdminRole = (role) => {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'admin' || normalizedRole === 'super-admin'
}
const isRecruiterRole = (role) => {
  const normalizedRole = normalizeRole(role)
  return normalizedRole === 'recruiter' || normalizedRole === 'sub-recruiter'
}

const resolveSafeNextPath = (nextParam) => {
  const raw = Array.isArray(nextParam) ? nextParam[0] : nextParam
  if (!raw || typeof raw !== 'string') return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch (_) {
    decoded = raw
  }
  const trimmed = decoded.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  return trimmed
}

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [googleChoice, setGoogleChoice] = useState(null)
  const [googlePassword, setGooglePassword] = useState('')
  const [showGooglePassword, setShowGooglePassword] = useState(false)
  const [googleChoiceError, setGoogleChoiceError] = useState('')
  const [googleChoiceLoading, setGoogleChoiceLoading] = useState(false)
  const router = useRouter()
  const { login, logout, user, isAuthenticated, isAdminSession, checkAuthStatus } = useAuth()
  const postLoginPath = resolveSafeNextPath(router.query?.next) || '/overview'
  const showRegistrationSuccess = router.query?.registered === '1'

  const userSignals = [
    'Curated roles matched to your profile',
    'Application tracking across every stage',
    'Direct recruiter updates in one place'
  ]

  const userHighlights = [
    { value: '12k+', label: 'active openings' },
    { value: '89%', label: 'faster shortlist response' },
    { value: '24/7', label: 'profile visibility' }
  ]

  useEffect(() => {
    if (isAuthenticated && user) {
      if (isAdminSession) {
        router.replace('/admin-dashboard')
      } else {
        router.replace(postLoginPath)
      }
    }
  }, [isAuthenticated, user, isAdminSession, postLoginPath, router])

  const validateForm = () => {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setErrors((prev) => ({ ...prev, general: 'Google login failed. Missing credential.' }))
      return
    }

    try {
      const response = await apiService.request('/auth/google/login', {
        method: 'POST',
        body: JSON.stringify({ token: idToken, credential: idToken, login_type: 'GOOGLE' }),
        returnErrorObject: true
      })

      if (response?.requiresAccountChoice) {
        setGoogleChoice({
          token: idToken,
          email: response.email,
          name: response.name,
          googleId: response.googleId
        })
        setGoogleChoiceError('')
        return
      }

      const responseToken = response?.token || response?.data?.token || response?.details?.token
      const responseUser = response?.user || response?.data?.user || response?.details?.user
      const hasHttpError = typeof response?.status === 'number' && response.status >= 400
      const responseError =
        response?.error ||
        (hasHttpError ? (response?.details?.message || response?.details?.error || 'Google login failed') : '')

      if (!response || responseError || !responseToken || !responseUser) {
        throw new Error(responseError || 'Google login failed')
      }

      if (isRecruiterRole(responseUser.role)) {
        apiService.clearToken()
        setErrors((prev) => ({
          ...prev,
          general: 'Recruiter accounts should sign in from the recruiter login page.'
        }))
        return
      }

      apiService.setToken(responseToken)
      apiService.setUserData(responseUser)
      await checkAuthStatus()
    } catch (error) {
      console.error('Google login failed:', error)
      apiService.clearToken()
      setErrors((prev) => ({ ...prev, general: error?.message || 'Google login failed' }))
    }
  }

  const completeGoogleSignup = async (mode) => {
    if (!googleChoice?.token) return
    if (mode === 'google+password' && !googlePassword) {
      setGoogleChoiceError('Please enter a password to continue.')
      return
    }

    setGoogleChoiceLoading(true)
    setGoogleChoiceError('')

    try {
      const response = await apiService.request('/auth/google/login', {
        method: 'POST',
        body: JSON.stringify({
          token: googleChoice.token,
          credential: googleChoice.token,
          mode,
          login_type: 'GOOGLE',
          password: mode === 'google+password' ? googlePassword : undefined
        }),
        returnErrorObject: true
      })

      if (!response || response.error || !response.token || !response.user) {
        throw new Error(response?.error || 'Google login failed')
      }

      if (isRecruiterRole(response.user.role)) {
        apiService.clearToken()
        setGoogleChoice(null)
        setGooglePassword('')
        setShowGooglePassword(false)
        setErrors((prev) => ({
          ...prev,
          general: 'Recruiter accounts should sign in from the recruiter login page.'
        }))
        return
      }

      apiService.setToken(response.token)
      apiService.setUserData(response.user)
      setGoogleChoice(null)
      setGooglePassword('')
      setShowGooglePassword(false)
      await checkAuthStatus()
    } catch (error) {
      console.error('Google signup failed:', error)
      setGoogleChoiceError(error.message || 'Google signup failed')
    } finally {
      setGoogleChoiceLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    setErrors({})

    try {
      const normalizedEmail = formData.email.trim().toLowerCase()

      if (normalizedEmail === 'admin@truehire.com') {
        const adminResponse = await apiService.adminLogin({
          email: normalizedEmail,
          password: formData.password
        })

        if (adminResponse?.error) {
          alert(adminResponse.error)
          setFormData((prev) => ({ ...prev, password: '' }))
          return
        }

        await checkAuthStatus()
        router.replace('/admin-dashboard')
        return
      }

      const response = await login({
        email: normalizedEmail,
        password: formData.password,
        login_type: 'EMAIL'
      })

      if (response?.error) {
        alert(response.error)
        setFormData((prev) => ({ ...prev, password: '' }))
        return
      }

      if (!response?.user?.role) {
        throw new Error('Invalid login response')
      }

      const role = normalizeRole(response.user.role)
      if (isAdminRole(role)) {
        router.replace('/admin-dashboard')
        return
      }
      if (isRecruiterRole(role)) {
        logout()
        setErrors({ general: 'Recruiter accounts should sign in from the recruiter login page.' })
        return
      }
      router.replace(postLoginPath)
    } catch (error) {
      logout()
      alert('Invalid credentials')
      setFormData((prev) => ({ ...prev, password: '' }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Sign In - TrueHire</title>
        <meta name="description" content="Sign in to your TrueHire account" />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-[#07111f] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.24),_transparent_32%),radial-gradient(circle_at_bottom,_rgba(14,165,233,0.14),_transparent_40%)]" />
          <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute right-0 top-10 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-sky-300/10 blur-3xl" />
          <div className="grid-pattern absolute inset-0 opacity-30" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between py-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <img
                  src="/images/truerizelogon.png"
                  onError={(e) => {
                    e.currentTarget.onerror = null
                    e.currentTarget.src = '/images/truerizelogon.png.jpg'
                  }}
                  alt="TrueHire Logo"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">TrueHire</span>
            </Link>

            <Link
              href="/login"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/10"
            >
              Recruiter Login
            </Link>
          </header>

          <main className="flex flex-1 items-center py-8 lg:py-12">
            <section className="login-shell grid w-full gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-3 shadow-[0_40px_120px_-40px_rgba(2,6,23,0.9)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.95fr] lg:p-4">
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(160deg,#082032_0%,#0b2942_46%,#0b4f6c_100%)] p-8 sm:p-10 lg:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(125,211,252,0.24),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(34,211,238,0.18),_transparent_30%)]" />
                <div className="relative">
                  <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
                    Candidate Portal
                  </span>
                  <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                    {googleChoice ? 'Finish setting up your access in one step.' : 'Make every application feel organized, visible, and fast.'}
                  </h1>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                    {googleChoice
                      ? 'Choose the login method you want tied to your new TrueHire account and continue into your dashboard.'
                      : 'Sign in to track applications, discover roles that match your skills, and stay ready when recruiters reach out.'}
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {userHighlights.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                        <p className="text-2xl font-semibold text-white">{item.value}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-100/80">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 rounded-[24px] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/75">What you get after login</p>
                    <div className="mt-4 space-y-3">
                      {userSignals.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-300/15 text-cyan-100">
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                              <path d="M7.8 13.4 4.9 10.5l-1.4 1.4 4.3 4.3 8.7-8.7-1.4-1.4z" />
                            </svg>
                          </span>
                          <p className="text-sm text-slate-100">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-white px-6 py-8 text-slate-900 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 sm:py-10">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">User login</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                    {googleChoice ? 'Complete your Google signup' : 'Welcome back'}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {googleChoice
                      ? 'Choose how you want to finish creating your TrueHire account.'
                      : 'Use your email or Google account to continue into TrueHire.'}
                  </p>
                </div>

                {showRegistrationSuccess && !googleChoice && (
                  <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm text-emerald-700">Account created successfully. Please sign in to continue.</p>
                  </div>
                )}

                {googleChoice ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm text-slate-600">Signed in as</p>
                      <p className="mt-1 text-base font-semibold text-slate-900">{googleChoice.email}</p>
                    </div>

                    <div className="rounded-[24px] border border-slate-200 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">Continue with Google only</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        Keep it simple and sign in with Google anytime without setting a password now.
                      </p>
                      <button
                        type="button"
                        disabled={googleChoiceLoading}
                        onClick={() => completeGoogleSignup('google')}
                        className="mt-5 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-base font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {googleChoiceLoading ? 'Processing...' : 'Continue with Google'}
                      </button>
                    </div>

                    <div className="rounded-[24px] border border-cyan-200 bg-cyan-50/60 p-5">
                      <h3 className="text-lg font-semibold text-slate-900">Add a password too</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Set a password if you also want to log in later with email and password.
                      </p>
                      <div className="mt-4 space-y-3">
                        <label htmlFor="google-password" className="block text-sm font-medium text-slate-700">Password</label>
                        <input
                          id="google-password"
                          name="google-password"
                          type={showGooglePassword ? 'text' : 'password'}
                          className="input min-h-12"
                          placeholder="Create a password"
                          value={googlePassword}
                          onChange={(e) => setGooglePassword(e.target.value)}
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={showGooglePassword}
                            onChange={(e) => setShowGooglePassword(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                          />
                          <span>Show password</span>
                        </label>
                        <button
                          type="button"
                          disabled={googleChoiceLoading}
                          onClick={() => completeGoogleSignup('google+password')}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-900 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {googleChoiceLoading ? 'Processing...' : 'Create account'}
                        </button>
                      </div>
                    </div>

                    {googleChoiceError && (
                      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-sm text-rose-700">{googleChoiceError}</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setGoogleChoice(null)
                        setGooglePassword('')
                        setShowGooglePassword(false)
                        setGoogleChoiceError('')
                      }}
                      className="w-full text-sm font-medium text-slate-500 transition hover:text-slate-700"
                    >
                      Cancel and return to sign in
                    </button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          className="input min-h-12"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
                      </div>

                      <div>
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                          <Link href="/forgot-password" className="text-sm font-medium text-cyan-700 hover:text-cyan-600">
                            Forgot password?
                          </Link>
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          required
                          className="input min-h-12"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={handleChange}
                        />
                        {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
                        {errors.general && <p className="mt-2 text-sm text-rose-600">{errors.general}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="show-password" className="inline-flex items-center gap-2 text-sm text-slate-600">
                        <input
                          id="show-password"
                          name="show-password"
                          type="checkbox"
                          checked={showPassword}
                          onChange={(e) => setShowPassword(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                        />
                        <span>Show password</span>
                      </label>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Secure login</span>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0891b2,#2563eb)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_22px_40px_-20px_rgba(37,99,235,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_45px_-20px_rgba(37,99,235,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Signing in...
                        </div>
                      ) : (
                        'Sign In'
                      )}
                    </button>

                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-3 text-slate-400">Or continue with</span>
                      </div>
                    </div>

                    <div className="relative w-full">
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)] transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                      <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-0">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setErrors((prev) => ({ ...prev, general: 'Google login failed. Please try again.' }))}
                          ux_mode="popup"
                          width="100%"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 text-center">
                      <Link href="/register" className="block text-sm font-semibold text-cyan-700 transition hover:text-cyan-600">
                        Create a new account
                      </Link>
                      <Link href="/" className="block text-sm text-slate-500 transition hover:text-slate-700">
                        Back to Home
                      </Link>
                    </div>
                  </form>
                )}
              </div>
            </section>
          </main>
        </div>

        <style jsx>{`
          .grid-pattern {
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
            background-size: 42px 42px;
          }

          .login-shell {
            animation: panelEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          @keyframes panelEnter {
            0% {
              opacity: 0;
              transform: translate3d(0, 22px, 0) scale(0.985);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
        `}</style>
      </div>
    </>
  )
}
