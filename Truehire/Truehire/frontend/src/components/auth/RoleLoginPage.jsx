import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import apiService from '../../services/api'

const ROLE_META = {
  user: {
    label: 'User',
    title: 'User Login - TrueHire',
    heading: 'User Login',
    description: 'Sign in to continue your job search and track applications.',
    defaultPath: '/user-dashboard',
    forgotPath: '/forgot-password',
    registerPath: '/register',
    allowGoogleLogin: true,
  },
  recruiter: {
    label: 'Recruiter',
    title: 'Recruiter Login - TrueHire',
    heading: 'Recruiter Login',
    description: 'Sign in to manage openings, candidates, and hiring activity.',
    defaultPath: '/recruiter-dashboard',
    forgotPath: '/recruiter-forgot-password',
    registerPath: '/register?mode=recruiter',
    allowGoogleLogin: false,
  },
  admin: {
    label: 'Admin',
    title: 'Admin Login - TrueHire',
    heading: 'Admin Login',
    description: 'Sign in to manage platform operations from the dashboard.',
    defaultPath: '/admin-dashboard',
    forgotPath: null,
    registerPath: null,
    allowGoogleLogin: false,
  },
}

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/_/g, '-')
const resolveRole = (role) => {
  const normalizedRole = normalizeRole(role)
  return ROLE_META[normalizedRole] ? normalizedRole : 'user'
}

const resolveSafeNextPath = (nextParam) => {
  const raw = Array.isArray(nextParam) ? nextParam[0] : nextParam
  if (!raw || typeof raw !== 'string') return null

  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch (_error) {
    decoded = raw
  }

  const trimmed = decoded.trim()
  if (!trimmed.startsWith('/')) return null
  if (trimmed.startsWith('//')) return null
  return trimmed
}

const getRedirectPath = (role, nextPath) => nextPath || ROLE_META[role]?.defaultPath || '/login'
const setPendingRecruiterLogin = (email, password, nextPath) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem('pendingOtpEmail', email)
  window.localStorage.setItem('pendingOtpPassword', password)

  if (nextPath) {
    window.localStorage.setItem('pendingRecruiterNext', nextPath)
  } else {
    window.localStorage.removeItem('pendingRecruiterNext')
  }
}

export default function RoleLoginPage() {
  const router = useRouter()
  const { login, checkAuthStatus } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const role = resolveRole(router.query?.role)
  const roleMeta = ROLE_META[role]
  const nextPath = resolveSafeNextPath(router.query?.next)
  const showRegistrationSuccess = role === 'user' && router.query?.registered === '1'

  useEffect(() => {
    setErrors({})
  }, [role])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '', general: '' }))
  }

  const validateForm = () => {
    const nextErrors = {}

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const normalizedEmail = formData.email.trim().toLowerCase()

      if (role === 'recruiter') {
        const otpResponse = await apiService.sendOTP(normalizedEmail, formData.password)
        const isOtpSendSuccess =
          Boolean(otpResponse) &&
          otpResponse.success === true &&
          !otpResponse.error

        if (!isOtpSendSuccess) {
          const otpErrorMessage = String(
            otpResponse?.error ||
            otpResponse?.message ||
            otpResponse?.details?.message ||
            ''
          ).toLowerCase()

          const isOtpDeliveryIssue =
            otpErrorMessage.includes('failed to send otp') ||
            otpErrorMessage.includes('email login failed') ||
            otpErrorMessage.includes('email service') ||
            otpResponse?.status >= 500

          if (!isOtpDeliveryIssue) {
            setErrors({ general: 'Invalid email or password.' })
            apiService.clearToken()
            setFormData((current) => ({ ...current, password: '' }))
            return
          }

          const directLoginResponse = await login({
            email: normalizedEmail,
            password: formData.password,
            role: 'RECRUITER',
          })

          if (directLoginResponse?.error) {
            setErrors({ general: directLoginResponse.error || 'Unable to sign in.' })
            setFormData((current) => ({ ...current, password: '' }))
            return
          }

          router.replace(getRedirectPath(role, nextPath))
          return
        }

        setPendingRecruiterLogin(normalizedEmail, formData.password, nextPath)
        router.push('/recruiter-otp')
        return
      }

      const response = await login({
        email: normalizedEmail,
        password: formData.password,
        role: role.toUpperCase(),
      })

      console.log('[admin-auth] login response received', {
        requestedRole: role,
        email: normalizedEmail,
        success: !response?.error,
        returnedRole: response?.user?.role || null,
        tokenStored: Boolean(apiService.getToken()),
        adminTokenStored: Boolean(apiService.getAdminToken()),
      })

      if (response?.error) {
        setErrors({ general: response.error || 'Unable to sign in.' })
        setFormData((current) => ({ ...current, password: '' }))
        return
      }

      const responseRole = normalizeRole(response?.user?.role)
      if (role === 'user' && responseRole !== 'user') {
        apiService.clearToken()
        setErrors({ general: 'This account does not belong to the User login page.' })
        return
      }

      if (role === 'recruiter' && !['recruiter', 'sub-recruiter'].includes(responseRole)) {
        apiService.clearToken()
        setErrors({ general: 'This account does not belong to the Recruiter login page.' })
        return
      }

      if (role === 'admin' && !['admin', 'super-admin'].includes(responseRole)) {
        apiService.clearToken()
        setErrors({ general: 'This account does not belong to the Admin login page.' })
        return
      }

      console.log('[admin-auth] redirecting after login', {
        role: responseRole,
        path: getRedirectPath(role, nextPath),
      })
      router.replace(getRedirectPath(role, nextPath))
    } catch (_error) {
      apiService.clearToken()
      setErrors({ general: 'Invalid credentials.' })
      setFormData((current) => ({ ...current, password: '' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setErrors({ general: 'Google login failed. Missing credential.' })
      return
    }

    try {
      const response = await apiService.request('/auth/google/login', {
        method: 'POST',
        body: JSON.stringify({ token: idToken, credential: idToken, login_type: 'GOOGLE' }),
        returnErrorObject: true,
      })

      const responseToken = response?.token || response?.data?.token || response?.details?.token
      const responseUser = response?.user || response?.data?.user || response?.details?.user
      const hasHttpError = typeof response?.status === 'number' && response.status >= 400
      const responseError =
        response?.error ||
        (hasHttpError ? (response?.details?.message || response?.details?.error || 'Google login failed') : '')

      if (!response || responseError || !responseToken || !responseUser) {
        throw new Error(responseError || 'Google login failed')
      }

      apiService.setToken(responseToken)
      apiService.setUserData(responseUser)
      await checkAuthStatus()
      router.replace(getRedirectPath('user', nextPath))
    } catch (error) {
      apiService.clearToken()
      setErrors({ general: error?.message || 'Google login failed.' })
    }
  }

  return (
    <>
      <Head>
        <title>{roleMeta.title}</title>
        <meta name="description" content={`${roleMeta.label} login for TrueHire.`} />
      </Head>

      <div className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
          <section className="grid w-full gap-6 rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_32px_90px_-50px_rgba(15,23,42,0.9)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-5">
            <div className="rounded-[24px] bg-[linear-gradient(160deg,#0f172a_0%,#0f3b5f_55%,#166534_100%)] p-8 sm:p-10">
              <Link href="/" className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-cyan-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                  <img
                    src="/images/truerizelogon.png"
                    onError={(event) => {
                      event.currentTarget.onerror = null
                      event.currentTarget.src = '/images/truerizelogon.png.jpg'
                    }}
                    alt="TrueHire logo"
                    className="h-7 w-7 object-contain"
                  />
                </span>
                TrueHire
              </Link>

              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/80">
                {roleMeta.label} Login
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                {roleMeta.heading}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                {roleMeta.description}
              </p>
            </div>

            <div className="rounded-[24px] bg-white px-6 py-8 text-slate-900 sm:px-8 sm:py-10">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  {roleMeta.label} login
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {roleMeta.heading}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {roleMeta.description}
                </p>
              </div>

              {showRegistrationSuccess ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  Account created successfully. Please sign in to continue.
                </div>
              ) : null}

              {errors.general ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errors.general}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:bg-white ${
                      errors.email ? 'border-rose-300' : 'border-slate-200'
                    }`}
                  />
                  {errors.email ? <p className="mt-2 text-sm text-rose-600">{errors.email}</p> : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    {roleMeta.forgotPath ? (
                      <Link href={roleMeta.forgotPath} className="text-sm font-medium text-cyan-700 hover:text-cyan-600">
                        Forgot password?
                      </Link>
                    ) : null}
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-600 focus:bg-white ${
                      errors.password ? 'border-rose-300' : 'border-slate-200'
                    }`}
                  />
                  <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(event) => setShowPassword(event.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-cyan-700 focus:ring-cyan-600"
                    />
                    <span>Show password</span>
                  </label>
                  {errors.password ? <p className="mt-2 text-sm text-rose-600">{errors.password}</p> : null}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? 'Signing in...' : 'Login'}
                </button>

                {roleMeta.allowGoogleLogin ? (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-3 text-slate-400">Or continue with</span>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Continue with Google</span>
                      </button>
                      <div className="absolute inset-0 overflow-hidden rounded-xl opacity-0">
                        <GoogleLogin
                          onSuccess={handleGoogleSuccess}
                          onError={() => setErrors({ general: 'Google login failed. Please try again.' })}
                          ux_mode="popup"
                          width="100%"
                        />
                      </div>
                    </div>
                  </>
                ) : null}

                <div className="space-y-3 pt-2 text-center">
                  {roleMeta.registerPath ? (
                    <Link href={roleMeta.registerPath} className="block text-sm font-semibold text-cyan-700 transition hover:text-cyan-600">
                      Create a new account
                    </Link>
                  ) : null}
                  <Link href="/" className="block text-sm text-slate-500 transition hover:text-slate-700">
                    Back to Home
                  </Link>
                </div>
              </form>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
