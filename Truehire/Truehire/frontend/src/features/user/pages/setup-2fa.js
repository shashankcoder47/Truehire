import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Setup2FA() {
  const [step, setStep] = useState(1) // 1: QR code, 2: verification
  const [verificationCode, setVerificationCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Mock QR code data - in real app this would come from backend
  const qrCodeUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjEwMCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDAwIiBmb250LXNpemU9IjE0Ij5RRyBDb2RlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg=='
  const secretKey = 'JBSWY3DPEHPK3PXP'

  const handleVerify = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1000))

    // In real app, verify the code with backend
    if (verificationCode.length === 6) {
      // Store 2FA enabled status
      localStorage.setItem('2faEnabled', 'true')
      router.push('/account')
    } else {
      alert('Invalid verification code')
    }

    setIsLoading(false)
  }

  const handleSkip = () => {
    router.push('/account')
  }

  return (
    <>
      <Head>
        <title>Setup Two-Factor Authentication - TrueHire</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {step === 1 ? 'Setup Two-Factor Authentication' : 'Verify Your Code'}
              </h2>
              <p className="text-gray-600">
                {step === 1
                  ? 'Scan the QR code with your authenticator app'
                  : 'Enter the 6-digit code from your authenticator app'
                }
              </p>
            </div>

            {step === 1 ? (
              <div className="mt-8 space-y-6">
                <div className="text-center">
                  <div className="inline-block p-4 bg-gray-50 rounded-lg">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code for 2FA setup"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">
                    Can't scan? Enter this code manually:<br />
                    <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono mt-2 block">
                      {secretKey}
                    </code>
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Popular Authenticator Apps
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Google Authenticator, Authy, Microsoft Authenticator, 1Password</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSkip}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : (
              <form className="mt-8 space-y-6" onSubmit={handleVerify}>
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="verificationCode"
                    name="verificationCode"
                    type="text"
                    required
                    maxLength="6"
                    className="appearance-none relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading || verificationCode.length !== 6}
                    className="w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                      'Enable 2FA'
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-blue-600 hover:text-blue-500 font-medium transition-colors"
                  >
                    ← Back to QR Code
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/account"
                className="text-gray-600 hover:text-gray-500 text-sm transition-colors"
              >
                Skip and go to Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



