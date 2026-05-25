import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function JobAlerts() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState([])
  const [newAlert, setNewAlert] = useState({
    keywords: '',
    location: '',
    jobType: '',
    salaryRange: ''
  })

  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('isLoggedIn')
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    const otpVerified = localStorage.getItem('otpVerified') === 'true'
    if (!otpVerified) {
      router.push('/otp')
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
            email: 'user@example.com'
          })
        }

        // Mock alerts data
        setAlerts([
          {
            id: 1,
            keywords: 'Frontend Developer',
            location: 'New York',
            jobType: 'Full-time',
            salaryRange: '$80k - $120k',
            active: true,
            createdAt: '2024-01-15'
          },
          {
            id: 2,
            keywords: 'React Developer',
            location: 'Remote',
            jobType: 'Contract',
            salaryRange: '$50/h',
            active: true,
            createdAt: '2024-01-10'
          }
        ])
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router])

  const handleCreateAlert = (e) => {
    e.preventDefault()
    const alert = {
      id: Date.now(),
      ...newAlert,
      active: true,
      createdAt: new Date().toISOString().split('T')[0]
    }
    setAlerts([alert, ...alerts])
    setNewAlert({
      keywords: '',
      location: '',
      jobType: '',
      salaryRange: ''
    })
  }

  const toggleAlert = (id) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, active: !alert.active } : alert
    ))
  }

  const deleteAlert = (id) => {
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Job Alerts - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/welcome" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Alerts</h1>
            <p className="text-gray-600">Get notified when new jobs match your criteria</p>
          </div>

          {/* Create New Alert */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Alert</h2>
            <form onSubmit={handleCreateAlert} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords
                  </label>
                  <input
                    type="text"
                    value={newAlert.keywords}
                    onChange={(e) => setNewAlert({...newAlert, keywords: e.target.value})}
                    placeholder="e.g., Frontend Developer, React"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newAlert.location}
                    onChange={(e) => setNewAlert({...newAlert, location: e.target.value})}
                    placeholder="e.g., New York, Remote"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    value={newAlert.jobType}
                    onChange={(e) => setNewAlert({...newAlert, jobType: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Any</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salary Range
                  </label>
                  <input
                    type="text"
                    value={newAlert.salaryRange}
                    onChange={(e) => setNewAlert({...newAlert, salaryRange: e.target.value})}
                    placeholder="e.g., $80k - $120k"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Alert
              </button>
            </form>
          </div>

          {/* Existing Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Alerts</h2>
            {alerts.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No job alerts created yet.</p>
            ) : (
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{alert.keywords}</h3>
                        <p className="text-gray-600">{alert.location} • {alert.jobType} • {alert.salaryRange}</p>
                        <p className="text-sm text-gray-500">Created on {alert.createdAt}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {alert.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => toggleAlert(alert.id)}
                        className={`px-4 py-2 rounded-lg font-medium ${
                          alert.active
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {alert.active ? 'Pause' : 'Resume'}
                      </button>
                      <button
                        onClick={() => deleteAlert(alert.id)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}



