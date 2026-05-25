import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Insights() {
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
          <p className="text-gray-600">Loading insights...</p>
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
        <title>Insights & Reviews - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Insights & Reviews</h1>
            <p className="text-gray-600 mt-2">Anonymous reviews and learning resources to help you grow</p>
          </div>

          {/* Anonymous Reviews */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                  <span className="text-2xl">⭐</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Anonymous Reviews</h2>
                  <p className="text-gray-600">Read and share honest feedback about companies and roles</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-medium">
                Write Review
              </button>
            </div>
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {'★★★★★'.split('').map((star, i) => (
                        <span key={i}>{star}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">TechCorp</span>
                  </div>
                  <span className="text-sm text-gray-500">2 weeks ago</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Great work culture and benefits</h3>
                <p className="text-gray-700 mb-4">
                  Excellent company to work for. The team is supportive, management is transparent, and the benefits package is comprehensive.
                  Work-life balance is respected, and there's plenty of opportunity for growth.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Pros: Work-life balance, Benefits, Growth</span>
                  <span>Cons: None mentioned</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {'★★★☆☆'.split('').map((star, i) => (
                        <span key={i} className={i < 3 ? 'text-yellow-400' : 'text-gray-300'}>{star}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">StartupXYZ</span>
                  </div>
                  <span className="text-sm text-gray-500">1 month ago</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Fast-paced environment with learning opportunities</h3>
                <p className="text-gray-700 mb-4">
                  The work is challenging and fast-paced. You'll learn a lot, but be prepared for long hours during crunch periods.
                  The compensation is competitive for a startup, and there's equity involved.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Pros: Learning, Compensation, Innovation</span>
                  <span>Cons: Long hours, High pressure</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex text-yellow-400 mr-2">
                      {'★★★★☆'.split('').map((star, i) => (
                        <span key={i} className={i < 4 ? 'text-yellow-400' : 'text-gray-300'}>{star}</span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">InnovateLabs</span>
                  </div>
                  <span className="text-sm text-gray-500">3 weeks ago</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Solid company with room for improvement</h3>
                <p className="text-gray-700 mb-4">
                  Good company overall with interesting projects. The team is knowledgeable and collaborative.
                  However, the decision-making process can be slow, and there could be better communication from leadership.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Pros: Projects, Team, Stability</span>
                  <span>Cons: Slow decisions, Communication</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Hub */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Learning Hub</h2>
                  <p className="text-gray-600">Curated resources to help you advance your career</p>
                </div>
              </div>
              <Link href="/learning" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                Explore All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 14L16 10H8L12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Interview Preparation Guide</h3>
                <p className="text-sm text-gray-600 mb-3">Complete guide to acing technical and behavioral interviews</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">45 min read</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 19V6L21 3V16M9 19C9 20.1046 8.10457 21 7 21C5.89543 21 5 20.1046 5 19C5 17.8954 5.89543 17 7 17C8.10457 17 9 17.8954 9 19ZM9 19L21 16M21 16C21 17.1046 21.8954 18 23 18C24.1046 18 25 17.1046 25 16C25 14.8954 24.1046 14 23 14C21.8954 14 21 14.8954 21 16Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Salary Negotiation Tactics</h3>
                <p className="text-sm text-gray-600 mb-3">Learn how to negotiate better offers and compensation</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">30 min read</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Premium
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Resume Writing Masterclass</h3>
                <p className="text-sm text-gray-600 mb-3">Create compelling resumes that get noticed by recruiters</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">60 min video</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 20H7C5.89543 20 5 19.1046 5 18V9C5 7.89543 5.89543 7 7 7H17C18.1046 7 19 7.89543 19 9V18C19 19.1046 18.1046 20 17 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Networking Strategies</h3>
                <p className="text-sm text-gray-600 mb-3">Build meaningful professional connections effectively</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">25 min read</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Free
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">LinkedIn Optimization</h3>
                <p className="text-sm text-gray-600 mb-3">Make your LinkedIn profile stand out to recruiters</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">40 min video</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Premium
                  </span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-indigo-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13 10V3L4 14H11V21L20 10H13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Career Transition Guide</h3>
                <p className="text-sm text-gray-600 mb-3">Successfully switch careers with this comprehensive guide</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">90 min course</span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Premium
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



