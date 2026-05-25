import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function ActiveJobs() {
  const [recruiterData, setRecruiterData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Check if recruiter is logged in
    const isLoggedIn = localStorage.getItem('recruiterLoggedIn')
    const data = localStorage.getItem('recruiterData')

    if (!isLoggedIn || !data) {
      router.push('/login')
      return
    }

    setRecruiterData(JSON.parse(data))
  }, [router])

  if (!recruiterData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const recentJobs = [
    { id: 1, title: 'Senior Software Engineer', applicants: 45, status: 'Active', posted: '2 days ago' },
    { id: 2, title: 'Product Manager', applicants: 23, status: 'Active', posted: '1 week ago' },
    { id: 3, title: 'UX Designer', applicants: 67, status: 'Active', posted: '2 weeks ago' }
  ]

  return (
    <>
      <Head>
        <title>Active Jobs - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Active Jobs</h1>
                <p className="text-gray-600 mt-1">Manage your currently active job postings</p>
              </div>
              <button
                onClick={() => window.location.href = '/post-job'}
                className="btn btn-primary px-6 py-2"
              >
                Post New Job
              </button>
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {recentJobs.length > 0 ? (
                <div className="space-y-4">
                  {recentJobs.filter(job => job.status === 'Active').map((job) => (
                    <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                          <p className="text-sm text-gray-600">{job.applicants} applicants • Posted {job.posted}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            {job.status}
                          </span>
                          <button
                            onClick={() => router.push(`/job-details?id=${job.id}`)}
                            className="btn btn-outline px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => router.push(`/edit-job?id=${job.id}`)}
                            className="btn btn-secondary px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No active jobs</h4>
                  <p className="text-gray-600 mb-4">Start by posting your first job opening</p>
                  <button
                    onClick={() => window.location.href = '/post-job'}
                    className="btn btn-primary"
                  >
                    Post Your First Job
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}



