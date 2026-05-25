import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../../context/AuthContext'
import { Eye, EyeOff } from 'lucide-react'

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [captchaText, setCaptchaText] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')
  const router = useRouter()
  const { register, logout } = useAuth()

  const userSignals = [
    'One profile for jobs, alerts, and recruiter activity',
    'Cleaner application tracking from day one',
    'Secure signup with password checks and verification'
  ]

  const userHighlights = [
    { value: 'Fast', label: 'candidate onboarding' },
    { value: 'Smart', label: 'job discovery setup' },
    { value: 'Ready', label: 'for recruiter outreach' }
  ]

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  useEffect(() => {
    setCaptchaText(generateCaptcha())
  }, [])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!captchaInput.trim()) {
      newErrors.captcha = 'Please enter the captcha code'
    } else if (captchaInput.trim() !== captchaText) {
      newErrors.captcha = 'Captcha code is incorrect'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'captchaInput') {
      setCaptchaInput(value)
      if (errors.captcha) {
        setErrors((prev) => ({ ...prev, captcha: '' }))
      }
      return
    }

    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      }, 'user')

      if (response && response.error) {
        alert(response.error || 'Registration failed. Please try again.')
        return
      }

      logout()
      router.push('/login?registered=1')
    } catch (error) {
      console.error('Registration error:', error)
      alert(error.message || 'Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '' }
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^A-Za-z\d]/.test(password)) strength++
    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    return { strength, label: labels[strength] }
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const preventClipboardActions = (event) => {
    event.preventDefault()
  }

  const strengthClass =
    passwordStrength.strength <= 2 ? 'bg-rose-500' :
      passwordStrength.strength <= 3 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <>
      <Head>
        <title>Create Account - TrueHire</title>
        <meta name="description" content="Join TrueHire and start your career journey" />
      </Head>

      <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_80%_20%,_rgba(59,130,246,0.2),_transparent_30%),radial-gradient(circle_at_bottom,_rgba(125,211,252,0.12),_transparent_38%)]" />
        </div>

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,#082032_0%,#0b2942_46%,#0b4f6c_100%)] p-8 text-white shadow-[0_40px_120px_-40px_rgba(2,6,23,0.95)] sm:p-10 lg:p-12">
            <span className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              Candidate Signup
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-tight sm:text-5xl">
              Start strong with a profile built for discovery.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-200 sm:text-base">
              Create your TrueHire account to unlock smarter job matches, organized applications, and a profile recruiters can trust.
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
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100/75">
                Why sign up now
              </p>
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
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white p-6 text-slate-900 shadow-[0_40px_120px_-50px_rgba(15,23,42,0.85)] sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">User registration</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Create your account</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Join TrueHire and start building your next opportunity.
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Back
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errors.general}
                </div>
              )}

              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${
                    errors.name ? 'border-rose-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="mt-2 text-sm text-rose-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${
                    errors.email ? 'border-rose-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-2 text-sm text-rose-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    onCopy={preventClipboardActions}
                    onCut={preventClipboardActions}
                    onPaste={preventClipboardActions}
                    onContextMenu={preventClipboardActions}
                    onDrop={preventClipboardActions}
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${
                      errors.password ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex h-full items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Password strength</span>
                      <span className="text-xs font-medium text-slate-700">{passwordStrength.label}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200">
                      <div className={`h-1.5 rounded-full transition-all duration-300 ${strengthClass}`} style={{ width: `${(passwordStrength.strength / 5) * 100}%` }} />
                    </div>
                  </div>
                )}
                {errors.password && <p className="mt-2 text-sm text-rose-600">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    onCopy={preventClipboardActions}
                    onCut={preventClipboardActions}
                    onPaste={preventClipboardActions}
                    onContextMenu={preventClipboardActions}
                    onDrop={preventClipboardActions}
                    className={`w-full rounded-2xl border bg-slate-50 px-4 py-3.5 pr-12 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${
                      errors.confirmPassword ? 'border-rose-300' : 'border-slate-200'
                    }`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-3 flex h-full items-center justify-center rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-cyan-700"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-2 text-sm text-rose-600">{errors.confirmPassword}</p>}
              </div>

              <div>
                <label htmlFor="captchaInput" className="mb-3 block text-sm font-medium text-slate-700">Verification Code</label>
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xl font-bold tracking-[0.3em] text-slate-900">{captchaText}</div>
                    <button
                      type="button"
                      onClick={() => setCaptchaText(generateCaptcha())}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
                <input
                  id="captchaInput"
                  name="captchaInput"
                  type="text"
                  required
                  className={`mt-3 w-full rounded-2xl border bg-slate-50 px-4 py-3.5 text-slate-900 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100 ${
                    errors.captcha ? 'border-rose-300' : 'border-slate-200'
                  }`}
                  placeholder="Enter the verification code above"
                  value={captchaInput}
                  onChange={handleChange}
                />
                {errors.captcha && <p className="mt-2 text-sm text-rose-600">{errors.captcha}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0891b2,#2563eb)] px-5 py-4 text-base font-semibold text-white shadow-[0_22px_40px_-20px_rgba(37,99,235,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_45px_-20px_rgba(37,99,235,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-slate-500">Already have an account?</span>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Link href="/login" className="font-medium text-cyan-700 transition hover:text-cyan-600">
                  Sign in instead
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-slate-500">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-cyan-700 hover:text-cyan-600">Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" className="text-cyan-700 hover:text-cyan-600">Privacy Policy</Link>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
