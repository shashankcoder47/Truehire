import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function AIInterviewCoach() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTopic, setSelectedTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [isPracticing, setIsPracticing] = useState(false)

  const router = useRouter()

  const interviewTopics = [
    'Behavioral Questions',
    'Technical Skills',
    'Company Knowledge',
    'Leadership Experience',
    'Problem Solving',
    'Teamwork & Collaboration'
  ]

  const sampleQuestions = {
    'Behavioral Questions': [
      'Tell me about a time when you faced a challenging situation at work and how you handled it.',
      'Describe a situation where you had to work with a difficult team member.',
      'Give an example of a project where you took initiative.'
    ],
    'Technical Skills': [
      'Explain your experience with [specific technology relevant to the job].',
      'How do you approach debugging a complex issue?',
      'Describe your process for learning new technologies.'
    ],
    'Company Knowledge': [
      'What do you know about our company and why do you want to work here?',
      'How does your experience align with our company values?',
      'What interests you most about our current projects?'
    ],
    'Leadership Experience': [
      'Tell me about a time when you led a team or project.',
      'How do you motivate and inspire your team members?',
      'Describe a situation where you had to make a difficult decision.'
    ],
    'Problem Solving': [
      'Walk me through your approach to solving a complex problem.',
      'Tell me about a time when you had to think outside the box.',
      'How do you prioritize tasks when everything seems urgent?'
    ],
    'Teamwork & Collaboration': [
      'Describe your experience working in cross-functional teams.',
      'How do you handle conflicts within a team?',
      'Give an example of successful collaboration on a project.'
    ]
  }

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

  const startPractice = (topic) => {
    setSelectedTopic(topic)
    setQuestions(sampleQuestions[topic])
    setCurrentQuestion(0)
    setUserAnswer('')
    setFeedback(null)
    setIsPracticing(true)
  }

  const submitAnswer = () => {
    // Simulate AI feedback
    const mockFeedback = {
      score: Math.floor(Math.random() * 40) + 60, // 60-100
      strengths: [
        'Clear and concise communication',
        'Good structure in your response',
        'Relevant examples provided'
      ],
      improvements: [
        'Add more specific details',
        'Use the STAR method more effectively',
        'Practice speaking more confidently'
      ],
      tips: [
        'Start with the Situation, then Task, Action, and Result',
        'Use quantifiable metrics when possible',
        'Maintain eye contact and positive body language'
      ]
    }
    setFeedback(mockFeedback)
  }

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setUserAnswer('')
      setFeedback(null)
    }
  }

  const resetPractice = () => {
    setSelectedTopic('')
    setQuestions([])
    setCurrentQuestion(0)
    setUserAnswer('')
    setFeedback(null)
    setIsPracticing(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI Interview Coach...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>AI Interview Coach - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/welcome" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
              ← Back to Welcome
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎭 AI Interview Coach
            </h1>
            <p className="text-xl text-gray-600">
              Practice interviews with AI-powered feedback and personalized coaching
            </p>
          </div>

          {!isPracticing ? (
            <>
              {/* Topic Selection */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Practice Topic</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {interviewTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => startPractice(topic)}
                      className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg text-left hover:from-blue-100 hover:to-purple-100 transition-all border border-gray-200 hover:border-blue-300"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{topic}</h3>
                      <p className="text-gray-600">
                        Practice {sampleQuestions[topic].length} questions on {topic.toLowerCase()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Personalized Feedback</h3>
                  <p className="text-gray-600">Get detailed AI analysis of your responses with specific improvement suggestions.</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                  <div className="text-3xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Tracking</h3>
                  <p className="text-gray-600">Track your progress over time and see how your interview skills improve.</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
                  <div className="text-3xl mb-4">🎬</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Recording</h3>
                  <p className="text-gray-600">Record your practice sessions and review your body language and delivery.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Practice Session */}
              <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedTopic} Practice</h2>
                  <button
                    onClick={resetPractice}
                    className="btn btn-secondary"
                  >
                    End Practice
                  </button>
                </div>

                {/* Progress */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Question {currentQuestion + 1} of {questions.length}</span>
                    <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {questions[currentQuestion]}
                  </h3>
                  <textarea
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Feedback */}
                {feedback && (
                  <div className="mb-6 p-6 bg-gray-50 rounded-lg">
                    <div className="flex items-center mb-4">
                      <div className="text-2xl mr-3">📊</div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">AI Feedback</h4>
                        <p className="text-gray-600">Score: {feedback.score}/100</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <h5 className="font-semibold text-green-700 mb-2">✅ Strengths</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index}>• {strength}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-orange-700 mb-2">🔧 Improvements</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {feedback.improvements.map((improvement, index) => (
                            <li key={index}>• {improvement}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-semibold text-blue-700 mb-2">💡 Tips</h5>
                        <ul className="text-sm text-gray-700 space-y-1">
                          {feedback.tips.map((tip, index) => (
                            <li key={index}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between">
                  <button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || feedback}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedback ? 'Feedback Received' : 'Get AI Feedback'}
                  </button>
                  {feedback && currentQuestion < questions.length - 1 && (
                    <button onClick={nextQuestion} className="btn btn-secondary">
                      Next Question
                    </button>
                  )}
                  {feedback && currentQuestion === questions.length - 1 && (
                    <button onClick={resetPractice} className="btn btn-success">
                      Complete Practice Session
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Master Your Interview Skills</h2>
            <p className="text-purple-100 mb-6">
              Get unlimited practice sessions, advanced AI feedback, and personalized coaching plans.
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



