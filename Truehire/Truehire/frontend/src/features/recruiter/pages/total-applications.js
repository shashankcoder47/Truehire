import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function TotalApplications() {
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

  const recentApplications = [
    { id: 1, candidate: 'John Smith', job: 'Senior Software Engineer', status: 'Under Review', applied: '1 day ago' },
    { id: 2, candidate: 'Sarah Johnson', job: 'Product Manager', status: 'Interview Scheduled', applied: '3 days ago' },
    { id: 3, candidate: 'Mike Chen', job: 'UX Designer', status: 'Shortlisted', applied: '1 week ago' }
  ]

  return (
    <>
      <Head>
        <title>Total Applications - TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Total Applications</h1>
                <p className="text-gray-600 mt-1">View and manage all candidate applications</p>
              </div>
              <div className="flex items-center space-x-4">
                <button className="btn btn-outline px-4 py-2">
                  Filter
                </button>
                <button className="btn btn-primary px-4 py-2">
                  Export
                </button>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              {recentApplications.length > 0 ? (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {app.candidate.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{app.candidate}</h3>
                            <p className="text-sm text-gray-600">{app.job} • Applied {app.applied}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            app.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                            app.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {app.status}
                          </span>
                          <button
                            onClick={() => router.push(`/candidate-profile?id=${app.id}`)}
                            className="btn btn-outline px-4 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => router.push(`/contact-candidate?id=${app.id}`)}
                            className="btn btn-secondary px-4 py-2 text-sm bg-green-500 text-white hover:bg-green-600"
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h4>
                  <p className="text-gray-600 mb-4">Applications will appear here once candidates apply to your jobs</p>
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


