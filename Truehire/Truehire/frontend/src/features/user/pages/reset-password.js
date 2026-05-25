import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import apiService from '../../../services/api'

const passwordCriteria = [
  {
    id: 'length',
    label: 'At least 8 characters',
    validator: (value) => value.length >= 8
  },
  {
    id: 'uppercase',
    label: 'Include an uppercase letter',
    validator: (value) => /[A-Z]/.test(value)
  },
  {
    id: 'number',
    label: 'Include a number',
    validator: (value) => /[0-9]/.test(value)
  }
]

const getPasswordStrength = (password) => {
  if (!password) return { label: 'Too weak', color: 'text-red-400', value: 0 }
  const score =
    +(password.length >= 8) +
    +(password.length >= 12) +
    +(/[A-Z]/.test(password)) +
    +(/[0-9]/.test(password)) +
    +(/[^A-Za-z0-9]/.test(password))

  if (score >= 4) return { label: 'Strong', color: 'text-emerald-500', value: score }
  if (score >= 2) return { label: 'Fair', color: 'text-amber-500', value: score }
  return { label: 'Weak', color: 'text-red-400', value: score }
}

export default function ResetPassword() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [token, setToken] = useState('')
  const router = useRouter()

  useEffect(() => {
    const { token: urlToken } = router.query
    if (urlToken) {
      setToken(urlToken)
    } else if (router.isReady && !urlToken) {
      router.push('/login')
    }
  }, [router.query, router.isReady])

  const strength = useMemo(() => getPasswordStrength(formData.password), [formData.password])

  const validateForm = () => {
    const newErrors = {}

    const passwordValid = passwordCriteria.every((criteria) =>
      criteria.validator(formData.password.trim())
    )

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (!passwordValid) {
      newErrors.password = 'Password must meet all requirements'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      await apiService.resetPassword(token, formData.password)
      setIsSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      console.error('Reset password failed:', error)
      setErrors({
        general: error.message || 'Failed to reset password. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <>
        <Head>
          <title>Password Reset Successful - TrueHire</title>
          <meta name="description" content="Your password has been reset successfully" />
        </Head>

        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-white/40 px-8 py-10 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-slate-900">Password reset successful!</h2>
            <p className="text-sm text-slate-600">
              Your account is now protected with a fresh password. You will be redirected to the login screen shortly.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-transparent bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Reset Password - TrueHire</title>
        <meta name="description" content="Set a new password for your TrueHire account" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/90 backdrop-blur rounded-3xl shadow-2xl border border-white/40 px-8 py-10 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">TrueHire</p>
            <h2 className="text-3xl font-bold text-slate-900">Set a new password</h2>
            <p className="text-sm text-slate-600">
              Confirm your new credentials and keep your account secure.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-600" htmlFor="password">
                New password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`peer w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                    errors.password ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'
                  } focus:outline-none focus:ring-0`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={toggleShowPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900 focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password}</p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Password strength</span>
                <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
              </div>
              <div className="h-1 rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all"
                  style={{ width: `${Math.min(strength.value * 20, 100)}%` }}
                ></div>
              </div>
              <ul className="text-xs text-slate-500 space-y-1">
                {passwordCriteria.map((criteria) => {
                  const passed = criteria.validator(formData.password)
                  return (
                    <li
                      key={criteria.id}
                      className={`flex items-center gap-2 ${passed ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${passed ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        aria-hidden="true"
                      ></span>
                      {criteria.label}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-600" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  errors.confirmPassword ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-indigo-500'
                } focus:outline-none focus:ring-0`}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-500 px-5 py-3 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:from-indigo-700 hover:to-emerald-600'
              }`}
            >
              {isLoading ? 'Saving password...' : 'Reset password'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            <p>
              Remembered your password?
              <Link href="/login" className="ml-1 font-semibold text-indigo-600 hover:text-indigo-500">
                Back to sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}



