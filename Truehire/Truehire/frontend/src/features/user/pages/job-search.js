import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function JobSearch() {
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
            name: 'User',
            email: 'user@example.com',
            role: 'Job Seeker',
            joinedDate: 'January 2024'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job search tools...</p>
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
        <title>Job Search & Applications - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/account"
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                >
                  <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Back to Account
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Job Search & Applications</h1>
              </div>
            </div>
            <p className="text-gray-600 mt-2">All tools for finding and managing job opportunities</p>
          </div>

          {/* Smart Job Search */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Smart Job Search</h2>
                  <p className="text-gray-600">AI-powered job recommendations tailored to your profile</p>
                </div>
              </div>
              <Link href="/jobs" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Search Jobs
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Recommended for You</h3>
                <p className="text-sm text-gray-600">12 new matches based on your skills</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Trending Roles</h3>
                <p className="text-sm text-gray-600">Popular positions in your industry</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Salary Insights</h3>
                <p className="text-sm text-gray-600">Market rates for your experience level</p>
              </div>
            </div>
          </div>

          {/* Job Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Job Alerts</h2>
                  <p className="text-gray-600">Get notified when jobs matching your criteria are posted</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
                Create Alert
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Senior Developer - Remote</h3>
                  <p className="text-sm text-gray-600">React, Node.js, TypeScript • San Francisco, CA</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Full Stack Engineer</h3>
                  <p className="text-sm text-gray-600">Python, Django, React • New York, NY</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Application Tracker */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-teal-100 rounded-lg mr-4">
                  <span className="text-2xl">📋</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Application Tracker</h2>
                  <p className="text-gray-600">Track your job application status and follow-ups</p>
                </div>
              </div>
              <Link href="/applications" className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium">
                View All
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Senior Developer at TechCorp</h3>
                  <p className="text-sm text-gray-600">Applied 2 days ago • Interview scheduled</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Interview
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.45801 12C3.73228 7.94288 7.52257 5 12 5C16.4774 5 20.2677 7.94288 21.542 12C20.2677 16.0571 16.4774 19 12 19C7.52257 19 3.73228 16.0571 2.45801 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Product Manager at InnovateLabs</h3>
                  <p className="text-sm text-gray-600">Applied 1 week ago • Under review</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Under Review
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.45801 12C3.73228 7.94288 7.52257 5 12 5C16.4774 5 20.2677 7.94288 21.542 12C20.2677 16.0571 16.4774 19 12 19C7.52257 19 3.73228 16.0571 2.45801 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Frontend Developer at StartupXYZ</h3>
                  <p className="text-sm text-gray-600">Applied 2 weeks ago • Rejected</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Rejected
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2.45801 12C3.73228 7.94288 7.52257 5 12 5C16.4774 5 20.2677 7.94288 21.542 12C20.2677 16.0571 16.4774 19 12 19C7.52257 19 3.73228 16.0571 2.45801 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recruiter Chats */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-100 rounded-lg mr-4">
                  <span className="text-2xl">💬</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recruiter Chats</h2>
                  <p className="text-gray-600">Connect with recruiters directly through our messaging platform</p>
                </div>
              </div>
              <Link href="/messages" className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                View Messages
              </Link>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-semibold text-blue-600">TC</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">TechCorp HR</h3>
                    <p className="text-sm text-gray-600">Thanks for your application! We'd like to schedule...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">2h ago</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    1
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-sm font-semibold text-green-600">IL</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">InnovateLabs Talent</h3>
                    <p className="text-sm text-gray-600">Your profile looks great! Let's discuss the role...</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">1d ago</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    3
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



