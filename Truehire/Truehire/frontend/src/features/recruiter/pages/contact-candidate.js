import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function ContactCandidate() {
  const [recruiterData, setRecruiterData] = useState(null)
  const [candidate, setCandidate] = useState(null)
  const [message, setMessage] = useState('')
  const [subject, setSubject] = useState('')
  const router = useRouter()
  const { id } = router.query

  useEffect(() => {
    // Check if recruiter is logged in
    const isLoggedIn = localStorage.getItem('recruiterLoggedIn')
    const data = localStorage.getItem('recruiterData')

    if (!isLoggedIn || !data) {
      router.push('/login')
      return
    }

    setRecruiterData(JSON.parse(data))

    // Mock candidate data - in real app, fetch from API
    const mockCandidates = {
      1: {
        id: 1,
        name: 'John Smith',
        email: 'john.smith@email.com',
        phone: '+1 (555) 123-4567',
        job: 'Senior Software Engineer'
      },
      2: {
        id: 2,
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1 (555) 234-5678',
        job: 'Product Manager'
      },
      3: {
        id: 3,
        name: 'Mike Chen',
        email: 'mike.chen@email.com',
        phone: '+1 (555) 345-6789',
        job: 'UX Designer'
      }
    }

    if (id && mockCandidates[id]) {
      setCandidate(mockCandidates[id])
    }
  }, [router, id])

  const handleSendMessage = () => {
    // In real app, send message via API
    alert('Message sent successfully!')
    router.push('/total-applications')
  }

  if (!recruiterData || !candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Contact {candidate.name} - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>

          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Contact {candidate.name}</h1>
              <p className="text-gray-600 mt-1">Send a message regarding the {candidate.job} position</p>
            </div>

            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {candidate.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{candidate.name}</h3>
                    <p className="text-sm text-gray-600">{candidate.email}</p>
                    <p className="text-sm text-gray-600">{candidate.phone}</p>
                  </div>
                </div>
              </div>

              {/* Message Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter message subject"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={8}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message here..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={() => router.back()}
                  className="btn btn-outline px-6 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="btn btn-primary px-6 py-2"
                >
                  Send Message
                </button>
              </div>
            </div>
          </div>

          {/* Quick Templates */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setSubject('Interview Invitation')
                  setMessage(`Dear ${candidate.name},\n\nWe were impressed by your application for the ${candidate.job} position and would like to invite you for an interview.\n\nPlease let us know your availability for next week.\n\nBest regards,\n${recruiterData.name}`)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Interview Invitation</h3>
                <p className="text-sm text-gray-600">Invite candidate for interview</p>
              </button>

              <button
                onClick={() => {
                  setSubject('Application Update')
                  setMessage(`Dear ${candidate.name},\n\nThank you for your interest in the ${candidate.job} position. We wanted to provide an update on your application.\n\nWe are currently reviewing applications and will be in touch soon.\n\nBest regards,\n${recruiterData.name}`)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Application Update</h3>
                <p className="text-sm text-gray-600">Send status update</p>
              </button>

              <button
                onClick={() => {
                  setSubject('Request Additional Information')
                  setMessage(`Dear ${candidate.name},\n\nWe are interested in your application for the ${candidate.job} position and would like to request some additional information.\n\nCould you please provide more details about your experience with...\n\nBest regards,\n${recruiterData.name}`)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Request Information</h3>
                <p className="text-sm text-gray-600">Ask for more details</p>
              </button>

              <button
                onClick={() => {
                  setSubject('Thank You for Applying')
                  setMessage(`Dear ${candidate.name},\n\nThank you for taking the time to apply for the ${candidate.job} position at our company.\n\nWe appreciate your interest and will be in touch if there's a good fit.\n\nBest regards,\n${recruiterData.name}`)
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-medium text-gray-900">Thank You</h3>
                <p className="text-sm text-gray-600">Send thank you note</p>
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}


