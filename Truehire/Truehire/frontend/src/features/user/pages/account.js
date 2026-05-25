import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Account() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Fetch user data from localStorage or simulate API call
    const fetchUserData = async () => {
      try {
        // Check if user data exists in localStorage (from registration)
        const storedUserData = localStorage.getItem('userData')

        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } else {
          // Fallback to mock data if no stored data
          await new Promise(resolve => setTimeout(resolve, 500))
          setUser({
            name: 'parves khan H!',
            email: 'user@example.com',
            role: 'user',
            joinedDate: 'November 2025',
            registrationId: 'TH2025000001',
            profileComplete: 0,
            applications: 0,
            savedJobs: 0
          })
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>TrueHire Dashboard - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="flex">
          {/* Main Content */}
          <div className="">
            <div className="px-4 py-8 sm:px-6 lg:px-8">
              {/* Mobile Header */}
              <div className="lg:hidden mb-8">
                <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                        <img
                          src="/images/parves.png.jpg"
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-gray-600">Welcome back, {user.name}!</p>
                        <p className="text-gray-600">{user.role} • Member since {user.joinedDate}</p>
                        <p className="text-gray-600">Registration #: {user.registrationId}</p>
                        <button
                          onClick={handleLogout}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Header */}
              <div className="hidden lg:block mb-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                        <img
                          src="/images/parves.png.jpg"
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">TrueHire Dashboard</h1>
                        <p className="text-xl text-gray-600">{user.role} • Member since {user.joinedDate}</p>
                        <button
                          onClick={handleLogout}
                          className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Applications</p>
                  <p className="text-2xl font-bold text-gray-900">{user.applications}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H7C5.9 3 5.01 3.9 5.01 5L5 21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Saved Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{user.savedJobs}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Profile Complete</p>
                  <p className="text-2xl font-bold text-gray-900">{user.profileComplete}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/jobs" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6 text-blue-600 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2" fill="currentColor"/>
                </svg>
                <span className="font-medium text-gray-900">Browse Jobs</span>
              </Link>

              <Link href="/companies" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <svg className="w-6 h-6 text-green-600 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" fill="currentColor"/>
                </svg>
                <span className="font-medium text-gray-900">View Companies</span>
              </Link>

              <Link href="/profile" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6 text-purple-600 mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12ZM12 14C8.13401 14 5 16.134 5 19V21H19V19C19 16.134 15.866 14 12 14Z" fill="currentColor"/>
                </svg>
                <span className="font-medium text-gray-900">Create & Manage Profile</span>
              </Link>


            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
                  <p className="text-sm text-gray-600">
                    {typeof window !== 'undefined' && localStorage.getItem('2faEnabled') === 'true'
                      ? 'Two-factor authentication is enabled'
                      : 'Add an extra layer of security to your account'
                    }
                  </p>
                </div>
                {typeof window !== 'undefined' && localStorage.getItem('2faEnabled') === 'true' ? (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Enabled
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem('2faEnabled')
                        localStorage.removeItem('2faVerified')
                        alert('2FA has been disabled')
                        window.location.reload()
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Disable
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/setup-2fa"
                    className="btn btn-secondary"
                  >
                    Enable 2FA
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Login Alerts</p>
                  <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                </div>
                <button className="btn btn-secondary">
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Experience & Credentials */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Experience & Credentials</h2>
            <p className="text-gray-600 mb-6">Covers your professional background and qualifications.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/experience" className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 7H4C2.9 7 2 7.9 2 9V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V9C22 7.9 21.1 7 20 7ZM20 19H4V9H20V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3H8C6.9 3 6 3.9 6 5V7H18V5C18 3.9 17.1 3 16 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Experience</h3>
                  <p className="text-sm text-gray-600">Showcase your work history and achievements</p>
                </div>
              </Link>

              <Link href="/education" className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14L16 10H13V3H11V10H8L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Education</h3>
                  <p className="text-sm text-gray-600">Highlight your academic background</p>
                </div>
              </Link>

              <Link href="/certifications" className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors cursor-pointer">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-yellow-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Certifications</h3>
                  <p className="text-sm text-gray-600">Display your professional certifications</p>
                </div>
              </Link>

              <Link href="/languages" className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M2 12H22" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 2C14.7614 2 17 4.23858 17 7C17 9.76142 14.7614 12 12 12C9.23858 12 7 9.76142 7 7C7 4.23858 9.23858 2 12 2Z" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Languages</h3>
                  <p className="text-sm text-gray-600">List languages you speak</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Job Search & Applications */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Job Search & Applications</h2>
            <p className="text-gray-600 mb-6">All tools for finding and managing job opportunities.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/job-search" className="flex items-center p-4 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors">
                <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Job Search</h3>
                  <p className="text-sm text-gray-600">AI-powered job recommendations</p>
                </div>
              </Link>

              <Link href="/job-alerts" className="flex items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Job Alerts</h3>
                  <p className="text-sm text-gray-600">Get notified of new job postings</p>
                </div>
              </Link>

              <Link href="/application-tracker" className="flex items-center p-4 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors">
                <div className="p-3 bg-teal-100 rounded-lg mr-4">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Application Tracker</h3>
                  <p className="text-sm text-gray-600">Track your job application status</p>
                </div>
              </Link>

              <Link href="/recruiter-chats" className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Recruiter Chats</h3>
                  <p className="text-sm text-gray-600">Connect with recruiters directly</p>
                </div>
              </Link>
            </div>
          </div>

          {/* AI & Career Tools */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">AI & Career Tools</h2>
            <p className="text-gray-600 mb-6">Everything powered by AI to improve your chances.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/ai-profile-enhancer" className="flex items-center p-4 bg-cyan-50 rounded-lg hover:bg-cyan-100 transition-colors">
                <div className="p-3 bg-cyan-100 rounded-lg mr-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Profile Enhancer</h3>
                  <p className="text-sm text-gray-600">Optimize your profile with AI suggestions</p>
                </div>
              </Link>

              <Link href="/ai-interview-coach" className="flex items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                <div className="p-3 bg-pink-100 rounded-lg mr-4">
                  <span className="text-2xl">🎭</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Interview Coach</h3>
                  <p className="text-sm text-gray-600">Practice interviews with AI feedback</p>
                </div>
              </Link>

              <Link href="/interview-practice" className="flex items-center p-4 bg-lime-50 rounded-lg hover:bg-lime-100 transition-colors">
                <div className="p-3 bg-lime-100 rounded-lg mr-4">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Interview Practice</h3>
                  <p className="text-sm text-gray-600">Record and review your interview skills</p>
                </div>
              </Link>

              <Link href="/voice-search" className="flex items-center p-4 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors">
                <div className="p-3 bg-violet-100 rounded-lg mr-4">
                  <span className="text-2xl">🎙️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Voice Search</h3>
                  <p className="text-sm text-gray-600">Search jobs using voice commands</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Insights & Reviews */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Insights & Reviews</h2>
            <p className="text-gray-600 mb-6">For learning and gathering market or employer insights.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link href="/anonymous-reviews" className="flex items-center p-4 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                <div className="p-3 bg-amber-100 rounded-lg mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Anonymous Reviews</h3>
                  <p className="text-sm text-gray-600">Read and write anonymous company reviews</p>
                </div>
              </Link>

              <Link href="/learning-hub" className="flex items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                <div className="p-3 bg-emerald-100 rounded-lg mr-4">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Learning Hub</h3>
                  <p className="text-sm text-gray-600">Access career development resources</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Settings & Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings & Notifications</h2>
            <p className="text-gray-600 mb-6">Manage your account preferences and notification settings.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/notifications" className="flex items-center p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="p-3 bg-slate-100 rounded-lg mr-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <p className="text-sm text-gray-600">Manage your notification preferences</p>
                </div>
              </Link>

              <Link href="/social-links" className="flex items-center p-4 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                <div className="p-3 bg-rose-100 rounded-lg mr-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Social Links</h3>
                  <p className="text-sm text-gray-600">Connect your social media profiles</p>
                </div>
              </Link>

              <Link href="/premium-services" className="flex items-center p-4 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors">
                <div className="p-3 bg-gold-100 rounded-lg mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Premium Services</h3>
                  <p className="text-sm text-gray-600">Unlock advanced features and tools</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14 2H6C4.9 2 4.01 2.9 4.01 4L4 20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Applied to Senior Developer position at TechCorp</p>
                  <p className="text-sm text-gray-600">2 days ago</p>
                </div>
              </div>

              <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 3H7C5.9 3 5.01 3.9 5.01 5L5 21L12 18L19 21V5C19 3.9 18.1 3 17 3Z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">Saved Product Manager role at InnovateLabs</p>
                  <p className="text-sm text-gray-600">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  </>
)
}



