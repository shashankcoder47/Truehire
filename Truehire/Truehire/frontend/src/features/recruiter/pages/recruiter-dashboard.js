import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { motion } from 'framer-motion'
import {
  BadgeCheck,
  Bell,
  Briefcase,
  ClipboardList,
  FileVideo,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Send,
  Settings,
  SmilePlus,
  Sparkles,
  Type,
  Upload,
  Users,
  X
} from 'lucide-react'
import apiService from '../../../utils/api'
import { useAuth } from '../../../context/AuthContext'

const dashboardTabRoutes = {
  '/recruiter-dashboard': 'overview',
  '/manage-jobs': 'jobs',
  '/review-applications': 'applications',
  '/recruiter-chats': 'messages',
  '/sub-recruiters': 'sub-recruiters'
}

const resolveDashboardTabFromPath = (pathname = '') => (
  dashboardTabRoutes[pathname] || 'overview'
)

const navigateToRecruiterPage = (path) => {
  if (typeof window !== 'undefined') {
    window.location.href = path
    return
  }
}

export default function RecruiterDashboard() {
  const [recruiterData, setRecruiterData] = useState(null)
  const [jwtRole, setJwtRole] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [subRecruiters, setSubRecruiters] = useState([])
  const [loadingSubRecruiters, setLoadingSubRecruiters] = useState(false)
  const [showAddSubRecruiter, setShowAddSubRecruiter] = useState(false)
  const [newSubRecruiter, setNewSubRecruiter] = useState({ name: '', email: '', password: '' })
  const [showSubRecruiterPassword, setShowSubRecruiterPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [recruiterNotifications, setRecruiterNotifications] = useState([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [pendingNotificationApplicationId, setPendingNotificationApplicationId] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    employmentType: '',
    postedWithin: ''
  })
  const [filtersApplied, setFiltersApplied] = useState(false)
  const [manageJobsCandidateFilter, setManageJobsCandidateFilter] = useState('ALL')
  const applicationFilterDefaults = {
    search: '',
    status: '',
    jobId: '',
    appliedWithin: '',
    location: ''
  }
  const [applicationFilters, setApplicationFilters] = useState(applicationFilterDefaults)
  const [applicationMatchFilter, setApplicationMatchFilter] = useState('ALL')
  const [showApplicationFilters, setShowApplicationFilters] = useState(false)
  const [recruiterApplications, setRecruiterApplications] = useState([])
  const [loadingApplications, setLoadingApplications] = useState(false)
  const [messageConversations, setMessageConversations] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [messagesUnreadCount, setMessagesUnreadCount] = useState(0)
  const [selectedJob, setSelectedJob] = useState({ open: false, job: null, loading: false, error: null })
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [filteredJobs, setFilteredJobs] = useState([])
  const [recruiterJobs, setRecruiterJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [deletingApplicationId, setDeletingApplicationId] = useState(null)
  const [showShortlistConfirm, setShowShortlistConfirm] = useState(false)
  const [isShortlisting, setIsShortlisting] = useState(false)
  const [shortlistMessage, setShortlistMessage] = useState('')
  const [shortlistError, setShortlistError] = useState('')
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)
  const [recruiterProfile, setRecruiterProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [companyProfile, setCompanyProfile] = useState({
    company_name: '',
    official_email: '',
    website: '',
    industry: '',
    company_size: '',
    location_city: '',
    location_state: '',
    location_country: '',
    short_overview: ''
  })
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [postForm, setPostForm] = useState({ caption: '', media: [] })
  const [postMediaPreviewUrls, setPostMediaPreviewUrls] = useState([])
  const [postSaving, setPostSaving] = useState(false)
  const [postMessage, setPostMessage] = useState('')
  const [postError, setPostError] = useState('')
  const quickPostEmojis = ['💼', '🚀', '🎉', '👏', '📢', '✨', '📍', '🤝']
  const [recruiterPosts, setRecruiterPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [postComments, setPostComments] = useState({})
  const [postCommentsLoadingId, setPostCommentsLoadingId] = useState(null)
  const [expandedPostId, setExpandedPostId] = useState(null)
  const [deletingPostId, setDeletingPostId] = useState(null)
  const [companyCompletion, setCompanyCompletion] = useState(0)
  const [companySaving, setCompanySaving] = useState(false)
  const [companySaveMessage, setCompanySaveMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false)
  const [phoneOtpError, setPhoneOtpError] = useState('')
  const [phoneVerifyMessage, setPhoneVerifyMessage] = useState('')
  const [verificationStatus, setVerificationStatus] = useState('Pending')
  const [verificationDocs, setVerificationDocs] = useState([])
  const [verificationLoading, setVerificationLoading] = useState(false)
  const [verificationError, setVerificationError] = useState('')
  const [verificationUpload, setVerificationUpload] = useState({ docType: '', file: null })
  const [verificationUploading, setVerificationUploading] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()
  const profileMenuRef = useRef(null)
  const notificationsButtonRef = useRef(null)
  const notificationsPanelRef = useRef(null)
  const viewTrackingRef = useRef({ applicationId: null, startTime: null })
  const viewNotifiedApplicationRef = useRef(null)
  const videoRefreshRef = useRef(null)

  const rejectionReasons = [
    'Skills mismatch',
    'Experience level does not meet job requirements',
    'Poor resume quality or formatting issues',
    'Missing required keywords (ATS screening)',
    'Lack of relevant projects or portfolio',
    'Incomplete or low-quality profile',
    'Weak or missing cover letter',
    'Cultural or team fit concerns',
    'Salary, location, or availability mismatch',
    'Position closed or an internal candidate selected'
  ]

  const industryOptions = [
    'IT',
    'Manufacturing',
    'Healthcare',
    'Education',
    'Finance',
    'Retail',
    'Logistics',
    'Construction',
    'Telecom',
    'Consulting',
    'Other'
  ]

  const companySizeOptions = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1001-5000',
    '5000+'
  ]

  const verificationDocOptions = [
    'GST Certificate',
    'CIN',
    'Shop & Establishment Certificate',
    'MSME / Udyam Registration',
    'Incorporation Certificate',
    'Company PAN'
  ]

  const getJwtRole = () => {
    if (typeof window === 'undefined') return null
    const token = apiService.getToken()
    if (!token) return null
    const parts = token.split('.')
    if (parts.length < 2) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    try {
      const payload = JSON.parse(atob(base64))
      return payload?.role || null
    } catch (error) {
      return null
    }
  }

  const splitLocation = (value) => {
    if (!value || typeof value !== 'string') {
      return { city: '', state: '', country: '' }
    }
    const parts = value.split(',').map(part => part.trim()).filter(Boolean)
    return {
      city: parts[0] || '',
      state: parts[1] || '',
      country: parts[2] || ''
    }
  }

  const buildLocationString = (profile) => {
    const parts = [
      profile.location_city || '',
      profile.location_state || '',
      profile.location_country || ''
    ].map(part => String(part || '').trim()).filter(Boolean)
    return parts.join(', ')
  }

  const calculateCompanyCompletion = (profile) => {
    if (!profile) return 0
    const hasLocation = Boolean(
      (profile.location_city && profile.location_city.trim()) ||
      (profile.location_state && profile.location_state.trim()) ||
      (profile.location_country && profile.location_country.trim())
    )
    const fields = [
      profile.company_name,
      profile.official_email,
      profile.website,
      profile.industry,
      profile.company_size,
      hasLocation,
      profile.short_overview
    ]
    const total = fields.length
    const filled = fields.filter(field => {
      if (typeof field === 'boolean') return field
      return Boolean(field && String(field).trim())
    }).length
    return Math.round((filled / total) * 100)
  }

  const buildCompanyProfile = (profile = {}) => {
    const locationParts = splitLocation(profile.headquarters_location)
    const draftCompany = typeof window !== 'undefined'
      ? localStorage.getItem('recruiterCompanyDraft') || ''
      : ''
    return {
      company_name: profile.company_name || draftCompany || profile.company || '',
      official_email: profile.official_email || profile.email || recruiterData?.email || '',
      website: profile.website || '',
      industry: profile.industry || '',
      company_size: profile.company_size || '',
      location_city: locationParts.city,
      location_state: locationParts.state,
      location_country: locationParts.country,
      short_overview: profile.short_overview || profile.detailed_description || ''
    }
  }

  const handleCompanyFieldChange = (field, value) => {
    setCompanyProfile(prev => {
      const next = { ...prev, [field]: value }
      setCompanyCompletion(calculateCompanyCompletion(next))
      return next
    })
    if (companySaveMessage) setCompanySaveMessage('')
  }

  const loadRecruiterProfile = async () => {
    try {
      setProfileLoading(true)
      setProfileError('')
      const response = await apiService.getRecruiterProfile()
      if (response?.error) {
        setProfileError(response.error)
        return
      }
      const profile = response?.recruiter || null
      setRecruiterProfile(profile)
      const hydrated = buildCompanyProfile(profile || {})
      setCompanyProfile(hydrated)
      setCompanyCompletion(calculateCompanyCompletion(hydrated))

      if (typeof window !== 'undefined') {
        const phoneDraft = localStorage.getItem('recruiterPhoneDraft') || ''
        if (profile?.phone_number) {
          setPhoneNumber(profile.phone_number)
        } else if (phoneDraft) {
          setPhoneNumber(phoneDraft)
        }
      }
    } catch (error) {
      console.error('Failed to load recruiter profile', error)
      setProfileError('Failed to load recruiter profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSaveCompanyProfile = async () => {
    try {
      setCompanySaving(true)
      setCompanySaveMessage('')
      const locationString = buildLocationString(companyProfile)
      const payload = {
        company_name: companyProfile.company_name.trim() || null,
        official_email: companyProfile.official_email.trim() || null,
        website: companyProfile.website.trim() || null,
        industry: companyProfile.industry || null,
        company_size: companyProfile.company_size || null,
        headquarters_location: locationString || null,
        short_overview: companyProfile.short_overview.trim() || null,
        detailed_description: companyProfile.short_overview.trim() || null,
        company_profile_complete: calculateCompanyCompletion(companyProfile) === 100
      }

      const response = await apiService.updateCurrentRecruiterProfile(payload)
      if (response?.error) {
        setCompanySaveMessage(response.error || 'Failed to save profile.')
        return
      }

      if (response?.recruiter) {
        setRecruiterProfile(response.recruiter)
      }
      setCompanySaveMessage('Company profile saved successfully.')
    } catch (error) {
      console.error('Save company profile error', error)
      setCompanySaveMessage('Failed to save profile.')
    } finally {
      setCompanySaving(false)
    }
  }

  const loadVerificationStatus = async () => {
    try {
      setVerificationLoading(true)
      setVerificationError('')
      const response = await apiService.getRecruiterVerification()
      if (response?.error) {
        setVerificationError(response.error)
        return
      }
      setVerificationStatus(response?.status || 'Pending')
      setVerificationDocs(response?.documents || [])
    } catch (error) {
      console.error('Verification load error', error)
      setVerificationError('Failed to load verification status.')
    } finally {
      setVerificationLoading(false)
    }
  }

  const fetchMessageConversations = async () => {
    try {
      setMessagesLoading(true)
      setMessagesError('')
      const response = await apiService.request('/messages/conversations', { returnErrorObject: true })
      if (response?.error) {
        throw response
      }
      setMessageConversations(response?.conversations || [])
      setMessagesUnreadCount(response?.totalUnread || 0)
    } catch (error) {
      console.error('Failed to load message conversations:', error)
      setMessagesError(error?.message || error?.error || 'Failed to load messages.')
    } finally {
      setMessagesLoading(false)
    }
  }

  const formatNotificationTime = (value) => {
    if (!value) return 'Just now'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Just now'
    const diffMs = Date.now() - date.getTime()
    if (diffMs < 60000) return 'Just now'
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    if (diffMinutes < 60) return `${diffMinutes} min${diffMinutes === 1 ? '' : 's'} ago`
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'VIDEO_UPLOADED':
        return '??'
      case 'SHORTLISTED':
        return '?'
      default:
        return '??'
    }
  }

  const fetchRecruiterNotifications = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setNotificationsLoading(true)
        setNotificationsError('')
      }
      const response = await apiService.getRecruiterNotifications()
      if (response?.error) {
        if (!silent) {
          setNotificationsError(response.error || 'Failed to load notifications.')
        }
        return
      }
      setRecruiterNotifications(response?.notifications || [])
      setUnreadNotificationsCount(response?.unreadCount || 0)
    } catch (error) {
      console.error('Failed to load recruiter notifications:', error)
      if (!silent) {
        setNotificationsError('Failed to load notifications.')
      }
    } finally {
      if (!silent) {
        setNotificationsLoading(false)
      }
    }
  }

  const markRecruiterNotificationRead = async (notificationId) => {
    if (!notificationId) return
    setRecruiterNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    )
    setUnreadNotificationsCount((prev) => Math.max(prev - 1, 0))

    try {
      const response = await apiService.markRecruiterNotificationRead(notificationId)
      if (response?.error) {
        setNotificationsError(response.error || 'Failed to update notification.')
        await fetchRecruiterNotifications({ silent: true })
        return
      }
      if (typeof response?.unreadCount === 'number') {
        setUnreadNotificationsCount(response.unreadCount)
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
      await fetchRecruiterNotifications({ silent: true })
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification) return
    if (!notification.isRead) {
      await markRecruiterNotificationRead(notification.id)
    }
    setNotificationsOpen(false)
    setActiveTab('applications')
    const applicationId = notification.applicationId
    if (!applicationId) return
    const existing = recruiterApplications.find(
      (application) => String(application.applicationId) === String(applicationId)
    )
    if (existing) {
      setSelectedApplication(existing)
      return
    }
    setPendingNotificationApplicationId(applicationId)
    await fetchRecruiterApplications()
  }

  const handleSendPhoneOtp = async () => {
    const phone = String(phoneNumber || '').trim()
    if (!phone) {
      setPhoneOtpError('Please enter a phone number.')
      return
    }
    if (!/^[0-9+()\\-\\s]{8,20}$/.test(phone)) {
      setPhoneOtpError('Invalid phone number format.')
      return
    }
    try {
      setPhoneOtpLoading(true)
      setPhoneOtpError('')
      setPhoneVerifyMessage('')
      const response = await apiService.sendRecruiterPhoneOtp(phone)
      if (response?.error) {
        setPhoneOtpError(response.error)
        return
      }
      setPhoneOtpSent(true)
      setPhoneVerifyMessage('OTP sent to your registered email.')
    } catch (error) {
      console.error('Send phone OTP error', error)
      setPhoneOtpError('Failed to send OTP.')
    } finally {
      setPhoneOtpLoading(false)
    }
  }

  const handleVerifyPhoneOtp = async () => {
    const phone = String(phoneNumber || '').trim()
    const otp = String(phoneOtp || '').trim()
    if (!phone || !otp) {
      setPhoneOtpError('Phone number and OTP are required.')
      return
    }
    try {
      setPhoneOtpLoading(true)
      setPhoneOtpError('')
      const response = await apiService.verifyRecruiterPhoneOtp(phone, otp)
      if (response?.error) {
        setPhoneOtpError(response.error)
        return
      }
      setPhoneVerifyMessage('Phone verified successfully.')
      setPhoneOtp('')
      setPhoneOtpSent(false)
      if (response?.recruiter) {
        setRecruiterProfile(response.recruiter)
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('recruiterPhoneDraft')
      }
    } catch (error) {
      console.error('Verify phone OTP error', error)
      setPhoneOtpError('Failed to verify OTP.')
    } finally {
      setPhoneOtpLoading(false)
    }
  }

  const handleVerificationUpload = async () => {
    if (!verificationUpload.docType) {
      setVerificationError('Please select a document type.')
      return
    }
    if (!verificationUpload.file) {
      setVerificationError('Please choose a file to upload.')
      return
    }
    try {
      setVerificationUploading(true)
      setVerificationError('')
      const form = new FormData()
      form.append('doc_type', verificationUpload.docType)
      form.append('document', verificationUpload.file)
      const response = await apiService.uploadRecruiterVerificationDoc(form)
      if (response?.error) {
        setVerificationError(response.error)
        return
      }
      setVerificationUpload({ docType: '', file: null })
      await loadVerificationStatus()
    } catch (error) {
      console.error('Upload verification document error', error)
      setVerificationError('Failed to upload document.')
    } finally {
      setVerificationUploading(false)
    }
  }

  useEffect(() => {
    // Check if recruiter is logged in using token from OTP verification
    const token = apiService.getToken()
    const user = apiService.getUserData()

    if (!token || !user) {
      router.push('/login')
      return
    }

    try {
      const normalizedRole = String(user.role || '').toLowerCase().replace(/_/g, '-')
      if (normalizedRole !== 'recruiter' && normalizedRole !== 'sub-recruiter') {
        router.push('/login')
        return
      }
      setRecruiterData({ ...user, role: normalizedRole })
      setJwtRole(getJwtRole())
    } catch (error) {
      console.error('Error loading recruiter data:', error)
      router.push('/login')
      return
    }
  }, [router])

  useEffect(() => {
    if (!router.isReady) return

    const nextTab = resolveDashboardTabFromPath(router.pathname)
    const isSubRecruiterRoute =
      recruiterData?.role === 'sub-recruiter' || jwtRole === 'sub_recruiter'

    setActiveTab(nextTab)

    if (nextTab === 'sub-recruiters') {
      setShowAddSubRecruiter(router.query.openAdd === '1' && !isSubRecruiterRoute)
      return
    }

    setShowAddSubRecruiter(false)
  }, [router.isReady, router.pathname, router.query.openAdd, recruiterData?.role, jwtRole])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleClickOutside = (event) => {
      const target = event.target
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false)
      }
      if (
        notificationsPanelRef.current &&
        notificationsButtonRef.current &&
        !notificationsPanelRef.current.contains(target) &&
        !notificationsButtonRef.current.contains(target)
      ) {
        setNotificationsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (recruiterData) {
      fetchSubRecruiters()
      fetchRecruiterJobs()
      fetchRecruiterApplications()
      loadRecruiterProfile()
      loadVerificationStatus()
      loadRecruiterPosts()
    }
  }, [recruiterData])

  useEffect(() => {
    if (!postForm.media.length) {
      setPostMediaPreviewUrls([])
      return undefined
    }

    const previewUrls = postForm.media.map((file) => URL.createObjectURL(file))
    setPostMediaPreviewUrls(previewUrls)
    return () => previewUrls.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
  }, [postForm.media])

  useEffect(() => {
    if (!recruiterData) return
    if (activeTab === 'messages') {
      fetchMessageConversations()
    }
  }, [recruiterData, activeTab])

  useEffect(() => {
    if (!recruiterData || activeTab !== 'jobs') return undefined

    // Keep "My Jobs" metrics (including views_count) fresh while tab is open.
    const refreshJobs = () => {
      fetchRecruiterJobs()
    }

    const interval = setInterval(refreshJobs, 60000)
    window.addEventListener('focus', refreshJobs)

    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', refreshJobs)
    }
  }, [recruiterData, activeTab])

  useEffect(() => {
    if (!recruiterData) return undefined
    fetchRecruiterNotifications()
    const interval = setInterval(() => {
      fetchRecruiterNotifications({ silent: true })
    }, 30000)
    return () => clearInterval(interval)
  }, [recruiterData])

  useEffect(() => {
    if (!router.isReady || router.pathname !== '/review-applications') return
    const applicationId = Array.isArray(router.query.applicationId)
      ? router.query.applicationId[0]
      : router.query.applicationId

    if (applicationId) {
      setApplicationMatchFilter('ALL')
      setPendingNotificationApplicationId(applicationId)
    }
  }, [router.isReady, router.pathname, router.query.applicationId])

  useEffect(() => {
    if (!pendingNotificationApplicationId) return
    const match = recruiterApplications.find(
      (application) => String(application.applicationId) === String(pendingNotificationApplicationId)
    )
    if (match) {
      setSelectedApplication(match)
      setPendingNotificationApplicationId(null)
    }
  }, [pendingNotificationApplicationId, recruiterApplications])

  useEffect(() => {
    if (!selectedApplication || recruiterApplications.length === 0) return
    const match = recruiterApplications.find(
      (application) => String(application.applicationId) === String(selectedApplication.applicationId)
    )
    if (!match) return
    const nextVideo = match.intro_video_url || match.introVideoUrl
    const prevVideo = selectedApplication.intro_video_url || selectedApplication.introVideoUrl
    if (nextVideo && !prevVideo) {
      setSelectedApplication((prev) => ({ ...prev, ...match }))
    }
  }, [selectedApplication, recruiterApplications])

  // If applications are empty but jobs are loaded, attempt a retry using the loaded jobs list
  useEffect(() => {
    if (recruiterData && recruiterJobs.length > 0 && recruiterApplications.length === 0 && !loadingApplications) {
      fetchRecruiterApplications(recruiterJobs)
    }
  }, [recruiterData, recruiterJobs, recruiterApplications.length])

  useEffect(() => {
    if (!selectedApplication) {
      videoRefreshRef.current = null
      setShowShortlistConfirm(false)
      setShortlistMessage('')
      setShortlistError('')
      setShowRejectConfirm(false)
      setRejectReason('')
      setRejectError('')
    }
  }, [selectedApplication])

  const getAuthToken = () => {
    if (typeof window === 'undefined') return null
    const token = apiService.getToken()
    return token || null
  }

  const recordViewTime = async (applicationId, durationMs) => {
    const token = getAuthToken()
    if (!token) return
    const durationSeconds = Math.floor(durationMs / 1000)
    if (!durationSeconds) return

    try {
      await apiService.request(`/recruiters/applications/${applicationId}/record-view-time`, {
        method: 'POST',
        body: JSON.stringify({ seconds: durationSeconds }),
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Failed to record application view time', error)
    }
  }

  const recordApplicationView = async (applicationId) => {
    const token = getAuthToken()
    if (!token || !applicationId) return

    try {
      await apiService.request(`/recruiters/applications/${applicationId}/record-view`, {
        method: 'POST',
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Failed to record application view', error)
    }
  }

  const startViewTracking = () => {
    if (typeof document === 'undefined') return
    const tracker = viewTrackingRef.current
    if (!tracker.applicationId || tracker.startTime) return
    if (document.visibilityState !== 'visible') return
    tracker.startTime = Date.now()
  }

  const stopViewTracking = () => {
    const tracker = viewTrackingRef.current
    if (!tracker.applicationId || !tracker.startTime) return
    const elapsedMs = Date.now() - tracker.startTime
    tracker.startTime = null
    if (elapsedMs < 1000) return
    recordViewTime(tracker.applicationId, elapsedMs)
  }

  useEffect(() => {
    const applicationId = selectedApplication?.applicationId || selectedApplication?.id || null
    const tracker = viewTrackingRef.current

    if (tracker.applicationId && tracker.applicationId !== applicationId) {
      stopViewTracking()
    }

    tracker.applicationId = applicationId

    if (applicationId) {
      if (viewNotifiedApplicationRef.current !== applicationId) {
        viewNotifiedApplicationRef.current = applicationId
        recordApplicationView(applicationId)
      }
      startViewTracking()
    } else {
      viewNotifiedApplicationRef.current = null
    }
  }, [selectedApplication])

  useEffect(() => {
    if (!selectedApplication) return
    const applicationId = selectedApplication?.applicationId || selectedApplication?.id || null
    if (!applicationId || loadingApplications) return
    const hasVideo = Boolean(
      selectedApplication.intro_video_url || selectedApplication.introVideoUrl
    )
    if (hasVideo) return
    if (videoRefreshRef.current === applicationId) return
    videoRefreshRef.current = applicationId
    fetchRecruiterApplications()
  }, [selectedApplication, loadingApplications])

  useEffect(() => {
    if (typeof document === 'undefined') return
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        stopViewTracking()
      } else {
        startViewTracking()
      }
    }
    const handlePageHide = () => stopViewTracking()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handlePageHide)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handlePageHide)
      stopViewTracking()
    }
  }, [])

  const normalizeApplication = (app = {}) => {
    const jobId = app.jobId ?? app.job_id ?? app.job?.id ?? null
    const appliedAt = app.appliedAt || app.applied_at || app.detailedAppliedAt || app.applied || app.created_at || null
    const status = app.status || app.application_status || 'Applied'
    const jobTitle = app.jobTitle || app.job_title || app.job?.title || app.title || 'Job'
    const jobCompany = app.jobCompany || app.job_company || app.company || app.job?.company || 'Company'
    const jobLocation = app.jobLocation || app.job_location || app.job?.location || app.location || null
    const candidateName = app.candidateName || app.name || app.detailedName || 'Candidate'
    const candidateEmail = app.candidateEmail || app.email || app.detailedEmail || ''
    const location = app.location || app.applicantLocation || jobLocation || null

    return {
      ...app,
      applicationId: app.applicationId || app.id || `${jobId || 'job'}-${app.userId || app.user_id || candidateEmail || Date.now()}`,
      jobId,
      userId: app.userId || app.user_id || null,
      status,
      appliedAt,
      candidateName,
      candidateEmail,
      jobTitle,
      jobCompany,
      jobLocation,
      location,
      phone: app.phone || null,
      experience_level: app.experience_level || app.experienceLevel || null,
      current_salary: app.current_salary || app.currentSalary || null,
      expected_salary: app.expected_salary || app.expectedSalary || null,
      notice_period: app.notice_period || app.noticePeriod || null,
      additional_comments: app.additional_comments || app.additionalComments || app.notes || null,
      resume_path: app.resume_path || app.resumePath || null,
      match_score: app.match_score ?? app.matchScore ?? null,
      matchScore: app.matchScore ?? app.match_score ?? null,
      matched_skills: Array.isArray(app.matched_skills) ? app.matched_skills : (Array.isArray(app.matchedSkills) ? app.matchedSkills : []),
      matchedSkills: Array.isArray(app.matchedSkills) ? app.matchedSkills : (Array.isArray(app.matched_skills) ? app.matched_skills : []),
      missing_skills: Array.isArray(app.missing_skills) ? app.missing_skills : (Array.isArray(app.missingSkills) ? app.missingSkills : []),
      missingSkills: Array.isArray(app.missingSkills) ? app.missingSkills : (Array.isArray(app.missing_skills) ? app.missing_skills : []),
      match_status: app.match_status || app.matchStatus || 'MATCHED',
      matchStatus: app.matchStatus || app.match_status || 'MATCHED',
      intro_video_url: app.intro_video_url || app.introVideoUrl || null,
      intro_video_duration_seconds: app.intro_video_duration_seconds || app.introVideoDurationSeconds || null,
      intro_video_uploaded_at: app.intro_video_uploaded_at || app.introVideoUploadedAt || null
    }
  }

  const normalizeApplications = (apps = []) => apps.map(normalizeApplication)

  const fetchSubRecruiters = async () => {
    try {
      setLoadingSubRecruiters(true)
      const token = getAuthToken()
      if (!token) {
        setLoadingSubRecruiters(false)
        router.push('/login')
        return
      }
      const recruiterId = recruiterData.role === 'sub-recruiter' ? recruiterData.mainRecruiterId : recruiterData.id
      const data = await apiService.request(`/recruiters/${recruiterId}/sub-recruiters`, {
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data && data.sub_recruiters) {
        setSubRecruiters(data.sub_recruiters)
      } else {
        console.warn('Sub-recruiters response missing list', data)
        setSubRecruiters([])
      }
    } catch (error) {
      console.error('Error fetching sub-recruiters:', error)
      setSubRecruiters([])
    } finally {
      setLoadingSubRecruiters(false)
    }
  }

  const handleAddSubRecruiter = async (e) => {
    e.preventDefault()
    if (subRecruiters.length >= 3) {
      alert('You have reached the limit of 3 sub-recruiters.')
      return
    }
    setLoading(true)

    try {
      // For sub-recruiters, they cannot add other sub-recruiters
      if (recruiterData.role === 'sub-recruiter') {
        alert('Sub-recruiters cannot add other sub-recruiters')
        return
      }

      const token = getAuthToken()
      if (!token) {
        alert('Please log in again to add a sub-recruiter.')
        router.push('/login')
        return
      }

      const response = await apiService.request('/recruiters/sub-recruiters', {
        method: 'POST',
        body: JSON.stringify(newSubRecruiter),
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response && response.message && !response.error) {
        setNewSubRecruiter({ name: '', email: '', password: '' })
        setShowAddSubRecruiter(false)
        fetchSubRecruiters()
      } else {
        const msg = response?.message || response?.error || response?.details?.message || 'Failed to add sub-recruiter'
        alert(msg)
      }
    } catch (error) {
      console.error('Error adding sub-recruiter:', error)
      alert(error.message || 'Failed to add sub-recruiter')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSubRecruiter = async (subRecruiterId) => {
    if (!confirm('Are you sure you want to remove this sub-recruiter?')) return

    try {
      const token = getAuthToken()
      if (!token) {
        alert('Please log in again to manage sub-recruiters.')
        router.push('/login')
        return
      }

      const response = await apiService.request(`/recruiters/${recruiterData.id}/sub-recruiters/${subRecruiterId}`, {
        method: 'DELETE',
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })

      if (response && !response.error) {
        fetchSubRecruiters()
      } else {
        alert(response?.message || response?.error || response?.details?.message || 'Failed to remove sub-recruiter')
      }
    } catch (error) {
      console.error('Error removing sub-recruiter:', error)
      alert(error.message || 'Failed to remove sub-recruiter')
    }
  }

  const handleLogout = () => {
    logout()
    setRecruiterData(null)
    setProfileMenuOpen(false)
    setNotificationsOpen(false)
    router.replace('/login')
  }

  const isJobExpired = (job) => {
    const status = String(job?.status || '').toLowerCase()
    if (status === 'expired') return true
    if (!job?.application_deadline) return false

    const deadline = new Date(job.application_deadline)
    if (Number.isNaN(deadline.getTime())) return false

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
    return deadlineDate < todayStart
  }

  const fetchRecruiterJobs = async () => {
    try {
      setLoadingJobs(true)
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const recruiterJobEndpoints = ['/jobs/recruiter/my-jobs', '/recruiter/jobs']
      let data = null

      for (const endpoint of recruiterJobEndpoints) {
        const response = await apiService.request(endpoint, {
          returnErrorObject: true,
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response?.error) {
          data = response
          break
        }
      }

      if (data && data.jobs) {
        const jobs = data.jobs || []
        const visibleJobs = jobs.filter((job) => !isJobExpired(job))
        setRecruiterJobs(visibleJobs)
        // Kick off applications fetch once jobs are known
        fetchRecruiterApplications(visibleJobs, { skipRetry: true })
      } else {
        console.warn('Recruiter jobs response missing jobs field', data)
        setRecruiterJobs([])
      }
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error)
      setRecruiterJobs([])
    } finally {
      setLoadingJobs(false)
    }
  }

  const fetchApplicationsFromJobs = async (jobsList = []) => {
    const apps = []
    for (const job of jobsList) {
      try {
        const token = getAuthToken()
        if (!token) break
        const res = await apiService.request(`/jobs/${job.id}/applications`, {
      returnErrorObject: true,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res && res.job && Array.isArray(res.job.applications)) {
      res.job.applications.forEach(app => {
        apps.push(normalizeApplication({
          ...app,
          jobId: job.id,
          jobTitle: job.title,
          jobCompany: job.company,
          jobLocation: job.location
        }))
      })
    }
  } catch (err) {
    // swallow per-job errors to keep the loop going
  }
    }
    return apps
  }

  const fetchRecruiterApplications = async (jobsOverride = null, opts = {}) => {
    const { skipRetry = false } = opts
    if (loadingApplications) return // avoid overlapping flicker
    try {
      setLoadingApplications(true)
      const token = getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const data = await apiService.request('/recruiters/applications', {
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data && data.applications && Array.isArray(data.applications) && data.applications.length > 0) {
        setRecruiterApplications(normalizeApplications(data.applications))
        return
      }

      // Fallback: fetch per-job applications if aggregate endpoint is empty or failed
      const jobsList = jobsOverride && jobsOverride.length
        ? jobsOverride
        : (
          recruiterJobs.length
            ? recruiterJobs
            : (
                (await apiService.request('/jobs/recruiter/my-jobs', {
                  returnErrorObject: true,
                  headers: { Authorization: `Bearer ${token}` }
                }))?.jobs ||
                (await apiService.request('/recruiter/jobs', {
                  returnErrorObject: true,
                  headers: { Authorization: `Bearer ${token}` }
                }))?.jobs ||
                []
              )
        )
      const fallbackApps = await fetchApplicationsFromJobs(jobsList)
      setRecruiterApplications(normalizeApplications(fallbackApps || []))

      // one soft retry if still empty
      if (!skipRetry && (!fallbackApps || fallbackApps.length === 0)) {
        setTimeout(() => fetchRecruiterApplications(jobsList, { skipRetry: true }), 200)
      }
    } catch (error) {
      console.error('Error fetching recruiter applications:', error)
      setRecruiterApplications([])
    } finally {
      setLoadingApplications(false)
    }
  }

  // Filter functions
  const applyFilters = () => {
    const normalized = recruiterJobs.map(normalizeJob)
    const now = new Date()
    const filtered = normalized.filter(job => {
      const searchField = `${job.title} ${job.role} ${job.location}`.toLowerCase()
      const matchesSearch = !filters.search || searchField.includes(filters.search.toLowerCase())
      const matchesStatus = !filters.status || job.status.toLowerCase() === filters.status.toLowerCase()
      const matchesType = !filters.employmentType || (job.employment_type || job.modeOfWork || '').toLowerCase() === filters.employmentType.toLowerCase()

      let matchesPosted = true
      if (filters.postedWithin === '7') {
        matchesPosted = (now - new Date(job.created_at || job.posted)) <= 7 * 24 * 60 * 60 * 1000
      } else if (filters.postedWithin === '30') {
        matchesPosted = (now - new Date(job.created_at || job.posted)) <= 30 * 24 * 60 * 60 * 1000
      }

      return matchesSearch && matchesStatus && matchesType && matchesPosted
    })
    setFilteredJobs(filtered)
    setFiltersApplied(true)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      employmentType: '',
      postedWithin: ''
    })
    setManageJobsCandidateFilter('ALL')
    setFilteredJobs([])
    setFiltersApplied(false)
  }

  const clearApplicationFilters = () => {
    setApplicationFilters(applicationFilterDefaults)
    setApplicationMatchFilter('ALL')
  }

  const formatPostedDate = (dateString, fallback = 'recently') => {
    if (!dateString) return fallback
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return fallback

    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const formatDateTime = (value) => {
    if (!value) return 'Not available'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Not available'
    return date.toLocaleString()
  }

  const displayValue = (value, fallback = 'Not provided') => {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string' && value.trim() === '') return fallback
    return value
  }

  const buildFileUrl = (path) => {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    const raw = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '')
    const base = raw.endsWith('/api') ? raw.replace(/\/api$/, '') : raw
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
  }

  const phoneVerified = Boolean(recruiterProfile?.phone_verified)
  const verificationBadgeClasses = verificationStatus === 'Verified'
    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40'
    : verificationStatus === 'Rejected'
      ? 'bg-rose-500/15 text-rose-700 ring-1 ring-rose-400/40'
      : 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40'
  const verificationCopy = verificationStatus === 'Verified'
    ? 'Your business verification is approved. You can post public jobs.'
    : verificationStatus === 'Rejected'
      ? 'Verification was rejected. Upload a clearer document or contact support.'
      : 'Verification is pending. Upload at least one document to start review.'
  const postPreviewMediaItems = postMediaPreviewUrls.map((previewUrl, index) => ({
    url: previewUrl,
    type: postForm.media[index]?.type?.startsWith('video/') ? 'video' : 'image',
    name: postForm.media[index]?.name || `Media ${index + 1}`
  }))
  const composerCompanyName = companyProfile.company_name || recruiterData?.company_name || recruiterData?.company || 'Company'
  const composerIndustry = companyProfile.industry || 'Industry not specified'
  const composerInitial = String(composerCompanyName || 'C').slice(0, 1).toUpperCase()

  const handleResumeDownload = async (application) => {
    const applicationId = application?.applicationId || application?.id
    if (!applicationId) return
    const token = getAuthToken()
    if (!token) return

    try {
      await apiService.request(`/recruiters/applications/${applicationId}/record-resume-download`, {
        method: 'POST',
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })
    } catch (error) {
      console.error('Failed to record resume download', error)
    }
  }

  const openJobDetailsPage = (jobId) => {
    if (!jobId) return
    router.push(`/recruiter/jobs/${jobId}`)
  }

  const handleDeleteApplication = async (application) => {
    if (!application?.applicationId) {
      alert('Unable to delete: missing application id.')
      return
    }
    const confirmDelete = window.confirm('Delete this application? This cannot be undone.')
    if (!confirmDelete) return

    const token = getAuthToken()
    if (!token) {
      alert('Please log in again to delete applications.')
      router.push('/login')
      return
    }

    try {
      setDeletingApplicationId(application.applicationId)
      const res = await apiService.request(`/recruiters/applications/${application.applicationId}`, {
        method: 'DELETE',
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res?.success === false || res?.error) {
        throw new Error(res?.message || res?.error || 'Failed to delete application')
      }

      setRecruiterApplications(prev => prev.filter(app =>
        (app.applicationId || app.id) !== application.applicationId
      ))
      setSelectedApplication(null)
    } catch (err) {
      alert(err?.message || 'Failed to delete application. Please try again.')
    } finally {
      setDeletingApplicationId(null)
    }
  }

  const handleShortlistConfirm = async () => {
    if (!selectedApplication) return
    const applicationId = selectedApplication.applicationId || selectedApplication.id
    if (!applicationId) {
      setShortlistError('Unable to identify application ID to shortlist.')
      return
    }

    const token = getAuthToken()
    if (!token) {
      alert('Please log in again to shortlist applications.')
      router.push('/login')
      return
    }

    setIsShortlisting(true)
    setShortlistError('')
    setShortlistMessage('')

    try {
      const res = await apiService.shortlistApplication(applicationId)
      const updatedStatus = res?.status || 'shortlisted'
      const message = res?.emailSent
        ? 'Candidate shortlisted successfully. Shortlisted email sent successfully.'
        : (res?.message || 'Candidate shortlisted successfully.')

      setShortlistMessage(message)
      setSelectedApplication((prev) =>
        prev ? { ...prev, status: updatedStatus } : prev
      )
      setRecruiterApplications((prev) =>
        prev.map((app) => {
          const id = app.applicationId || app.id
          if (id && String(id) === String(applicationId)) {
            return { ...app, status: updatedStatus }
          }
          return app
        })
      )
      setShowShortlistConfirm(false)
    } catch (error) {
      setShortlistError(error?.message || 'Failed to shortlist applicant. Please try again.')
    } finally {
      setIsShortlisting(false)
    }
  }

  const handleRejectConfirm = async () => {
    if (!selectedApplication) return
    const applicationId = selectedApplication.applicationId || selectedApplication.id
    if (!applicationId) {
      setRejectError('Unable to identify application ID to reject.')
      return
    }
    if (!rejectReason) {
      setRejectError('Please select a rejection reason.')
      return
    }

    const token = getAuthToken()
    if (!token) {
      alert('Please log in again to reject applications.')
      router.push('/login')
      return
    }

    setIsRejecting(true)
    setRejectError('')

    try {
      const res = await apiService.request(`/recruiters/applications/${applicationId}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ reason: rejectReason }),
        returnErrorObject: true,
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res?.error) {
        throw new Error(res.message || res.error || 'Failed to reject application')
      }

      setSelectedApplication((prev) =>
        prev ? { ...prev, status: 'Rejected', rejection_reason: rejectReason } : prev
      )
      setRecruiterApplications((prev) =>
        prev.map((app) => {
          const id = app.applicationId || app.id
          if (id && String(id) === String(applicationId)) {
            return { ...app, status: 'Rejected', rejection_reason: rejectReason }
          }
          return app
        })
      )
      setShowRejectConfirm(false)
    } catch (error) {
      setRejectError(error?.message || 'Failed to reject applicant. Please try again.')
    } finally {
      setIsRejecting(false)
    }
  }

  const handleDeleteJob = async (jobId) => {
    if (!jobId) return
    const confirmDelete = window.confirm('Are you sure you want to delete this job? This cannot be undone.')
    if (!confirmDelete) return
    try {
      const res = await apiService.request(`/jobs/${jobId}`, {
        method: 'DELETE',
        returnErrorObject: true
      })
      if (res?.error) {
        throw new Error(res?.details?.message || res?.error || 'Failed to delete job.')
      }
      setRecruiterJobs(prev => prev.filter(j => j.id !== jobId))
      setFilteredJobs(prev => prev.filter(j => j.id !== jobId))
      setSelectedJob({ open: false, job: null, loading: false, error: null })
    } catch (err) {
      alert(err?.message || 'Failed to delete job. Please try again.')
    }
  }

  const goToManagePosts = () => {
    if (typeof window !== 'undefined') {
      window.location.assign('/manage-posts')
      return
    }
    router.push('/manage-posts')
  }

  const loadRecruiterPosts = async () => {
    setPostsLoading(true)
    setPostsError('')
    try {
      const response = await apiService.request('/recruiter/posts', {
        returnErrorObject: true
      })
      if (response?.error) {
        throw new Error(response.message || response.error || 'Unable to load posts.')
      }
      setRecruiterPosts(Array.isArray(response.posts) ? response.posts : [])
    } catch (error) {
      setPostsError(error?.message || 'Unable to load recruiter posts.')
    } finally {
      setPostsLoading(false)
    }
  }

  const loadPostComments = async (postId) => {
    setPostCommentsLoadingId(postId)
    try {
      const response = await apiService.request(`/posts/${postId}/comments`, {
        returnErrorObject: true
      })
      if (response?.error) {
        throw new Error(response.message || response.error || 'Unable to load comments.')
      }
      setPostComments((current) => ({
        ...current,
        [postId]: Array.isArray(response.comments) ? response.comments : []
      }))
    } catch (error) {
      setPostComments((current) => ({
        ...current,
        [postId]: [{ id: `error-${postId}`, comment: error?.message || 'Unable to load comments.', user_name: 'TrueHire' }]
      }))
    } finally {
      setPostCommentsLoadingId(null)
    }
  }

  const handleTogglePostComments = (postId) => {
    setExpandedPostId((current) => {
      if (current === postId) return null
      if (!postComments[postId]) {
        loadPostComments(postId)
      }
      return postId
    })
  }

  const handleDeleteRecruiterPost = async (postId) => {
    if (!postId) return
    const confirmed = window.confirm('Delete this post from the user feed? This cannot be undone.')
    if (!confirmed) return

    setDeletingPostId(postId)
    try {
      const response = await apiService.request(`/recruiter/posts/${postId}`, {
        method: 'DELETE',
        returnErrorObject: true
      })
      if (response?.error) {
        throw new Error(response.message || response.error || 'Unable to delete post.')
      }
      setRecruiterPosts((current) => current.filter((post) => String(post.id) !== String(postId)))
      setPostComments((current) => {
        const next = { ...current }
        delete next[postId]
        return next
      })
      setExpandedPostId((current) => (current === postId ? null : current))
    } catch (error) {
      alert(error?.message || 'Unable to delete post. Please try again.')
    } finally {
      setDeletingPostId(null)
    }
  }

  const handlePostMediaChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) {
      event.target.value = ''
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
    const unsupportedFile = files.find((file) => !allowedTypes.includes(file.type))
    if (unsupportedFile) {
      setPostError('Upload JPG, PNG, WEBP, GIF, MP4, WEBM, or MOV files only.')
      event.target.value = ''
      return
    }

    setPostForm((prev) => {
      const nextFiles = [...prev.media]
      files.forEach((file) => {
        const alreadySelected = nextFiles.some((item) => (
          item.name === file.name &&
          item.size === file.size &&
          item.lastModified === file.lastModified
        ))
        if (!alreadySelected && nextFiles.length < 15) {
          nextFiles.push(file)
        }
      })

      if (nextFiles.length === prev.media.length && files.length) {
        setPostError('Those files are already selected.')
      } else if (prev.media.length + files.length > 15) {
        setPostError('Only the first 15 images or videos were selected.')
      } else {
        setPostError('')
      }

      return { ...prev, media: nextFiles }
    })
    event.target.value = ''
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    setPostError('')
    setPostMessage('')

    const caption = postForm.caption.trim()

    if (!caption && !postForm.media.length) {
      setPostError('Add a caption, image, or video before publishing.')
      return
    }

    const formData = new FormData()
    formData.append('caption', caption)
    postForm.media.forEach((file) => formData.append('media', file))

    setPostSaving(true)
    try {
      const response = await apiService.request('/recruiter/posts', {
        method: 'POST',
        body: formData,
        returnErrorObject: true
      })

      if (response?.error) {
        throw new Error(response.message || response.error || 'Unable to publish post.')
      }

      setPostForm({ caption: '', media: [] })
      setPostMediaPreviewUrls([])
      setPostMessage('Post published to the user feed.')
      await loadRecruiterPosts()
      window.setTimeout(() => {
        setShowCreatePost(false)
        setPostMessage('')
      }, 900)
    } catch (error) {
      setPostError(error?.message || 'Unable to publish post. Please try again.')
    } finally {
      setPostSaving(false)
    }
  }

  const addEmojiToPostCaption = (emoji) => {
    setPostForm((current) => ({
      ...current,
      caption: `${current.caption}${emoji}`
    }))
  }

  const normalizeJob = (job) => {
    const title = job?.title || 'Job'
    return {
      ...job,
      title,
      role: job?.role || job?.skills_required || job?.employment_type || 'Role not set',
      location: job?.location || 'Not specified',
      experience: job?.experience_level || job?.experience || 'Not specified',
      modeOfWork: job?.modeOfWork || job?.employment_type || 'Not specified',
      applicants: job?.applications_count ?? job?.applicants ?? 0,
      views_count: Number(job?.views_count ?? job?.view_count ?? 0),
      posted: formatPostedDate(job?.created_at || job?.posted),
      status: job?.status || 'Active',
      titleInitial: title.charAt(0).toUpperCase()
    }
  }

  const renderSelectedApplicationModal = () => {
    if (!selectedApplication) return null
    const introVideoUrl = selectedApplication.intro_video_url
      ? buildFileUrl(selectedApplication.intro_video_url)
      : null
    const introVideoUploadedAt = selectedApplication.intro_video_uploaded_at
    const videoStatusLabel = introVideoUrl ? '? Video Uploaded' : '? Video Pending'
    const videoStatusClass = introVideoUrl
      ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40'
      : 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40'
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
        <div className="w-full max-w-4xl relative rounded-[32px] bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.35)] border border-white/70 overflow-hidden">
          <div className="relative rounded-[32px] bg-white/80 p-6 md:p-8 border border-white/70 shadow-[0_10px_30px_rgba(15,23,42,0.18)] max-h-[90vh] overflow-y-auto">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-slate-600 transition"
              onClick={() => setSelectedApplication(null)}
              aria-label="Close"
            >
              X
            </button>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-indigo-600 font-semibold mb-2">Application</p>
                <h3 className="text-3xl font-semibold text-slate-900">Applicant Details</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedApplication.jobTitle || 'Job'} at {selectedApplication.jobCompany || 'Company'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-slate-700 bg-white/80">
                  {selectedApplication.status || 'Under Review'}
                </span>
                <span className="px-4 py-1 rounded-full text-xs font-semibold text-slate-600 bg-white border border-slate-200/70">
                  Applied {formatDateTime(selectedApplication.appliedAt)}
                </span>
                <button
                  onClick={() => {
                    const targetId = selectedApplication.applicationId || selectedApplication.id
                    if (targetId) {
                      router.push(`/messages/${targetId}`)
                    }
                  }}
                  className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
                >
                  Message
                </button>
                <button
                  onClick={() => {
                    const targetId = selectedApplication.applicationId || selectedApplication.id
                    if (targetId) {
                      router.push(`/recruiter-applicant-profile/${targetId}`)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 border border-slate-200/70 bg-white hover:bg-slate-50 transition"
                >
                  View Profile
                </button>
                <button
                  onClick={() => handleDeleteApplication(selectedApplication)}
                  disabled={deletingApplicationId === selectedApplication.applicationId}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 border border-rose-200/70 bg-rose-50 hover:bg-rose-100 transition"
                >
                  {deletingApplicationId === selectedApplication.applicationId ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>

            {shortlistMessage && (
              <div className="mt-4 rounded-2xl bg-emerald-100 border border-emerald-200/70 text-emerald-700 px-4 py-2 text-sm font-semibold shadow-sm">
                {shortlistMessage}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start">
              <div className="flex-1 grid grid-cols-3 gap-4">
                {[
                  { label: 'Application ID', value: selectedApplication.applicationId || 'N/A' },
                  { label: 'Job ID', value: selectedApplication.jobId || 'N/A' },
                  { label: 'User ID', value: selectedApplication.userId || 'N/A' }
                ].map(item => (
                  <div key={item.label} className="bg-white/80 border border-slate-200/70 rounded-2xl px-4 py-3 shadow-sm flex flex-col text-xs text-slate-600">
                    <span className="text-[11px] uppercase tracking-[0.35em]">{item.label}</span>
                    <span className="mt-1 text-base font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col gap-3 md:max-w-sm">
                {!isSelectedApplicationRejected && (isSelectedApplicationShortlisted ? (
                  <div className="rounded-2xl border border-emerald-200/70 bg-emerald-100 px-4 py-3 text-sm text-emerald-700 font-semibold shadow-sm">
                    Already shortlisted
                  </div>
                ) : showShortlistConfirm ? (
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 space-y-3 shadow-sm">
                    <p className="text-sm text-slate-600">Send a shortlist confirmation to this applicant?</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleShortlistConfirm}
                        disabled={isShortlisting}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-700 to-indigo-500 text-white text-sm font-semibold py-2 shadow-md transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isShortlisting ? 'Confirming...' : 'Confirm'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowShortlistConfirm(false)
                          setShortlistError('')
                        }}
                        disabled={isShortlisting}
                        className="flex-1 rounded-2xl border border-slate-200/70 text-slate-700 text-sm font-semibold py-2 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                    {shortlistError && (
                      <p className="text-xs text-rose-600">{shortlistError}</p>
                    )}
                  </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowShortlistConfirm(true)
                        setShortlistError('')
                        setShortlistMessage('')
                      }}
                    className="rounded-2xl border border-slate-200/70 text-slate-700 bg-white px-4 py-2 text-sm font-semibold hover:bg-white/80 transition shadow-sm"
                    >
                      Shortlist candidate
                    </button>
                  ))}
                {!isSelectedApplicationShortlisted && (isSelectedApplicationRejected ? (
                  <div className="rounded-2xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-semibold shadow-sm">
                    Already rejected
                  </div>
                ) : showRejectConfirm ? (
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 space-y-4 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Select a rejection reason</p>
                      <p className="text-xs text-slate-500">This will be shared with the candidate.</p>
                    </div>
                    <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                      {rejectionReasons.map((reason) => (
                        <label
                          key={reason}
                          className="flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-xs text-slate-700 transition hover:border-rose-200"
                        >
                          <input
                            type="radio"
                            name="rejectionReason"
                            value={reason}
                            checked={rejectReason === reason}
                            onChange={() => setRejectReason(reason)}
                            className="mt-1 h-3.5 w-3.5 text-rose-500 focus:ring-rose-400"
                          />
                          <span className="leading-5">{reason}</span>
                        </label>
                      ))}
                    </div>
                    {rejectError && (
                      <p className="text-xs text-rose-600">{rejectError}</p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleRejectConfirm}
                        disabled={isRejecting}
                        className="flex-1 rounded-2xl bg-rose-600 text-white text-sm font-semibold py-2 shadow-md transition hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRejecting ? 'Rejecting...' : 'Confirm reject'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRejectConfirm(false)
                          setRejectReason('')
                          setRejectError('')
                        }}
                        disabled={isRejecting}
                        className="flex-1 rounded-2xl border border-slate-200/70 text-slate-700 text-sm font-semibold py-2 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectConfirm(true)
                      setRejectReason('')
                      setRejectError('')
                    }}
                    className="rounded-2xl border border-rose-200/70 text-rose-600 bg-rose-50 px-4 py-2 text-sm font-semibold hover:bg-rose-100 transition shadow-sm"
                  >
                    Reject candidate
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-6">
              <div className="bg-white/80 border border-slate-200/70 rounded-lg p-3">
                <p className="text-slate-600">Application ID</p>
                <p className="text-base font-semibold text-slate-900">{selectedApplication.applicationId || 'N/A'}</p>
              </div>
              <div className="bg-white/80 border border-slate-200/70 rounded-lg p-3">
                <p className="text-slate-600">Job ID</p>
                <p className="text-base font-semibold text-slate-900">{selectedApplication.jobId || 'N/A'}</p>
              </div>
              <div className="bg-white/80 border border-slate-200/70 rounded-lg p-3">
                <p className="text-slate-600">User ID</p>
                <p className="text-base font-semibold text-slate-900">{selectedApplication.userId || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-700">Resume Match</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {String(selectedApplication.matchStatus || selectedApplication.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
                      ? 'Below this job match threshold'
                      : 'Meets this job match threshold'}
                  </p>
                </div>
                <span className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-sm font-bold ${
                  String(selectedApplication.matchStatus || selectedApplication.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
                    ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                    : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                }`}>
                  {selectedApplication.matchScore ?? selectedApplication.match_score ?? 'N/A'}% match
                </span>
              </div>
              {(selectedApplication.matchedSkills?.length > 0 || selectedApplication.missingSkills?.length > 0) && (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Matched Skills</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {(selectedApplication.matchedSkills || selectedApplication.matched_skills || []).join(', ') || 'None'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Missing Skills</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {(selectedApplication.missingSkills || selectedApplication.missing_skills || []).join(', ') || 'None'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Name</p>
                <p className="font-semibold text-slate-900">{selectedApplication.candidateName || selectedApplication.name || 'Not available'}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Email</p>
                <p className="font-semibold text-slate-900 break-all">{selectedApplication.candidateEmail || selectedApplication.email || 'Not provided'}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Phone</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.phone)}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Experience Level</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.experience_level, 'Not specified')}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Job Location</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.jobLocation, 'Not specified')}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Candidate Location</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.location, 'Not specified')}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Current Salary</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.current_salary)}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Expected Salary</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.expected_salary)}</p>
              </div>
              <div className="bg-gray-50 border border-white/70 rounded-xl p-4">
                <p className="text-slate-600">Notice Period</p>
                <p className="font-semibold text-slate-900">{displayValue(selectedApplication.notice_period)}</p>
              </div>
            </div>

            {(selectedApplication.additional_comments || selectedApplication.notes || selectedApplication.additionalComments) && (
              <div className="mt-6">
                <p className="text-slate-600 text-sm mb-2">Notes</p>
                <div className="text-slate-700 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
                  {selectedApplication.additional_comments || selectedApplication.notes || selectedApplication.additionalComments}
                </div>
              </div>
            )}

            <div className="mt-6">
              <p className="text-slate-600 text-sm mb-2">Resume</p>
              {selectedApplication.resume_path ? (
                <a
                  href={buildFileUrl(selectedApplication.resume_path)}
                  onClick={() => handleResumeDownload(selectedApplication)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded-md bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition break-all shadow-sm"
                >
                  View Resume
                </a>
              ) : (
                <p className="text-slate-700 text-sm">Not provided</p>
              )}
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 text-sm mb-2">Candidate Introduction Video</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${videoStatusClass}`}>
                  {videoStatusLabel}
                </span>
              </div>
              {introVideoUrl ? (
                <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm">
                  <video
                    className="w-full rounded-xl"
                    controls
                    preload="metadata"
                    src={introVideoUrl}
                  />
                  {introVideoUploadedAt && (
                    <p className="mt-2 text-xs text-slate-500">Uploaded {formatDateTime(introVideoUploadedAt)}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-700 text-sm">No video uploaded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }



  const renderSelectedJobModal = () => {
    if (!selectedJob.open) return null
    const selectedJobCandidateCounts = selectedJob.job ? getJobCandidateCounts(selectedJob.job.id) : { ALL: 0, MATCHED: 0, NOT_MATCHED: 0 }
    const selectedJobApplications = selectedJob.job
      ? getApplicationsForJob(selectedJob.job.id, manageJobsCandidateFilter).sort(sortByAppliedDesc)
      : []
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 md:p-8 relative border border-white/70 max-h-[85vh] overflow-y-auto">
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-slate-600 transition"
            onClick={() => setSelectedJob({ open: false, job: null, loading: false, error: null })}
            aria-label="Close job modal"
          >
            X
          </button>
          {selectedJob.loading ? (
            <div className="py-12 text-center text-slate-600">Loading job details...</div>
          ) : selectedJob.error ? (
            <div className="py-12 text-center text-rose-600">{selectedJob.error}</div>
          ) : selectedJob.job ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-indigo-600 font-semibold mb-2">Job</p>
                  <h3 className="text-2xl font-bold text-slate-900">{selectedJob.job.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{selectedJob.job.company} - {displayValue(selectedJob.job.location, 'Location not set')}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedJob.job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/80 text-slate-600'}`}>
                    {selectedJob.job.status || 'Status unknown'}
                  </span>
                  <button
                    className="px-3 py-2 bg-rose-50 text-rose-600 border border-rose-200/70 rounded-md text-xs font-semibold hover:bg-rose-100 transition"
                    onClick={() => handleDeleteJob(selectedJob.job.id)}
                  >
                    Delete Post
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Employment Type</p>
                  <p className="text-base font-semibold text-slate-900">{displayValue(selectedJob.job.employment_type || selectedJob.job.modeOfWork, 'Not specified')}</p>
                </div>
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Experience Level</p>
                  <p className="text-base font-semibold text-slate-900">{displayValue(selectedJob.job.experience_level, 'Not specified')}</p>
                </div>
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Minimum Experience</p>
                  <p className="text-base font-semibold text-slate-900">{selectedJob.job.min_experience_years != null ? `${selectedJob.job.min_experience_years} years` : 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Resume Match Threshold</p>
                  <p className="text-base font-semibold text-slate-900">{selectedJob.job.match_percentage ?? 0}%</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-700">Role Overview</p>
                <span className="text-xs text-slate-600">Posted {formatDateTime(selectedJob.job.created_at || selectedJob.job.posted)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-white/70 rounded-xl p-4">
                  <p className="text-slate-600 text-sm mb-2">Description</p>
                  <p className="text-slate-700 text-sm whitespace-pre-line">{displayValue(selectedJob.job.description, 'Not provided')}</p>
                </div>
                <div className="bg-white border border-white/70 rounded-xl p-4">
                  <p className="text-slate-600 text-sm mb-2">Requirements</p>
                  <p className="text-slate-700 text-sm whitespace-pre-line">{displayValue(selectedJob.job.requirements, 'Not provided')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-white/70 rounded-xl p-4">
                  <p className="text-slate-600 text-sm mb-2">Benefits</p>
                  <p className="text-slate-700 text-sm whitespace-pre-line">{displayValue(selectedJob.job.benefits, 'Not provided')}</p>
                </div>
                <div className="bg-white border border-white/70 rounded-xl p-4">
                  <p className="text-slate-600 text-sm mb-2">Skills / Category</p>
                  <p className="text-slate-700 text-sm whitespace-pre-line">{displayValue(selectedJob.job.skills_required || selectedJob.job.role, 'Not provided')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Salary Min</p>
                  <p className="text-base font-semibold text-slate-900">{displayValue(selectedJob.job.salary_min)}</p>
                </div>
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Salary Max</p>
                  <p className="text-base font-semibold text-slate-900">{displayValue(selectedJob.job.salary_max)}</p>
                </div>
                <div className="bg-gray-50 border border-white/70 rounded-lg p-3">
                  <p className="text-slate-600">Currency</p>
                  <p className="text-base font-semibold text-slate-900">{displayValue(selectedJob.job.salary_currency || 'INR')}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-slate-600 text-sm mb-2">Application Deadline</p>
                <p className="text-slate-700 text-sm">{selectedJob.job.application_deadline ? formatDateTime(selectedJob.job.application_deadline) : 'Not set'}</p>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Candidates for this job</p>
                    <p className="text-xs text-slate-500">Applications are categorized automatically from resume match score.</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {[
                    { value: 'ALL', label: 'All Candidates', count: selectedJobCandidateCounts.ALL },
                    { value: 'MATCHED', label: 'Matched Candidates', count: selectedJobCandidateCounts.MATCHED },
                    { value: 'NOT_MATCHED', label: 'Unmatched Candidates', count: selectedJobCandidateCounts.NOT_MATCHED }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setManageJobsCandidateFilter(tab.value)}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${
                        manageJobsCandidateFilter === tab.value
                          ? 'bg-slate-950 text-white shadow-sm'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-2 py-0.5 ${
                        manageJobsCandidateFilter === tab.value ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
                {selectedJobApplications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-sm text-slate-500">
                    No candidates in this category yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedJobApplications.map((application) => {
                      const isMatched = getApplicationMatchStatus(application) === 'MATCHED'
                      return (
                        <button
                          key={application.applicationId || application.id}
                          type="button"
                          onClick={() => {
                            setSelectedJob({ open: false, job: null, loading: false, error: null })
                            setSelectedApplication(application)
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-200 hover:bg-indigo-50/40"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <p className="font-semibold text-slate-900">{application.candidateName || 'Candidate'}</p>
                              <p className="mt-1 text-xs text-slate-500">{application.candidateEmail || 'Email not provided'}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                isMatched
                                  ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                                  : 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                              }`}>
                                {application.matchScore ?? application.match_score ?? 'N/A'}% match
                              </span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                isMatched
                                  ? 'bg-emerald-500/15 text-emerald-700'
                                  : 'bg-rose-500/15 text-rose-700'
                              }`}>
                                {isMatched ? 'Matched' : 'Unmatched'}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }
  const normalizedRecruiterJobs = recruiterJobs.map(normalizeJob)
  const getApplicationMatchStatus = (application) => (
    String(application?.matchStatus || application?.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
      ? 'NOT_MATCHED'
      : 'MATCHED'
  )
  const getApplicationsForJob = (jobId, matchFilter = 'ALL') => recruiterApplications.filter((application) => {
    const matchesJob = String(application.jobId || application.job_id || '') === String(jobId)
    if (!matchesJob) return false
    if (matchFilter === 'ALL') return true
    return getApplicationMatchStatus(application) === matchFilter
  })
  const getJobCandidateCounts = (jobId) => {
    const applications = getApplicationsForJob(jobId, 'ALL')
    return applications.reduce((counts, application) => {
      counts.ALL += 1
      counts[getApplicationMatchStatus(application)] += 1
      return counts
    }, { ALL: 0, MATCHED: 0, NOT_MATCHED: 0 })
  }
  const manageJobsCandidateCounts = recruiterApplications.reduce((counts, application) => {
    counts.ALL += 1
    counts[getApplicationMatchStatus(application)] += 1
    return counts
  }, { ALL: 0, MATCHED: 0, NOT_MATCHED: 0 })
  const activeJobsCount = normalizedRecruiterJobs.filter(
    (job) => (job.status || '').toLowerCase() === 'active'
  ).length
  const jobsPostedCount = recruiterJobs.length
  const totalApplicationsCount = recruiterApplications.length
  const isSelectedApplicationShortlisted = selectedApplication
    ? (selectedApplication.status || '').toLowerCase() === 'shortlisted'
    : false
  const isSelectedApplicationRejected = selectedApplication
    ? (selectedApplication.status || '').toLowerCase() === 'rejected'
    : false

  const totalPostLimit = recruiterData?.job_post_limit_total ?? recruiterData?.jobPostLimitTotal
  const remainingPostLimit = recruiterData?.job_post_limit ?? recruiterData?.jobPostLimit ?? recruiterData?.job_post_limit_remaining
  const jobPostLimitDisplay = recruiterData?.subscription_status === 'Premium'
    ? 'Unlimited'
    : totalPostLimit != null && remainingPostLimit != null
      ? `${Math.max(totalPostLimit - remainingPostLimit, 0)}/${totalPostLimit}`
      : remainingPostLimit != null
        ? `${Math.max(remainingPostLimit, 0)} left`
        : `${jobsPostedCount}`

  const isSubRecruiter = recruiterData?.role === 'sub-recruiter' || jwtRole === 'sub_recruiter'
  const roleLabel = isSubRecruiter ? 'Sub-Recruiter' : 'Recruiter'
  const recruiterInitial = recruiterData?.name ? recruiterData.name.charAt(0).toUpperCase() : 'R'
  const stats = [
    {
      label: 'Active Jobs',
      value: activeJobsCount,
      trend: { direction: 'up', value: '2 this week' },
      accentClass: 'border-sky-500/60',
      glowClass: 'bg-sky-500/20',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 19h16M6 16V8m6 8V5m6 11V11" />
        </svg>
      ),
      bgIcon: (
        <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 19h16M6 16V8m6 8V5m6 11V11" />
        </svg>
      ),
      bgIconClass: 'text-sky-600',
      iconClass: 'bg-sky-100 text-sky-600'
    },
    {
      label: 'Total Applications',
      value: totalApplicationsCount,
      trend: { direction: 'up', value: '+12% this week' },
      accentClass: 'border-emerald-500/60',
      glowClass: 'bg-emerald-500/20',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M7 8h10M7 12h6M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      ),
      bgIcon: (
        <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M7 8h10M7 12h6M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      ),
      bgIconClass: 'text-emerald-700',
      iconClass: 'bg-emerald-100 text-emerald-700'
    },
    {
      label: 'Jobs Posted',
      value: jobsPostedCount,
      trend: { direction: 'down', value: '-5 this week' },
      accentClass: 'border-purple-500/60',
      glowClass: 'bg-purple-500/20',
      icon: (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M4 8h16M9 12h6M6 4h12l1 4H5l1-4zM5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
        </svg>
      ),
      bgIcon: (
        <svg className="h-24 w-24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.2" d="M4 8h16M9 12h6M6 4h12l1 4H5l1-4zM5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
        </svg>
      ),
      bgIconClass: 'text-purple-600',
      iconClass: 'bg-purple-100 text-purple-600'
    }
  ]
  const candidateFilteredJobs = (filtersApplied ? filteredJobs : normalizedRecruiterJobs).filter((job) => (
    manageJobsCandidateFilter === 'ALL' || getApplicationsForJob(job.id, manageJobsCandidateFilter).length > 0
  ))
  const jobsToDisplay = candidateFilteredJobs
  const recentJobs = jobsToDisplay.slice(0, 3)
  const canAddSubRecruiter = recruiterData?.role === 'recruiter' && subRecruiters.length < 3

  const applicationJobMap = new Map()
  normalizedRecruiterJobs.forEach((job) => applicationJobMap.set(String(job.id), job.title))
  recruiterApplications.forEach((app) => {
    const jobId = app.jobId ?? app.job_id
    if (jobId && !applicationJobMap.has(String(jobId))) {
      applicationJobMap.set(String(jobId), app.jobTitle || `Job #${jobId}`)
    }
  })
  const applicationJobOptions = Array.from(applicationJobMap.entries()).map(([id, title]) => ({ id, title }))
  const applicationStatuses = Array.from(new Set(recruiterApplications
    .map((app) => (app.status || '').trim())
    .filter(Boolean)))
  const hasApplicationFilters = Object.values(applicationFilters).some((value) => (value ?? '').toString().trim() !== '') || applicationMatchFilter !== 'ALL'
  const sortByAppliedDesc = (a, b) => {
    const aTime = a.appliedAt ? new Date(a.appliedAt).getTime() : 0
    const bTime = b.appliedAt ? new Date(b.appliedAt).getTime() : 0
    return bTime - aTime
  }

  const applicationsToDisplay = recruiterApplications
    .filter((app) => {
      const searchField = `${app.candidateName || ''} ${app.candidateEmail || ''} ${app.jobTitle || ''} ${app.jobCompany || ''}`.toLowerCase()
      const matchesSearch = !applicationFilters.search || searchField.includes(applicationFilters.search.toLowerCase())
      const matchesStatus = !applicationFilters.status || (app.status || '').toLowerCase() === applicationFilters.status.toLowerCase()
      const matchesJob = !applicationFilters.jobId || String(app.jobId) === applicationFilters.jobId
      const locationField = `${app.location || app.jobLocation || ''}`.toLowerCase()
      const matchesLocation = !applicationFilters.location || locationField.includes(applicationFilters.location.toLowerCase())
      const normalizedMatchStatus = String(app.matchStatus || app.match_status || 'MATCHED').toUpperCase()
      const matchesResumeMatch = applicationMatchFilter === 'ALL' || normalizedMatchStatus === applicationMatchFilter

      let matchesAppliedWithin = true
      if (applicationFilters.appliedWithin) {
        const appliedDate = app.appliedAt ? new Date(app.appliedAt) : null
        if (!appliedDate || Number.isNaN(appliedDate.getTime())) {
          matchesAppliedWithin = false
        } else if (applicationFilters.appliedWithin === '7') {
          matchesAppliedWithin = (Date.now() - appliedDate.getTime()) <= 7 * 24 * 60 * 60 * 1000
        } else if (applicationFilters.appliedWithin === '30') {
          matchesAppliedWithin = (Date.now() - appliedDate.getTime()) <= 30 * 24 * 60 * 60 * 1000
        }
      }

      return matchesSearch && matchesStatus && matchesJob && matchesLocation && matchesAppliedWithin && matchesResumeMatch
    })
    .sort(sortByAppliedDesc)

  const applicationMatchCounts = recruiterApplications.reduce((counts, app) => {
    const status = String(app.matchStatus || app.match_status || 'MATCHED').toUpperCase()
    counts.ALL += 1
    if (status === 'NOT_MATCHED') counts.NOT_MATCHED += 1
    else counts.MATCHED += 1
    return counts
  }, { ALL: 0, MATCHED: 0, NOT_MATCHED: 0 })

  const isNewApplication = (value) => {
    if (!value) return false
    const appliedDate = new Date(value)
    if (Number.isNaN(appliedDate.getTime())) return false
    const diffDays = (Date.now() - appliedDate.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 1
  }

  const newApplicationsCount = recruiterApplications.filter((app) => isNewApplication(app.appliedAt)).length
  const pendingReviewCount = recruiterApplications.filter((app) => (app.status || '').toLowerCase() === 'under review').length
  const companyStrength = companyCompletion || 0
  const overviewStats = [
    {
      label: 'Active Roles',
      value: activeJobsCount,
      tone: 'from-[#0f766e] via-[#14b8a6] to-[#67e8f9]',
      note: activeJobsCount > 0 ? 'Hiring is live' : 'Post your first role',
    },
    {
      label: 'Fresh Applicants',
      value: newApplicationsCount,
      tone: 'from-[#2563eb] via-[#4f46e5] to-[#7c3aed]',
      note: newApplicationsCount > 0 ? 'Last 24 hours' : 'No new applicants yet',
    },
    {
      label: 'Pending Review',
      value: pendingReviewCount,
      tone: 'from-[#ea580c] via-[#f59e0b] to-[#fde68a]',
      note: pendingReviewCount > 0 ? 'Needs attention' : 'Pipeline is clear',
    },
    {
      label: 'Profile Strength',
      value: `${companyStrength}%`,
      tone: 'from-[#be185d] via-[#ec4899] to-[#f9a8d4]',
      note: companyStrength >= 80 ? 'Brand looks strong' : 'Complete company profile',
    },
  ]

  const quickActionCards = [
    {
      title: 'Post Job',
      description: 'Launch a new role with a premium listing flow and tighter candidate targeting.',
      action: () => router.push('/post-job'),
      badge: 'Fast lane',
      accent: 'from-[#0f766e] via-[#14b8a6] to-[#67e8f9]',
      glow: 'bg-teal-400/20',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v12m6-6H6" />
        </svg>
      ),
    },
    {
      title: 'Create Post',
      description: 'Share an image, video, or company update in the user feed.',
      action: () => router.push('/create-post'),
      badge: 'Social',
      accent: 'from-[#0369a1] via-[#0ea5e9] to-[#67e8f9]',
      glow: 'bg-sky-400/20',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 16l4.5-4.5 3.5 3.5 2-2L20 19M4 5h16v14H4z" />
        </svg>
      ),
    },
    {
      title: 'Manage Posts',
      description: 'Review your company feed posts, see comments, and delete posts you no longer need.',
      action: () => router.push('/manage-posts'),
      badge: `${recruiterPosts.length} posts`,
      accent: 'from-[#0f172a] via-[#334155] to-[#64748b]',
      glow: 'bg-slate-400/20',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 5h12M6 9h12M6 13h8M5 19l3-3h11a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h.5L5 19z" />
        </svg>
      ),
    },
    {
      title: 'Manage Jobs',
      description: 'Keep active openings sharp, updated, and visible to the right candidates.',
      action: () => router.push('/manage-jobs'),
      badge: `${activeJobsCount} live`,
      accent: 'from-[#1d4ed8] via-[#4338ca] to-[#7c3aed]',
      glow: 'bg-indigo-400/20',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      ),
    },
    {
      title: 'Review Applications',
      description: 'Open your shortlist queue and move top candidates forward with less friction.',
      action: () => router.push('/review-applications'),
      badge: pendingReviewCount > 0 ? `${pendingReviewCount} waiting` : 'Queue clear',
      accent: 'from-[#7c2d12] via-[#ea580c] to-[#fb923c]',
      glow: 'bg-orange-400/20',
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M7 8h10M7 12h6M5 5h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
        </svg>
      ),
    },
    {
      title: 'Add Sub-Recruiter',
      description: 'Expand your hiring desk with teammates, shared coverage, and faster response time.',
      action: () => router.push('/sub-recruiters?openAdd=1'),
      badge: isSubRecruiter ? 'Admin only' : `${subRecruiters.length}/3 seats`,
      accent: 'from-[#831843] via-[#db2777] to-[#f472b6]',
      glow: 'bg-pink-400/20',
      disabled: isSubRecruiter,
      icon: (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 5a4 4 0 100 8 4 4 0 000-8zM6 19a6 6 0 0112 0" />
        </svg>
      ),
    },
  ]

  const recentApplications = [...recruiterApplications].sort(sortByAppliedDesc).slice(0, 3).map((app) => ({
    id: app.applicationId,
    candidate: app.candidateName || 'Candidate',
    job: app.jobTitle || 'Job',
    applied: formatPostedDate(app.appliedAt, 'recently'),
    status: app.status || 'Under Review',
    isNew: isNewApplication(app.appliedAt),
    isPending: (app.status || '').toLowerCase() === 'under review'
  }))

  if (!recruiterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Recruiter Dashboard - TrueHire</title>
        <meta name="description" content="Manage your recruitment activities" />
      </Head>
      <Header />
      <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(56,189,248,0.12), transparent 48%), radial-gradient(circle at 85% 15%, rgba(59,130,246,0.12), transparent 44%), radial-gradient(circle at 50% 85%, rgba(99,102,241,0.14), transparent 46%)' }} />
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-sky-500/20 blur-[140px]" />
          <div className="absolute right-0 top-12 h-96 w-96 rounded-full bg-indigo-500/20 blur-[160px]" />
          <div className="absolute bottom-[-6rem] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-200/60 blur-[160px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-24 h-[28rem] w-[42rem] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[180px]" />
          </div>
          <div className="relative space-y-12 sm:space-y-14 lg:space-y-16">
                    {/* Header */}
            <div className={`relative overflow-visible rounded-[34px] border border-slate-200/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(241,245,249,0.84)_42%,rgba(224,231,255,0.92)_100%)] p-6 shadow-[0_35px_90px_rgba(15,23,42,0.16)] backdrop-blur sm:p-8 lg:p-10 ${profileMenuOpen || notificationsOpen ? 'z-[120]' : 'z-10'}`}>
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.04),transparent_35%,rgba(99,102,241,0.08)_68%,rgba(45,212,191,0.1)_100%)]" />
                <div className="absolute -right-10 top-6 h-44 w-44 rounded-full bg-indigo-500/20 blur-[100px]" />
                <div className="absolute left-10 bottom-[-2rem] h-40 w-40 rounded-full bg-cyan-400/15 blur-[90px]" />
                <div className="absolute right-24 bottom-12 h-24 w-24 rounded-full border border-white/40 bg-white/20 backdrop-blur-md" />
              </div>
            <div className="relative flex flex-col gap-8 xl:flex-row xl:items-stretch xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-slate-500">Recruiter command center</p>
                <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  Build momentum with a dashboard that keeps your hiring pipeline in motion.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Welcome back, <span className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-500 bg-clip-text font-semibold text-transparent">{recruiterData.name}</span>. Stay on top of openings, keep review cycles moving, and give your team a workspace that feels fast.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                  {companyProfile.company_name && (
                    <button
                      type="button"
                      onClick={goToManagePosts}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50 px-4 py-2 font-bold text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-100 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                      aria-label="Open Manage Posts"
                    >
                      {companyProfile.company_name}
                    </button>
                  )}
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 shadow-sm">
                    Logged in as <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] uppercase tracking-[0.24em] text-white">{roleLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-teal-200/80 bg-teal-50 px-4 py-2 text-teal-700 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    {activeJobsCount > 0 ? `${activeJobsCount} roles active` : 'Ready to publish'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-violet-50 px-4 py-2 text-violet-700 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    {unreadNotificationsCount} unread alerts
                  </span>
                </div>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => router.push('/post-job')}
                    className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#1d4ed8,#06b6d4)] px-6 py-3.5 text-base font-semibold text-white shadow-[0_22px_48px_rgba(29,78,216,0.35)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_rgba(8,145,178,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
                  >
                    Post a New Job
                  </button>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {overviewStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-[0_14px_34px_rgba(15,23,42,0.06)] backdrop-blur">
                      <div className={`inline-flex rounded-full bg-gradient-to-r ${stat.tone} px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white`}>
                        {stat.label}
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-slate-950">{stat.value}</div>
                      <p className="mt-1 text-sm text-slate-500">{stat.note}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-between gap-5 xl:min-w-[290px]">
                <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(160deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92)_50%,rgba(14,116,144,0.88))] p-6 text-white shadow-[0_24px_55px_rgba(15,23,42,0.3)]">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-cyan-200/80">Today&apos;s focus</p>
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-3xl font-semibold">{newApplicationsCount}</p>
                      <p className="mt-1 text-sm text-slate-200/85">Fresh applicants arrived in the last 24 hours.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <p className="text-sm font-medium text-white">Next best action</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200/85">
                        {pendingReviewCount > 0
                          ? `Review ${pendingReviewCount} pending candidate${pendingReviewCount === 1 ? '' : 's'} to keep hiring speed up.`
                          : 'Your review queue is clear. Publish a new role or strengthen your company profile.'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                <div className="relative">
                  <button
                    ref={notificationsButtonRef}
                    type="button"
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev)
                      if (!notificationsOpen) {
                        setNotificationsError('')
                        fetchRecruiterNotifications({ silent: true })
                      }
                    }}
                    className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-400/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60"
                    aria-label="Notifications"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.4-1.4a2 2 0 01-.6-1.4V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z" />
                    </svg>
                    {unreadNotificationsCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[22px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                        {unreadNotificationsCount}
                      </span>
                    )}
                  </button>
                  {notificationsOpen && (
                    <div
                      ref={notificationsPanelRef}
                      className="dropdown-animate absolute right-0 top-full mt-3 w-80 rounded-3xl border border-white/70 bg-gradient-to-b from-white via-[#FFF1F2] to-[#FFE4E6] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.2)] backdrop-blur z-50"
                    >
                      <div className="pointer-events-none absolute -top-2 right-6 h-3 w-3 rotate-45 bg-white/95 border-l border-t border-white/70" />
                      <div className="flex items-center justify-between px-2 pb-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Notifications</p>
                          <p className="text-xs text-slate-500">{unreadNotificationsCount} unread</p>
                        </div>
                      </div>
                      <div className="h-px bg-rose-100/80 mx-2 mb-2" />
                      {notificationsLoading ? (
                        <div className="px-4 py-6 text-sm text-slate-500">Loading notifications...</div>
                      ) : notificationsError ? (
                        <div className="px-4 py-6 text-sm text-rose-600">{notificationsError}</div>
                      ) : recruiterNotifications.length === 0 ? (
                        <div className="px-4 py-6 text-sm text-slate-600">You're all caught up ??</div>
                      ) : (
                        <ul className="max-h-80 space-y-2 overflow-y-auto px-2">
                          {recruiterNotifications.map((notification) => {
                            const isUnread = !notification.isRead
                            return (
                              <li key={notification.id}>
                                <button
                                  type="button"
                                  onClick={() => handleNotificationClick(notification)}
                                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                                    isUnread
                                      ? 'border-rose-200/70 bg-white/90 text-slate-900 shadow-sm'
                                      : 'border-white/70 bg-white/70 text-slate-600'
                                  }`}
                                >
                                  <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold">{notification.title}</p>
                                      <span className="text-[10px] text-slate-500">
                                        {formatNotificationTime(notification.createdAt)}
                                      </span>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-600">{notification.message}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                      <span className={isUnread ? 'text-rose-500' : 'text-slate-500'}>
                                        {isUnread ? 'Unread' : 'Read'}
                                      </span>
                                      {notification.type === 'VIDEO_UPLOADED' && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-2 py-0.5 text-indigo-600 normal-case">
                                          View Application
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div ref={profileMenuRef} className="relative z-[60] shrink-0 overflow-visible">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setProfileMenuOpen((prev) => !prev)
                    }}
                    className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-400/60 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                    aria-haspopup="menu"
                    aria-expanded={profileMenuOpen}
                    aria-controls="recruiter-profile-menu"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
                      {recruiterInitial}
                    </span>
                    <span className="hidden flex-col items-start sm:flex">
                      <span className="text-sm font-semibold text-slate-900">{recruiterData.name}</span>
                      <span className="text-xs text-slate-600">{roleLabel}</span>
                    </span>
                    <svg className={`h-4 w-4 text-slate-600 transition ${profileMenuOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {profileMenuOpen && (
                    <div
                      id="recruiter-profile-menu"
                      role="menu"
                      aria-label="Recruiter profile menu"
                      onClick={(e) => e.stopPropagation()}
                      className="dropdown-animate absolute right-0 top-full mt-3 min-w-[16rem] rounded-3xl border border-white/70 bg-gradient-to-b from-white via-[#F5F3FF] to-[#EEF2FF] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.2)] backdrop-blur overflow-visible z-[9999]"
                    >
                      <div className="pointer-events-none absolute -top-2 right-6 h-3 w-3 rotate-45 bg-white/95 border-l border-t border-white/70" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          router.push('/recruiter-profile')
                        }}
                        role="menuitem"
                        className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-white/80 hover:border-white/70"
                      >
                        View Profile
                      </button>
                      <div className="h-px bg-slate-200/70 mx-2 my-2" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          router.push('/recruiter-settings')
                        }}
                        role="menuitem"
                        className="w-full rounded-xl border border-white/70 bg-white/80 px-4 py-3 text-left text-sm font-semibold text-slate-900 transition hover:bg-white/80 hover:border-white/70"
                      >
                        Account Settings
                      </button>
                      <div className="h-px bg-slate-200/70 mx-2 my-2" />
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false)
                          handleLogout()
                        }}
                        role="menuitem"
                        className="w-full rounded-xl border border-rose-200/70 bg-rose-50 px-4 py-3 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:border-rose-300/70"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
              </div>
            </div>
            </div>

          {/* Quick Actions */}
            <section className="relative z-0 overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,250,252,0.82))] p-6 shadow-[0_22px_48px_rgba(15,23,42,0.12)] sm:p-8">
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-0 top-0 h-32 w-32 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute right-0 bottom-0 h-40 w-40 rounded-full bg-fuchsia-300/15 blur-3xl" />
              </div>
              <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.34em] text-slate-500">Quick actions</p>
                  <h3 className="mt-2 text-2xl font-semibold text-slate-950">Move the right work forward</h3>
                  <p className="mt-2 text-sm text-slate-600">Everything you need for a cleaner, faster recruiter workflow is one click away.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
                  <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500" />
                  AI assisted workflow
                </span>
              </div>
              <div className="relative grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {quickActionCards.map((card) => (
                  <button
                    key={card.title}
                    onClick={card.action}
                    disabled={card.disabled}
                    className={`group relative h-full overflow-hidden rounded-[28px] border border-white/80 bg-[linear-gradient(160deg,rgba(255,255,255,0.84),rgba(241,245,249,0.78))] p-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_22px_48px_rgba(15,23,42,0.16)] ${card.disabled ? 'cursor-not-allowed opacity-65 hover:-translate-y-0' : ''}`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100">
                      <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full ${card.glow} blur-3xl`} />
                    </div>
                    <div className="relative flex h-full flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <span className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${card.accent} text-white shadow-[0_18px_34px_rgba(15,23,42,0.18)]`}>
                          {card.icon}
                        </span>
                        <span className="max-w-[9rem] truncate rounded-full border border-slate-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {card.badge}
                        </span>
                      </div>
                      <h4 className="mt-6 text-xl font-semibold text-slate-950">{card.title}</h4>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                      <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                        Open
                        <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          {/* Navigation Tabs */}
            <div className="rounded-2xl border border-white/70 bg-white/80 shadow-[0_14px_34px_rgba(15,23,42,0.1)]">
            <div className="border-b border-white/70">
              <nav className="flex flex-wrap gap-2 px-4 py-2">
                <button
                  onClick={() => navigateToRecruiterPage('/recruiter-dashboard')}
                  className={`tab-pill rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeTab === 'overview'
                      ? 'tab-pill-active bg-white/80 text-slate-900 border border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20 font-semibold'
                      : 'bg-transparent text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-600 hover:bg-white/80'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => navigateToRecruiterPage('/manage-jobs')}
                  className={`tab-pill rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    activeTab === 'jobs'
                      ? 'tab-pill-active bg-white/80 text-slate-900 border border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20 font-semibold'
                      : 'bg-transparent text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-600 hover:bg-white/80'
                  }`}
                >
                  My Jobs
                </button>
                  <button
                    onClick={() => navigateToRecruiterPage('/review-applications')}
                    className={`tab-pill rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      activeTab === 'applications'
                        ? 'tab-pill-active bg-white/80 text-slate-900 border border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20 font-semibold'
                        : 'bg-transparent text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Applications
                  </button>
                  <button
                    onClick={() => navigateToRecruiterPage('/recruiter-chats')}
                    className={`tab-pill rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      activeTab === 'messages'
                        ? 'tab-pill-active bg-white/80 text-slate-900 border border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20 font-semibold'
                        : 'bg-transparent text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-600 hover:bg-white/80'
                    }`}
                  >
                    Messages
                    {messagesUnreadCount > 0 && (
                      <span className="ml-2 rounded-full border border-white/70 bg-white/80 px-2 py-0.5 text-xs text-indigo-600">
                        {messagesUnreadCount}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => navigateToRecruiterPage('/sub-recruiters')}
                    className={`tab-pill rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      activeTab === 'sub-recruiters'
                        ? 'tab-pill-active bg-white/80 text-slate-900 border border-indigo-500/25 shadow-[inset_0_1px_0_rgba(99,102,241,0.18)] ring-1 ring-indigo-500/20 font-semibold'
                      : 'bg-transparent text-slate-600 opacity-70 hover:opacity-100 hover:text-slate-600 hover:bg-white/80'
                  }`}
                >
                  Sub-Recruiters <span className="ml-2 rounded-full border border-white/70 bg-white/80 px-2 py-0.5 text-xs text-slate-600">{subRecruiters.length}/3</span>
                </button>
              </nav>
            </div>

            <div className="p-6 transition-all duration-300">
              {activeTab === 'overview' && (
                <div className="space-y-12">
                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Jobs</h3>
                      <div className="space-y-3">
                        {recentJobs.map((job) => (
                          <div
                            key={job.id}
                            className="rounded-2xl border border-white/70 border-l-4 border-l-sky-500/60 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)]"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-semibold text-slate-900">{job.title}</h4>
                                  {job.is_urgent && (
                                    <span className="px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-amber-400/15 text-amber-700 border border-amber-400/50 shadow-[0_6px_14px_rgba(251,191,36,0.2)]">
                                      Urgent Hiring
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600">{job.applicants} applicants - Posted {job.posted}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                job.status === 'Active' ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40' : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/70'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/70 bg-white/80 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
                      <h3 className="text-xl font-semibold text-slate-900 mb-4">Recent Applications</h3>
                      <div className="space-y-3">
                        {recentApplications.map((app) => (
                          <div
                            key={app.id}
                            className={`rounded-2xl border border-white/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)] ${
                              app.status === 'Under Review'
                                ? 'bg-amber-100'
                                : app.status === 'Interview Scheduled'
                                  ? 'bg-indigo-100'
                                  : 'bg-emerald-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-lg font-semibold text-slate-900">{app.candidate}</h4>
                                <p className="text-sm text-slate-600">{app.job} - Applied {app.applied}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-2">
                                  {app.isNew && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-400/40">
                                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                      New
                                    </span>
                                  )}
                                  {app.isPending && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-400/40">
                                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" />
                                      </svg>
                                      Pending review
                                    </span>
                                  )}
                                </div>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                  app.status === 'Under Review'
                                    ? 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40'
                                    : app.status === 'Interview Scheduled'
                                      ? 'bg-indigo-500/20 text-indigo-700 ring-1 ring-indigo-400/40'
                                      : 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40'
                                }`}>
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2 2" />
                                  </svg>
                                  {app.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}


              {activeTab === 'jobs' && (
                <div>
                  {/* Filter Button and Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">My Job Postings</h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition-all duration-300 ease-out hover:bg-white/80 hover:border-indigo-400/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>Filter</span>
                      </button>
                      <button
                        onClick={() => router.push('/post-job')}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                        </svg>
                        Post Job
                      </button>
                    </div>
                  </div>

                  {/* Filter Panel */}
                  {showFilters && (
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 mb-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <h4 className="text-md font-semibold text-slate-900 mb-4">Filter Jobs</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Search</label>
                          <input
                            type="text"
                            placeholder="Title, role, location"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                          <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Paused">Paused</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Employment Type</label>
                          <select
                            value={filters.employmentType}
                            onChange={(e) => setFilters({ ...filters, employmentType: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">All Types</option>
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Freelance">Freelance</option>
                            <option value="Internship">Internship</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Posted</label>
                          <select
                            value={filters.postedWithin}
                            onChange={(e) => setFilters({ ...filters, postedWithin: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">Any time</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={applyFilters}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                          </svg>
                          Apply Filters
                        </button>
                        <button
                          onClick={clearFilters}
                          className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-500/40 bg-white/80 px-5 text-sm font-semibold text-rose-600 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-rose-500/10 hover:border-rose-400/50 hover:shadow-[0_14px_30px_rgba(244,63,94,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Clear Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Jobs List */}
                  <div className="space-y-4">
                    {jobsToDisplay.map((job) => {
                      const candidateCounts = getJobCandidateCounts(job.id)
                      const visibleCandidateCount = manageJobsCandidateFilter === 'ALL'
                        ? candidateCounts.ALL
                        : candidateCounts[manageJobsCandidateFilter]
                      return (
                        <div
                          key={job.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openJobDetailsPage(job.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              openJobDetailsPage(job.id)
                            }
                          }}
                          className="cursor-pointer rounded-2xl border border-white/70 bg-white/80 p-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                        >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start space-x-4">
                              <div className="w-12 h-12 rounded-xl bg-white/80 flex items-center justify-center">
                                <span className="text-slate-900 font-semibold text-lg">
                                  {job.title.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-semibold text-slate-900">{job.title}</h4>
                                {job.is_urgent && (
                                  <span className="px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide rounded-full bg-[#fff3ec] text-[#b9391c] border border-[#f76e2f]">
                                    Urgent Hiring
                                  </span>
                                )}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                                    </svg>
                                    {job.role}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    {job.location}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {job.experience}
                                  </span>
                                  <span className="flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    {job.modeOfWork}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
                                  <span>{visibleCandidateCount} {manageJobsCandidateFilter === 'ALL' ? 'applicants' : manageJobsCandidateFilter === 'MATCHED' ? 'matched' : 'unmatched'}</span>
                                  <span className="text-xs text-slate-500">
                                    {candidateCounts.MATCHED} matched / {candidateCounts.NOT_MATCHED} unmatched
                                  </span>
                                  <span>-</span>
                                  <span>?? {job.views_count || 0} views</span>
                                  <span>-</span>
                                  <span>Posted {job.posted}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              job.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-white/80 text-slate-600'
                            }`}>
                              {job.status}
                            </span>
                            <button
                              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-white/80 hover:border-indigo-400/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                              onClick={(event) => {
                                event.stopPropagation()
                                openJobDetailsPage(job.id)
                              }}
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
                                <circle cx="12" cy="12" r="3.5" strokeWidth="2" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>

                  {jobsToDisplay.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-slate-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-slate-900">No jobs found</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        {filtersApplied ? 'No jobs match your current filters.' : 'Start by posting your first job opening to see results here.'}
                      </p>
                      <div className="mt-5 flex flex-wrap justify-center gap-3">
                        {filtersApplied ? (
                          <button
                            onClick={clearFilters}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-rose-500/40 bg-white/80 px-5 text-sm font-semibold text-rose-600 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-rose-500/10 hover:border-rose-400/50 hover:shadow-[0_14px_30px_rgba(244,63,94,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Clear Filters
                          </button>
                        ) : (
                          <button
                            onClick={() => router.push('/post-job')}
                            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                            </svg>
                            Post Job
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'applications' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Applications</h3>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowApplicationFilters(!showApplicationFilters)}
                        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition-all duration-300 ease-out hover:bg-white/80 hover:border-indigo-400/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        <span>{showApplicationFilters ? 'Hide Filters' : 'Filter'}</span>
                      </button>
                      <button
                        onClick={clearApplicationFilters}
                        disabled={!hasApplicationFilters}
                        className={`btn btn-secondary ${!hasApplicationFilters ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {showApplicationFilters && (
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 mb-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <h4 className="text-md font-semibold text-slate-900 mb-4">Filter Applications</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Search</label>
                          <input
                            type="text"
                            placeholder="Candidate, email, job"
                            value={applicationFilters.search}
                            onChange={(e) => setApplicationFilters({ ...applicationFilters, search: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                          <select
                            value={applicationFilters.status}
                            onChange={(e) => setApplicationFilters({ ...applicationFilters, status: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">All statuses</option>
                            {applicationStatuses.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>{statusOption}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Job</label>
                          <select
                            value={applicationFilters.jobId}
                            onChange={(e) => setApplicationFilters({ ...applicationFilters, jobId: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">All jobs</option>
                            {applicationJobOptions.map((job) => (
                              <option key={job.id} value={job.id}>{job.title}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Location</label>
                          <input
                            type="text"
                            placeholder="City or region"
                            value={applicationFilters.location}
                            onChange={(e) => setApplicationFilters({ ...applicationFilters, location: e.target.value })}
                            className="input w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-600 mb-1">Applied</label>
                          <select
                            value={applicationFilters.appliedWithin}
                            onChange={(e) => setApplicationFilters({ ...applicationFilters, appliedWithin: e.target.value })}
                            className="input w-full"
                          >
                            <option value="">Any time</option>
                            <option value="7">Last 7 days</option>
                            <option value="30">Last 30 days</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowApplicationFilters(false)}
                          className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          Done
                        </button>
                        <button
                          onClick={clearApplicationFilters}
                          disabled={!hasApplicationFilters}
                          className={`inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-5 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.25)] transition-all duration-300 ease-out hover:bg-white/80 hover:border-indigo-400/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 ${!hasApplicationFilters ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-13.657-5.657L4 4m0 0h6m10 16h-6" />
                          </svg>
                          Reset Filters
                        </button>
                      </div>
                    </div>
                  )}

                  {loadingApplications ? (
                    <div className="text-center py-12 text-slate-600">Loading applications...</div>
                  ) : recruiterApplications.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-slate-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-slate-900">No applications yet</h4>
                      <p className="mt-2 text-sm text-slate-600">Applications will appear here once candidates apply to your jobs.</p>
                    </div>
                  ) : applicationsToDisplay.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-slate-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6l-2 2m6 4h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-slate-900">No applications match your filters</h4>
                      <p className="mt-2 text-sm text-slate-600">Try adjusting or clearing the filters to see more results.</p>
                      <button
                        onClick={clearApplicationFilters}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-full border border-rose-500/40 bg-white/80 px-5 text-sm font-semibold text-rose-600 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-rose-500/10 hover:border-rose-400/50 hover:shadow-[0_14px_30px_rgba(244,63,94,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applicationsToDisplay.map((app) => (
                        <div
                          key={app.applicationId || app.id}
                          className={`rounded-2xl border border-white/70 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)] flex items-start justify-between ${
                            (app.status || '').toLowerCase() === 'under review'
                              ? 'bg-amber-100'
                              : (app.status || '').toLowerCase() === 'interview scheduled'
                                ? 'bg-indigo-100'
                                : (app.status || '').toLowerCase() === 'shortlisted'
                                  ? 'bg-emerald-100'
                                  : 'bg-white/80'
                          }`}
                        >
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-lg font-semibold text-slate-900">{app.candidateName || 'Candidate'}</h4>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                                String(app.matchStatus || app.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
                                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-200'
                                  : 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                              }`}>
                                {app.matchScore ?? app.match_score ?? 'N/A'}% match
                              </span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                              {isNewApplication(app.appliedAt) && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/15 px-2 py-0.5 text-indigo-700 ring-1 ring-indigo-400/40">
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                  New
                                </span>
                              )}
                              {(app.status || '').toLowerCase() === 'under review' && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-700 ring-1 ring-amber-400/40">
                                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2 2m6-2a8 8 0 11-16 0 8 8 0 0116 0z" />
                                  </svg>
                                  Pending review
                                </span>
                              )}
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ring-1 ${
                                String(app.matchStatus || app.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
                                  ? 'bg-rose-500/15 text-rose-700 ring-rose-400/40'
                                  : 'bg-emerald-500/15 text-emerald-700 ring-emerald-400/40'
                              }`}>
                                {String(app.matchStatus || app.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED' ? 'Not matched' : 'Matched'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600">{app.candidateEmail || 'Email not provided'}</p>
                            <p className="text-sm text-slate-600 mt-1">{app.jobTitle || 'Job'} at {app.jobCompany || 'Company'}</p>
                            <p className="text-xs text-slate-600 mt-1">Applied {app.appliedAt ? formatDateTime(app.appliedAt) : 'Date not available'}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium capitalize ${
                              (app.status || '').toLowerCase() === 'under review'
                                ? 'bg-amber-500/15 text-amber-700 ring-1 ring-amber-400/40'
                                : (app.status || '').toLowerCase() === 'interview scheduled'
                                  ? 'bg-indigo-500/20 text-indigo-700 ring-1 ring-indigo-400/40'
                                  : (app.status || '').toLowerCase() === 'shortlisted'
                                    ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-400/40'
                                    : 'bg-white/80 text-slate-600 ring-1 ring-slate-200/70'
                            }`}>
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l2 2" />
                              </svg>
                              {app.status || 'Under Review'}
                            </span>
                            {(app.jobLocation || app.location) && <p className="text-xs text-slate-600 mt-2">{app.jobLocation || app.location}</p>}
                            <button
                              onClick={() => setSelectedApplication({
                                ...app,
                                candidateName: app.candidateName || app.name || 'Candidate',
                                candidateEmail: app.candidateEmail || app.email || 'Not provided',
                                location: app.location || app.jobLocation || null
                              })}
                              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-white/80 hover:border-indigo-400/40 hover:shadow-[0_14px_30px_rgba(59,130,246,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 12s4.5-7.5 10.5-7.5S22.5 12 22.5 12s-4.5 7.5-10.5 7.5S1.5 12 1.5 12z" />
                                <circle cx="12" cy="12" r="3.5" strokeWidth="2" />
                              </svg>
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Messages</h3>
                      <p className="text-sm text-slate-600">Conversations tied to job applications.</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                        Unread
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-indigo-700">
                          {messagesUnreadCount}
                        </span>
                      </span>
                      <button
                        onClick={fetchMessageConversations}
                        className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {messagesLoading ? (
                    <div className="text-center py-12 text-slate-600">Loading conversations...</div>
                  ) : messagesError ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-600">
                      {messagesError}
                    </div>
                  ) : messageConversations.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <h4 className="text-lg font-semibold text-slate-900">No messages yet</h4>
                      <p className="mt-2 text-sm text-slate-600">
                        Start messaging candidates from their application details.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messageConversations.map((conversation) => {
                        const counterpartName = conversation.userName || 'Candidate'
                        const lastMessage = conversation.lastMessage || 'No messages yet.'
                        const statusLabel = conversation.applicationStatus || 'Applied'
                        return (
                          <button
                            key={conversation.applicationId}
                            onClick={() => router.push(`/messages/${conversation.applicationId}`)}
                            className="w-full rounded-2xl border border-white/70 bg-white/80 p-4 text-left shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.2)]"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {conversation.jobTitle || 'Job'} - {counterpartName}
                                </p>
                                <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                                  {statusLabel}
                                </p>
                                <p className="mt-1 text-sm text-slate-600 truncate">
                                  {lastMessage}
                                </p>
                                {conversation.lastMessageAt && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatDateTime(conversation.lastMessageAt)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {conversation.unreadCount > 0 && (
                                  <span className="rounded-full bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                    {conversation.unreadCount}
                                  </span>
                                )}
                                <span className="text-xs font-semibold text-indigo-600">Open</span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'sub-recruiters' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-slate-900 sm:text-2xl">Sub-Recruiters</h3>
                    {canAddSubRecruiter && (
                      <button
                        onClick={() => setShowAddSubRecruiter(true)}
                        className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                        </svg>
                        Add Sub-Recruiter
                      </button>
                    )}
                  </div>

                  {showAddSubRecruiter && (
                    <div className="rounded-2xl border border-white/70 bg-white/80 p-6 mb-6 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
                      <h4 className="text-md font-semibold text-slate-900 mb-4">Add New Sub-Recruiter</h4>
                      <form onSubmit={handleAddSubRecruiter} className="space-y-5">
                        <div className="mx-auto w-full max-w-md space-y-5">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={newSubRecruiter.name}
                              onChange={(e) => setNewSubRecruiter({...newSubRecruiter, name: e.target.value})}
                              className="w-full px-3 py-2 border border-white/70 rounded-md bg-white/80 text-slate-900 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter full name"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Email Address</label>
                            <input
                              type="email"
                              value={newSubRecruiter.email}
                              onChange={(e) => setNewSubRecruiter({...newSubRecruiter, email: e.target.value})}
                              className="w-full px-3 py-2 border border-white/70 rounded-md bg-white/80 text-slate-900 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Enter email address"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
                            <div className="relative w-full">
                              <input
                                type={showSubRecruiterPassword ? 'text' : 'password'}
                                value={newSubRecruiter.password}
                                onChange={(e) => setNewSubRecruiter({...newSubRecruiter, password: e.target.value})}
                                className="w-full px-3 py-2 pr-12 border border-white/70 rounded-md bg-white/80 text-slate-900 placeholder-slate-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter password (min 6 characters)"
                                required
                              />
                              <span
                                onClick={() => setShowSubRecruiterPassword((prev) => !prev)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-600 transition-opacity duration-200 hover:text-slate-700"
                                aria-label={showSubRecruiterPassword ? 'Hide password' : 'Show password'}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    setShowSubRecruiterPassword((prev) => !prev)
                                  }
                                }}
                              >
                                {showSubRecruiterPassword ? (
                                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M3 3l18 18M10.5 10.5a2 2 0 102.83 2.83M9.88 4.24A10.94 10.94 0 0112 4c7 0 10 8 10 8a19.64 19.64 0 01-4.19 4.88M6.1 6.1A19.2 19.2 0 002 12s3 8 10 8a10.94 10.94 0 005.12-1.24" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mx-auto w-full max-w-md flex flex-col gap-3">
                          <button
                            type="submit"
                            disabled={loading || subRecruiters.length >= 3}
                            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                          >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                            </svg>
                            {loading ? 'Adding...' : 'Add Sub-Recruiter'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddSubRecruiter(false)}
                            className="inline-flex h-10 items-center justify-center rounded-full border border-white/70 bg-white/80 px-5 text-sm font-medium text-slate-600 transition hover:bg-white/80"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {loadingSubRecruiters ? (
                    <div className="text-center py-12 text-slate-600">Loading sub-recruiters...</div>
                  ) : subRecruiters.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200/70 bg-white/80 p-10 text-center shadow-[0_12px_28px_rgba(15,23,42,0.06)]">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 text-slate-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-slate-900">No sub-recruiters yet</h4>
                      <p className="mt-2 text-sm text-slate-600">Add team members to help manage your recruitment process.</p>
                      {subRecruiters.length < 3 && (
                        <button
                          onClick={() => setShowAddSubRecruiter(true)}
                          className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(79,70,229,0.35)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(79,70,229,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                          </svg>
                          Add Your First Sub-Recruiter
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {subRecruiters.slice(0, 3).map((subRecruiter) => (
                        <div key={subRecruiter.id} className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.14)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                                {subRecruiter.name ? subRecruiter.name[0] : '?'}
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{subRecruiter.name}</h4>
                                <p className="text-sm text-slate-600">{subRecruiter.email}</p>
                                <p className="text-xs text-slate-600 mt-1">
                                  Status: <span className="font-medium">{subRecruiter.status || 'Active'}</span>
                                  {subRecruiter.created_at && (
                                    <> - Created {new Date(subRecruiter.created_at).toLocaleDateString()}</>
                                  )}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveSubRecruiter(subRecruiter.id)}
                              className="inline-flex h-9 items-center gap-2 rounded-full border border-rose-500/40 bg-rose-50 px-4 text-xs font-semibold text-rose-600 shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition-all duration-300 ease-out hover:bg-rose-500/15 hover:border-rose-400/50 hover:shadow-[0_14px_30px_rgba(244,63,94,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                              disabled={recruiterData.role !== 'recruiter'}
                            >
                              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 002 2h6a2 2 0 002-2V6" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                      {subRecruiters.length > 3 && (
                        <p className="text-xs text-slate-600">Showing first 3 (max allowed). Remove one to add another.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
            </div>
          </div>
        </div>
    
    </main>

      {renderSelectedApplicationModal()}

      {showCreatePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.38)]">
            <button
              type="button"
              onClick={() => {
                if (postSaving) return
                setShowCreatePost(false)
                setPostError('')
                setPostMessage('')
                setPostForm({ caption: '', media: [] })
              }}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              aria-label="Close create post modal"
            >
              <X className="h-5 w-5" strokeWidth={2.3} />
            </button>

            <form onSubmit={handleCreatePost} className="grid max-h-[92vh] overflow-y-auto bg-white lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_48%,#38bdf8_100%)] p-6 text-white sm:p-8">
                <div className="absolute inset-x-8 top-28 h-px bg-white/20" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-sky-50">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.3} />
                    Create Post
                  </div>
                  <h2 className="mt-5 max-w-xs text-3xl font-black leading-tight tracking-tight">
                    Craft a company update candidates remember.
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-sky-50/90">
                    Pair concise hiring context with visual proof of your team, culture, events, or product momentum.
                  </p>

                  <div className="mt-8 rounded-2xl border border-white/18 bg-white/12 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white text-lg font-black text-blue-700">
                        {composerInitial}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-black">{composerCompanyName}</p>
                          <BadgeCheck className="h-4 w-4 shrink-0 text-sky-100" strokeWidth={2.4} />
                        </div>
                        <p className="truncate text-xs font-semibold text-sky-100/85">{composerIndustry}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                      {[
                        ['Media', postPreviewMediaItems.length || 0],
                        ['Words', postForm.caption.trim() ? postForm.caption.trim().split(/\s+/).length : 0],
                        ['Limit', '15']
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/14 bg-white/10 px-2 py-3">
                          <div className="text-base font-black">{value}</div>
                          <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-100/80">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-2 text-xs font-semibold text-sky-50/90">
                    <div className="flex items-center gap-2"><Type className="h-4 w-4" /> Clear caption, human tone</div>
                    <div className="flex items-center gap-2"><ImagePlus className="h-4 w-4" /> Up to 15 visual assets</div>
                    <div className="flex items-center gap-2"><FileVideo className="h-4 w-4" /> Image and video friendly</div>
                  </div>
                </div>
              </aside>

              <div className="space-y-5 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_62%)] p-5 sm:p-7 lg:p-8">
                <div className="pr-12">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">Composer</p>
                  <h3 className="mt-2 text-2xl font-black text-slate-950">Publish to company feed</h3>
                </div>

                {postError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {postError}
                  </div>
                )}
                {postMessage && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {postMessage}
                  </div>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label htmlFor="company-post-caption" className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                      <Type className="h-4 w-4 text-sky-600" strokeWidth={2.4} />
                      Caption
                    </label>
                    <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                      <SmilePlus className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                      {quickPostEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmojiToPostCaption(emoji)}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-base transition hover:bg-white hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                          aria-label={`Add ${emoji} emoji`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    id="company-post-caption"
                    value={postForm.caption}
                    onChange={(event) => setPostForm((prev) => ({ ...prev, caption: event.target.value }))}
                    rows={7}
                    maxLength={1200}
                    placeholder="Write a caption..."
                    className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-950 shadow-inner transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100"
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-slate-500">Posts with context and visuals tend to get stronger candidate response.</span>
                    <span className="shrink-0 font-bold text-slate-500">{postForm.caption.length}/1200</span>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="company-post-media" className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                      <ImagePlus className="h-4 w-4 text-sky-600" strokeWidth={2.4} />
                      Media
                    </label>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                      {postPreviewMediaItems.length ? `${postPreviewMediaItems.length}/15 added` : 'Optional'}
                    </span>
                  </div>
                  <label
                    htmlFor="company-post-media"
                    className={`mt-4 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 text-center transition hover:border-sky-400 hover:bg-sky-50 ${
                      postPreviewMediaItems.length ? 'p-2' : 'px-4 py-10'
                    }`}
                  >
                    {postPreviewMediaItems.length ? (
                      <div className="w-full">
                        <div className={`grid gap-2 ${postPreviewMediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                          {postPreviewMediaItems.map((item, index) => (
                            <div key={`${item.url}-${index}`} className="relative overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                              {item.type === 'video' ? (
                                <video src={item.url} className="max-h-[360px] w-full bg-slate-950 object-contain" controls playsInline />
                              ) : (
                                <img src={item.url} alt="" className="aspect-square w-full object-cover" />
                              )}
                              <span className="absolute left-2 top-2 rounded-md bg-slate-950/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                                {item.type === 'video' ? 'Video' : 'Image'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between gap-3 px-3 py-3 text-xs text-slate-600">
                          <span className="truncate font-semibold">{postForm.media.length} selected</span>
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-black text-sky-700 shadow-sm">
                            <Upload className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Change media
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm">
                          <Upload className="h-7 w-7" strokeWidth={2.1} />
                        </span>
                        <span className="mt-4 text-sm font-black text-slate-900">Drop in polished visuals</span>
                        <span className="mt-1 max-w-md text-xs leading-5 text-slate-500">Upload up to 15 JPG, PNG, WEBP, GIF, MP4, WEBM, or MOV files up to 100MB each.</span>
                      </>
                    )}
                  </label>
                  <input
                    id="company-post-media"
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={handlePostMediaChange}
                    className="sr-only"
                  />
                </section>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-semibold text-slate-500">Your post appears in the company feed after publishing.</p>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => {
                        if (postSaving) return
                        setShowCreatePost(false)
                        setPostError('')
                        setPostMessage('')
                        setPostForm({ caption: '', media: [] })
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={postSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      <Send className="h-4 w-4" strokeWidth={2.5} />
                      {postSaving ? 'Publishing...' : 'Publish Post'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
      <style jsx>{`
        @keyframes dropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-animate {
          animation: dropdownIn 180ms ease-out;
        }

        .tab-pill {
          transform-origin: center;
          transition: transform 200ms ease-out, background-color 200ms ease-out, opacity 200ms ease-out;
        }

        .tab-pill:hover {
          transform: scale(1.01);
        }

        .tab-pill-active {
          animation: tabPop 200ms ease-out;
        }

        @keyframes tabPop {
          from {
            opacity: 0.92;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tab-pill,
          .tab-pill:hover,
          .tab-pill-active {
            animation: none;
            transform: none;
            transition: none;
          }
        }
      `}</style>
  </>
  )
}


