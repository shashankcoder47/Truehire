import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { apiService } from '../../utils/api'

export default function RecruiterOtp() {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [resendSuccess, setResendSuccess] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isResendingOtp, setIsResendingOtp] = useState(false)
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    // Get email from localStorage
    const pendingEmail = localStorage.getItem('pendingOtpEmail')
    if (!pendingEmail) {
      // If no email, redirect back to login
      router.push('/login')
      return
    }
    setEmail(pendingEmail)
  }, [router])

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return // Only allow single digit

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      if (nextInput) nextInput.focus()
    }

    // Clear error and success messages when user starts typing
    if (otpError) setOtpError('')
    if (resendSuccess) setResendSuccess('')
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      if (prevInput) prevInput.focus()
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setIsVerifyingOtp(true)
    setOtpError('')
    setResendSuccess('')

    const otpString = otp.join('')

    try {
      const response = await apiService.verifyOTP({ email, otp: otpString })

      // User-friendly handling for invalid/expired OTP and other API errors
      if (response && response.error) {
        const msg = String(response.error || '').toLowerCase()
        if (msg.includes('invalid') || msg.includes('expired') || response.status === 400 || response.status === 401) {
          alert('Invalid or expired OTP')
        } else {
          alert('Verification failed. Please try again.')
        }
        setOtp(['', '', '', '', '', ''])
        const firstInput = document.getElementById('otp-0')
        if (firstInput) firstInput.focus()
        return
      }

      // Success - clear pending email and redirect
      localStorage.removeItem('pendingOtpEmail')
      localStorage.removeItem('pendingOtpPassword')
      localStorage.setItem('recruiterOtpVerified', 'true')
      const nextPath = localStorage.getItem('pendingRecruiterNext')
      localStorage.removeItem('pendingRecruiterNext')

      // Preserve backend role payload (recruiter/sub-recruiter) for dashboard access
      const responseUser = response?.user
      if (responseUser && typeof responseUser === 'object') {
        const normalizedRole = String(responseUser.role || '')
          .toLowerCase()
          .replace(/_/g, '-')
        apiService.setUserData({
          ...responseUser,
          role: normalizedRole || 'recruiter'
        })
      }

      router.replace(nextPath || '/recruiter-dashboard')
    } catch (error) {
      const msg = String(error?.message || '').toLowerCase()
      if (msg.includes('invalid') || msg.includes('expired')) {
        alert('Invalid or expired OTP')
      } else {
        alert('Verification failed. Please try again.')
      }
      console.error('OTP verification error:', error)
      setOtp(['', '', '', '', '', ''])
      const firstInput = document.getElementById('otp-0')
      if (firstInput) firstInput.focus()
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setIsResendingOtp(true)
    setOtpError('')
    setResendSuccess('')

    try {
      const pendingPassword = localStorage.getItem('pendingOtpPassword') || ''
      if (!pendingPassword) {
        setOtpError('Session expired. Please login again.')
        router.push('/login')
        return
      }

      const response = await apiService.sendOTP(email, pendingPassword)
      if (response && response.error) {
        setOtpError(response.error || 'Failed to resend OTP. Please try again.')
        return
      }

      setOtp(['', '', '', '', '', ''])
      const firstInput = document.getElementById('otp-0')
      if (firstInput) firstInput.focus()
      setResendSuccess('A new OTP has been sent to your email.')
      setTimeout(() => setResendSuccess(''), 3000)
    } catch (error) {
      console.error('OTP resend error:', error)
      setOtpError(error.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setIsResendingOtp(false)
    }
  }

  return (
    <>
      <Head>
        <title>Recruiter Email Verification - TrueHire</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h2>
              <p className="text-gray-600 mb-4">
                We've sent a 6-digit verification code to <strong>{email}</strong>
              </p>
              <p className="text-sm text-gray-500">
                Please enter it below to continue.
              </p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div>
                <div className="flex justify-center space-x-2">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  ))}
                </div>
                {otpError && (
                  <p className="text-red-600 text-sm text-center mt-2">{otpError}</p>
                )}
                {resendSuccess && (
                  <p className="text-green-600 text-sm text-center mt-2">{resendSuccess}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otp.some(digit => !digit)}
                className="w-full btn btn-primary py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOtp ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  'Verify Email'
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{' '}
                <button
                  onClick={handleResendOtp}
                  disabled={isResendingOtp}
                  className="text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResendingOtp ? 'Resending...' : 'Resend Code'}
                </button>
              </p>
            </div>

            <div className="text-center mt-4">
              <button
                onClick={() => router.push('/login')}
                className="text-gray-600 hover:text-gray-500 text-sm transition-colors"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


