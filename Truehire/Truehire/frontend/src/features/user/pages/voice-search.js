import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function VoiceSearch() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [voiceCommands, setVoiceCommands] = useState([])

  const recognitionRef = useRef(null)
  const router = useRouter()

  // Mock job data for demonstration
  const mockJobs = [
    { id: 1, title: 'Senior React Developer', company: 'TechCorp', location: 'New York', type: 'Full-time' },
    { id: 2, title: 'Frontend Engineer', company: 'InnovateLabs', location: 'San Francisco', type: 'Full-time' },
    { id: 3, title: 'UI/UX Designer', company: 'Design Studio', location: 'Remote', type: 'Contract' },
    { id: 4, title: 'Product Manager', company: 'StartupXYZ', location: 'Austin', type: 'Full-time' },
    { id: 5, title: 'Data Scientist', company: 'DataTech', location: 'Seattle', type: 'Full-time' },
    { id: 6, title: 'DevOps Engineer', company: 'CloudSys', location: 'Remote', type: 'Full-time' }
  ]

  const voiceCommandExamples = [
    '"Find software engineer jobs in New York"',
    '"Show me remote frontend developer positions"',
    '"Search for product manager roles"',
    '"Find jobs in San Francisco"',
    '"Show contract work opportunities"'
  ]

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

    // Initialize speech recognition
    initializeSpeechRecognition()
  }, [router])

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()

      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }

        setTranscript(finalTranscript || interimTranscript)
      }

      recognition.onend = () => {
        setIsListening(false)
        if (transcript.trim()) {
          performVoiceSearch(transcript.trim())
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
        alert('Speech recognition error. Please try again.')
      }

      recognitionRef.current = recognition
    } else {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.')
    }
  }

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  const performVoiceSearch = async (query) => {
    setIsSearching(true)

    // Simulate AI processing of voice command
    setVoiceCommands(prev => [...prev.slice(-4), query]) // Keep last 5 commands

    // Mock search logic based on voice command
    const lowerQuery = query.toLowerCase()

    let filteredJobs = []

    if (lowerQuery.includes('software engineer') || lowerQuery.includes('developer')) {
      filteredJobs = mockJobs.filter(job =>
        job.title.toLowerCase().includes('developer') ||
        job.title.toLowerCase().includes('engineer')
      )
    } else if (lowerQuery.includes('remote')) {
      filteredJobs = mockJobs.filter(job => job.location.toLowerCase().includes('remote'))
    } else if (lowerQuery.includes('new york')) {
      filteredJobs = mockJobs.filter(job => job.location.toLowerCase().includes('new york'))
    } else if (lowerQuery.includes('san francisco')) {
      filteredJobs = mockJobs.filter(job => job.location.toLowerCase().includes('san francisco'))
    } else if (lowerQuery.includes('contract')) {
      filteredJobs = mockJobs.filter(job => job.type.toLowerCase().includes('contract'))
    } else if (lowerQuery.includes('product manager')) {
      filteredJobs = mockJobs.filter(job => job.title.toLowerCase().includes('product manager'))
    } else {
      // General search
      filteredJobs = mockJobs.filter(job =>
        job.title.toLowerCase().includes(lowerQuery) ||
        job.company.toLowerCase().includes(lowerQuery) ||
        job.location.toLowerCase().includes(lowerQuery)
      )
    }

    // Simulate API delay
    setTimeout(() => {
      setSearchResults(filteredJobs)
      setIsSearching(false)
    }, 1500)
  }

  const clearResults = () => {
    setTranscript('')
    setSearchResults([])
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Voice Search...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Voice Search - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎙️ Voice Search
            </h1>
            <p className="text-xl text-gray-600">
              Search jobs using voice commands - hands-free job hunting
            </p>
          </div>

          {/* Voice Search Interface */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <div className="text-center">
              {/* Voice Button */}
              <div className="mb-6">
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`w-32 h-32 rounded-full border-4 transition-all ${
                    isListening
                      ? 'bg-red-500 border-red-600 animate-pulse'
                      : 'bg-blue-500 border-blue-600 hover:bg-blue-600'
                  } flex items-center justify-center text-white text-4xl`}
                >
                  {isListening ? '🎤' : '🎙️'}
                </button>
                <p className="mt-4 text-lg font-medium text-gray-900">
                  {isListening ? 'Listening...' : 'Tap to speak'}
                </p>
              </div>

              {/* Transcript Display */}
              {transcript && (
                <div className="mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{transcript}"</p>
                  </div>
                </div>
              )}

              {/* Search Status */}
              {isSearching && (
                <div className="mb-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing your voice search...</p>
                </div>
              )}

              {/* Clear Button */}
              {(transcript || searchResults.length > 0) && (
                <button
                  onClick={clearResults}
                  className="btn btn-secondary mb-6"
                >
                  Clear Results
                </button>
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Search Results ({searchResults.length})
              </h2>
              <div className="space-y-4">
                {searchResults.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg p-6 hover:border-blue-300 transition-colors border border-gray-200"
                    style={job.is_urgent ? { backgroundColor: 'rgba(247, 110, 47, 0.15)', borderColor: '#f76e2f' } : undefined}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                            {job.is_urgent && (
                              <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-full bg-[#fff3ec] text-[#b9391c] border border-[#f76e2f]">
                                Urgent Hiring
                              </span>
                            )}
                        </div>
                        <p className="text-gray-600 mb-2">{job.company}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <span className="mr-4">📍 {job.location}</span>
                          <span>💼 {job.type}</span>
                        </div>
                      </div>
                      <Link
                        href={`/jobs/${job.id}`}
                        className="btn btn-primary"
                      >
                        View Job
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voice Commands History */}
          {voiceCommands.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Voice Commands</h2>
              <div className="space-y-3">
                {voiceCommands.map((command, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-500 mr-3">🎤</span>
                    <span className="text-gray-700 italic">"{command}"</span>
                    <button
                      onClick={() => performVoiceSearch(command)}
                      className="ml-auto text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Search Again
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">How Voice Search Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🎤</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Speak Naturally</h3>
                <p className="text-gray-600">Use natural language to describe what you're looking for.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Processing</h3>
                <p className="text-gray-600">Our AI understands context and intent to find relevant jobs.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Results</h3>
                <p className="text-gray-600">Get personalized job recommendations in seconds.</p>
              </div>
            </div>
          </div>

          {/* Voice Command Examples */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Try These Voice Commands</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {voiceCommandExamples.map((example, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">{example}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Smart Matching</h3>
              <p className="text-gray-600">
                AI understands job titles, locations, and requirements to find the perfect matches.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">💬 Natural Language</h3>
              <p className="text-gray-600">
                Speak conversationally - no need to memorize specific commands or keywords.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">📱 Hands-Free</h3>
              <p className="text-gray-600">
                Perfect for multitasking - search jobs while driving, exercising, or doing chores.
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">🔄 Voice History</h3>
              <p className="text-gray-600">
                Access your recent voice searches and easily repeat successful queries.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Voice Search Premium</h2>
            <p className="text-purple-100 mb-6">
              Unlock advanced voice features, unlimited searches, and personalized voice profiles.
            </p>
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </>
  )
}



