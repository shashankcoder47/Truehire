import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDashboardPath } from '../services/authService'
import apiService from '../services/api'

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6.75h16v10.5H4V6.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="m4.75 7.5 7.25 5.25L19.25 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7.25 10.5V8.25a4.75 4.75 0 0 1 9.5 0v2.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.25 10.5h11.5v8.25H6.25V10.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
  </svg>
)

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2.75 12s3.4-6.25 9.25-6.25S21.25 12 21.25 12 17.85 18.25 12 18.25 2.75 12 2.75 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12 14.75A2.75 2.75 0 1 0 12 9.25a2.75 2.75 0 0 0 0 5.5Z" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m4.75 4.75 14.5 14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M10.4 5.9c.51-.1 1.04-.15 1.6-.15 5.85 0 9.25 6.25 9.25 6.25a17.5 17.5 0 0 1-2.6 3.26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14.08 14.08A2.75 2.75 0 0 1 9.92 9.92" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.53 7.52C4.12 9.13 2.75 12 2.75 12s3.4 6.25 9.25 6.25c1.58 0 3-.46 4.23-1.14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const normalizeRole = (role) => String(role || '').trim().toLowerCase().replace(/_/g, '-')

const resolveSafeNextPath = (nextParam, role) => {
  const raw = Array.isArray(nextParam) ? nextParam[0] : nextParam
  if (!raw || typeof raw !== 'string') return ''

  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch (_error) {
    decoded = raw
  }

  const nextPath = decoded.trim()
  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) return ''

  const normalizedRole = normalizeRole(role)
  if (normalizedRole.includes('admin') && !nextPath.startsWith('/admin')) return ''
  if (normalizedRole.includes('recruiter') && !nextPath.startsWith('/recruiter')) return ''
  if (normalizedRole === 'user' && (nextPath.startsWith('/admin') || nextPath.startsWith('/recruiter'))) return ''

  return nextPath
}

export default function LoginPage() {
  const router = useRouter()
  const { login, checkAuthStatus, isAuthenticated, user } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!router.isReady || !isAuthenticated || !user?.role) return
    router.replace(getDashboardPath(user.role))
  }, [isAuthenticated, router, user])

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const email = form.email.trim().toLowerCase()
    if (!email || !form.password) {
      setError('Enter your email and password to continue.')
      return
    }

    setLoading(true)
    try {
      if (email === 'admin@truehire.com') {
        const adminResponse = await apiService.adminLogin({
          email,
          password: form.password
        })

        if (adminResponse?.error) {
          setError(adminResponse.error || 'Invalid email or password.')
          setLoading(false)
          return
        }

        await checkAuthStatus()
        setLoading(false)
        router.replace('/admin-dashboard')
        return
      }

      const response = await login({ email, password: form.password })
      setLoading(false)

      if (response?.error) {
        setError('Invalid email or password.')
        return
      }

      const role = response?.role || response?.user?.role
      const next = resolveSafeNextPath(router.query.next, role)
      const fallback = getDashboardPath(role)
      router.replace(next || fallback)
    } catch (error) {
      setLoading(false)
      setError(error?.message || 'Invalid email or password.')
      return
    }
  }

  return (
    <>
      <Head>
        <title>Login - TrueHire</title>
      </Head>

      <main className="relative min-h-screen overflow-hidden bg-[#070c1b] text-slate-950">
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(14,165,233,0.22),transparent_30%),radial-gradient(circle_at_88%_10%,rgba(20,184,166,0.17),transparent_26%),linear-gradient(180deg,#0d2a2a_0%,#070c1b_46%,#080c18_100%)]" />
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/70" />

        <section className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.48, ease: 'easeOut' }}
            className="grid w-full max-w-5xl overflow-hidden rounded-[24px] border border-white/15 bg-white shadow-[0_34px_90px_-40px_rgba(0,0,0,0.85)] lg:grid-cols-[1.08fr_1fr]"
          >
            <aside className="relative hidden min-h-[520px] overflow-hidden bg-[#163149] px-9 py-10 text-white lg:block">
              <img
                src="/images/job-portal.svg"
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover opacity-25"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(120deg,rgba(13,38,62,0.92),rgba(10,35,58,0.76)),radial-gradient(circle_at_45%_50%,rgba(59,130,246,0.28),transparent_38%)]" />
              <div aria-hidden="true" className="absolute inset-0 bg-slate-950/15" />

              <div className="relative z-10 flex h-full flex-col">
                <Link href="/" className="inline-flex w-fit items-center gap-3 text-xs font-black uppercase tracking-[0.28em] text-white no-underline transition hover:text-cyan-100">
                  <span className="flex h-10 w-10 overflow-hidden rounded-xl border border-white/20 bg-white shadow-lg backdrop-blur-md">
                    <img
                      src="/images/truerizelogon.png"
                      onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = '/images/truerizelogon.png.jpg'
                      }}
                      alt=""
                      aria-hidden="true"
                      className="h-full w-full object-cover"
                    />
                  </span>
                  TrueHire
                </Link>

                <div className="mt-auto max-w-[420px] pb-2">
                  <p className="text-xs font-black uppercase tracking-[0.34em] text-white/80">Unified access</p>
                  <h1 className="mt-5 text-4xl font-black leading-[1.18] tracking-tight text-white sm:text-[46px]">
                    One secure sign in for every TrueHire workspace.
                  </h1>
                  <p className="mt-7 text-sm font-semibold leading-7 text-white/82">
                    Enter your credentials once. TrueHire identifies your account and opens the right dashboard automatically.
                  </p>
                </div>
              </div>
            </aside>

            <section className="bg-[#f7f8fa] px-8 py-10 sm:px-10 lg:px-12 lg:py-14">
              <motion.div
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, duration: 0.38 }}
                className="mx-auto flex min-h-[430px] max-w-[420px] flex-col justify-center"
              >
              <div>
                <Link
                  href="/"
                  className="mb-6 inline-flex w-fit items-center gap-2 text-xs font-medium text-slate-500 no-underline transition duration-200 hover:-translate-x-1 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Back to Home</span>
                </Link>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.38em] text-cyan-700">Welcome back</p>
                <h2 className="mt-2 text-[32px] font-black leading-tight tracking-tight text-slate-950">
                  Sign in to TrueHire
                </h2>
                <p className="mt-7 max-w-[330px] text-xs font-semibold leading-5 text-slate-500">
                  Use the email and password for your TrueHire account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
                  <AnimatePresence>
                    {error ? (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        id="login-error"
                        role="alert"
                        aria-live="polite"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
                      >
                        {error}
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <label htmlFor="login-email" className="block">
                    <span className="text-[11px] font-bold text-slate-700">Email address</span>
                    <div className="mt-2 flex h-11 items-center rounded-xl border border-slate-200 bg-white/95 px-4 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/10">
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                          className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent text-xs font-semibold text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        placeholder="Enter email"
                      />
                    </div>
                  </label>

                  <label htmlFor="login-password" className="block">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[11px] font-bold text-slate-700">Password</span>
                      <Link href="/forgot-password" className="text-[11px] font-extrabold text-cyan-700 underline underline-offset-2 transition hover:text-cyan-600">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative mt-2 h-11 rounded-xl border border-slate-200 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition duration-200 hover:border-slate-300 focus-within:border-cyan-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/10">
                      <input
                        id="login-password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        required
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? 'login-error' : undefined}
                        className="h-full w-full appearance-none border-0 bg-transparent px-4 pr-12 text-xs font-semibold text-slate-950 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center border-0 bg-transparent p-0 text-slate-400 transition duration-200 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400/25"
                      >
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </label>

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={loading ? undefined : { scale: 1.01, y: -1 }}
                    whileTap={loading ? undefined : { scale: 0.985 }}
                    className="mt-1 flex min-h-11 w-full items-center justify-center rounded-lg bg-[#02051a] px-5 py-3 text-[11px] font-black text-white shadow-[0_18px_32px_-18px_rgba(2,6,23,0.9)] transition hover:bg-[#070b24] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center gap-3">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                        Signing in
                      </span>
                    ) : (
                      'Login'
                    )}
                  </motion.button>
                </form>

                <div className="mt-7 text-center text-[11px] font-medium text-slate-500">
                  New to TrueHire?{' '}
                  <Link href="/register" className="font-extrabold text-cyan-700 underline underline-offset-2 transition hover:text-cyan-600">
                    Create an account
                  </Link>
                </div>
              </motion.div>
            </section>
          </motion.div>
        </section>
      </main>
    </>
  )
}
