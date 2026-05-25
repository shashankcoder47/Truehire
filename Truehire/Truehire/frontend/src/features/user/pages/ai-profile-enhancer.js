import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function AIProfileEnhancer() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [profileAnalysis, setProfileAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    // Fetch user data
    const fetchUserData = async () => {
      try {
        const storedUserData = localStorage.getItem('userData')
        if (storedUserData) {
          const userData = JSON.parse(storedUserData)
          setUser(userData)
        } else {
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

  const analyzeProfile = async () => {
    setIsAnalyzing(true)
    // Simulate AI analysis
    setTimeout(() => {
      setProfileAnalysis({
        score: 75,
        strengths: [
          'Strong technical skills in React and Node.js',
          'Good project descriptions',
          'Relevant work experience'
        ],
        improvements: [
          'Add more quantifiable achievements',
          'Include industry-specific keywords',
          'Expand on leadership experience'
        ],
        suggestions: [
          'Use action verbs to start bullet points',
          'Quantify your impact with metrics',
          'Tailor your profile for each job application'
        ]
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Profile Enhancer...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>AI Profile Enhancer - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🤖 AI Profile Enhancer
            </h1>
            <p className="text-xl text-gray-600">
              Optimize your profile with AI-powered suggestions to improve your job search success
            </p>
          </div>

          {/* Profile Analysis Section */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Analysis</h2>

            {!profileAnalysis ? (
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Get AI-powered insights to improve your profile's effectiveness and visibility to recruiters.
                </p>
                <button
                  onClick={analyzeProfile}
                  disabled={isAnalyzing}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze My Profile'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Score */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 rounded-full mb-4">
                    <span className="text-3xl font-bold text-blue-600">{profileAnalysis.score}%</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Profile Strength Score</h3>
                  <p className="text-gray-600">Based on industry standards and recruiter preferences</p>
                </div>

                {/* Strengths */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-3">✅ Strengths</h3>
                  <ul className="space-y-2">
                    {profileAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-700 mb-3">🔧 Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {profileAnalysis.improvements.map((improvement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-orange-500 mr-2">•</span>
                        <span className="text-gray-700">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Suggestions */}
                <div>
                  <h3 className="text-lg font-semibold text-blue-700 mb-3">💡 AI Suggestions</h3>
                  <ul className="space-y-2">
                    {profileAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="text-center pt-4">
                  <button
                    onClick={() => setProfileAnalysis(null)}
                    className="btn btn-secondary mr-4"
                  >
                    Run Analysis Again
                  </button>
                  <Link href="/profile" className="btn btn-primary">
                    Update Profile
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Keyword Optimization</h3>
              <p className="text-gray-600">
                AI analyzes job descriptions and suggests relevant keywords to improve your profile's search visibility.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Enhancement</h3>
              <p className="text-gray-600">
                Get suggestions for improving your resume content, making it more compelling and professional.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Industry Insights</h3>
              <p className="text-gray-600">
                Learn what recruiters in your industry are looking for and how to position yourself better.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Competitive Analysis</h3>
              <p className="text-gray-600">
                Compare your profile against successful candidates in your field and get tailored recommendations.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Boost Your Profile?</h2>
            <p className="text-blue-100 mb-6">
              Unlock premium AI features and get unlimited profile analyses with detailed recommendations.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </>
  )
}



