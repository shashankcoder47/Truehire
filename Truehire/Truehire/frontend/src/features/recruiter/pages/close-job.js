import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function CloseJob() {
  const [recruiterData, setRecruiterData] = useState(null)
  const [job, setJob] = useState(null)
  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState('')
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

    // Mock job data - in real app, fetch from API
    const mockJobs = {
      1: {
        id: 1,
        title: 'Senior Software Engineer',
        applicants: 45,
        status: 'Active',
        posted: '2 days ago',
        description: 'We are looking for a Senior Software Engineer to join our team...',
        location: 'San Francisco, CA',
        salary: '$120,000 - $160,000'
      },
      2: {
        id: 2,
        title: 'Product Manager',
        applicants: 23,
        status: 'Active',
        posted: '1 week ago',
        description: 'We are seeking an experienced Product Manager...',
        location: 'New York, NY',
        salary: '$130,000 - $170,000'
      },
      3: {
        id: 3,
        title: 'UX Designer',
        applicants: 67,
        status: 'Closed',
        posted: '2 weeks ago',
        description: 'We are looking for a talented UX Designer...',
        location: 'Austin, TX',
        salary: '$90,000 - $120,000'
      },
      4: {
        id: 4,
        title: 'Data Scientist',
        applicants: 12,
        status: 'Active',
        posted: '3 days ago',
        description: 'Join our data science team...',
        location: 'Seattle, WA',
        salary: '$110,000 - $150,000'
      },
      5: {
        id: 5,
        title: 'DevOps Engineer',
        applicants: 8,
        status: 'Active',
        posted: '5 days ago',
        description: 'We need a skilled DevOps Engineer...',
        location: 'Remote',
        salary: '$100,000 - $140,000'
      }
    }

    if (id && mockJobs[id]) {
      setJob(mockJobs[id])
    }
  }, [router, id])

  const handleCloseJob = () => {
    if (confirmation !== 'CLOSE') {
      alert('Please type "CLOSE" to confirm')
      return
    }

    // In real app, close job via API
    alert('Job closed successfully!')
    router.push('/jobs-posted')
  }

  if (!recruiterData || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Close Job - {job.title} - TrueHire</title>
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
            Back to Jobs Posted
          </button>

          {/* Close Job Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Close Job Posting</h1>
              <p className="text-gray-600 mt-1">Close the "{job.title}" position</p>
            </div>

            {/* Job Summary */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-red-900">Warning: This action cannot be undone</h3>
                  <p className="text-red-700 mt-1">
                    Closing this job will prevent new applications and may affect ongoing recruitment processes.
                    Current applicants will still be able to view the job posting but won't be able to apply.
                  </p>
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Job Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Job Title</p>
                  <p className="font-medium text-gray-900">{job.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Applicants</p>
                  <p className="font-medium text-gray-900">{job.applicants}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posted</p>
                  <p className="font-medium text-gray-900">{job.posted}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Job Form */}
            <div className="space-y-6">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for closing (optional)
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="position_filled">Position filled</option>
                  <option value="budget_constraints">Budget constraints</option>
                  <option value="reorganization">Company reorganization</option>
                  <option value="requirements_changed">Requirements changed</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  Type "CLOSE" to confirm
                </label>
                <input
                  type="text"
                  id="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type CLOSE to confirm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 mt-8">
              <button
                onClick={() => router.back()}
                className="btn btn-outline px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseJob}
                className="btn btn-danger px-6 py-2"
              >
                Close Job
              </button>
            </div>
          </div>

          {/* Additional Information */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens when you close a job?</h2>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">The job posting will be marked as "Closed"</p>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">New applications will be disabled</p>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">Existing applications remain accessible</p>
              </div>
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">You can still view and manage applications</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}


