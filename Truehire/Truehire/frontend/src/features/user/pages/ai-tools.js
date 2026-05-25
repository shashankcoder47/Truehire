import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function AITools() {
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
          <p className="text-gray-600">Loading AI tools...</p>
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
        <title>AI & Career Tools - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">AI & Career Tools</h1>
            <p className="text-gray-600 mt-2">Leverage AI to enhance your job search and career development</p>
          </div>

          {/* Profile Enhancer */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg mr-4">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Profile Enhancer</h2>
                  <p className="text-gray-600">AI-powered suggestions to optimize your resume and profile</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                Enhance Profile
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Resume Optimization</h3>
                <p className="text-sm text-gray-600">Get AI suggestions to improve your resume's impact</p>
                <div className="mt-2 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-600">75%</span>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Keyword Matching</h3>
                <p className="text-sm text-gray-600">Ensure your profile matches job requirements</p>
                <div className="mt-2 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-600">85%</span>
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Skills Gap Analysis</h3>
                <p className="text-sm text-gray-600">Identify skills to develop for your target roles</p>
                <div className="mt-2 flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                  <span className="ml-2 text-xs text-gray-600">60%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interview Coach */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Interview Coach</h2>
                  <p className="text-gray-600">Practice interviews with AI-powered feedback and tips</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                Start Practice
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Technical Interview Prep</h3>
                <p className="text-sm text-gray-600 mb-4">Practice coding problems and system design questions</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Algorithms</span>
                    <span className="text-blue-600">8/10 completed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Data Structures</span>
                    <span className="text-blue-600">6/10 completed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>System Design</span>
                    <span className="text-blue-600">3/10 completed</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Behavioral Interview Prep</h3>
                <p className="text-sm text-gray-600 mb-4">Master common behavioral questions and STAR method</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Leadership</span>
                    <span className="text-blue-600">5/8 completed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Problem Solving</span>
                    <span className="text-blue-600">7/8 completed</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Teamwork</span>
                    <span className="text-blue-600">4/8 completed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Sessions */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Practice Sessions</h2>
                  <p className="text-gray-600">Record and analyze your interview responses</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
                Start Recording
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Tell me about yourself</h3>
                  <p className="text-sm text-gray-600">Recorded 2 days ago • 2:34 duration</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Excellent
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9.17157 9.17157C10.7337 7.60948 13.2663 7.60948 14.8284 9.17157M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Why do you want to work here?</h3>
                  <p className="text-sm text-gray-600">Recorded 1 week ago • 1:45 duration</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Good
                  </span>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14.8284 14.8284C13.2663 16.3905 10.7337 16.3905 9.17157 14.8284M9.17157 9.17157C10.7337 7.60948 13.2663 7.60948 14.8284 9.17157M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Voice Search */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-pink-100 rounded-lg mr-4">
                  <span className="text-2xl">🎙️</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Voice Search</h2>
                  <p className="text-gray-600">Search for jobs using natural language voice commands</p>
                </div>
              </div>
              <button className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors font-medium">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 11C19 15.4183 16.4183 19 12 19M12 19C7.58172 19 5 15.4183 5 11M12 19V23M12 23H8M12 23H16M12 14C10.3431 14 9 12.6569 9 11V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V11C15 12.6569 13.6569 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Voice Search
              </button>
            </div>
            <div className="bg-pink-50 rounded-lg p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-pink-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 11C19 15.4183 16.4183 19 12 19M12 19C7.58172 19 5 15.4183 5 11M12 19V23M12 23H8M12 23H16M12 14C10.3431 14 9 12.6569 9 11V5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5V11C15 12.6569 13.6569 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Try Voice Search</h3>
                <p className="text-gray-600 mb-4">Say something like "Find me senior developer jobs in San Francisco with React experience"</p>
                <div className="flex justify-center space-x-4 text-sm text-gray-500">
                  <span>• Natural language processing</span>
                  <span>• Smart job matching</span>
                  <span>• Voice-to-text conversion</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



