import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { apiService } from '../../utils/api'
import { GoogleLogin } from '@react-oauth/google'

export default function RecruiterLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingOtp, setIsSendingOtp] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const recruiterSignals = [
    'Post roles and monitor pipeline activity',
    'Coordinate sub-recruiters from one workspace',
    'Move from new applicant to shortlist faster'
  ]

  const recruiterMetrics = [
    { value: '3x', label: 'faster candidate review' },
    { value: '1 hub', label: 'for hiring operations' },
    { value: 'OTP', label: 'extra login security' }
  ]

  const redirectAfterRecruiterLogin = (responseUser) => {
    const normalizedRole = String(responseUser?.role || '')
      .toLowerCase()
      .replace(/_/g, '-')

    if (normalizedRole === 'admin' || normalizedRole === 'super-admin') {
      router.replace('/admin-dashboard')
      return
    }

    router.replace('/recruiter-dashboard')
  }

  const getRecruiterLoginErrorMessage = (message) => {
    const normalized = String(message || '').toLowerCase()

    if (
      normalized.includes('pending admin approval') ||
      normalized.includes('admin approval') ||
      normalized.includes('approval pending')
    ) {
      return 'Wait for admin approval. You can login after admin approval.'
    }

    if (normalized.includes('rejected')) {
      return message || 'Your recruiter account has been rejected by admin.'
    }

    return message || 'Login failed. Please try again.'
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential
    if (!idToken) {
      setError('Google login failed. Please try again.')
      return
    }

    try {
      setError('')
      const response = await apiService.request('/auth/google/recruiter', {
        method: 'POST',
        body: JSON.stringify({ token: idToken, credential: idToken }),
        returnErrorObject: true
      })

      const responseToken = response?.token || response?.data?.token || response?.details?.token
      const responseUser = response?.user || response?.data?.user || response?.details?.user
      const hasHttpError = typeof response?.status === 'number' && response.status >= 400
      const responseError =
        response?.error ||
        (hasHttpError ? (response?.details?.message || response?.details?.error || 'Google login failed') : '')

      if (!response || responseError || !responseToken || !responseUser) {
        const normalizedError = String(responseError || '').toLowerCase()
        if (normalizedError.includes('backend api unavailable') || response?.status === 503) {
          setError('Backend server is not reachable. Check NEXT_PUBLIC_API_URL and try again.')
        } else {
          setError(responseError || 'Google login failed. Please try again.')
        }
        apiService.clearToken()
        return
      }

      const normalizedRole = String(responseUser?.role || '')
        .toLowerCase()
        .replace(/_/g, '-')
      const normalizedUser = {
        ...responseUser,
        role: normalizedRole || 'recruiter'
      }

      apiService.setToken(responseToken)
      apiService.setUserData(normalizedUser)

      if (normalizedRole === 'admin' || normalizedRole === 'super-admin') {
        router.replace('/admin-dashboard')
      } else {
        router.replace('/recruiter-dashboard')
      }
    } catch (error) {
      console.error('Google login failed:', error)
      apiService.clearToken()
      const message = String(error?.message || '')
      if (message.toLowerCase().includes('network error')) {
        setError('Cannot reach backend server. Ensure NEXT_PUBLIC_API_URL points to the backend API.')
      } else {
        setError(message || 'Google login failed. Please try again.')
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const normalizedEmail = String(email || '').trim().toLowerCase()
    const normalizedPassword = String(password || '').trim()

    setError('')
    setIsLoading(true)

    if (!normalizedEmail) {
      setError('Please enter your email')
      setIsLoading(false)
      return
    }

    if (!normalizedPassword) {
      setError('Please enter your password')
      setIsLoading(false)
      return
    }

    try {
      if (normalizedEmail === 'truerizeadmin@gmail.com' && normalizedPassword === '123456789') {
        router.replace('/login')
        return
      }

      setIsSendingOtp(true)
      const otpResponse = await apiService.sendOTP(normalizedEmail, normalizedPassword)
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
          const rawMessage =
            otpResponse?.message ||
            otpResponse?.error ||
            otpResponse?.details?.message ||
            ''
          const friendlyMessage = getRecruiterLoginErrorMessage(rawMessage)
          setError(friendlyMessage !== rawMessage ? friendlyMessage : 'Invalid email or password')
          apiService.clearToken()
          return
        }

        const directLoginResponse = await apiService.login({
          email: normalizedEmail,
          password: normalizedPassword,
          role: 'RECRUITER'
        })

        if (!directLoginResponse || directLoginResponse.error || !directLoginResponse.user) {
          setError(getRecruiterLoginErrorMessage(directLoginResponse?.error))
          apiService.clearToken()
          return
        }

        redirectAfterRecruiterLogin(directLoginResponse.user)
        return
      }

      localStorage.setItem('pendingOtpEmail', normalizedEmail)
      localStorage.setItem('pendingOtpPassword', normalizedPassword)
      router.push('/recruiter-otp')
    } catch (error) {
      console.error('Login failed:', error)
      setError(getRecruiterLoginErrorMessage(error.message))
    } finally {
      setIsLoading(false)
      setIsSendingOtp(false)
    }
  }

  return (
    <>
      <Head>
        <title>Recruiter Login - TrueHire</title>
        <meta
          name="description"
          content="Recruiter login for TrueHire with a polished hiring-focused interface."
        />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-[#0f172a] text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_24%),radial-gradient(circle_at_75%_20%,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.25),_transparent_50%)]" />
          <div className="absolute -left-20 top-16 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="recruiter-grid absolute inset-0 opacity-25" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between py-2">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <img
                  src="/images/truerizelogon.png"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = '/images/truerizelogon.png.jpg'
                  }}
                  alt="TrueHire logo"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="text-lg font-semibold tracking-[0.18em] text-slate-100">TRUEHIRE</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/10"
              >
                User Login
              </button>
              <button
                type="button"
                className="rounded-full bg-amber-300 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_18px_35px_-20px_rgba(252,211,77,0.55)] transition hover:-translate-y-0.5"
              >
                Recruiter Login
              </button>
            </div>
          </header>

          <main className="flex flex-1 items-center py-8 lg:py-12">
            <section className="recruiter-shell grid w-full gap-6 overflow-hidden rounded-[32px] border border-white/10 bg-white/6 p-3 shadow-[0_40px_120px_-40px_rgba(2,6,23,0.95)] backdrop-blur-xl lg:grid-cols-[1.08fr_0.92fr] lg:p-4">
              <div className="relative overflow-hidden rounded-[28px] bg-[linear-gradient(165deg,#111827_0%,#172554_48%,#0f766e_100%)] p-8 text-white sm:p-10 lg:p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.18),_transparent_24%),radial-gradient(circle_at_bottom_left,_rgba(125,211,252,0.18),_transparent_28%)]" />
                <div className="relative">
                  <span className="inline-flex rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                    Hiring Console
                  </span>
                  <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
                    Keep your recruiter workflow sharp from the first login.
                  </h1>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
                    Access your pipeline, review applicants, and coordinate hiring decisions through one polished recruiter workspace.
                  </p>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {recruiterMetrics.map((item) => (
                      <div key={item.label} className="rounded-2xl border border-white/10 bg-white/8 p-4">
                        <p className="text-2xl font-semibold text-white">{item.value}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-200/80">{item.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 rounded-[24px] border border-white/10 bg-slate-950/20 p-5 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100/80">After sign in</p>
                    <div className="mt-4 space-y-3">
                      {recruiterSignals.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3">
                          <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-amber-200/15 text-amber-100">
                            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                              <path d="M7.8 13.4 4.9 10.5l-1.4 1.4 4.3 4.3 8.7-8.7-1.4-1.4z" />
                            </svg>
                          </span>
                          <p className="text-sm text-slate-100">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 rounded-[24px] border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-200/75">Recruiter access</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">
                      Main recruiters and sub-recruiters can both sign in here. OTP verification is used when available to add another layer of protection.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-white px-6 py-8 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.5)] sm:px-8 sm:py-10">
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">Recruiter login</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Welcome back</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Sign in to continue hiring with confidence on TrueHire.
                  </p>
                </div>

                {error && (
                  <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your work email"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/40"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                      <Link href="/recruiter-forgot-password" className="text-sm font-medium text-sky-700 hover:text-sky-600">
                        Forgot password?
                      </Link>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-200/40"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={(e) => setShowPassword(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />
                      <span>Show password</span>
                    </label>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">OTP when available</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-2xl bg-[linear-gradient(135deg,#f59e0b,#0ea5e9)] px-5 py-3.5 text-base font-semibold text-white shadow-[0_22px_40px_-20px_rgba(14,165,233,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_46px_-20px_rgba(14,165,233,0.65)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading || isSendingOtp ? 'Signing in...' : 'Sign In'}
                  </button>

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
                      className="w-full inline-flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
                        onError={() => setError('Google sign-in failed. Please try again.')}
                        ux_mode="popup"
                        width="100%"
                      />
                    </div>
                  </div>

                  <div className="text-center text-sm text-slate-500">
                    Need a recruiter account?{' '}
                    <Link href="/register?mode=recruiter" className="font-semibold text-sky-700 hover:text-sky-600">
                      Create one
                    </Link>
                  </div>
                </form>
              </div>
            </section>
          </main>
        </div>

        <style jsx>{`
          .recruiter-grid {
            background-image:
              linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
            background-size: 42px 42px;
          }

          .recruiter-shell {
            animation: recruiterPanelEnter 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          @keyframes recruiterPanelEnter {
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
