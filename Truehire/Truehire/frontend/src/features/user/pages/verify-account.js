import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function VerifyAccount() {
  const [otp, setOtp] = useState('')
  const [verificationMethod, setVerificationMethod] = useState('email') // 'email' or 'sms'
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [resendTimer, setResendTimer] = useState(30)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Start countdown for resend
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [resendTimer])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      // Simulate OTP verification
      await new Promise(resolve => setTimeout(resolve, 1500))

      // For demo purposes, accept any 6-digit OTP
      if (otp.length === 6 && /^\d+$/.test(otp)) {
        setMessage('Account verified successfully!')

        // Store verification status
        localStorage.setItem('isVerified', 'true')

        // Redirect to account page
        setTimeout(() => {
          router.push('/account')
        }, 2000)
      } else {
        setMessage('Invalid OTP. Please try again.')
      }
    } catch (error) {
      console.error('Verification failed:', error)
      setMessage('Verification failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      // Simulate sending OTP
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMessage(`OTP sent successfully via ${verificationMethod === 'email' ? 'email' : 'SMS'}!`)
      setResendTimer(30)
      setCanResend(false)
    } catch (error) {
      console.error('Resend failed:', error)
      setMessage('Failed to resend OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Verify Account - TrueHire</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" fill="currentColor"/>
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Account</h2>
              <p className="text-gray-600">Enter the 6-digit code sent to your {verificationMethod === 'email' ? 'email' : 'phone'}</p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Verification Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Method
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="method"
                      value="email"
                      checked={verificationMethod === 'email'}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Email</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="method"
                      value="sms"
                      checked={verificationMethod === 'sms'}
                      onChange={(e) => setVerificationMethod(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">SMS</span>
                  </label>
                </div>
              </div>

              {/* OTP Input */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  maxLength="6"
                  required
                  className="input text-center text-2xl tracking-widest"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-xs text-gray-500 mt-1">Enter the 6-digit code</p>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="btn btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : (
                    'Verify Account'
                  )}
                </button>
              </div>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={!canResend || isLoading}
                  className="text-blue-600 hover:text-blue-500 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
                </button>
                <Link
                  href="/register"
                  className="text-gray-600 hover:text-gray-500 text-sm transition-colors block"
                >
                  Wrong details? Register again
                </Link>
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-500 text-sm transition-colors block"
                >
                  ← Back to Home
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}



