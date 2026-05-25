import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'

export default function Applications() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [applications, setApplications] = useState([])
  const [jobModal, setJobModal] = useState({ open: false, job: null, loading: false, error: null })
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [videoUploadState, setVideoUploadState] = useState({
    file: null,
    durationSeconds: null,
    error: null,
    uploading: false,
    success: null
  })
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState(null)
  const [notificationClock, setNotificationClock] = useState(Date.now())
  const notificationsRef = useRef(null)
  const autoOpenRef = useRef(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchApplications()
      fetchNotifications()
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user) return undefined

    const clockInterval = window.setInterval(() => {
      setNotificationClock(Date.now())
    }, 1000)
    const refreshInterval = window.setInterval(() => {
      fetchNotifications({ silent: true })
    }, 5000)

    return () => {
      window.clearInterval(clockInterval)
      window.clearInterval(refreshInterval)
    }
  }, [user])

  useEffect(() => {
    if (!showNotifications) return
    const handleClickOutside = (event) => {
      if (!notificationsRef.current) return
      if (!notificationsRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  useEffect(() => {
    if (!router.isReady || autoOpenRef.current) return
    const targetId = router.query.applicationId
    if (!targetId || applications.length === 0) return
    const targetApplication = applications.find(app => String(app.id) === String(targetId))
    if (targetApplication) {
      autoOpenRef.current = true
      openJobModal(targetApplication)
    }
  }, [router.isReady, router.query.applicationId, applications])

  const fetchApplications = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const token = apiService.getToken()
      if (!token) {
        setError('You are not logged in. Please sign in to view applications.')
        router.push('/login')
        return
      }

      const response = await apiService.request('/jobs/user/applications', { returnErrorObject: true })

      if (response && response.error) {
        throw response
      }

      if (response && response.applications) {
        setApplications(response.applications)
      } else {
        setError('No applications found.')
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
      const message =
        error?.message ||
        error?.details?.message ||
        'Failed to load applications. Please try again.'
      setError(message)

      if (error?.status === 401 || error?.status === 403) {
        apiService.clearToken()
        router.push('/login')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const fetchNotifications = async ({ silent = false } = {}) => {
    if (!silent) setLoadingNotifications(true)
    setNotificationError(null)
    try {
      const response = await apiService.request('/notifications', { returnErrorObject: true })

      if (response && response.error) {
        throw response
      }

      setNotifications(response?.notifications || [])
      setUnreadCount(response?.unreadCount || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotificationError(
        error?.message || error?.details?.message || 'Failed to load notifications.'
      )
    } finally {
      if (!silent) setLoadingNotifications(false)
    }
  }

  const markNotificationRead = async (notificationId) => {
    if (!notificationId) return
    try {
      const response = await apiService.request(`/notifications/${notificationId}/read`, {
        method: 'PUT',
        returnErrorObject: true
      })
      if (response && response.error) {
        throw response
      }
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId ? { ...notification, status: 'read' } : notification
        )
      )
      if (typeof response?.unreadCount === 'number') {
        setUnreadCount(response.unreadCount)
      } else {
        setUnreadCount(prev => Math.max(prev - 1, 0))
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const toggleNotifications = () => {
    const nextState = !showNotifications
    setShowNotifications(nextState)
    if (nextState) {
      fetchNotifications()
    }
  }

  const getStatusColor = (status) => {
    const normalized = (status || '').toLowerCase()
    switch (normalized) {
      case 'applied - awaiting recruiter response':
        return 'bg-blue-100 text-blue-800'
      case 'under review':
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-800'
      case 'interview scheduled':
      case 'interview':
        return 'bg-blue-100 text-blue-800'
      case 'shortlisted':
        return 'bg-indigo-100 text-indigo-800'
      case 'accepted':
      case 'hired':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getVideoStatusColor = (status) => {
    if (status === 'Video Uploaded') return 'bg-emerald-100 text-emerald-800'
    if (status === 'Video Pending') return 'bg-amber-100 text-amber-800'
    return 'bg-slate-100 text-slate-700'
  }

  const getApplicationTone = (status) => {
    const normalized = (status || '').toLowerCase()
    if (normalized === 'shortlisted') return 'bg-indigo-500'
    if (normalized === 'accepted' || normalized === 'hired') return 'bg-emerald-500'
    if (normalized === 'rejected') return 'bg-rose-500'
    if (normalized === 'under review' || normalized === 'reviewed') return 'bg-amber-500'
    if (normalized.includes('interview')) return 'bg-blue-500'
    return 'bg-slate-400'
  }

  const getApplicationStage = (status) => {
    const normalized = (status || '').toLowerCase()
    if (normalized === 'accepted' || normalized === 'hired') return 4
    if (normalized.includes('interview')) return 3
    if (normalized === 'shortlisted') return 2
    if (normalized === 'under review' || normalized === 'reviewed') return 1
    if (normalized === 'rejected') return 1
    return 0
  }

  const getNextStep = (app) => {
    const status = (app.status || '').toLowerCase()
    const videoStatus = (app.videoStatus || '').toLowerCase()
    if (status === 'shortlisted' && videoStatus !== 'video uploaded') return 'Upload intro video'
    if (status.includes('interview')) return 'Prepare for interview'
    if (status === 'accepted' || status === 'hired') return 'Review offer'
    if (status === 'rejected') return 'Closed'
    if (status === 'under review' || status === 'reviewed') return 'Await recruiter decision'
    return 'Track recruiter response'
  }

  const formatViewTime = (seconds) => {
    const totalSeconds = Number(seconds) || 0
    const minutes = Math.floor(totalSeconds / 60)
    const remainder = totalSeconds % 60
    if (minutes > 0 && remainder > 0) return `${minutes}m ${remainder}s`
    if (minutes > 0) return `${minutes}m`
    return `${remainder}s`
  }

  const formatNotificationTime = (value) => {
    if (!value) return '0s ago'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '0s ago'
    const diffMs = notificationClock - date.getTime()
    const seconds = Math.max(0, Math.floor(diffMs / 1000))
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const emptyVideoState = {
    file: null,
    durationSeconds: null,
    error: null,
    uploading: false,
    success: null
  }

  const readVideoDuration = (file) => new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    const url = URL.createObjectURL(file)
    video.src = url
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration || 0)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read video metadata'))
    }
  })

  const handleVideoFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      setVideoUploadState({ ...emptyVideoState, error: 'Only MP4, MOV, or WebM videos are allowed.' })
      return
    }

    if (file.size > 100 * 1024 * 1024) {
      setVideoUploadState({ ...emptyVideoState, error: 'Video size must be 100 MB or less.' })
      return
    }

    try {
      const durationSeconds = await readVideoDuration(file)
      if (durationSeconds > 90) {
        setVideoUploadState({ ...emptyVideoState, error: 'Video must be 90 seconds or less.' })
        return
      }
      setVideoUploadState({
        file,
        durationSeconds,
        error: null,
        uploading: false,
        success: null
      })
    } catch (err) {
      setVideoUploadState({ ...emptyVideoState, error: err.message || 'Unable to read video duration.' })
    }
  }

  const handleUploadIntroductionVideo = async () => {
    if (!selectedApplication?.id) {
      setVideoUploadState((prev) => ({ ...prev, error: 'Missing application details.' }))
      return
    }
    if (!videoUploadState.file) {
      setVideoUploadState((prev) => ({ ...prev, error: 'Choose a video to upload.' }))
      return
    }

    setVideoUploadState((prev) => ({ ...prev, uploading: true, error: null, success: null }))
    try {
      const formData = new FormData()
      formData.append('video', videoUploadState.file)
      if (videoUploadState.durationSeconds) {
        formData.append('durationSeconds', Math.round(videoUploadState.durationSeconds))
      }

      const response = await apiService.request(
        `/jobs/user/applications/${selectedApplication.id}/introduction-video`,
        { method: 'POST', body: formData, returnErrorObject: true }
      )

      if (response?.error || response?.success === false) {
        throw new Error(response?.message || response?.error || 'Upload failed.')
      }

      setVideoUploadState({
        ...emptyVideoState,
        success: 'Video uploaded successfully.'
      })

      setApplications((prev) =>
        prev.map((app) =>
          app.id === selectedApplication.id
            ? { ...app, videoStatus: 'Video Uploaded', videoUploadedAt: new Date().toISOString() }
            : app
        )
      )
      setSelectedApplication((prev) =>
        prev ? { ...prev, videoStatus: 'Video Uploaded', videoUploadedAt: new Date().toISOString() } : prev
      )
    } catch (err) {
      setVideoUploadState((prev) => ({
        ...prev,
        uploading: false,
        error: err?.message || 'Upload failed. Please try again.'
      }))
      return
    }

    setVideoUploadState((prev) => ({ ...prev, uploading: false }))
  }

  const handleWithdrawApplication = async (applicationId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return

    try {
      await apiService.request(`/jobs/user/applications/${applicationId}`, { method: 'DELETE' })
      setApplications(prev => prev.filter(app => app.id !== applicationId))
    } catch (err) {
      console.error('Withdraw application error:', err)
      alert(err?.message || 'Failed to withdraw application. Please try again.')
    }
  }

  const openJobModal = async (application) => {
    if (!application) return
    setSelectedApplication(application)
    setVideoUploadState(emptyVideoState)
    setJobModal({ open: true, job: null, loading: true, error: null })
    try {
      const jobId = application.jobId || application.id
      const res = await apiService.request(`/jobs/${jobId}`)
      if (!res || !res.job) throw new Error('Unable to load job details.')
      setJobModal({ open: true, job: res.job, loading: false, error: null })
    } catch (err) {
      console.error('Load job details error:', err)
      setJobModal({ open: true, job: null, loading: false, error: err?.message || 'Failed to load job details.' })
    }
  }

  const closeJobModal = () => {
    setJobModal({ open: false, job: null, loading: false, error: null })
    setSelectedApplication(null)
    setVideoUploadState(emptyVideoState)
  }

  const isShortlistedApplication = selectedApplication
    ? (selectedApplication.status || '').toLowerCase() === 'shortlisted'
    : false
  const videoStatusLabel =
    selectedApplication?.videoStatus || (isShortlistedApplication ? 'Video Pending' : null)
  const hasVideoUploaded = selectedApplication?.videoStatus === 'Video Uploaded'
  const activeApplications = applications.filter((app) => {
    const status = (app.status || '').toLowerCase()
    return status !== 'rejected' && status !== 'withdrawn'
  }).length
  const shortlistedApplications = applications.filter((app) =>
    (app.status || '').toLowerCase() === 'shortlisted'
  ).length
  const pendingVideos = applications.filter((app) =>
    (app.videoStatus || '').toLowerCase() === 'video pending'
  ).length
  const summaryCards = [
    { label: 'Total applications', value: applications.length, caption: 'All submitted roles', accent: 'from-sky-500 to-cyan-500', surface: 'bg-sky-50 text-sky-700' },
    { label: 'Active roles', value: activeApplications, caption: 'Still in motion', accent: 'from-indigo-500 to-blue-500', surface: 'bg-indigo-50 text-indigo-700' },
    { label: 'Shortlisted', value: shortlistedApplications, caption: 'Recruiter interest', accent: 'from-emerald-500 to-teal-500', surface: 'bg-emerald-50 text-emerald-700' },
    { label: 'Video pending', value: pendingVideos, caption: 'Needs your action', accent: 'from-amber-500 to-orange-500', surface: 'bg-amber-50 text-amber-700' }
  ]

  return (
    <>
      <Head>
        <title>My Applications - TrueHire</title>
      </Head>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ecfeff_100%)] text-slate-900">
        <div className="relative overflow-hidden border-b border-white/70">
          <div className="pointer-events-none absolute right-[-120px] top-[-100px] h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-130px] left-[-80px] h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
              </svg>
              Back
            </button>
            <div className="rounded-[30px] border border-white/70 bg-white/75 p-6 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                  Applications
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  My applications
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Track every role you applied for, open recruiter updates, and manage next steps from one focused workspace.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={toggleNotifications}
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                    aria-label="Notifications"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.6-2.2a2 2 0 01-.4-1.2V11a6 6 0 10-12 0v2.6c0 .4-.1.8-.4 1.2L4 17h5" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 17a3 3 0 006 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white shadow">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  {showNotifications && (
                    <div className="absolute right-0 z-20 mt-3 w-80 max-w-[85vw] rounded-3xl border border-white/80 bg-white/95 p-4 text-sm text-slate-700 shadow-[0_24px_60px_-25px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Notifications</p>
                          <p className="text-base font-semibold text-slate-900">Your updates</p>
                        </div>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600">
                            {unreadCount} unread
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        {loadingNotifications ? (
                          <p className="text-slate-500">Loading notifications...</p>
                        ) : notificationError ? (
                          <p className="text-rose-500">{notificationError}</p>
                        ) : notifications.length === 0 ? (
                          <p className="text-slate-500">No notifications yet.</p>
                        ) : (
                          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                            {notifications.map(notification => {
                              const isUnread = notification.status === 'unread'
                              const title = notification?.metadata?.title
                              return (
                                <button
                                  key={notification.id}
                                  onClick={() => markNotificationRead(notification.id)}
                                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                    isUnread
                                      ? 'border-indigo-100 bg-indigo-50/70 hover:bg-indigo-50'
                                      : 'border-slate-100 bg-white hover:bg-slate-50'
                                  }`}
                                >
                                  {title && (
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      {title}
                                    </p>
                                  )}
                                  <p className="text-sm font-medium text-slate-900">{notification.message}</p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatNotificationTime(notification.createdAt)}
                                  </p>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => router.push('/jobs')}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                >
                  Browse jobs
                </button>
                <button
                  onClick={() => router.push('/overview')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-cyan-800"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7m7 14l7-7-7-7" />
                  </svg>
                  Dashboard
                </button>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summaryCards.map((card) => (
                <div key={card.label} className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 px-5 py-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.5)] transition hover:-translate-y-1 hover:shadow-[0_22px_55px_-35px_rgba(15,23,42,0.55)]">
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-600">{card.label}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{card.caption}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${card.surface}`}>Live</span>
                  </div>
                  <p className="mt-5 text-4xl font-black tracking-tight text-slate-950">{card.value}</p>
                </div>
              ))}
            </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[28px] border border-white/75 bg-white/80 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-3 border-b border-slate-200/80 bg-white/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-950">Application pipeline</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {applications.length} submitted {applications.length === 1 ? 'application' : 'applications'} with status and next action.
                </p>
              </div>
              <button
                onClick={fetchApplications}
                className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center px-6 py-20">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                  <div
                    className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-slate-500"
                    style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
                  ></div>
                </div>
                <p className="mt-5 text-sm font-medium text-slate-600">Loading applications...</p>
              </div>
            ) : error ? (
              <div className="m-5 rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
                <p className="text-base font-semibold text-red-700">Unable to load applications</p>
                <p className="text-sm text-red-500 max-w-md mx-auto">{error}</p>
                <button
                  onClick={fetchApplications}
                  className="mt-5 inline-flex items-center rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Retry
                </button>
              </div>
            ) : applications.length === 0 ? (
              <div className="px-6 py-20 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l3-3 3 3m-3-3v7m0-14V7" />
                  </svg>
                </div>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">No applications yet</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
                  Once you start applying, every submission will show up right here.
                </p>
                <button
                  onClick={() => router.push('/jobs')}
                  className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50/80 p-4 sm:p-5">
                {applications.map((app) => {
                  const stage = getApplicationStage(app.status)
                  const nextStep = getNextStep(app)
                  const salaryLabel = app.salary || app.salary_min || app.salary_max
                    ? app.salary || `${app.salary_min || '-'} - ${app.salary_max || '-'}`
                    : 'Salary undisclosed'

                  return (
                    <article
                      key={app.id || app.applicationId}
                      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_55px_-38px_rgba(15,23,42,0.55)]"
                    >
                      <div className={`absolute inset-y-0 left-0 w-1.5 ${getApplicationTone(app.status)}`} />
                      <div className="grid gap-5 p-5 pl-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.95fr)_auto] xl:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Application</p>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(app.status)}`}>
                              {app.status || 'Pending'}
                            </span>
                            {app.videoStatus && (
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getVideoStatusColor(app.videoStatus)}`}>
                                {app.videoStatus}
                              </span>
                            )}
                          </div>
                          <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">
                            {app.jobTitle || app.title || 'Role title unavailable'}
                          </h3>
                          <p className="mt-1 text-sm font-medium text-slate-600">{app.company || 'Company not set'}</p>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">{app.location || 'Remote'}</span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">{salaryLabel}</span>
                            <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">Applied {app.appliedDate || 'Recently'}</span>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next step</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{nextStep}</p>
                            </div>
                            <p className="text-xs font-medium text-slate-500">Viewed {formatViewTime(app.viewTimeSeconds)}</p>
                          </div>
                          <div className="mt-4 grid grid-cols-4 gap-2">
                            {['Applied', 'Review', 'Shortlist', 'Offer'].map((label, index) => (
                              <div key={label}>
                                <div className={`h-1.5 rounded-full ${index <= stage ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                                <p className={`mt-2 text-[11px] font-medium ${index <= stage ? 'text-slate-700' : 'text-slate-400'}`}>
                                  {label}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 xl:min-w-[210px] xl:flex-col">
                          <button
                            onClick={() => openJobModal(app)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-cyan-800 xl:w-full"
                          >
                            View details
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleWithdrawApplication(app.id)}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-red-200 hover:text-red-600 xl:w-full"
                          >
                            Withdraw
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {jobModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-[0_35px_90px_rgba(2,6,23,0.35)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Job Details</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">
                  {jobModal.job?.title || 'Role details'}
                </h3>
                <p className="mt-2 text-sm text-slate-500">{jobModal.job?.company || 'Company'}</p>
              </div>
              <button
                onClick={closeJobModal}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Close"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto sm:px-8 sm:py-7">
              {jobModal.loading && <p className="text-sm text-slate-600">Loading job details...</p>}
              {jobModal.error && <p className="text-sm font-medium text-red-600">{jobModal.error}</p>}
              {!jobModal.loading && jobModal.job && (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{jobModal.job.location || 'Remote'}</span>
                    {jobModal.job.employment_type && (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{jobModal.job.employment_type}</span>
                    )}
                    {(jobModal.job.salary_min || jobModal.job.salary_max) && (
                      <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">
                        {jobModal.job.salary_currency || 'USD'} {jobModal.job.salary_min || '-'} - {jobModal.job.salary_max || '-'}
                      </span>
                    )}
                  </div>
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="space-y-5">
                      <section>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Overview</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                          {jobModal.job.description || 'No description available for this role.'}
                        </p>
                      </section>
                      <section>
                        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Requirements</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                          {jobModal.job.requirements || 'No requirements listed for this role.'}
                        </p>
                      </section>
                    </div>
                    <div className="space-y-5">
                      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Benefits</p>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                          {jobModal.job.benefits || 'Benefits not specified for this role.'}
                        </p>
                      </section>
                      <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Overview</p>
                        <div className="mt-3 space-y-2 text-sm text-slate-600">
                          <p><span className="font-semibold text-slate-700">Status:</span> {jobModal.job.status || 'Active'}</p>
                          <p><span className="font-semibold text-slate-700">Location:</span> {jobModal.job.location || 'Remote'}</p>
                          <p><span className="font-semibold text-slate-700">Employment:</span> {jobModal.job.employment_type || 'Not specified'}</p>
                        </div>
                      </section>
                      {isShortlistedApplication && (
                        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">Introduction Video</p>
                            {videoStatusLabel && (
                              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getVideoStatusColor(videoStatusLabel)}`}>
                                {videoStatusLabel}
                              </span>
                            )}
                          </div>
                          <p className="mt-3 text-sm text-slate-600">
                            Upload a short introduction video (30-90 seconds) to help the recruiter know you better.
                          </p>
                          <div className="mt-4 rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-amber-900">
                            <p className="font-semibold">Tell us about yourself</p>
                            <p className="mt-1">
                              Please upload a short introduction video (30-90 seconds) to help the recruiter know you better.
                            </p>
                          </div>
                          <div className="mt-4 text-xs text-slate-500 space-y-1">
                            <p>Allowed formats: MP4, MOV, WebM</p>
                            <p>Max duration: 90 seconds</p>
                            <p>Max size: 100 MB</p>
                            <p>One video per shortlisted application</p>
                          </div>
                          {hasVideoUploaded ? (
                            <p className="mt-4 text-sm font-semibold text-emerald-600">
                              Video uploaded. The recruiter has been notified.
                            </p>
                          ) : (
                            <div className="mt-4 space-y-3">
                              <input
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm"
                                onChange={handleVideoFileChange}
                                className="w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-50"
                              />
                              {videoUploadState.file && (
                                <p className="text-xs text-slate-500">
                                  Selected: {videoUploadState.file.name}
                                  {videoUploadState.durationSeconds
                                    ? ` - ${Math.round(videoUploadState.durationSeconds)}s`
                                    : ''}
                                </p>
                              )}
                              {videoUploadState.error && (
                                <p className="text-xs font-semibold text-rose-600">{videoUploadState.error}</p>
                              )}
                              {videoUploadState.success && (
                                <p className="text-xs font-semibold text-emerald-600">{videoUploadState.success}</p>
                              )}
                              <button
                                type="button"
                                onClick={handleUploadIntroductionVideo}
                                disabled={videoUploadState.uploading || !videoUploadState.file}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {videoUploadState.uploading ? 'Uploading...' : 'Upload Introduction Video'}
                              </button>
                            </div>
                          )}
                        </section>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
              <button
                onClick={() => selectedApplication?.id && router.push(`/messages/${selectedApplication.id}`)}
                disabled={!selectedApplication?.id}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Message Recruiter
              </button>
              <button
                onClick={closeJobModal}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}




