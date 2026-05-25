import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { jobs } from '../../../utils/jobs'

export default function ApplicationTracker() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [applications, setApplications] = useState([])
  const [filter, setFilter] = useState('all')
  const [appliedAtById, setAppliedAtById] = useState({})
  const [recruiterActionsById, setRecruiterActionsById] = useState({})
  const [timelineStateById, setTimelineStateById] = useState({})
  const [suggestedJobsById, setSuggestedJobsById] = useState({})
  const [suggestionNoticeById, setSuggestionNoticeById] = useState({})

  const applicationsRef = useRef([])
  const recruiterActionsRef = useRef({})
  const applicationTimersRef = useRef({})
  const broadenTimersRef = useRef({})

  const APPLY_WAIT_MS = 30 * 60 * 1000
  const BROADEN_WAIT_MS = 24 * 60 * 60 * 1000
  const TIMELINE_STAGES = ['Applied', 'Awaiting Response', 'Exploring Similar Jobs']
  const RECRUITER_ACTION_TYPES = new Set([
    'view',
    'shortlist',
    'reject',
    'message sent',
    'interview scheduled'
  ])
  const SUGGESTION_NOTICE =
    'We\u2019re still waiting for a response from the recruiter. Meanwhile, here are similar jobs you might be interested in.'

  useEffect(() => {
    applicationsRef.current = applications
  }, [applications])

  useEffect(() => {
    recruiterActionsRef.current = recruiterActionsById
  }, [recruiterActionsById])

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

        // Mock applications data
        setApplications([
          {
            id: 1,
            company: 'TechCorp',
            position: 'Senior Frontend Developer',
            status: 'applied',
            appliedDate: '2024-01-15',
            lastUpdate: '2024-01-15',
            notes: 'Applied through company website'
          },
          {
            id: 2,
            company: 'InnovateLabs',
            position: 'React Developer',
            status: 'interview',
            appliedDate: '2024-01-10',
            lastUpdate: '2024-01-18',
            notes: 'Phone interview scheduled for next week'
          },
          {
            id: 3,
            company: 'StartupXYZ',
            position: 'Full Stack Developer',
            status: 'rejected',
            appliedDate: '2024-01-05',
            lastUpdate: '2024-01-12',
            notes: 'Position filled internally'
          },
          {
            id: 4,
            company: 'DataFlow Inc',
            position: 'Frontend Engineer',
            status: 'offer',
            appliedDate: '2024-01-08',
            lastUpdate: '2024-01-20',
            notes: 'Offer received, reviewing details'
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

  useEffect(() => {
    return () => {
      Object.values(applicationTimersRef.current).forEach(timeoutId => clearTimeout(timeoutId))
      Object.values(broadenTimersRef.current).forEach(timeoutId => clearTimeout(timeoutId))
    }
  }, [])

  const normalizeText = (value) => (value || '').toString().toLowerCase().trim()
  const toKeywords = (value) => normalizeText(value).split(/[^a-z0-9]+/).filter(Boolean)
  const normalizeLocation = (value) => normalizeText(value).replace(/\bremote\b/g, '').trim()
  const isRemoteLocation = (value) => normalizeText(value).includes('remote')

  const isSameOrNearbyLocation = (jobLocation, targetLocation) => {
    if (!jobLocation || !targetLocation) return false
    if (isRemoteLocation(jobLocation) || isRemoteLocation(targetLocation)) return true
    const jobParts = normalizeLocation(jobLocation).split(',').map(part => part.trim()).filter(Boolean)
    const targetParts = normalizeLocation(targetLocation).split(',').map(part => part.trim()).filter(Boolean)
    return jobParts.some(part => targetParts.includes(part))
  }

  const isRecruiterRecentlyActive = (job) => {
    const lastActive =
      job?.recruiterLastActive ||
      job?.recruiter?.lastActive ||
      job?.recruiter?.lastActiveAt
    if (!lastActive) return true
    const lastActiveTime = new Date(lastActive).getTime()
    if (Number.isNaN(lastActiveTime)) return true
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
    return Date.now() - lastActiveTime <= THIRTY_DAYS_MS
  }

  const buildApplicationContext = (application) => ({
    title: application?.position || application?.title || '',
    skills: application?.skills || user?.skills || user?.profileSkills || [],
    keywords: application?.keywords || user?.keywords || [],
    experienceLevel: application?.level || user?.experienceLevel || user?.experience || '',
    location: application?.location || user?.location || '',
    industry: application?.industry || application?.domain || user?.industry || user?.domain || ''
  })

  const scoreJobMatch = (job, context, broaden) => {
    const jobTitleKeywords = toKeywords(job?.title)
    const contextTitleKeywords = toKeywords(context.title)
    const titleOverlap = jobTitleKeywords.some(word => contextTitleKeywords.includes(word))

    const jobSkillKeywords = Array.isArray(job?.skills) ? job.skills.map(normalizeText) : []
    const contextSkillKeywords = []
      .concat(context.skills || [])
      .concat(context.keywords || [])
      .map(normalizeText)
      .filter(Boolean)
    const skillOverlap = jobSkillKeywords.some(skill => contextSkillKeywords.includes(skill))

    const experienceMatch = context.experienceLevel
      ? normalizeText(job?.level) === normalizeText(context.experienceLevel)
      : false

    const locationMatch = context.location
      ? isSameOrNearbyLocation(job?.location, context.location)
      : false

    const industryMatch = context.industry
      ? normalizeText(job?.industry || job?.domain) === normalizeText(context.industry)
      : false

    let score = 0
    if (titleOverlap) score += 3
    if (skillOverlap) score += 3
    if (!broaden && experienceMatch) score += 2
    if (!broaden && locationMatch) score += 2
    if (!broaden && industryMatch) score += 1

    return {
      score,
      meetsRules:
        titleOverlap &&
        skillOverlap &&
        (broaden || experienceMatch) &&
        (broaden || locationMatch || isRemoteLocation(job?.location)) &&
        (broaden || industryMatch || !context.industry)
    }
  }

  const fetchRelatedJobSuggestions = (applicationId, options = {}) => {
    const { broaden = false } = options
    const application = applicationsRef.current.find(app => app.id === applicationId)
    if (!application) return []

    const context = buildApplicationContext(application)
    const scoredJobs = jobs
      .filter(job => job?.id !== application.id)
      .filter(job => isRecruiterRecentlyActive(job))
      .map(job => ({ job, match: scoreJobMatch(job, context, broaden) }))
      .filter(item => item.match.meetsRules || item.match.score >= (broaden ? 3 : 6))
      .sort((a, b) => b.match.score - a.match.score)
      .map(item => item.job)

    setSuggestedJobsById(prev => ({ ...prev, [applicationId]: scoredJobs }))
    setSuggestionNoticeById(prev => ({ ...prev, [applicationId]: SUGGESTION_NOTICE }))
    setTimelineStateById(prev => ({
      ...prev,
      [applicationId]: {
        currentStage: 'Exploring Similar Jobs',
        stages: TIMELINE_STAGES
      }
    }))

    return scoredJobs
  }

  const clearApplicationTimers = (applicationId) => {
    if (applicationTimersRef.current[applicationId]) {
      clearTimeout(applicationTimersRef.current[applicationId])
      delete applicationTimersRef.current[applicationId]
    }
    if (broadenTimersRef.current[applicationId]) {
      clearTimeout(broadenTimersRef.current[applicationId])
      delete broadenTimersRef.current[applicationId]
    }
  }

  const startSmartApplicationTimeline = (applicationId) => {
    clearApplicationTimers(applicationId)

    setApplications(prev =>
      prev.map(app =>
        app.id === applicationId
          ? { ...app, status: 'Applied \u2013 Awaiting Recruiter Response' }
          : app
      )
    )

    setAppliedAtById(prev => ({ ...prev, [applicationId]: Date.now() }))
    setTimelineStateById(prev => ({
      ...prev,
      [applicationId]: {
        currentStage: 'Awaiting Response',
        stages: TIMELINE_STAGES
      }
    }))

    applicationTimersRef.current[applicationId] = setTimeout(() => {
      const actions = recruiterActionsRef.current[applicationId]?.actions || []
      if (actions.length > 0) return
      fetchRelatedJobSuggestions(applicationId)
    }, APPLY_WAIT_MS)

    broadenTimersRef.current[applicationId] = setTimeout(() => {
      const actions = recruiterActionsRef.current[applicationId]?.actions || []
      if (actions.length > 0) return
      fetchRelatedJobSuggestions(applicationId, { broaden: true })
    }, BROADEN_WAIT_MS)
  }

  const recordRecruiterAction = (applicationId, actionType, meta = {}) => {
    if (!RECRUITER_ACTION_TYPES.has(actionType)) return

    clearApplicationTimers(applicationId)

    setRecruiterActionsById(prev => {
      const existing = prev[applicationId] || { actions: [] }
      const nextActions = existing.actions.concat({
        type: actionType,
        timestamp: Date.now(),
        meta
      })
      return {
        ...prev,
        [applicationId]: {
          ...existing,
          lastActionAt: Date.now(),
          actions: nextActions
        }
      }
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'applied': return 'bg-blue-100 text-blue-800'
      case 'reviewing': return 'bg-yellow-100 text-yellow-800'
      case 'interview': return 'bg-purple-100 text-purple-800'
      case 'offer': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'applied': return 'Applied'
      case 'reviewing': return 'Under Review'
      case 'interview': return 'Interview'
      case 'offer': return 'Offer Received'
      case 'rejected': return 'Rejected'
      default: return status
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Application Tracker - TrueHire</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link href="/welcome" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Tracker</h1>
            <p className="text-gray-600">Track your job application status and progress</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total</h3>
              <p className="text-3xl font-bold text-gray-600">{applications.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Applied</h3>
              <p className="text-3xl font-bold text-blue-600">
                {applications.filter(app => app.status === 'applied').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview</h3>
              <p className="text-3xl font-bold text-purple-600">
                {applications.filter(app => app.status === 'interview').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Offers</h3>
              <p className="text-3xl font-bold text-green-600">
                {applications.filter(app => app.status === 'offer').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Rejected</h3>
              <p className="text-3xl font-bold text-red-600">
                {applications.filter(app => app.status === 'rejected').length}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mb-8">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => setFilter('applied')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'applied'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Applied ({applications.filter(app => app.status === 'applied').length})
              </button>
              <button
                onClick={() => setFilter('interview')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'interview'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Interview ({applications.filter(app => app.status === 'interview').length})
              </button>
              <button
                onClick={() => setFilter('offer')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'offer'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Offers ({applications.filter(app => app.status === 'offer').length})
              </button>
              <button
                onClick={() => setFilter('rejected')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  filter === 'rejected'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected ({applications.filter(app => app.status === 'rejected').length})
              </button>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Your Applications</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {filteredApplications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-600">No applications found for the selected filter.</p>
                </div>
              ) : (
                filteredApplications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {application.position}
                        </h3>
                        <p className="text-gray-600 mb-2">{application.company}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Applied: {application.appliedDate}</span>
                          <span>Last Update: {application.lastUpdate}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
                        {getStatusText(application.status)}
                      </span>
                    </div>
                    {application.notes && (
                      <p className="text-gray-700 mb-4">{application.notes}</p>
                    )}
                    <div className="flex space-x-4">
                      <button className="text-blue-600 hover:text-blue-800 font-medium">
                        View Details
                      </button>
                      <button className="text-gray-600 hover:text-gray-800 font-medium">
                        Update Status
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}



