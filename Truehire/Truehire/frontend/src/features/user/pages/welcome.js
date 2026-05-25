import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Welcome() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()

  const handleLogout = () => {
    // Clear all stored data
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('otpVerified')
    localStorage.removeItem('locationAccepted')
    localStorage.removeItem('userData')
    localStorage.removeItem('userLocation')
    localStorage.removeItem('socialLinks')
    localStorage.removeItem('currentPlan')
    // Redirect to login
    router.push('/login')
  }

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Check if OTP verification is completed
    const otpVerified = localStorage.getItem('otpVerified') === 'true'
    if (!otpVerified) {
      router.push('/otp')
      return
    }

    // Check if location access is accepted
    const locationAccepted = localStorage.getItem('locationAccepted') === 'true'
    if (!locationAccepted) {
      // Request location access using browser API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Success: Store location data and mark as accepted
            localStorage.setItem('locationAccepted', 'true')
            localStorage.setItem('userLocation', JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            }))
          },
          (error) => {
            // Error: Mark as declined but still allow access
            console.log('Location access denied or unavailable:', error.message)
            localStorage.setItem('locationAccepted', 'false')
            // Automatically proceed without modal
          }
        )
      } else {
        // Geolocation not supported
        console.log('Geolocation is not supported by this browser')
        localStorage.setItem('locationAccepted', 'false')
        // Automatically proceed without modal
      }
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } else {
          // Fallback mock data
          setUser({
            name: 'Professional User',
            email: 'user@example.com',
            role: 'Job Seeker'
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





  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your dashboard...</p>
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
        <title>Welcome Back - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-white">
        {/* Header Container with Dark Background */}
        <div className="bg-[#092d5b] py-0 px-8 mb-16">
          <div className="max-w-6xl mx-auto">
            {/* Header with Logout */}
            <div className="flex justify-end mb-6">
              <button
                onClick={handleLogout}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 hover:shadow-md transition-all duration-200"
              >
                Logout
              </button>
            </div>

            <div className="max-w-4xl mx-auto text-center text-white">
              <div className="flex flex-col items-center space-y-2">
                <img src="/images/parves.png.jpg" alt="Profile" className="w-32 h-32 rounded-full border-4 border-white/20 shadow-lg" />
                <div className="space-y-2">
                  <h1 className="text-5xl font-bold">
                    Welcome back, {user.name}!
                  </h1>
                  <p className="text-xl opacity-90">
                    Job Seeker • Member since
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto text-center">

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div
              onClick={() => router.push('/applications')}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Applications</h3>
              <p className="text-3xl font-bold text-blue-700">12</p>
            </div>
            <div
              onClick={() => router.push('/saved-jobs')}
              className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl shadow-lg p-6 border border-emerald-200 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Saved Jobs</h3>
              <p className="text-3xl font-bold text-emerald-700">8</p>
            </div>
            <div
              onClick={() => router.push('/user-profile-complete')}
              className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl shadow-lg p-6 border border-violet-200 text-center hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Complete</h3>
              <p className="text-3xl font-bold text-violet-700">75%</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => router.push('/jobs')}
                className="flex flex-col items-center p-6 bg-blue-50 rounded-lg hover:bg-blue-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="font-semibold text-gray-900">Browse Jobs</span>
              </button>
              <button
                onClick={() => router.push('/companies')}
                className="flex flex-col items-center p-6 bg-green-50 rounded-lg hover:bg-green-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="font-semibold text-gray-900">View Companies</span>
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="flex flex-col items-center p-6 bg-purple-50 rounded-lg hover:bg-purple-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="font-semibold text-gray-900">Create & Manage Profile</span>
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Security Settings
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-gray-600">Add an extra layer of security to your account</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200">Enable 2FA</button>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Login Alerts</h3>
                  <p className="text-gray-600">Get notified of new login attempts</p>
                </div>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 hover:shadow-md transition-all duration-200">Configure</button>
              </div>
            </div>
          </div>



          {/* Job Search & Applications */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Job Search & Applications
            </h2>
            <p className="text-gray-600 mb-4">All tools for finding and managing job opportunities.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/jobs')}
                className="p-4 bg-indigo-50 rounded-lg text-center hover:bg-indigo-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🔍</span>
                <h3 className="text-lg font-semibold text-gray-900">Smart Job Search</h3>
                <p className="text-gray-600">AI-powered job recommendations</p>
              </button>
              <button
                onClick={() => router.push('/job-alerts')}
                className="p-4 bg-red-50 rounded-lg text-center hover:bg-red-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🔔</span>
                <h3 className="text-lg font-semibold text-gray-900">Job Alerts</h3>
                <p className="text-gray-600">Get notified of new job postings</p>
              </button>
              <button
                onClick={() => router.push('/application-tracker')}
                className="p-4 bg-teal-50 rounded-lg text-center hover:bg-teal-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">📋</span>
                <h3 className="text-lg font-semibold text-gray-900">Application Tracker</h3>
                <p className="text-gray-600">Track your job application status</p>
              </button>
              <button
                onClick={() => router.push('/recruiter-chats')}
                className="p-4 bg-orange-50 rounded-lg text-center hover:bg-orange-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">💬</span>
                <h3 className="text-lg font-semibold text-gray-900">Recruiter Chats</h3>
                <p className="text-gray-600">Connect with recruiters directly</p>
              </button>
            </div>
          </div>

          {/* AI & Career Tools */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              AI & Career Tools
            </h2>
            <p className="text-gray-600 mb-4">Everything powered by AI to improve your chances.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/ai-profile-enhancer')}
                className="p-4 bg-cyan-50 rounded-lg text-center hover:bg-cyan-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🤖</span>
                <h3 className="text-lg font-semibold text-gray-900">AI Profile Enhancer</h3>
                <p className="text-gray-600">Optimize your profile with AI suggestions</p>
              </button>
              <button
                onClick={() => router.push('/ai-interview-coach')}
                className="p-4 bg-pink-50 rounded-lg text-center hover:bg-pink-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🎭</span>
                <h3 className="text-lg font-semibold text-gray-900">AI Interview Coach</h3>
                <p className="text-gray-600">Practice interviews with AI feedback</p>
              </button>
              <button
                onClick={() => router.push('/interview-practice')}
                className="p-4 bg-lime-50 rounded-lg text-center hover:bg-lime-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🎤</span>
                <h3 className="text-lg font-semibold text-gray-900">Interview Practice</h3>
                <p className="text-gray-600">Record and review your interview skills</p>
              </button>
              <button
                onClick={() => router.push('/voice-search')}
                className="p-4 bg-violet-50 rounded-lg text-center hover:bg-violet-100 hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                <span className="text-2xl mb-2 block">🎙️</span>
                <h3 className="text-lg font-semibold text-gray-900">Voice Search</h3>
                <p className="text-gray-600">Search jobs using voice commands</p>
              </button>
            </div>
          </div>

          {/* Insights & Reviews */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Insights & Reviews
            </h2>
            <p className="text-gray-600 mb-4">For learning and gathering market or employer insights.</p>
            <div className="grid grid-cols-1 gap-4">
              <button onClick={() => router.push('/learning-hub')} className="p-4 bg-emerald-50 rounded-lg text-center hover:bg-emerald-100 hover:shadow-md hover:scale-105 transition-all duration-200">
                <span className="text-2xl mb-2 block">🎓</span>
                <h3 className="text-lg font-semibold text-gray-900">Learning Hub</h3>
                <p className="text-gray-600">Access career development resources</p>
              </button>
            </div>
          </div>

          {/* Settings & Notifications */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Settings & Notifications
            </h2>
            <p className="text-gray-600 mb-4">For managing communication, preferences, and premium features.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button onClick={() => router.push('/notifications')} className="p-4 bg-slate-50 rounded-lg text-center hover:bg-slate-100 hover:shadow-md hover:scale-105 transition-all duration-200">
                <span className="text-2xl mb-2 block">🔔</span>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <p className="text-gray-600">Manage your notification preferences</p>
              </button>
              <button onClick={() => router.push('/social-links')} className="p-4 bg-rose-50 rounded-lg text-center hover:bg-rose-100 hover:shadow-md hover:scale-105 transition-all duration-200">
                <span className="text-2xl mb-2 block">🔗</span>
                <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
                <p className="text-gray-600">Connect your social media profiles</p>
              </button>
              <button onClick={() => router.push('/premium-services')} className="p-4 bg-yellow-50 rounded-lg text-center hover:bg-yellow-100 hover:shadow-md hover:scale-105 transition-all duration-200">
                <span className="text-2xl mb-2 block">⭐</span>
                <h3 className="text-lg font-semibold text-gray-900">Premium Services</h3>
                <p className="text-gray-600">Unlock advanced features and tools</p>
              </button>
            </div>
          </div>

          {/* Featured Opportunities */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Featured Opportunities
            </h2>
            <p className="text-gray-600 mb-6">Discover handpicked opportunities from top companies that match your skills and career aspirations</p>
            <div className="space-y-6">
              {/* Job 1 */}
              <div className="border border-blue-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">Software Engineer</h3>
                    <p className="text-blue-700">TechCorp</p>
                  </div>
                  <button onClick={() => router.push('/jobs/1')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 hover:shadow-md transition-all duration-200">
                    View Details
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-blue-600 mb-4">
                  <span>San Francisco, CA</span>
                  <span>₹120k - ₹160k</span>
                  <span>Mid</span>
                  <span>Full-time</span>
                </div>
                <p className="text-sm text-blue-500">Posted 2 days ago</p>
              </div>
              {/* Job 2 */}
              <div className="border border-emerald-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-emerald-50 to-teal-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-emerald-900">Product Manager</h3>
                    <p className="text-emerald-700">InnoGroup</p>
                  </div>
                  <button onClick={() => router.push('/jobs/2')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 hover:shadow-md transition-all duration-200">
                    View Details
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-emerald-600 mb-4">
                  <span>New York, NY</span>
                  <span>₹140k - ₹180k</span>
                  <span>Senior</span>
                  <span>Full-time</span>
                </div>
                <p className="text-sm text-emerald-500">Posted 1 week ago</p>
              </div>
              {/* Job 3 */}
              <div className="border border-violet-200 rounded-lg p-6 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-violet-50 to-purple-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-violet-900">UI/UX Designer</h3>
                    <p className="text-violet-700">DesignCo</p>
                  </div>
                  <button onClick={() => router.push('/jobs/3')} className="bg-violet-600 text-white px-4 py-2 rounded-lg hover:bg-violet-700 hover:shadow-md transition-all duration-200">
                    View Details
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-violet-600 mb-4">
                  <span>Los Angeles, CA</span>
                  <span>₹100k - ₹130k</span>
                  <span>Mid</span>
                  <span>Full-time</span>
                </div>
                <p className="text-sm text-violet-500">Posted 3 days ago</p>
              </div>
            </div>
          </div>

        </div>

        {/* Recent Activity */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Applied to Senior Developer position at TechCorp</p>
                  <p className="text-sm text-gray-300">2 days ago</p>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-white">Saved Product Manager role at InnovateLabs</p>
                  <p className="text-sm text-gray-300">1 week ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



