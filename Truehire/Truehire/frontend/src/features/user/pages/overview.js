import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { Home, Search, Send } from 'lucide-react'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'
import FriendSuggestions from '../../../components/FriendSuggestions'

const ACTIVITY_STORAGE_KEY = 'recentActivityLog'
const BOOKMARK_IDS_KEY = 'bookmarkedJobs'

const normalizeBookmarkIds = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      if (entry && typeof entry === 'object') return String(entry.id ?? entry.jobId ?? '')
      return String(entry)
    })
    .filter((id) => id && id !== 'undefined' && id !== 'null')
}

const normalizeBoolean = (value) => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  if (typeof value === 'string') return ['1', 'true', 'yes'].includes(value.toLowerCase())
  return false
}

const normalizeComment = (comment) => ({
  ...comment,
  liked: normalizeBoolean(comment?.liked),
  like_count: Number(comment?.like_count || 0)
})

const normalizeSkillList = (...values) => {
  const skills = []

  values.forEach((value) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item && typeof item === 'object') {
          skills.push(item.name || item.skill || item.title || '')
          return
        }
        skills.push(item)
      })
      return
    }

    if (typeof value === 'string') {
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => skills.push(item))
      return
    }

    if (typeof value === 'object') {
      Object.values(value).forEach((item) => skills.push(item))
    }
  })

  return Array.from(
    new Map(
      skills
        .map((skill) => String(skill || '').trim())
        .filter(Boolean)
        .map((skill) => [skill.toLowerCase(), skill])
    ).values()
  )
}

const normalizeCount = (...values) => {
  for (const value of values) {
    const number = Number(value)
    if (Number.isFinite(number)) return number
  }
  return 0
}

const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Razorpay checkout is only available in the browser.'))
      return
    }

    if (window.Razorpay) {
      resolve(window.Razorpay)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(window.Razorpay)
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout.'))
    document.body.appendChild(script)
  })

export default function Overview() {
  const { user, loading, logout } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [jobs, setJobs] = useState([])
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [recommendedJobsLoading, setRecommendedJobsLoading] = useState(false)
  const [recommendedJobsError, setRecommendedJobsError] = useState('')
  const [applicationCount, setApplicationCount] = useState(0)
  const [savedJobCount, setSavedJobCount] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [notifications, setNotifications] = useState([])
  const [connectionStats, setConnectionStats] = useState({ followingCount: 0, followersCount: 0 })
  const [followListType, setFollowListType] = useState(null)
  const [followListUsers, setFollowListUsers] = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationClock, setNotificationClock] = useState(Date.now())
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [markingNotificationId, setMarkingNotificationId] = useState(null)
  const [friendRequestActionId, setFriendRequestActionId] = useState(null)
  const [followBackActionId, setFollowBackActionId] = useState(null)
  const [messagePremiumTarget, setMessagePremiumTarget] = useState(null)
  const [messagePremiumLoading, setMessagePremiumLoading] = useState(false)
  const [messagePremiumPaying, setMessagePremiumPaying] = useState(false)
  const [messagePremiumError, setMessagePremiumError] = useState('')
  const [clearingNotifications, setClearingNotifications] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showExperienceMenu, setShowExperienceMenu] = useState(false)
  const [showProfileTabs, setShowProfileTabs] = useState(false)
  const [activeProfileTab, setActiveProfileTab] = useState('posts')
  const [userPosts, setUserPosts] = useState([])
  const [userPostsLoading, setUserPostsLoading] = useState(false)
  const [userPostsError, setUserPostsError] = useState('')
  const [userPostCaption, setUserPostCaption] = useState('')
  const [userPostMedia, setUserPostMedia] = useState([])
  const [showUserPostComposer, setShowUserPostComposer] = useState(false)
  const [userPostActionId, setUserPostActionId] = useState(null)
  const [userPostCommentDrafts, setUserPostCommentDrafts] = useState({})
  const [userPostCommentsByPost, setUserPostCommentsByPost] = useState({})
  const [openUserPostCommentsId, setOpenUserPostCommentsId] = useState(null)
  const [selectedUserPostTile, setSelectedUserPostTile] = useState(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [feedPosts, setFeedPosts] = useState([])
  const [feedOffset, setFeedOffset] = useState(0)
  const [feedHasMore, setFeedHasMore] = useState(true)
  const [feedLoading, setFeedLoading] = useState(false)
  const [feedError, setFeedError] = useState('')
  const [feedActionId, setFeedActionId] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyingToByPost, setReplyingToByPost] = useState({})
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({})
  const [openCommentPostId, setOpenCommentPostId] = useState(null)
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentsLoadingId, setCommentsLoadingId] = useState(null)
  const [viewedVideoPostIds, setViewedVideoPostIds] = useState({})
  const [companyStatuses, setCompanyStatuses] = useState([])
  const [statusesLoading, setStatusesLoading] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(null)
  const [statusViewerLoading, setStatusViewerLoading] = useState(false)
  const [likeBurstPostIds, setLikeBurstPostIds] = useState({})
  const [shareTargetPost, setShareTargetPost] = useState(null)
  const [shareConversations, setShareConversations] = useState([])
  const [shareConversationQuery, setShareConversationQuery] = useState('')
  const [selectedShareConversationIds, setSelectedShareConversationIds] = useState([])
  const [shareConversationsLoading, setShareConversationsLoading] = useState(false)
  const [shareSending, setShareSending] = useState(false)
  const [shareError, setShareError] = useState('')
  const [shareNotice, setShareNotice] = useState('')
  const router = useRouter()
  const notificationsButtonRef = useRef(null)
  const notificationsPanelRef = useRef(null)
  const menuButtonRef = useRef(null)
  const menuPanelRef = useRef(null)
  const experienceButtonRef = useRef(null)
  const experienceMenuRef = useRef(null)
  const feedSentinelRef = useRef(null)
  const lastFeedMediaTapRef = useRef({})
  const userPostFileInputRef = useRef(null)
  const userPostViewerScrollRef = useRef(null)
  const userPostTouchStartXRef = useRef(null)
  const pulsePostFocusRef = useRef('')

  const userPostMediaPreviews = useMemo(() => (
    userPostMedia.map((file, index) => ({
      file,
      index,
      url: URL.createObjectURL(file),
      type: file.type?.startsWith('video/') ? 'video' : 'image'
    }))
  ), [userPostMedia])

  useEffect(() => {
    return () => {
      userPostMediaPreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [userPostMediaPreviews])

  const smartSuggestionData = useMemo(() => {
    const candidates = notifications
      .filter((notification) => notification?.metadata?.type === 'smart_suggestion')
      .map((notification) => ({
        notice: notification.message,
        createdAt: notification.createdAt,
        jobs: Array.isArray(notification.metadata?.jobs) ? notification.metadata.jobs : []
      }))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const latest = candidates[0] || null;
    return {
      notice: latest?.notice || null,
      jobs: latest?.jobs || []
    };
  }, [notifications])

  const filteredShareConversations = useMemo(() => {
    const normalizedQuery = shareConversationQuery.trim().toLowerCase()
    if (!normalizedQuery) return shareConversations

    return shareConversations.filter((conversation) => {
      const other = conversation.otherUser || {}
      return [other.name, conversation.lastMessage]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    })
  }, [shareConversationQuery, shareConversations])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      setIsLoading(false)
      loadJobs()
      loadRecommendedJobs()
      loadOverviewCounts()
      loadRecentActivity()
      loadFeed({ reset: true })
      loadCompanyStatuses()
      loadConnectionStats()
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const refreshFollowStats = () => {
      loadConnectionStats()
      loadFeed({ reset: true })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshFollowStats()
    }

    window.addEventListener('focus', refreshFollowStats)
    window.addEventListener('follow-stats-changed', refreshFollowStats)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', refreshFollowStats)
      window.removeEventListener('follow-stats-changed', refreshFollowStats)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user])

  // Capture clicks on this page and log them as recent activity
  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target.closest('button, a')
      if (!target) return
      const text = (target.innerText || target.getAttribute('aria-label') || 'Action').trim()
      if (!text) return
      recordActivity(text, 'User interaction')
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  async function loadJobs() {
    try {
      const response = await apiService.request('/jobs?limit=20')
      if (response.jobs) {
        setJobs(response.jobs)
      }
    } catch (error) {
      console.error('Error loading jobs:', error)
    }
  }

  async function loadRecommendedJobs() {
    setRecommendedJobsLoading(true)
    setRecommendedJobsError('')
    try {
      const response = await apiService.request('/jobs/recommended', {
        returnErrorObject: true
      })

      if (response?.error) {
        throw new Error(response.message || response.error)
      }

      setRecommendedJobs(Array.isArray(response?.jobs) ? response.jobs : [])
    } catch (error) {
      console.error('Error loading recommended jobs:', error)
      setRecommendedJobs([])
      setRecommendedJobsError(error?.message || 'Unable to load recommended jobs.')
    } finally {
      setRecommendedJobsLoading(false)
    }
  }

  async function loadOverviewCounts() {
    try {
      const applicationsResponse = await apiService.request('/jobs/user/applications', {
        returnErrorObject: true
      })

      if (applicationsResponse?.success && Array.isArray(applicationsResponse.applications)) {
        setApplicationCount(applicationsResponse.applications.length)
      } else {
        setApplicationCount(0)
      }
    } catch (error) {
      console.error('Error loading applications count:', error)
      setApplicationCount(0)
    }

    if (typeof window === 'undefined') return

    try {
      const rawBookmarks = localStorage.getItem(BOOKMARK_IDS_KEY) || '[]'
      const parsedBookmarks = JSON.parse(rawBookmarks)
      setSavedJobCount(normalizeBookmarkIds(parsedBookmarks).length)
    } catch (error) {
      console.error('Error loading saved jobs count:', error)
      setSavedJobCount(0)
    }
  }

  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return null
    const now = new Date(notificationClock)
    const then = new Date(timestamp)
    if (Number.isNaN(then.getTime())) return null
    const diffMs = now - then
    const seconds = Math.max(0, Math.floor(diffMs / 1000))
    const minutes = Math.floor(diffMs / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const formatMemberSince = (profile) => {
    const dateValue = profile?.created_at || profile?.createdAt
    if (!dateValue) return 'Not available'
    const parsed = new Date(dateValue)
    if (Number.isNaN(parsed.getTime())) return 'Not available'
    return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  const apiOrigin = (apiService?.baseURL || '').replace(/\/api$/, '').replace(/\/+$/, '')
  const apiWithPrefix = (apiService?.baseURL || '').replace(/\/+$/, '')
  const getCompanyManagePostsHref = (companyId) => (
    companyId ? `/manage-posts?companyId=${encodeURIComponent(companyId)}` : ''
  )
  const [fetchedPhoto, setFetchedPhoto] = useState(null)
  const storedUser = useMemo(() => {
    try {
      return apiService.getUserData ? apiService.getUserData() : null
    } catch (e) {
      return null
    }
  }, [])

  useEffect(() => {
    const hydratePhoto = async () => {
      if (!user || user.profile_photo || user.profilePhoto || fetchedPhoto) return
      try {
        const profile = await apiService.getProfile()
        const apiPhoto =
          profile?.user?.profile_photo || profile?.user?.profilePhoto || profile?.user?.photo
        if (apiPhoto) {
          setFetchedPhoto(apiPhoto)
        }
      } catch (e) {
        // ignore; fallback will handle
      }
    }
    hydratePhoto()
  }, [user, fetchedPhoto])

  const resolvedPhotoPath = fetchedPhoto
    || user?.photoUrl
    || user?.profile_photo
    || user?.profilePhoto
    || storedUser?.photoUrl
    || storedUser?.profile_photo
    || storedUser?.profilePhoto
    || null
  const normalizedPath = resolvedPhotoPath
    ? resolvedPhotoPath.startsWith('http')
      ? resolvedPhotoPath
      : `${resolvedPhotoPath.startsWith('/') ? '' : '/'}${resolvedPhotoPath}`
    : null

  const photoCandidates = useMemo(() => {
    if (!normalizedPath) return []
    if (normalizedPath.startsWith('http')) return [normalizedPath]

    const candidates = []
    if (apiOrigin) candidates.push(`${apiOrigin}${normalizedPath}`)
    if (apiWithPrefix && apiWithPrefix !== apiOrigin) candidates.push(`${apiWithPrefix}${normalizedPath}`)
    candidates.push(normalizedPath)
    return Array.from(new Set(candidates))
  }, [normalizedPath, apiOrigin, apiWithPrefix])

  const [photoSrc, setPhotoSrc] = useState(null)

  useEffect(() => {
    setPhotoSrc(photoCandidates[0] || null)
  }, [photoCandidates])

  const readStoredActivity = () => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (err) {
      console.warn('Error reading stored activity:', err)
      return []
    }
  }

  const persistActivity = (items) => {
    try {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.warn('Error storing activity:', err)
    }
  }

  const dedupeAndTrim = (items) => {
    const byKey = new Map()
    items.forEach((item) => {
      const key = `${item.title || ''}::${item.description || ''}`
      const existing = byKey.get(key)
      if (!existing || (item.timestamp || 0) > (existing.timestamp || 0)) {
        byKey.set(key, item)
      }
    })
    return Array.from(byKey.values())
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 5)
  }

  const recordActivity = (title, description = '') => {
    const newItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title || 'Activity',
      description,
      timestamp: Date.now()
    }
    setRecentActivity((prev) => {
      const combined = dedupeAndTrim([newItem, ...prev])
      persistActivity(combined)
      return combined
    })
  }

  async function loadRecentActivity() {
    setActivityLoading(true)
    const stored = readStoredActivity()
    const cleaned = dedupeAndTrim(stored)
    setRecentActivity(cleaned)
    setActivityLoading(false)
  }

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!user) return
    if (!silent) setNotificationsLoading(true)
    try {
      const [listResponse, unreadResponse, pendingResponse] = await Promise.all([
        apiService.request('/notifications', { returnErrorObject: true }),
        apiService.request('/notifications/unread-count', { returnErrorObject: true }),
        apiService.request('/connections/pending', { returnErrorObject: true })
      ])

      if (listResponse && listResponse.success) {
        const notificationRows = Array.isArray(listResponse.notifications) ? listResponse.notifications : []
        const pendingRequests = Array.isArray(pendingResponse?.data) ? pendingResponse.data : []
        const existingFriendRequestIds = new Set(
          notificationRows
            .filter((notification) => notification?.metadata?.type === 'FRIEND_REQUEST')
            .map((notification) => String(notification.metadata?.requestId || ''))
            .filter(Boolean)
        )
        const fallbackFriendRequestNotifications = pendingRequests
          .filter((request) => !existingFriendRequestIds.has(String(request.id)))
          .map((request) => ({
            id: `pending-request-${request.id}`,
            message: `${request.sender_name || 'Someone'} sent you a friend request.`,
            metadata: {
              type: 'FRIEND_REQUEST',
              title: 'New friend request',
              requestId: String(request.id),
              senderId: String(request.sender_id),
              senderName: request.sender_name || 'TrueHire user'
            },
            status: 'unread',
            createdAt: request.created_at
          }))

        const visibleNotifications = [...fallbackFriendRequestNotifications, ...notificationRows]
        const hydratedNotifications = await Promise.all(
          visibleNotifications.map(async (notification) => {
            const metadata = notification?.metadata || {}
            if (metadata.type !== 'FOLLOW_BACK' || !metadata.targetUserId) return notification

            const [status, profile] = await Promise.all([
              apiService.request(`/follows/status/${metadata.targetUserId}`, {
                returnErrorObject: true
              }),
              apiService.getPublicUserProfile(metadata.targetUserId)
            ])

            return {
              ...notification,
              metadata: {
                ...metadata,
                following: Boolean(status?.data?.following),
                targetUserPhoto: profile?.user?.profile_photo || null
              }
            }
          })
        )
        setNotifications(hydratedNotifications)
      } else {
        console.warn('Unable to load notifications:', listResponse)
      }

      if (unreadResponse && unreadResponse.success) {
        setUnreadNotificationCount(unreadResponse.unreadCount ?? 0)
      } else {
        setUnreadNotificationCount(listResponse?.unreadCount ?? 0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      if (!silent) setNotificationsLoading(false)
    }
  }, [user])

  const handleNotificationBellClick = () => {
    setShowNotifications((prev) => {
      const next = !prev
      if (next) loadNotifications()
      return next
    })
  }

  const handleMarkNotificationRead = async (notificationId) => {
    if (!notificationId) return
    setMarkingNotificationId(notificationId)
    try {
      const response = await apiService.request(`/notifications/${notificationId}/read`, {
        method: 'PATCH',
        returnErrorObject: true
      })
      if (response && response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, status: 'read' } : notification
          )
        )
        setUnreadNotificationCount(
          response.unreadCount != null
            ? response.unreadCount
            : Math.max(unreadNotificationCount - 1, 0)
        )
      } else {
        console.warn('Failed to mark notification as read:', response)
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    } finally {
      setMarkingNotificationId(null)
    }
  }

  const handleClearNotifications = async () => {
    setClearingNotifications(true)
    try {
      const response = await apiService.request('/notifications/read-all', {
        method: 'PATCH',
        returnErrorObject: true
      })
      if (response && response.success) {
        setNotifications(response.notifications || [])
        setUnreadNotificationCount(response.unreadCount ?? 0)
      } else {
        console.warn('Failed to clear notifications:', response)
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
    } finally {
      setClearingNotifications(false)
    }
  }

  const handleNotificationNavigate = (notification) => {
    const metadata = notification?.metadata || {}
    const entityId = metadata?.entityId || metadata?.entity_id
    const entityType = String(metadata?.entityType || metadata?.entity_type || '').toUpperCase()

    if (metadata?.type === 'DIRECT_MESSAGE' && metadata?.conversationId) {
      router.push(`/messages?conversationId=${metadata.conversationId}`)
      setShowNotifications(false)
      return
    }

    if (entityType === 'JOB' && entityId) {
      router.push(`/jobs/${entityId}/apply`)
      setShowNotifications(false)
      return
    }

    if (notification?.applicationId) {
      router.push('/applications')
      setShowNotifications(false)
    }
  }

  async function loadConnectionStats() {
    try {
      const [response, followedCompaniesResponse] = await Promise.all([
        apiService.getConnectionStats(),
        apiService.getFollowedCompanies(),
      ])

      if (response?.success) {
        const followedCompaniesCount = Array.isArray(followedCompaniesResponse?.companies)
          ? followedCompaniesResponse.companies.length
          : Number(response.data?.followedCompaniesCount || 0)
        const followingUsersCount = Number(
          response.data?.followingUsersCount ?? response.data?.followingCount ?? 0
        )

        setConnectionStats({
          followingCount: followingUsersCount + followedCompaniesCount,
          followersCount: Number(response.data?.followersCount || 0)
        })
      }
    } catch (error) {
      console.error('Error loading connection stats:', error)
    }
  }

  const openFollowList = async (type) => {
    setFollowListType(type)
    setFollowListUsers([])
    setFollowListLoading(true)
    try {
      if (type === 'following') {
        const [usersResponse, companiesResponse] = await Promise.all([
          apiService.getFollowList(type),
          apiService.getFollowedCompanies(),
        ])
        const followedUsers = Array.isArray(usersResponse?.data)
          ? usersResponse.data.map((item) => ({ ...item, followType: 'user' }))
          : []
        const followedCompanies = Array.isArray(companiesResponse?.companies)
          ? companiesResponse.companies.map((company) => ({
              ...company,
              followType: 'company',
              name: company.company_name || company.company || 'Company',
              profileImage: company.company_logo || null,
            }))
          : []
        setFollowListUsers([...followedUsers, ...followedCompanies])
      } else {
        const response = await apiService.getFollowList(type)
        setFollowListUsers(Array.isArray(response?.data)
          ? response.data.map((item) => ({ ...item, followType: 'user' }))
          : [])
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error)
      setFollowListUsers([])
    } finally {
      setFollowListLoading(false)
    }
  }

  const openDirectUserMessage = async (userId) => {
    const response = await apiService.request(`/messages/conversation/${userId}`, {
      method: 'POST',
      returnErrorObject: true,
    })
    if (response?.error) return
    setFollowListType(null)
    router.push(`/messages?conversationId=${response.conversationId}`)
  }

  const getCompanyMessageTarget = (company) => {
    const id = company?.company_id || company?.recruiter_id || company?.id || company?.companyId || company?.recruiterId
    if (!id) return null
    return {
      id: String(id),
      name: company?.company_name || company?.company || company?.name || 'Company',
      logo: company?.company_logo || company?.profileImage || null,
    }
  }

  const openCompanyMessageConversation = async (companyId) => {
    const response = await apiService.openCompanyMessageConversation(companyId)
    if (response?.error) {
      if (response.status === 402 || response?.details?.requiresPayment) return { requiresPayment: true }
      throw new Error(response.message || 'Unable to open recruiter chat.')
    }
    const conversationId = response?.conversationId || response?.data?.conversationId || response?.conversation?.id
    if (!conversationId) throw new Error('Unable to open recruiter chat.')
    setFollowListType(null)
    setMessagePremiumTarget(null)
    await router.push(`/messages/direct/${conversationId}`)
    return { opened: true, conversationId: String(conversationId) }
  }

  const openCompanyMessage = async (company) => {
    const target = getCompanyMessageTarget(company)
    if (!target || messagePremiumLoading || messagePremiumPaying) return

    setMessagePremiumLoading(true)
    setMessagePremiumError('')
    try {
      const status = await apiService.getCompanyMessageAccessStatus(target.id)
      if (status?.error && status.status !== 404) throw new Error(status.message || 'Unable to check messaging access.')

      if (status?.access?.isActive) {
        await openCompanyMessageConversation(target.id)
        return
      }

      await startCompanyMessagePayment(target)
    } catch (error) {
      setMessagePremiumError(error.message || 'Unable to start recruiter messaging.')
    } finally {
      setMessagePremiumLoading(false)
    }
  }

  const startCompanyMessagePayment = async (targetOverride = null) => {
    const target = targetOverride || messagePremiumTarget
    if (!target || messagePremiumPaying) return

    setMessagePremiumPaying(true)
    setMessagePremiumTarget(null)
    setMessagePremiumError('')
    try {
      const order = await apiService.createCompanyMessageOrder(target.id)
      if (order?.error) throw new Error(order.message || 'Unable to create payment order.')

      if (order?.alreadyActive) {
        await openCompanyMessageConversation(target.id)
        setMessagePremiumTarget(null)
        return
      }

      if (!order?.key || !order?.orderId) {
        throw new Error('Payment setup is incomplete. Please try again.')
      }

      const RazorpayCheckout = await loadRazorpayCheckout()
      const checkout = new RazorpayCheckout({
        key: order.key,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'TrueHire Premium',
        description: `Message ${target.name}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name || storedUser?.name || '',
          email: user?.email || storedUser?.email || '',
        },
        notes: {
          planId: 'company-message-premium',
          companyId: target.id,
        },
        handler: async (response) => {
          try {
            const verification = await apiService.verifyCompanyMessagePayment({
              companyId: target.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })

            if (verification?.error || !verification?.success) {
              throw new Error(verification?.message || 'Payment verification failed.')
            }

            await openCompanyMessageConversation(target.id)
            setMessagePremiumTarget(null)
          } catch (error) {
            setMessagePremiumError(error.message || 'Payment completed, but chat could not be opened.')
          } finally {
            setMessagePremiumPaying(false)
          }
        },
        modal: {
          ondismiss: () => {
            setMessagePremiumPaying(false)
          },
        },
      })

      checkout.open()
    } catch (error) {
      setMessagePremiumError(error.message || 'Unable to open payment checkout.')
      setMessagePremiumPaying(false)
    }
  }

  const followUserFromList = async (userId) => {
    const response = await apiService.followUser(userId)
    if (response?.error) return
    setFollowListUsers((items) => items.map((item) => (
      item.followType === 'user' && String(item.id) === String(userId)
        ? { ...item, viewerFollowing: true }
        : item
    )))
    await loadConnectionStats()
    window.dispatchEvent(new Event('follow-stats-changed'))
  }

  const handleFriendRequestAction = async (notification, action) => {
    const requestId = notification?.metadata?.requestId
    if (!requestId) return

    setFriendRequestActionId(`${action}-${requestId}`)
    try {
      const endpoint =
        action === 'accept'
          ? `/connections/accept/${requestId}`
          : `/connections/reject/${requestId}`

      const response = await apiService.request(endpoint, {
        method: 'POST',
        returnErrorObject: true
      })

      if (!response?.success) {
        console.warn('Failed to update friend request:', response)
        return
      }

      if (!String(notification.id).startsWith('pending-request-')) {
        await apiService.request(`/notifications/${notification.id}/read`, {
          method: 'PATCH',
          returnErrorObject: true
        })
      }

      if (action === 'accept') {
        await loadConnectionStats()
        await loadNotifications()
      } else {
        setNotifications((prev) => prev.filter((item) => item.id !== notification.id))
        setUnreadNotificationCount((count) => Math.max(count - (notification.status === 'read' ? 0 : 1), 0))
      }
    } catch (error) {
      console.error('Error updating friend request:', error)
    } finally {
      setFriendRequestActionId(null)
    }
  }

  const handleFollowBack = async (notification) => {
    const targetUserId = notification?.metadata?.targetUserId
    if (!targetUserId) return
    setFollowBackActionId(targetUserId)
    try {
      const response = await apiService.followUser(targetUserId)
      if (response?.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === notification.id
              ? { ...item, metadata: { ...item.metadata, following: true } }
              : item
          )
        )
        await loadConnectionStats()
      }
    } catch (error) {
      console.error('Error following back:', error)
    } finally {
      setFollowBackActionId(null)
    }
  }

  const normalizeFeedPosts = (posts = []) => posts.map((post) => ({
    ...post,
    id: String(post.id),
    post_type: post.post_type || 'company',
    company_id: String(post.company_id || post.recruiter_id || ''),
    media: Array.isArray(post.media) ? post.media : [],
    like_count: Number(post.like_count || 0),
    comment_count: Number(post.comment_count || 0),
    view_count: Number(post.view_count || 0),
    liked: normalizeBoolean(post.liked),
    following: Boolean(post.following)
  }))

  const loadFeed = useCallback(async ({ reset = false } = {}) => {
    if (!user || feedLoading) return
    const nextOffset = reset ? 0 : feedOffset
    if (!reset && !feedHasMore) return

    setFeedLoading(true)
    setFeedError('')
    try {
      const [response, followedUserPostsResponse] = await Promise.all([
        apiService.request(`/user/feed?limit=6&offset=${nextOffset}`, {
          returnErrorObject: true
        }),
        apiService.request(`/user/following-posts?limit=6&offset=${nextOffset}`, {
          returnErrorObject: true
        }),
      ])

      if (response?.error) {
        throw new Error(response.message || response.error)
      }
      if (followedUserPostsResponse?.error) {
        throw new Error(followedUserPostsResponse.message || followedUserPostsResponse.error)
      }

      const nextPosts = normalizeFeedPosts([
        ...(response.posts || []),
        ...(followedUserPostsResponse.posts || []),
      ])
      setFeedPosts((current) => {
        const merged = reset ? nextPosts : [...current, ...nextPosts]
        const byId = new Map()
        merged.forEach((post) => byId.set(`${post.post_type || 'company'}:${post.id}`, post))
        return Array.from(byId.values()).sort((a, b) => {
          const firstTime = new Date(a.created_at || 0).getTime()
          const secondTime = new Date(b.created_at || 0).getTime()
          if (firstTime !== secondTime) return secondTime - firstTime
          return Number(b.id || 0) - Number(a.id || 0)
        })
      })
      setFeedOffset(response.nextOffset ?? nextOffset + nextPosts.length)
      setFeedHasMore(Boolean(response.hasMore || followedUserPostsResponse.hasMore))
    } catch (error) {
      console.error('Error loading post feed:', error)
      setFeedError(error?.message || 'Unable to load posts.')
    } finally {
      setFeedLoading(false)
    }
  }, [feedHasMore, feedLoading, feedOffset, user])

  const normalizeStatusMediaUrl = (value) => {
    if (!value) return ''
    if (String(value).startsWith('http')) return value
    return `${apiOrigin || ''}${String(value).startsWith('/') ? '' : '/'}${value}`
  }

  const isVideoMedia = (mediaType, mediaUrl = '') => {
    const type = String(mediaType || '').toLowerCase()
    const url = String(mediaUrl || '').toLowerCase()
    return type.includes('video') || type.includes('reel') || /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)
  }

  const getFeedPostMediaItems = (post) => {
    const rawItems = Array.isArray(post.media) && post.media.length
      ? post.media
      : Array.isArray(post.media_urls) && post.media_urls.length
        ? post.media_urls
        : Array.isArray(post.mediaUrls) && post.mediaUrls.length
          ? post.mediaUrls
          : post.media_url
            ? [{ media_url: post.media_url, media_type: post.media_type }]
            : []

    return rawItems
      .map((item) => {
        const mediaUrl = typeof item === 'string' ? item : item.media_url || item.url || item.path
        if (!mediaUrl) return null
        const mediaType = typeof item === 'string' ? post.media_type : item.media_type || item.type || post.media_type
        const url = normalizeStatusMediaUrl(mediaUrl)
        return {
          url,
          type: isVideoMedia(mediaType, mediaUrl) ? 'video' : 'image'
        }
      })
      .filter(Boolean)
  }

  const loadCompanyStatuses = async () => {
    setStatusesLoading(true)
    try {
      const response = await apiService.request('/user/statuses', { returnErrorObject: true })
      if (!response?.error) {
        setCompanyStatuses(Array.isArray(response.statuses) ? response.statuses : [])
      }
    } catch (error) {
      console.error('Error loading company statuses:', error)
    } finally {
      setStatusesLoading(false)
    }
  }

  const openStatusViewer = async (status) => {
    setSelectedStatus(status)
    setStatusViewerLoading(true)
    try {
      const response = await apiService.request(`/user/statuses/${status.id}`, { returnErrorObject: true })
      if (!response?.error && response.status) {
        setSelectedStatus(response.status)
      }
      await apiService.request(`/user/statuses/${status.id}/view`, {
        method: 'POST',
        returnErrorObject: true
      })
      setCompanyStatuses((current) => current.map((item) => (
        item.id === status.id ? { ...item, viewed: true } : item
      )))
    } catch (error) {
      console.error('Error opening status:', error)
    } finally {
      setStatusViewerLoading(false)
    }
  }

  const statusByCompanyId = useMemo(() => {
    const map = new Map()
    companyStatuses.forEach((status) => {
      const companyId = status?.company_id != null ? String(status.company_id) : ''
      if (!companyId || map.has(companyId)) return
      map.set(companyId, status)
    })
    return map
  }, [companyStatuses])

  useEffect(() => {
    if (!feedSentinelRef.current || !feedHasMore || !user) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        loadFeed()
      }
    }, { rootMargin: '420px 0px' })

    observer.observe(feedSentinelRef.current)
    return () => observer.disconnect()
  }, [feedHasMore, loadFeed, user])

  useEffect(() => {
    const targetPostId = String(router.query.pulsePost || '')
    if (!targetPostId || !user) return

    const target = document.querySelector(`[data-pulse-post-id="${targetPostId}"]`)
    if (target) {
      if (pulsePostFocusRef.current !== targetPostId) {
        pulsePostFocusRef.current = targetPostId
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' })
        })
      }
      return
    }

    if (feedHasMore && !feedLoading) {
      loadFeed()
    }
  }, [feedHasMore, feedLoading, feedPosts, loadFeed, router.query.pulsePost, user])

  const getUserPostMediaItems = (post) => {
    const rawItems = Array.isArray(post?.media) && post.media.length
      ? post.media
      : post?.media_url
        ? [{ media_url: post.media_url, media_type: post.media_type }]
        : []

    return rawItems
      .map((item) => {
        const mediaUrl = typeof item === 'string' ? item : item.media_url || item.url || item.path
        if (!mediaUrl) return null
        const mediaType = typeof item === 'string' ? post.media_type : item.media_type || item.type || post.media_type
        const url = normalizeStatusMediaUrl(mediaUrl)
        return {
          url,
          type: isVideoMedia(mediaType, mediaUrl) ? 'video' : 'image'
        }
      })
      .filter(Boolean)
  }

  const loadUserPosts = useCallback(async (type = activeProfileTab) => {
    if (!user) return
    setUserPostsLoading(true)
    setUserPostsError('')
    try {
      const postType = type === 'posts' ? 'all' : type || 'all'
      const response = await apiService.request(`/user/posts?type=${encodeURIComponent(postType)}`, {
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPosts(Array.isArray(response.posts) ? response.posts.map((post) => ({
        ...post,
        liked: normalizeBoolean(post.liked),
        like_count: Number(post.like_count || 0),
        comment_count: Number(post.comment_count || 0),
        share_count: Number(post.share_count || 0)
      })) : [])
    } catch (error) {
      setUserPosts([])
      setUserPostsError(error?.message || 'Unable to load profile posts.')
    } finally {
      setUserPostsLoading(false)
    }
  }, [activeProfileTab, user])

  useEffect(() => {
    if (showProfileTabs) {
      loadUserPosts(activeProfileTab)
    }
  }, [activeProfileTab, loadUserPosts, showProfileTabs])

  const handleUserPostMediaChange = (event) => {
    const files = Array.from(event.target.files || [])
    setUserPostMedia((current) => {
      return [...current, ...files].slice(0, 15)
    })
    event.target.value = ''
  }

  const openUserPostPicker = () => {
    userPostFileInputRef.current?.click()
  }

  const handleCreateUserPost = async () => {
    const caption = userPostCaption.trim()
    if (!caption && !userPostMedia.length) return

    const formData = new FormData()
    formData.append('caption', caption)
    userPostMedia.forEach((file) => formData.append('media[]', file))

    setUserPostActionId('create')
    try {
      const response = await apiService.request('/user/posts', {
        method: 'POST',
        body: formData,
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPostCaption('')
      setUserPostMedia([])
      setShowUserPostComposer(false)
      setActiveProfileTab('posts')
      if (response?.post) {
        setUserPosts((current) => [response.post, ...current])
      }
      await loadUserPosts('posts')
    } catch (error) {
      setUserPostsError(error?.message || 'Unable to create post.')
    } finally {
      setUserPostActionId(null)
    }
  }

  const updateUserPost = (postId, updater) => {
    setUserPosts((current) => current.map((post) => (
      String(post.id) === String(postId) ? updater(post) : post
    )))
    setFeedPosts((current) => current.map((post) => (
      post.post_type === 'user' && String(post.id) === String(postId) ? updater(post) : post
    )))
  }

  const handleLikeUserPost = async (post) => {
    const postId = String(post.id)
    setUserPostActionId(`like-${postId}`)
    const wasLiked = normalizeBoolean(post.liked)
    updateUserPost(postId, (current) => ({
      ...current,
      liked: !wasLiked,
      like_count: Math.max(0, Number(current.like_count || 0) + (wasLiked ? -1 : 1))
    }))
    try {
      const response = await apiService.request(`/user/posts/${postId}/like`, {
        method: 'POST',
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      updateUserPost(postId, (current) => ({
        ...current,
        liked: normalizeBoolean(response.liked)
      }))
    } catch (_error) {
      updateUserPost(postId, (current) => ({
        ...current,
        liked: wasLiked,
        like_count: Math.max(0, Number(current.like_count || 0) + (wasLiked ? 1 : -1))
      }))
    } finally {
      setUserPostActionId(null)
    }
  }

  const loadUserPostComments = async (postId) => {
    setUserPostActionId(`comments-${postId}`)
    try {
      const response = await apiService.request(`/user/posts/${postId}/comments`, {
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPostCommentsByPost((current) => ({
        ...current,
        [postId]: Array.isArray(response.comments) ? response.comments.map(normalizeComment) : []
      }))
    } finally {
      setUserPostActionId(null)
    }
  }

  const handleToggleUserPostComments = (post) => {
    const postId = String(post.id)
    setOpenUserPostCommentsId((current) => current === postId ? null : postId)
    if (!userPostCommentsByPost[postId]) loadUserPostComments(postId)
  }

  const handleAddUserPostComment = async (post) => {
    const postId = String(post.id)
    const comment = String(userPostCommentDrafts[postId] || '').trim()
    if (!comment) return
    setUserPostActionId(`comment-${postId}`)
    try {
      const response = await apiService.request(`/user/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ comment }),
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPostCommentDrafts((current) => ({ ...current, [postId]: '' }))
      setUserPostCommentsByPost((current) => ({
        ...current,
        [postId]: [
          ...(current[postId] || []),
          {
            ...(response.comment || {}),
            comment,
            user_name: user?.name || 'You',
            created_at: new Date().toISOString(),
            like_count: 0,
            liked: false
          }
        ]
      }))
      updateUserPost(postId, (current) => ({
        ...current,
        comment_count: Number(current.comment_count || 0) + 1
      }))
    } catch (error) {
      setUserPostsError(error?.message || 'Unable to add comment.')
    } finally {
      setUserPostActionId(null)
    }
  }

  const handleToggleUserPostCommentLike = async (post, comment) => {
    const postId = String(post.id)
    const commentId = String(comment.id)
    const wasLiked = normalizeBoolean(comment.liked)
    const previousLikeCount = Number(comment.like_count || 0)

    setUserPostActionId(`user-post-comment-like-${commentId}`)
    setUserPostCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || []).map((item) => (
        String(item.id) === commentId
          ? {
              ...item,
              liked: !wasLiked,
              like_count: Math.max(0, previousLikeCount + (wasLiked ? -1 : 1))
            }
          : item
      ))
    }))

    try {
      const response = await apiService.request(`/user/posts/${postId}/comments/${commentId}/like`, {
        method: 'POST',
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPostCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] || []).map((item) => (
          String(item.id) === commentId
            ? {
                ...item,
                liked: normalizeBoolean(response.liked),
                like_count: Number(response.like_count ?? item.like_count ?? 0)
              }
            : item
        ))
      }))
    } catch (_error) {
      setUserPostCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] || []).map((item) => (
          String(item.id) === commentId
            ? { ...item, liked: wasLiked, like_count: previousLikeCount }
            : item
        ))
      }))
    } finally {
      setUserPostActionId(null)
    }
  }

  const handleShareUserPost = async (post) => {
    const postId = String(post.id)
    const shareUrl = `${window.location.origin}/overview?post=${postId}`
    setUserPostActionId(`share-${postId}`)
    try {
      const response = await apiService.request(`/user/posts/${postId}/share`, {
        method: 'POST',
        returnErrorObject: true
      })
      if (navigator.share) {
        await navigator.share({ title: displayName, text: post.caption || 'TrueHire profile post', url: shareUrl })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
      }
      updateUserPost(postId, (current) => ({
        ...current,
        share_count: Number(response?.share_count ?? current.share_count ?? 0)
      }))
    } catch (error) {
      setUserPostsError(error?.message || 'Unable to share post.')
    } finally {
      setUserPostActionId(null)
    }
  }

  const openUserPostViewer = (post, mediaIndex = 0) => {
    const postId = String(post.id)
    setSelectedUserPostTile({ postId, mediaIndex })
    if (!userPostCommentsByPost[postId]) loadUserPostComments(postId)
  }

  const moveSelectedUserPostMedia = (direction) => {
    if (selectedUserPostMedia.length <= 1) return

    setSelectedUserPostTile((current) => {
      if (!current) return current
      const currentIndex = Number(current.mediaIndex || 0)
      return {
        ...current,
        mediaIndex: (currentIndex + direction + selectedUserPostMedia.length) % selectedUserPostMedia.length
      }
    })
  }

  const handleUserPostViewerScroll = () => {
    const container = userPostViewerScrollRef.current
    if (!container || !selectedUserPostTile) return

    const items = Array.from(container.querySelectorAll('[data-user-post-card]'))
    if (!items.length) return

    const containerTop = container.getBoundingClientRect().top
    let closestPostId = selectedUserPostTile.postId
    let closestDistance = Number.POSITIVE_INFINITY

    items.forEach((item) => {
      const postId = String(item.getAttribute('data-user-post-card') || '')
      if (!postId) return
      const distance = Math.abs(item.getBoundingClientRect().top - containerTop)
      if (distance < closestDistance) {
        closestDistance = distance
        closestPostId = postId
      }
    })

    if (closestPostId !== selectedUserPostTile.postId) {
      setSelectedUserPostTile({ postId: closestPostId, mediaIndex: 0 })
    }
  }

  useEffect(() => {
    if (!selectedUserPostTile || !userPostViewerScrollRef.current) return

    const target = userPostViewerScrollRef.current.querySelector(
      `[data-user-post-card="${selectedUserPostTile.postId}"]`
    )

    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ block: 'start' })
      })
    }
  }, [selectedUserPostTile])

  const handleDeleteUserPost = async (post) => {
    const postId = String(post.id)
    if (!window.confirm('Delete this post from your profile?')) return

    setUserPostActionId(`delete-${postId}`)
    try {
      const response = await apiService.request(`/user/posts/${postId}`, {
        method: 'DELETE',
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setUserPosts((current) => current.filter((item) => String(item.id) !== postId))
      setUserPostCommentsByPost((current) => {
        const next = { ...current }
        delete next[postId]
        return next
      })
      if (openUserPostCommentsId === postId) setOpenUserPostCommentsId(null)
      if (selectedUserPostTile?.postId === postId) setSelectedUserPostTile(null)
    } catch (error) {
      setUserPostsError(error?.message || 'Unable to delete post.')
    } finally {
      setUserPostActionId(null)
    }
  }

  const updateFeedPost = (postId, updater) => {
    setFeedPosts((current) => current.map((post) => (
      post.id === String(postId) ? updater(post) : post
    )))
  }

  const currentUserId = user?.id ?? user?.userId ?? user?.user_id
  const currentCommentAuthorRole = 'USER'

  const handleLikePost = async (post) => {
    setFeedActionId(post.id)
    const response = await apiService.request(`/posts/${post.id}/like`, {
      method: 'POST',
      returnErrorObject: true
    })
    setFeedActionId(null)
    if (response?.error) return
    updateFeedPost(post.id, (current) => {
      const nextLiked = normalizeBoolean(response.liked)
      const delta = nextLiked === current.liked ? 0 : nextLiked ? 1 : -1
      return {
        ...current,
        liked: nextLiked,
        like_count: Math.max(0, Number(current.like_count || 0) + delta)
      }
    })
  }

  const handleDoubleTapLikePost = (post) => {
    if (!post?.id) return
    const postId = String(post.id)
    setLikeBurstPostIds((current) => ({ ...current, [postId]: Date.now() }))
    window.setTimeout(() => {
      setLikeBurstPostIds((current) => {
        const next = { ...current }
        delete next[postId]
        return next
      })
    }, 700)
    if (!normalizeBoolean(post.liked)) handleLikePost(post)
  }

  const handleVideoPostPlay = async (post) => {
    const hasVideo = getFeedPostMediaItems(post).some((item) => item.type === 'video')
    if (!post?.id || !hasVideo || viewedVideoPostIds[post.id]) return

    setViewedVideoPostIds((current) => ({ ...current, [post.id]: true }))
    const response = await apiService.request(`/posts/${post.id}/view`, {
      method: 'POST',
      returnErrorObject: true
    })

    if (response?.error || typeof response.view_count !== 'number') return

    updateFeedPost(post.id, (current) => ({
      ...current,
      view_count: response.view_count
    }))
  }

  const toggleVideoPlayback = (event) => {
    event.stopPropagation()
    const video = event.currentTarget
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  const registerFeedMediaTap = (post) => {
    const postId = String(post.id)
    const now = Date.now()
    const lastTap = lastFeedMediaTapRef.current[postId] || 0
    if (now - lastTap < 320) {
      lastFeedMediaTapRef.current[postId] = 0
      handleDoubleTapLikePost(post)
      return true
    }
    lastFeedMediaTapRef.current[postId] = now
    return false
  }

  const handleFeedVideoClick = (event, post) => {
    if (registerFeedMediaTap(post)) {
      event.stopPropagation()
      return
    }
    toggleVideoPlayback(event)
  }

  const loadPostComments = async (postId) => {
    setCommentsLoadingId(postId)
    const response = await apiService.request(`/posts/${postId}/comments`, {
      returnErrorObject: true
    })
    setCommentsLoadingId(null)

    if (response?.error) return

    setCommentsByPost((current) => ({
      ...current,
      [postId]: Array.isArray(response.comments) ? response.comments.map(normalizeComment) : []
    }))
  }

  const handleToggleComments = (post) => {
    const postId = post.id
    setOpenCommentPostId((current) => {
      if (current === postId) return null
      if (!commentsByPost[postId]) {
        loadPostComments(postId)
      }
      return postId
    })
  }

  const handleFollowCompany = async (post) => {
    const following = Boolean(post.following)
    const endpoint = `/company/${post.company_id}/${following ? 'unfollow' : 'follow'}`
    setFeedActionId(`follow-${post.id}`)
    const response = await apiService.request(endpoint, {
      method: following ? 'DELETE' : 'POST',
      returnErrorObject: true
    })
    setFeedActionId(null)
    if (response?.error) return

    setFeedPosts((current) => current
      .map((item) => item.company_id === post.company_id ? { ...item, following: !following } : item)
      .sort((a, b) => {
        const firstTime = new Date(a.created_at || 0).getTime()
        const secondTime = new Date(b.created_at || 0).getTime()
        if (firstTime !== secondTime) return firstTime - secondTime
        return Number(a.id || 0) - Number(b.id || 0)
      }))
    await loadConnectionStats()
  }

  const handleAddComment = async (post, parentComment = null) => {
    const postId = String(post.id)
    const parentCommentId = parentComment?.id ? String(parentComment.id) : null
    const draftKey = parentCommentId ? `${postId}-${parentCommentId}` : postId
    const comment = String(parentCommentId ? replyDrafts[draftKey] : commentDrafts[postId] || '').trim()
    if (!comment) return

    setFeedActionId(parentCommentId ? `reply-${parentCommentId}` : `comment-${postId}`)
    const response = await apiService.request(`/posts/${postId}/comment`, {
      method: 'POST',
      body: JSON.stringify({ comment, parentCommentId }),
      returnErrorObject: true
    })
    setFeedActionId(null)
    if (response?.error) return

    if (parentCommentId) {
      setReplyDrafts((current) => ({ ...current, [draftKey]: '' }))
      setReplyingToByPost((current) => ({ ...current, [postId]: null }))
    } else {
      setCommentDrafts((current) => ({ ...current, [postId]: '' }))
    }
    setCommentsByPost((current) => ({
      ...current,
      [postId]: [
        ...(current[postId] || []),
        {
          ...(response.comment || {}),
          id: response.comment?.id || `local-${Date.now()}`,
          comment,
          parent_comment_id: parentCommentId,
          liked: normalizeBoolean(response.comment?.liked),
          like_count: Number(response.comment?.like_count || 0),
          user_id: currentUserId,
          author_role: currentCommentAuthorRole,
          user_name: user?.name || user?.full_name || 'You',
          created_at: new Date().toISOString()
        }
      ]
    }))
    updateFeedPost(post.id, (current) => ({
      ...current,
      comment_count: Number(current.comment_count || 0) + 1
    }))
  }

  const handleDeleteComment = async (post, comment) => {
    if (!comment?.id) return

    setFeedActionId(`delete-comment-${comment.id}`)
    const response = await apiService.request(`/posts/${post.id}/comments/${comment.id}`, {
      method: 'DELETE',
      returnErrorObject: true
    })
    setFeedActionId(null)

    if (response?.error) return

    const postId = String(post.id)
    const commentsForPost = commentsByPost[postId] || commentsByPost[post.id] || []
    const removedCommentCount = commentsForPost.filter((item) => (
      String(item.id) === String(comment.id) || String(item.parent_comment_id || '') === String(comment.id)
    )).length || 1

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || current[post.id] || []).filter((item) => (
        String(item.id) !== String(comment.id) && String(item.parent_comment_id || '') !== String(comment.id)
      ))
    }))
    updateFeedPost(post.id, (current) => ({
      ...current,
      comment_count: Math.max(0, Number(current.comment_count || 0) - removedCommentCount)
    }))
  }

  const handleToggleCommentLike = async (post, comment) => {
    if (!comment?.id) return
    const postId = String(post.id)
    const commentId = String(comment.id)
    const wasLiked = normalizeBoolean(comment.liked)

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || []).map((item) => (
        String(item.id) === commentId
          ? {
            ...item,
            liked: !wasLiked,
            like_count: Math.max(0, Number(item.like_count || 0) + (wasLiked ? -1 : 1))
          }
          : item
      ))
    }))

    const response = await apiService.request(`/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      returnErrorObject: true
    })

    if (response?.error) {
      setCommentsByPost((current) => ({
        ...current,
        [postId]: (current[postId] || []).map((item) => (
          String(item.id) === commentId
            ? {
              ...item,
              liked: wasLiked,
              like_count: Math.max(0, Number(item.like_count || 0) + (wasLiked ? 1 : -1))
            }
            : item
        ))
      }))
      return
    }

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || []).map((item) => (
        String(item.id) === commentId
          ? { ...item, liked: normalizeBoolean(response.liked), like_count: Number(response.like_count || 0) }
          : item
      ))
    }))
  }

  const buildCompanyPulseShareMessage = (post) => {
    const mediaItems = getFeedPostMediaItems(post)
    const firstMedia = mediaItems[0]
    return `__TRUEHIRE_COMPANY_PULSE_SHARE__${JSON.stringify({
      postId: String(post.id),
      companyId: String(post.company_id || ''),
      mediaUrl: firstMedia?.url || '',
      mediaType: firstMedia?.type || 'image',
      mediaItems
    })}`
  }

  const loadShareConversations = async () => {
    setShareConversationsLoading(true)
    setShareError('')
    try {
      const response = await apiService.request('/messages/conversations?type=direct', { returnErrorObject: true })
      if (response?.error) throw new Error(response.message || response.error)
      setShareConversations(Array.isArray(response?.conversations) ? response.conversations : [])
    } catch (error) {
      setShareConversations([])
      setShareError(error?.message || 'Unable to load messages.')
    } finally {
      setShareConversationsLoading(false)
    }
  }

  const handleSharePost = (post) => {
    setShareTargetPost(post)
    setShareConversationQuery('')
    setSelectedShareConversationIds([])
    setShareNotice('')
    loadShareConversations()
  }

  const closeShareDialog = () => {
    if (shareSending) return
    setShareTargetPost(null)
    setShareConversationQuery('')
    setSelectedShareConversationIds([])
    setShareError('')
    setShareNotice('')
  }

  const toggleShareConversation = (conversationId) => {
    const normalizedId = String(conversationId)
    setSelectedShareConversationIds((current) => (
      current.includes(normalizedId)
        ? current.filter((id) => id !== normalizedId)
        : [...current, normalizedId]
    ))
  }

  const sendCompanyPulseShare = async () => {
    if (!shareTargetPost || selectedShareConversationIds.length === 0 || shareSending) return

    setShareSending(true)
    setShareError('')
    setShareNotice('')
    try {
      const message = buildCompanyPulseShareMessage(shareTargetPost)
      const results = await Promise.all(selectedShareConversationIds.map((conversationId) => (
        apiService.request(`/messages/direct/${conversationId}`, {
          method: 'POST',
          body: JSON.stringify({ message }),
          returnErrorObject: true
        })
      )))

      const failed = results.filter((result) => result?.error)
      if (failed.length > 0) {
        throw new Error(failed[0]?.message || failed[0]?.error || 'Some messages could not be sent.')
      }

      setShareNotice(`Shared with ${selectedShareConversationIds.length} ${selectedShareConversationIds.length === 1 ? 'person' : 'people'}.`)
      window.setTimeout(() => {
        setShareTargetPost(null)
        setShareNotice('')
      }, 900)
    } catch (error) {
      setShareError(error?.message || 'Unable to share this post.')
    } finally {
      setShareSending(false)
    }
  }

  const handleLogout = () => {
    recordActivity('Logged out')
    logout()
    router.push('/')
  }

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user, loadNotifications])

  useEffect(() => {
    if (!user) return undefined

    const clockInterval = window.setInterval(() => {
      setNotificationClock(Date.now())
    }, 1000)

    const refreshInterval = window.setInterval(() => {
      loadNotifications({ silent: true })
    }, 5000)

    return () => {
      window.clearInterval(clockInterval)
      window.clearInterval(refreshInterval)
    }
  }, [user, loadNotifications])

  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    const handleFocus = () => {
      loadOverviewCounts()
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === BOOKMARK_IDS_KEY) {
        loadOverviewCounts()
      }
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        !notificationsPanelRef.current?.contains(event.target) &&
        !notificationsButtonRef.current?.contains(event.target)
      ) {
        setShowNotifications(false)
      }

      if (
        showMenu &&
        !menuPanelRef.current?.contains(event.target) &&
        !menuButtonRef.current?.contains(event.target)
      ) {
        setShowMenu(false)
      }

      if (
        showExperienceMenu &&
        !experienceMenuRef.current?.contains(event.target) &&
        !experienceButtonRef.current?.contains(event.target)
      ) {
        setShowExperienceMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications, showMenu, showExperienceMenu])

  const handleManageProfile = () => {
    recordActivity('Opened profile')
    router.push('/profile')
  }

  const handleExperienceNavigate = (category) => {
    setShowExperienceMenu(false)
    router.push(`/jobs?experience_category=${encodeURIComponent(category)}`)
  }

  const recruiterPosts = [
    { id: 1, title: 'Frontend Engineer', company: 'AlphaTech', location: 'Remote', posted: '1 day ago', type: 'Full-time', salary: '$90k - $120k' },
    { id: 2, title: 'Backend Engineer', company: 'BetaWorks', location: 'New York, NY', posted: '2 days ago', type: 'Full-time', salary: '$100k - $140k' },
    { id: 3, title: 'Data Scientist', company: 'InsightAI', location: 'San Francisco, CA', posted: '3 days ago', type: 'Contract', salary: '$60/hr - $90/hr' }
  ]
  const displayName = user?.name?.trim() || 'TrueHire member'
  const profileReference = user?.profile || user
  const displayEmail = user?.email || 'Email not available'
  const registrationNumber = user?.registration_number
  const profileCompletion = user?.profile_complete ? '100%' : 'In progress'
  const currentRole =
    profileReference?.current_role ||
    profileReference?.currentRole ||
    profileReference?.job_title ||
    profileReference?.jobTitle ||
    profileReference?.designation ||
    profileReference?.desired_job_role ||
    profileReference?.desiredJobRole ||
    profileReference?.resume_headline ||
    profileReference?.resumeHeadline ||
    profileReference?.headline ||
    user?.desired_job_role ||
    user?.desiredJobRole ||
    'Software Engineer'
  const displayLocation =
    profileReference?.location ||
    profileReference?.city ||
    profileReference?.address ||
    'Location not added'
  const visibleSkills = normalizeSkillList(
    profileReference?.core_skills,
    profileReference?.skills,
    profileReference?.technical_skills,
    profileReference?.technicalSkills,
    profileReference?.soft_skills,
    profileReference?.softSkills,
    profileReference?.secondary_skills,
    user?.core_skills,
    user?.skills,
    user?.soft_skills,
    user?.softSkills
  )
  const followingCount = connectionStats.followingCount
  const followersCount = connectionStats.followersCount
  const postsCount = 0
  const topRoleMatch = jobs[0] || recruiterPosts[0]
  const formatSalary = (job) => {
    if (job?.salary_min == null && job?.salary_max == null) return 'Salary not specified'
    const currency = String(job?.salary_currency || 'INR').toUpperCase()
    const min = job?.salary_min != null ? Number(job.salary_min) : null
    const max = job?.salary_max != null ? Number(job.salary_max) : null

    if (currency === 'LPA') {
      const formatLpa = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ''))
      if (Number.isFinite(min) && Number.isFinite(max)) return `${formatLpa(min)} - ${formatLpa(max)} LPA`
      if (Number.isFinite(min)) return `${formatLpa(min)}+ LPA`
      if (Number.isFinite(max)) return `Up to ${formatLpa(max)} LPA`
      return 'Salary not specified'
    }

    if (Number.isFinite(min) && Number.isFinite(max)) return `${currency} ${min} - ${max}`
    if (Number.isFinite(min)) return `${currency} ${min}+`
    if (Number.isFinite(max)) return `Up to ${currency} ${max}`
    return 'Salary not specified'
  }
  const pulseJobs = useMemo(() => {
    const jobMap = new Map()

    ;[...recommendedJobs, ...jobs].forEach((job) => {
      if (!job?.id) return
      const key = String(job.id)
      const existing = jobMap.get(key) || {}
      jobMap.set(key, {
        ...existing,
        ...job,
        recommendationScore: existing.recommendationScore ?? job.recommendationScore
      })
    })

    return Array.from(jobMap.values()).sort((a, b) => {
      const aTime = new Date(a.created_at || a.updated_at || 0).getTime()
      const bTime = new Date(b.created_at || b.updated_at || 0).getTime()
      return bTime - aTime
    })
  }, [jobs, recommendedJobs])

  const standalonePulseJobs = useMemo(() => {
    const companyIdsWithPosts = new Set(feedPosts.map((post) => String(post.company_id || '')).filter(Boolean))
    return pulseJobs.filter((job) => {
      const recruiterId = job.recruiter_id != null ? String(job.recruiter_id) : ''
      return !recruiterId || !companyIdsWithPosts.has(recruiterId)
    })
  }, [feedPosts, pulseJobs])

  const pulseFeedItems = useMemo(() => {
    const items = feedPosts.map((post) => ({
      key: `${post.post_type || 'company'}-${post.id}`,
      type: 'post',
      post
    }))

    const insertRandomly = (item) => {
      const firstMixedIndex = items.length > 0 ? 1 : 0
      const availableSlots = items.length - firstMixedIndex + 1
      const index = firstMixedIndex + Math.floor(Math.random() * Math.max(availableSlots, 1))
      items.splice(index, 0, item)
    }

    if (feedPosts.length > 0 || standalonePulseJobs.length > 0) {
      insertRandomly({ key: 'friend-suggestions', type: 'friend-suggestions' })
    }

    if (standalonePulseJobs.length > 0) {
      insertRandomly({ key: 'latest-recruiter-jobs', type: 'latest-recruiter-jobs' })
    }

    return items
  }, [feedPosts, standalonePulseJobs])

  const scrollPulseJobRail = (event, direction) => {
    const container = event.currentTarget.closest('[data-pulse-job-row]')
    const rail = container?.querySelector('[data-pulse-job-rail]')
    if (!rail) return

    rail.scrollBy({
      left: direction * Math.min(320, rail.clientWidth * 0.85),
      behavior: 'smooth'
    })
  }

  const renderPulseJobRail = (jobList, title = 'Open roles from this company') => {
    if (!jobList?.length) return null

    return (
      <div data-pulse-job-row className="border-t border-slate-100 px-5 py-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">{title}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(event) => scrollPulseJobRail(event, -1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-white text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Previous jobs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 6l-6 6 6 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(event) => scrollPulseJobRail(event, 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-100 bg-white text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              aria-label="Next jobs"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
        <div data-pulse-job-rail className="flex gap-3 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {jobList.map((job) => {
            const matchedSkills = [
              ...(job.matchedCoreSkills || []),
              ...(job.matchedSoftSkills || [])
            ]

            return (
              <article key={job.id} className="w-[260px] shrink-0 rounded-2xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50/50 p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-cyan-800">
                    Job
                  </span>
                  {job.recommendationScore != null && (
                    <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold text-indigo-700">
                      {job.recommendationScore} match
                    </span>
                  )}
                </div>
                <h3 className="mt-3 line-clamp-2 text-sm font-black leading-5 text-slate-950">{job.title}</h3>
                {job.recruiter_id || job.company_id ? (
                  <button
                    type="button"
                    onClick={() => router.push(getCompanyManagePostsHref(job.recruiter_id || job.company_id))}
                    className="mt-1 block max-w-full appearance-none truncate border-0 bg-transparent p-0 text-left text-xs font-semibold text-slate-500 transition hover:text-cyan-700"
                  >
                    {job.company || 'Company'}
                  </button>
                ) : (
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">{job.company || 'Company'}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-slate-600">
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{job.location || 'Remote'}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-1">{formatSalary(job)}</span>
                </div>
                {matchedSkills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {matchedSkills.slice(0, 2).map((skill) => (
                      <span key={skill} className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                <Link
                  href={`/jobs/${job.id}/apply`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-slate-950 px-3 py-2 text-xs font-bold text-white no-underline transition hover:bg-slate-800 hover:no-underline"
                >
                  View Job
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    )
  }

  const overviewStats = [
    {
      href: '/applications',
      label: 'Applications',
      value: String(applicationCount),
      description: 'Track your latest activity',
      eyebrow: 'Pipeline',
      accent: 'from-[#0F766E] via-[#14B8A6] to-[#7DD3FC]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m-6 4h6m-7 4h4m-7 5h10a2 2 0 002-2V6.5L14.5 3H7a2 2 0 00-2 2v13a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      href: '/saved-jobs',
      label: 'Saved Jobs',
      value: String(savedJobCount),
      description: 'Bookmarked roles to revisit',
      eyebrow: 'Shortlist',
      accent: 'from-[#9A3412] via-[#F97316] to-[#FDE68A]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
        </svg>
      )
    },
    {
      href: '/profile',
      label: 'Profile Status',
      value: profileCompletion,
      description: 'Update your profile details',
      eyebrow: 'Identity',
      accent: 'from-[#312E81] via-[#6366F1] to-[#A5B4FC]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a7.5 7.5 0 0115 0" />
        </svg>
      )
    },
    {
      href: '/inbox',
      label: 'Notifications',
      value: unreadNotificationCount > 0 ? String(unreadNotificationCount) : '0',
      description: 'Unread recruiter updates',
      eyebrow: 'Signals',
      accent: 'from-[#7C2D12] via-[#EA580C] to-[#FDBA74]',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.857 17.082a2.75 2.75 0 01-5.714 0M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7z" />
        </svg>
      )
    }
  ]
  const quickActionCards = [
    {
      href: '/companies',
      title: 'View Companies',
      description: 'Discover verified employers and compare team fit before you apply.',
      cta: 'Explore',
      accent: 'from-[#0F172A] via-[#1D4ED8] to-[#38BDF8]',
      badge: 'VC'
    },
    {
      href: '/career-resources',
      title: 'Career Center',
      description: 'Sharpen resumes, interview stories, and job search strategy in one place.',
      cta: 'Learn',
      accent: 'from-[#7C2D12] via-[#EA580C] to-[#F59E0B]',
      badge: 'CC'
    },
    {
      href: '/sliding-puzzle',
      title: 'Sliding Puzzle',
      description: 'Take a quick focus break, then come back energized for your next application.',
      cta: 'Play',
      accent: 'from-[#14532D] via-[#16A34A] to-[#86EFAC]',
      badge: 'SP'
    }
  ]


  const selectedUserPost = selectedUserPostTile
    ? userPosts.find((post) => String(post.id) === String(selectedUserPostTile.postId))
    : null
  const selectedUserPostMedia = getUserPostMediaItems(selectedUserPost)
  const selectedUserPostMediaIndex = Math.min(
    Math.max(Number(selectedUserPostTile?.mediaIndex || 0), 0),
    Math.max(selectedUserPostMedia.length - 1, 0)
  )
  const selectedUserPostId = selectedUserPost ? String(selectedUserPost.id) : ''
  const renderUserPostCommentsPanel = (post) => {
    const postId = String(post.id)
    const allComments = userPostCommentsByPost[postId] || []
    const rootComments = allComments.filter((comment) => !comment.parent_comment_id)
    const commentsToShow = rootComments.length ? rootComments : allComments
    const totalComments = Number(post.comment_count || allComments.length || 0)

    return (
      <div className="rounded-[28px] border border-slate-100 bg-white p-5 shadow-[0_22px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-950">Comments</h3>
            <p className="mt-4 text-xs font-black text-slate-500">{totalComments} total</p>
          </div>
          <button
            type="button"
            onClick={() => setOpenUserPostCommentsId(null)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-slate-300 hover:bg-white hover:text-slate-950"
            aria-label="Close comments"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-6 space-y-7">
          {commentsToShow.length ? commentsToShow.map((comment) => {
            const commentName = comment.user_name || 'User'
            const initial = String(commentName || 'U').trim().charAt(0).toUpperCase() || 'U'
            const replies = allComments.filter((item) => String(item.parent_comment_id || '') === String(comment.id))
            const isLiked = normalizeBoolean(comment.liked)

            return (
              <div key={comment.id} className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-rose-400 bg-white text-sm font-black text-slate-950 shadow-[inset_0_0_0_3px_#fff]">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-black text-slate-950">{commentName}</p>
                    <p className="text-sm font-bold text-slate-500">{formatTimeAgo(comment.created_at) || 'Just now'}</p>
                  </div>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-900">{comment.comment}</p>
                  <button type="button" className="mt-3 appearance-none border-0 bg-transparent p-0 text-sm font-black text-slate-500 transition hover:text-blue-600">
                    Reply
                  </button>
                  {replies.length > 0 && (
                    <button type="button" className="mt-4 flex items-center gap-3 appearance-none border-0 bg-transparent p-0 text-sm font-black text-slate-500 transition hover:text-slate-950">
                      <span className="h-px w-12 bg-slate-300" />
                      View {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleUserPostCommentLike(post, comment)}
                  disabled={userPostActionId === `user-post-comment-like-${comment.id}`}
                  className={`flex w-9 shrink-0 flex-col items-center gap-1 appearance-none border-0 bg-transparent p-0 pt-1 transition disabled:opacity-50 ${isLiked ? 'text-rose-500' : 'text-slate-500 hover:text-rose-500'}`}
                  aria-label="Like comment"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                  </svg>
                  {Number(comment.like_count || 0) > 0 && (
                    <span className="text-[11px] font-bold">{Number(comment.like_count || 0)}</span>
                  )}
                </button>
              </div>
            )
          }) : (
            <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center">
              <p className="text-sm font-black text-slate-700">No comments yet.</p>
            </div>
          )}
        </div>

        <div className="mt-7 flex gap-2 border-t border-slate-100 pt-4">
          <input
            value={userPostCommentDrafts[postId] || ''}
            onChange={(event) => setUserPostCommentDrafts((current) => ({ ...current, [postId]: event.target.value }))}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAddUserPostComment(post)
            }}
            placeholder="Add a comment..."
            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:bg-white"
          />
          <button
            type="button"
            onClick={() => handleAddUserPostComment(post)}
            disabled={userPostActionId === `comment-${postId}` || !String(userPostCommentDrafts[postId] || '').trim()}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Post
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your overview...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <Head>
        <title>Overview - TrueHire</title>
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.2),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(45,212,191,0.18),_transparent_24%),linear-gradient(160deg,#fffdf7_0%,#f8fbff_46%,#eef6ff_100%)] text-slate-900">
        <div className="fixed left-4 top-4 z-50">
          <button
            ref={menuButtonRef}
            type="button"
            onClick={() => setShowMenu((prev) => !prev)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/80 text-slate-700 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.45)] transition hover:bg-white"
            aria-expanded={showMenu}
            aria-controls="overview-menu"
          >
            <span className="sr-only">Open menu</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {showMenu && (
            <div
              ref={menuPanelRef}
              id="overview-menu"
              className="mt-3 w-64 overflow-hidden rounded-[28px] border border-white/70 bg-gradient-to-br from-white via-[#F8FAFF] to-[#EEF2FF] shadow-[0_30px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-xl"
            >
              <div className="border-b border-slate-200/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">Quick Menu</p>
                <p className="text-sm font-semibold text-slate-900">Navigate your account</p>
              </div>
              <nav className="flex flex-col gap-1 p-3 text-sm text-slate-700">
                <Link href="/overview" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Dashboard</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Home</span>
                </Link>
                <Link href="/profile" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">My Profile</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">View</span>
                </Link>
                <Link href="/applications" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Applied Jobs</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Track</span>
                </Link>
                <Link href="/inbox" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Messages</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Inbox</span>
                </Link>
                <Link href="/network" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Network</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Connect</span>
                </Link>
                <Link href="/saved-jobs" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Saved Jobs</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Shortlist</span>
                </Link>
                <Link href="/review-card" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Review Card</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Review</span>
                </Link>
                <Link href="/support" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Help &amp; Support</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Help</span>
                </Link>
                <Link href="/settings" className="group flex items-center justify-between rounded-2xl px-3 py-2.5 no-underline transition hover:bg-white hover:no-underline">
                  <span className="font-medium text-slate-900">Settings</span>
                  <span className="text-xs text-slate-500 group-hover:text-slate-700">Manage</span>
                </Link>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-red-500/40 bg-gradient-to-r from-red-500/90 to-pink-500/90 px-3 py-2.5 text-left text-sm font-semibold text-white shadow-[0_10px_25px_rgba(220,38,38,0.25)] transition hover:from-red-500 hover:to-pink-500"
                  >
                    Logout
                  </button>
                </div>
              </nav>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-24 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-cyan-200/30 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/70 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-6xl space-y-10 px-4 pb-28 pt-10 sm:px-6 sm:pb-10 lg:px-8">
          {/* Header */}
          <section className="relative overflow-visible rounded-[24px] border border-white/80 bg-white shadow-[0_26px_70px_-38px_rgba(15,23,42,0.42)]">
            <div className="relative h-40 overflow-visible rounded-t-[24px] bg-[radial-gradient(circle_at_10%_10%,#f59e0b_0%,transparent_28%),radial-gradient(circle_at_38%_0%,#f97316_0%,transparent_24%),radial-gradient(circle_at_58%_5%,#2563eb_0%,transparent_30%),radial-gradient(circle_at_82%_0%,#22c55e_0%,transparent_28%),linear-gradient(120deg,#fb7185_0%,#fef08a_42%,#67e8f9_100%)] sm:h-44">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-[18px]" />
              <div className="absolute right-4 top-4 z-20">
                <div className="relative">
                  <button
                    ref={notificationsButtonRef}
                    type="button"
                    onClick={handleNotificationBellClick}
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-900 shadow-[0_14px_30px_-18px_rgba(15,23,42,0.5)] transition-all cursor-pointer hover:bg-white"
                    aria-label="Open notifications"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17H9m6 0a3 3 0 0 1-6 0m6 0h4l-1.5-2.25V10a5.5 5.5 0 1 0-11 0v4.75L5 17h4" />
                    </svg>
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.35rem] items-center justify-center rounded-full bg-slate-950 px-1 text-[10px] font-semibold text-white">
                        {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>
                  <div
                        ref={notificationsPanelRef}
                        className={`absolute right-0 top-full z-50 mt-3 w-80 max-w-[92vw] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)] transition-all duration-200 ease-out ${
                          showNotifications
                            ? 'pointer-events-auto translate-y-0 opacity-100'
                            : 'pointer-events-none translate-y-2 opacity-0'
                        }`}
                      >
                        <div className="border-b border-slate-200/70 px-5 py-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold uppercase tracking-wide text-slate-700">Notifications</span>
                            <div className="flex gap-2 text-[11px] font-semibold">
                              <button
                                type="button"
                                onClick={handleClearNotifications}
                                disabled={clearingNotifications || notifications.length === 0}
                                className="rounded-full border border-indigo-200 bg-gradient-to-br from-indigo-500 to-purple-500 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(99,102,241,0.25)] transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {clearingNotifications ? 'Saving...' : 'Mark all read'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowNotifications(false)}
                                className="rounded-full border border-slate-200 px-3 py-1 bg-white text-slate-600 transition hover:border-slate-400"
                              >
                                Close
                              </button>
                            </div>
                          </div>
                          <p className="mt-1 text-[12px] text-slate-400">Friend requests and recruiter updates appear here.</p>
                        </div>
                        <div className="max-h-[320px] overflow-y-auto">
                          {notificationsLoading ? (
                            <div className="px-5 py-10 text-center text-sm text-slate-500">Loading notifications...</div>
                          ) : notifications.length === 0 ? (
                            <div className="px-5 py-10 text-center text-sm text-slate-500">
                              You have no notifications yet. We'll let you know when a recruiter checks your application.
                            </div>
                          ) : (
                            <ul>
                              {notifications.map((notification) => {
                                const metadata = notification.metadata || {};
                                const isShortlisted = metadata.type === 'shortlisted';
                                const isFriendRequest = metadata.type === 'FRIEND_REQUEST';
                                const isFollowBack = metadata.type === 'FOLLOW_BACK';
                                const primaryAction = metadata?.actions?.primary;
                                const secondaryAction = metadata?.actions?.secondary;
                                const primaryHref = primaryAction?.href || '/applications';
                                const secondaryHref = secondaryAction?.href || '/applications';
                                const primaryLabel = primaryAction?.label || 'Upload Introduction Video';
                                const secondaryLabel = secondaryAction?.label || 'View Next Steps';
                                const highlightTitle = metadata?.highlight?.title || 'Video introduction';
                                const highlightBody =
                                  metadata?.highlight?.body ||
                                  'Please upload a short introduction video (30-90 seconds) to help the recruiter know you better.';

                                return (
                                  <li key={notification.id} className="border-b border-slate-100 px-5 py-4 last:border-b-0">
                                    <div className="flex items-start justify-between gap-3">
                                      <div
                                        onClick={() => handleNotificationNavigate(notification)}
                                        className="space-y-3 text-left cursor-pointer"
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                          if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault()
                                            handleNotificationNavigate(notification)
                                          }
                                        }}
                                      >
                                        {isFriendRequest ? (
                                          <>
                                            <div>
                                              <p className="text-sm font-semibold text-slate-900">
                                                {metadata.title || 'New friend request'}
                                              </p>
                                              <p className="mt-1 text-sm text-slate-700">
                                                {notification.message}
                                              </p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  handleFriendRequestAction(notification, 'accept')
                                                }}
                                                disabled={friendRequestActionId === `accept-${metadata.requestId}` || friendRequestActionId === `reject-${metadata.requestId}`}
                                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(5,150,105,0.22)] transition hover:opacity-90 disabled:opacity-60"
                                              >
                                                {friendRequestActionId === `accept-${metadata.requestId}` ? 'Saving...' : 'Accept'}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(event) => {
                                                  event.stopPropagation()
                                                  handleFriendRequestAction(notification, 'reject')
                                                }}
                                                disabled={friendRequestActionId === `accept-${metadata.requestId}` || friendRequestActionId === `reject-${metadata.requestId}`}
                                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400 disabled:opacity-60"
                                              >
                                                {friendRequestActionId === `reject-${metadata.requestId}` ? 'Saving...' : 'Delete'}
                                              </button>
                                            </div>
                                            <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                              {formatTimeAgo(notification.createdAt) || 'Just now'}
                                            </p>
                                          </>
                                        ) : isFollowBack ? (
                                          <>
                                            <div className="flex items-start gap-3">
                                              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-black text-slate-700">
                                                {metadata.targetUserPhoto ? (
                                                  <img
                                                    src={metadata.targetUserPhoto.startsWith('http')
                                                      ? metadata.targetUserPhoto
                                                      : `${apiOrigin || ''}${metadata.targetUserPhoto.startsWith('/') ? '' : '/'}${metadata.targetUserPhoto}`}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                  />
                                                ) : (
                                                  String(metadata.targetUserName || 'U').slice(0, 1).toUpperCase()
                                                )}
                                              </div>
                                              <div>
                                                <p className="text-sm font-semibold text-slate-900">
                                                  {metadata.targetUserName || metadata.title || 'Follow back'}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-700">
                                                  {notification.message}
                                                </p>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(event) => {
                                                event.stopPropagation()
                                                handleFollowBack(notification)
                                              }}
                                              disabled={Boolean(metadata.following) || followBackActionId === metadata.targetUserId}
                                              className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                              {metadata.following
                                                ? 'Following'
                                                : followBackActionId === metadata.targetUserId
                                                  ? 'Saving...'
                                                  : 'Follow Back'}
                                            </button>
                                            <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                              {formatTimeAgo(notification.createdAt) || 'Just now'}
                                            </p>
                                          </>
                                        ) : isShortlisted ? (
                                          <>
                                            <div>
                                              <p className="text-sm font-semibold text-slate-900">
                                                {metadata.title || "You've been shortlisted"}
                                              </p>
                                              <p className="mt-1 text-sm text-slate-700">
                                                {notification.message || 'You have been shortlisted.'}
                                              </p>
                                            </div>
                                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                                              <p className="font-semibold">{highlightTitle}</p>
                                              <p className="mt-1">{highlightBody}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                              <Link
                                                href={primaryHref}
                                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition hover:opacity-90"
                                              >
                                                {primaryLabel}
                                              </Link>
                                              <Link
                                                href={secondaryHref}
                                                className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400"
                                              >
                                                {secondaryLabel}
                                              </Link>
                                            </div>
                                            <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                              {formatTimeAgo(notification.createdAt) || 'Just now'}
                                            </p>
                                          </>
                                        ) : (
                                          <>
                                            {metadata.title && (
                                              <p className="text-sm font-semibold text-slate-900">
                                                {metadata.title}
                                              </p>
                                            )}
                                            <p className="text-sm text-slate-700 leading-relaxed">
                                              {notification.message || 'A recruiter has viewed your application.'}
                                            </p>
                                            {primaryAction && (
                                              <div className="flex flex-wrap gap-2">
                                                <Link
                                                  href={primaryHref}
                                                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition hover:opacity-90"
                                                >
                                                  {primaryLabel}
                                                </Link>
                                                {secondaryAction && (
                                                  <Link
                                                    href={secondaryHref}
                                                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-400"
                                                  >
                                                    {secondaryLabel}
                                                  </Link>
                                                )}
                                              </div>
                                            )}
                                            <p className="text-[11px] uppercase tracking-wide text-slate-400">
                                              {formatTimeAgo(notification.createdAt) || 'Just now'}
                                            </p>
                                          </>
                                        )}
                                      </div>
                                      {!isFriendRequest && !isFollowBack && (
                                      <button
                                        type="button"
                                        onClick={() => handleMarkNotificationRead(notification.id)}
                                        disabled={notification.status === 'read' || markingNotificationId === notification.id}
                                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 px-4 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-[0_8px_20px_rgba(79,70,229,0.25)] transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {markingNotificationId === notification.id ? 'Saving...' : 'Mark read'}
                                      </button>
                                      )}
                                    </div>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      </div>
                </div>
              </div>
            </div>
            <div className="relative px-4 pb-4 pt-0 sm:px-5 sm:pb-5">
              <div className="-mt-12 grid gap-4 lg:grid-cols-[minmax(220px,1fr)_minmax(260px,0.9fr)] lg:items-end lg:justify-between">
                <div className="min-w-0">
                  <div className="h-24 w-24 rounded-full border-[5px] border-white bg-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.55)]">
                    <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-slate-950/90">
                      {photoSrc ? (
                        <img
                          src={photoSrc}
                          alt="Profile"
                          className="h-full w-full object-cover"
                          onError={() => {
                            const currentIndex = photoCandidates.indexOf(photoSrc)
                            const next = photoCandidates[currentIndex + 1]
                            setPhotoSrc(next || null)
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/70">
                          No Photo
                        </div>
                      )}
                    </div>
                  </div>
                  <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950">{displayName}</h1>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openFollowList('following')}
                      className="inline-flex min-w-[76px] appearance-none flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <span className="text-sm font-black leading-none text-slate-950">{followingCount}</span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Following</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openFollowList('followers')}
                      className="inline-flex min-w-[76px] appearance-none flex-col items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                    >
                      <span className="text-sm font-black leading-none text-slate-950">{followersCount}</span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Followers</span>
                    </button>
                    <div className="inline-flex min-w-[76px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center shadow-sm">
                      <span className="text-sm font-black leading-none text-slate-950">{postsCount}</span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Posts</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{displayLocation}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleManageProfile}
                      className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-[0_16px_35px_-24px_rgba(15,23,42,0.55)] transition hover:bg-slate-800"
                    >
                      Edit Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileTabs((current) => !current)
                        setActiveProfileTab('posts')
                      }}
                      className="inline-flex items-center justify-center rounded-full border border-slate-950 px-4 py-2 text-xs font-bold text-slate-950 no-underline transition hover:bg-slate-50 hover:no-underline"
                    >
                      View Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/messages')}
                      className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                    >
                      Messages
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:justify-items-end">
                  <div className="w-full text-left lg:text-right">
                    <div className="flex items-center gap-2 lg:justify-end">
                      <p className="text-xs font-medium text-slate-700">Current role</p>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M4 20V7a2 2 0 0 1 2-2h3.5a2 2 0 0 1 2 2v13M13 20V9a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v11M3 20h18" />
                      </svg>
                    </div>
                    <span className="mt-2 inline-flex max-w-full rounded-full border border-amber-200 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 px-4 py-2 text-xs font-black text-slate-950 shadow-[0_12px_30px_-20px_rgba(249,115,22,0.75)]">
                      {currentRole}
                    </span>
                  </div>
                  <div className="w-full text-left lg:text-right">
                    <div className="flex items-center gap-2 lg:justify-end">
                      <p className="text-xs font-medium text-slate-700">Skills</p>
                      <svg className="h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="m12 3 2.65 5.37 5.93.86-4.29 4.18 1.01 5.9L12 16.52 6.7 19.31l1.01-5.9-4.29-4.18 5.93-.86L12 3z" />
                      </svg>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 lg:justify-end">
                      {visibleSkills.map((skill) => (
                        <span key={skill} className="rounded-full bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-slate-800">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
              {showNotifications && (
                <div className="h-[320px] sm:h-[340px]" aria-hidden="true" />
              )}
          </section>
          {showProfileTabs && (
            <section className="-mt-8 overflow-hidden rounded-[22px] border border-white/80 bg-white shadow-[0_22px_60px_-38px_rgba(15,23,42,0.42)]">
              <div className="grid grid-cols-3 border-b border-slate-100 bg-slate-50/80 text-sm font-black text-slate-500">
                {[
                  {
                    id: 'posts',
                    label: 'Posts',
                    icon: (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
                      </svg>
                    )
                  },
                  {
                    id: 'videos',
                    label: 'Videos',
                    icon: (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <rect x="5" y="3" width="14" height="18" rx="3" strokeWidth="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m10 8 6 4-6 4V8Z" />
                      </svg>
                    )
                  },
                  {
                    id: 'images',
                    label: 'Images',
                    icon: (
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <rect x="4" y="5" width="16" height="14" rx="2.5" strokeWidth="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 16 4-4 3 3 2-2 1 1" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 9.5h.01" />
                      </svg>
                    )
                  }
                ].map((tab) => {
                  const isActive = activeProfileTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveProfileTab(tab.id)}
                      className={`relative flex h-16 items-center justify-center gap-3 border-r border-slate-100 last:border-r-0 transition ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-[0_12px_30px_-26px_rgba(37,99,235,0.8)]'
                          : 'bg-slate-50/70 text-slate-500 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      {isActive && <span className="absolute bottom-0 left-1/2 h-1 w-32 max-w-[70%] -translate-x-1/2 rounded-t-full bg-blue-600" />}
                    </button>
                  )
                })}
              </div>
              <div className="space-y-5 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-4 sm:p-5">
                <input
                  ref={userPostFileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleUserPostMediaChange(event)
                    setShowUserPostComposer(true)
                  }}
                />
                {userPosts.length > 0 && !showUserPostComposer && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={openUserPostPicker}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white shadow-[0_14px_30px_-20px_rgba(15,23,42,0.7)] transition hover:-translate-y-0.5 hover:bg-slate-800"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 5v14M5 12h14" />
                      </svg>
                      Add Post
                    </button>
                  </div>
                )}

                {userPostsError && (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {userPostsError}
                  </div>
                )}

                {userPostsLoading ? (
                  <div className="rounded-[22px] border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-500 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]">
                    Loading profile posts...
                  </div>
                ) : showUserPostComposer && userPostMedia.length > 0 ? (
                  <div className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-950">{userPostMedia.length} file{userPostMedia.length === 1 ? '' : 's'} ready</p>
                        <p className="mt-1 text-xs text-slate-500">Add a note, review your media, then publish.</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={openUserPostPicker} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700">Add more</button>
                        <button type="button" onClick={() => { setUserPostMedia([]); setUserPostCaption(''); setShowUserPostComposer(false) }} className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">Cancel</button>
                        <button type="button" onClick={handleCreateUserPost} disabled={userPostActionId === 'create' || (!userPostCaption.trim() && !userPostMedia.length)} className="rounded-full bg-slate-950 px-5 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">{userPostActionId === 'create' ? 'Posting...' : 'Post'}</button>
                      </div>
                    </div>
                    <label className="mt-4 block">
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Note</span>
                      <textarea
                        value={userPostCaption}
                        onChange={(event) => setUserPostCaption(event.target.value)}
                        placeholder="Write a note about this post..."
                        className="mt-2 min-h-[82px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </label>
                    <div className="mt-4 grid grid-cols-3 gap-3 lg:grid-cols-4">
                      {userPostMediaPreviews.map((preview) => (
                        <div key={`${preview.file.name}-${preview.index}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                          <div className="relative aspect-square bg-slate-100">
                            {preview.type === 'video' ? (
                              <video src={preview.url} className="h-full w-full object-cover" muted playsInline controls />
                            ) : (
                              <img src={preview.url} alt="" className="h-full w-full object-cover" />
                            )}
                            <button
                              type="button"
                              onClick={() => setUserPostMedia((current) => {
                                const next = current.filter((_, itemIndex) => itemIndex !== preview.index)
                                if (!next.length) {
                                  setUserPostCaption('')
                                  setShowUserPostComposer(false)
                                }
                                return next
                              })}
                              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow-sm transition hover:bg-rose-50"
                              aria-label="Remove selected media"
                              title="Remove"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                              </svg>
                            </button>
                          </div>
                          <div className="truncate px-3 py-2 text-xs font-bold text-slate-600">
                            {preview.file.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : userPosts.length === 0 ? (
                  <div className="flex min-h-[380px] items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-white p-8 text-center shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]">
                    <div>
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-blue-600 shadow-[0_14px_32px_-24px_rgba(15,23,42,0.65)]">
                        {activeProfileTab === 'videos' ? (
                          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <rect x="5" y="3" width="14" height="18" rx="3" strokeWidth="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m10 8 6 4-6 4V8Z" />
                          </svg>
                        ) : activeProfileTab === 'images' ? (
                          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <rect x="4" y="5" width="16" height="14" rx="2.5" strokeWidth="2" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m7 16 4-4 3 3 2-2 1 1" />
                          </svg>
                        ) : (
                          <svg className="h-9 w-9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
                          </svg>
                        )}
                      </div>
                      <p className="mt-6 text-2xl font-black text-slate-950">No {activeProfileTab === 'posts' ? 'posts' : activeProfileTab} yet</p>
                      <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-slate-500">
                        Create your first profile update.
                      </p>
                      <button
                        type="button"
                        onClick={openUserPostPicker}
                        className="mt-8 inline-flex items-center justify-center rounded-xl border-2 border-slate-950 bg-blue-600 px-7 py-3 text-sm font-black text-white shadow-[0_14px_30px_-20px_rgba(37,99,235,0.75)] transition hover:-translate-y-0.5 hover:bg-blue-500"
                      >
                        Create Post
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3 sm:gap-4">
                    {userPosts.map((post) => {
                      const postId = String(post.id)
                      const mediaItems = getUserPostMediaItems(post)
                      const filteredMediaItems = mediaItems
                        .map((item, originalIndex) => ({ item, originalIndex }))
                        .filter(({ item }) => (
                          activeProfileTab === 'images'
                            ? item.type === 'image'
                            : activeProfileTab === 'videos'
                              ? item.type === 'video'
                              : true
                        ))
                      const tile = filteredMediaItems[0] || (activeProfileTab === 'posts' ? { item: { type: 'text', url: '' }, originalIndex: 0 } : null)
                      if (!tile) return null
                      const { item, originalIndex } = tile
                      const total = filteredMediaItems.length || 1
                      const tileKey = `${postId}-${item.url || 'text'}`
                      return (
                        <article key={tileKey} className="group overflow-hidden rounded-lg border border-slate-800/45 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-[0_18px_45px_-32px_rgba(37,99,235,0.5)]">
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => openUserPostViewer(post, originalIndex)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                openUserPostViewer(post, originalIndex)
                              }
                            }}
                            className="relative aspect-square cursor-pointer overflow-hidden bg-white outline-none focus:ring-4 focus:ring-blue-200"
                          >
                            {item.type === 'video' ? (
                              <video src={item.url} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" muted playsInline preload="metadata" />
                            ) : item.type === 'text' ? (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 p-4 text-center">
                                <p className="line-clamp-6 text-sm font-bold leading-6 text-slate-700">
                                  {post.caption || 'Profile update'}
                                </p>
                              </div>
                            ) : (
                              <img src={item.url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                            )}
                            <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2">
                              <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-black text-white shadow-sm backdrop-blur">
                                {total > 1 ? `1/${total}` : item.type === 'video' ? 'Video' : 'Post'}
                              </span>
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  handleDeleteUserPost(post)
                                }}
                                disabled={userPostActionId === `delete-${postId}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 opacity-0 shadow-sm backdrop-blur transition hover:bg-rose-50 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Delete post"
                                title="Delete post"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M8 7v12h8V7" />
                                </svg>
                              </button>
                            </div>
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/0 opacity-0 transition group-hover:bg-slate-950/20 group-hover:opacity-100">
                              <span className="rounded-full bg-white/95 px-4 py-2 text-xs font-black text-slate-950 shadow-lg backdrop-blur">
                                Open Post
                              </span>
                            </div>
                            {item.type === 'video' && (
                              <div className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur">
                                <svg className="h-4 w-4 translate-x-px" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                  <path d="m9 7 8 5-8 5V7Z" />
                                </svg>
                              </div>
                            )}
                            {item.type === 'video' && (
                              <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-slate-950/85 px-2 py-1 text-[10px] font-black text-white shadow-sm backdrop-blur">
                                {Math.max(1, Number(post.view_count || post.views || 1))} views
                              </div>
                            )}
                          </div>
                          {openUserPostCommentsId === postId && (
                            <div className="border-t border-slate-100 p-3">
                              {renderUserPostCommentsPanel(post)}
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
          {/* Stats Summary */}
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="group relative min-h-[210px] overflow-hidden rounded-[22px] border border-slate-200/80 bg-white p-5 no-underline shadow-[0_18px_45px_-34px_rgba(15,23,42,0.38)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_28px_60px_-36px_rgba(15,23,42,0.42)] hover:no-underline focus:outline-none focus:ring-4 focus:ring-slate-200"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                <div className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-gradient-to-br ${card.accent} opacity-10 blur-2xl transition group-hover:opacity-20`} />
                <div className="relative flex h-full flex-col justify-between gap-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${card.accent} text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.7)]`}>
                      {card.icon}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 transition group-hover:border-slate-300 group-hover:bg-white">
                      Open
                      <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">{card.eyebrow}</p>
                    <div className="mt-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 no-underline">{card.label}</p>
                        <p className="mt-3 text-4xl font-bold tracking-tight text-slate-950 no-underline">{card.value}</p>
                      </div>
                      <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${card.accent}`} />
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-slate-600 no-underline">{card.description}</p>
                </div>
              </Link>
            ))}
          </section>

          {/* Quick Actions */}
          <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.28)] sm:p-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Momentum</p>
                  <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Quick Actions</h2>
                  <p className="mt-2 max-w-xl text-sm text-slate-600">
                    Open the main pages you use most often.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickActions((current) => !current)}
                  aria-expanded={showQuickActions}
                  aria-controls="quick-actions-panel"
                  className="inline-flex h-11 w-11 items-center justify-center self-start rounded-full border border-slate-200 bg-white text-slate-700 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.45)] transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 sm:self-center"
                >
                  <span className="sr-only">{showQuickActions ? 'Collapse Quick Actions' : 'Expand Quick Actions'}</span>
                  <svg
                    className={`h-5 w-5 transition-transform duration-200 ${showQuickActions ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {showQuickActions && (
              <div id="quick-actions-panel" className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Primary Actions</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="group relative h-full overflow-visible rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6 transition duration-200 hover:-translate-y-1 hover:border-slate-300">
                      {!showExperienceMenu ? (
                        <div className="relative z-10 flex h-full items-start justify-between gap-4">
                          <div className="flex min-w-0 items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F766E] via-[#14B8A6] to-[#67E8F9] text-white shadow-lg">
                              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-lg font-semibold leading-tight text-slate-900">Browse Jobs</h3>
                              <p className="mt-1 text-sm leading-snug text-slate-600">Explore curated openings</p>
                              <button
                                ref={experienceButtonRef}
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault()
                                  event.stopPropagation()
                                  setShowExperienceMenu(true)
                                }}
                                className="mt-2 inline-flex w-full items-center justify-start border-0 bg-transparent p-0 text-left text-xs font-semibold text-indigo-600 underline decoration-indigo-200 underline-offset-4 transition hover:text-indigo-700 focus:outline-none"
                              >
                                Browse by experience
                              </button>
                            </div>
                          </div>
                          <Link
                            href="/jobs"
                            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 no-underline transition hover:border-teal-200 hover:text-teal-700"
                          >
                            View
                          </Link>
                        </div>
                      ) : (
                        <div
                          ref={experienceMenuRef}
                          className="relative z-10 w-full rounded-2xl border border-slate-200 bg-white p-2 text-sm text-slate-700 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleExperienceNavigate("FRESHER")}
                            className="flex w-full items-center justify-start rounded-xl px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-indigo-50"
                          >
                            Fresher Jobs
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExperienceNavigate("INTERNSHIPS")}
                            className="flex w-full items-center justify-start rounded-xl px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-indigo-50"
                          >
                            Internships
                          </button>
                          <button
                            type="button"
                            onClick={() => handleExperienceNavigate("CAREER_GROWTH")}
                            className="flex w-full items-center justify-start rounded-xl px-3 py-2 text-left font-medium text-slate-700 transition hover:bg-indigo-50"
                          >
                            Career Growth Jobs
                          </button>
                        </div>
                      )}
                    </div>
                    {quickActionCards.map((card) => (
                      <Link
                        key={card.title}
                        href={card.href}
                        className="group h-full overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 no-underline transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:no-underline"
                      >
                        <div className="flex h-full flex-col justify-between gap-5">
                          <div>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-sm font-black uppercase tracking-[0.25em] text-white shadow-lg ${card.accent}`}>
                              {card.badge}
                            </div>
                            <h3 className="mt-5 text-lg font-semibold leading-tight text-slate-900">{card.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                          </div>
                          <div className="inline-flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-600">
                            <span>{card.cta}</span>
                            <span>Now</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          </section>

          {smartSuggestionData.notice && (
            <section className="rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(255,247,237,0.9),rgba(239,246,255,0.95))] p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.4)] backdrop-blur-2xl">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-500">Smart Application Timeline</p>
                  <h2 className="text-2xl font-bold text-slate-900">Explore similar jobs</h2>
                  <p className="text-sm text-slate-600">
                    {smartSuggestionData.notice ||
                      "We're still waiting for a response from the recruiter. Meanwhile, here are similar jobs you might be interested in."}
                  </p>
                </div>
                {smartSuggestionData.jobs.length === 0 ? (
                  <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-sm text-slate-600">
                    We are still curating the best matches. Check back soon for fresh suggestions.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {smartSuggestionData.jobs.map((job) => (
                      <div
                        key={job.id}
                        className="flex flex-col justify-between rounded-3xl border border-white/70 bg-gradient-to-br from-white via-[#FFF7ED] to-[#EEF6FF] p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)]"
                      >
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{job.title}</h3>
                          {job.recruiter_id || job.company_id ? (
                            <button
                              type="button"
                              onClick={() => router.push(getCompanyManagePostsHref(job.recruiter_id || job.company_id))}
                              className="appearance-none border-0 bg-transparent p-0 text-left text-sm text-slate-600 transition hover:text-cyan-700"
                            >
                              {job.company || 'Company'}
                            </button>
                          ) : (
                            <p className="text-sm text-slate-600">{job.company || 'Company'}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                            {job.location && (
                              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1">
                                {job.location}
                              </span>
                            )}
                            {job.experienceLevel && (
                              <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1">
                                {job.experienceLevel}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-5">
                          <Link
                            href={`/jobs/${job.id}/apply`}
                            className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_-18px_rgba(79,70,229,0.45)] transition hover:from-indigo-700 hover:to-sky-600"
                          >
                            Apply now
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
          {/* Recruiter post feed */}
          <section className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto bg-transparent [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col gap-6">
              {feedError && (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-medium text-red-700">
                  {feedError}
                </div>
              )}
              {recommendedJobsError && (
                <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-sm font-medium text-amber-800">
                  Some recommended jobs could not load, but other company updates are still available.
                </div>
              )}

              {feedPosts.length === 0 && standalonePulseJobs.length === 0 && (feedLoading || recommendedJobsLoading) ? (
                <div className="space-y-5">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="mx-auto max-w-2xl animate-pulse rounded-[28px] border border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-slate-200" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-40 rounded bg-slate-200" />
                          <div className="h-3 w-24 rounded bg-slate-100" />
                        </div>
                      </div>
                      <div className="mt-5 aspect-video rounded-3xl bg-slate-100" />
                      <div className="mt-4 h-3 w-3/4 rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : feedPosts.length === 0 && standalonePulseJobs.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm font-medium text-slate-600">
                  No company updates yet. New recruiter jobs and posts will appear here.
                </div>
              ) : (
                <div className="mx-auto flex max-w-2xl flex-col gap-0">
                  {pulseFeedItems.map((item) => {
                    if (item.type === 'friend-suggestions') {
                      return (
                        <div key={item.key} className="pb-6">
                          <FriendSuggestions limit={10} />
                        </div>
                      )
                    }

                    if (item.type === 'latest-recruiter-jobs') {
                      return (
                        <article key={item.key} className="mb-6 overflow-hidden rounded-[30px] border border-cyan-100 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.55)]">
                          {renderPulseJobRail(standalonePulseJobs, 'Latest recruiter jobs')}
                        </article>
                      )
                    }

                    const post = item.post
                    if (post.post_type === 'user') {
                      const userMediaItems = getUserPostMediaItems(post)
                      const userProfileHref = `/users/${encodeURIComponent(post.user_id)}`
                      const userAvatarUrl = post.profile_photo
                        ? post.profile_photo.startsWith('http')
                          ? post.profile_photo
                          : `${apiOrigin || ''}${post.profile_photo.startsWith('/') ? '' : '/'}${post.profile_photo}`
                        : ''
                      return (
                        <article key={`user-${post.id}`} className="relative overflow-hidden rounded-[30px] border border-slate-200/80 bg-white shadow-[0_22px_60px_-40px_rgba(15,23,42,0.55)]">
                          <div className="flex items-center gap-3 p-5">
                            <button type="button" onClick={() => router.push(userProfileHref)} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-slate-700">
                              {userAvatarUrl ? <img src={userAvatarUrl} alt="" className="h-full w-full object-cover" /> : String(post.user_name || 'U').slice(0, 1)}
                            </button>
                            <div className="min-w-0">
                              <button type="button" onClick={() => router.push(userProfileHref)} className="block max-w-full appearance-none truncate border-0 bg-transparent p-0 text-left text-sm font-bold text-slate-950 hover:text-cyan-700">
                                {post.user_name || 'TrueHire user'}
                              </button>
                              <p className="text-xs text-slate-500">{formatTimeAgo(post.created_at) || 'Just now'}</p>
                            </div>
                          </div>
                          {userMediaItems.length > 0 && (
                            <div className="bg-slate-950">
                              {userMediaItems[0].type === 'video' ? (
                                <video src={userMediaItems[0].url} className="max-h-[620px] w-full object-contain" controls playsInline preload="metadata" />
                              ) : (
                                <img src={userMediaItems[0].url} alt="" className="max-h-[620px] w-full object-contain" />
                              )}
                            </div>
                          )}
                          {post.caption && (
                            <div className="px-5 py-4">
                              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{post.caption}</p>
                            </div>
                          )}
                          <div className="border-t border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-5 text-slate-700">
                              <button
                                type="button"
                                onClick={() => handleLikeUserPost(post)}
                                disabled={userPostActionId === `like-${post.id}`}
                                className={`inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600 disabled:opacity-60 ${post.liked ? 'text-blue-600' : ''}`}
                                aria-label="Like post"
                              >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill={post.liked ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                                </svg>
                                <span>{Number(post.like_count || 0)}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleUserPostComments(post)}
                                className={`inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600 ${openUserPostCommentsId === String(post.id) ? 'text-blue-600' : ''}`}
                                aria-label="Open comments"
                              >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                                </svg>
                                <span>{Number(post.comment_count || 0)}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareUserPost(post)}
                                disabled={userPostActionId === `share-${post.id}`}
                                className="inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600 disabled:opacity-60"
                                aria-label="Share post"
                              >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                                </svg>
                                <span>{Number(post.share_count || 0)}</span>
                              </button>
                            </div>
                            {openUserPostCommentsId === String(post.id) && (
                              <div className="mt-4">
                                {renderUserPostCommentsPanel(post)}
                              </div>
                            )}
                          </div>
                        </article>
                      )
                    }
                    const mediaItems = getFeedPostMediaItems(post)
                    const postId = String(post.id)
                    const comments = commentsByPost[post.id] || commentsByPost[postId] || []
                    const topLevelComments = comments.filter((comment) => !comment.parent_comment_id)
                    const repliesByCommentId = comments.reduce((acc, comment) => {
                      if (comment.parent_comment_id) {
                        const parentId = String(comment.parent_comment_id)
                        acc[parentId] = [...(acc[parentId] || []), comment]
                      }
                      return acc
                    }, {})
                    const logoUrl = post.company_logo
                      ? post.company_logo.startsWith('http')
                        ? post.company_logo
                        : `${apiOrigin || ''}${post.company_logo.startsWith('/') ? '' : '/'}${post.company_logo}`
                      : ''
                    const companyStatus = statusByCompanyId.get(String(post.company_id || ''))
                    const companyManagePostsHref = getCompanyManagePostsHref(post.company_id) || `/overview?pulsePost=${postId}`
                    return (
                      <article key={post.id} data-pulse-post-id={postId} className="relative overflow-hidden border-b border-slate-200 bg-white">
                        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                          <div className="flex min-w-0 items-center gap-3">
                            <button
                              type="button"
                              onClick={() => router.push(companyManagePostsHref)}
                              className={`group shrink-0 rounded-full p-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                                companyStatus
                                  ? companyStatus.viewed
                                    ? 'bg-slate-200 hover:scale-105'
                                    : 'bg-[conic-gradient(from_180deg,#06b6d4,#22c55e,#0f172a,#06b6d4)] hover:scale-105'
                                  : 'bg-transparent'
                              }`}
                              aria-label={`Open ${post.company_name || 'company'} Manage Posts page`}
                            >
                              <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-50 shadow-sm">
                                {logoUrl ? (
                                  <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <span className="text-sm font-black text-slate-500">{String(post.company_name || 'T').slice(0, 1)}</span>
                                )}
                              </span>
                            </button>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => router.push(companyManagePostsHref)}
                                className="block max-w-full appearance-none border-0 bg-transparent p-0 text-left"
                                aria-label={`Open ${post.company_name || 'company'} Manage Posts page`}
                              >
                                <span className="block truncate text-sm font-bold text-slate-950 transition hover:text-cyan-700">{post.company_name}</span>
                              </button>
                              {companyStatus ? (
                                <button
                                  type="button"
                                  onClick={() => openStatusViewer(companyStatus)}
                                  className="appearance-none border-0 bg-transparent p-0 text-left text-xs text-cyan-700 transition hover:text-cyan-800"
                                >
                                  Status available
                                </button>
                              ) : (
                                <p className="text-xs text-slate-500">{formatTimeAgo(post.created_at) || 'Just now'}</p>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={feedActionId === `follow-${post.id}`}
                            onClick={() => handleFollowCompany(post)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                              post.following
                                ? 'border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                                : 'bg-slate-950 text-white hover:bg-slate-800'
                            } disabled:opacity-60`}
                          >
                            {post.following ? 'Following' : 'Follow'}
                          </button>
                        </div>

                        {mediaItems.length > 0 && (
                          <div className="relative bg-white">
                            {likeBurstPostIds[postId] && (
                              <div key={likeBurstPostIds[postId]} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                                <svg className="h-24 w-24 animate-[ping_0.65s_ease-out_1] fill-rose-500 text-rose-500 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]" viewBox="0 0 24 24" aria-hidden="true">
                                  <path d="M12 21 4.2 13.4a5.5 5.5 0 0 1 7.8-7.8 5.5 5.5 0 0 1 7.8 7.8L12 21Z" />
                                </svg>
                              </div>
                            )}
                            {mediaItems.length === 1 ? (
                              mediaItems[0].type === 'video' ? (
                                <>
                                  <video
                                    src={mediaItems[0].url}
                                    className="max-h-[620px] w-full cursor-pointer object-contain"
                                    muted
                                    playsInline
                                    preload="metadata"
                                    data-post-id={postId}
                                    onPlay={() => handleVideoPostPlay(post)}
                                    onClick={(event) => handleFeedVideoClick(event, post)}
                                  />
                                  <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                                    {Number(post.view_count || 0)} views
                                  </div>
                                </>
                              ) : (
                                <img src={mediaItems[0].url} alt="" className="max-h-[620px] w-full object-contain" onClick={() => registerFeedMediaTap(post)} />
                              )
                            ) : (
                              <div className="flex snap-x gap-2 overflow-x-auto bg-white [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {mediaItems.map((item, index) => (
                                  <div key={`${item.url}-${index}`} className="relative h-[420px] w-full min-w-full snap-center overflow-hidden bg-white sm:h-[520px]">
                                    {item.type === 'video' ? (
                                      <video
                                        src={item.url}
                                        className="h-full w-full cursor-pointer object-contain"
                                        muted
                                        playsInline
                                        preload="metadata"
                                        data-post-id={postId}
                                        onPlay={() => handleVideoPostPlay(post)}
                                        onClick={(event) => handleFeedVideoClick(event, post)}
                                      />
                                    ) : (
                                      <img src={item.url} alt="" className="h-full w-full object-contain" onClick={() => registerFeedMediaTap(post)} />
                                    )}
                                    <div className="absolute right-3 top-3 rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                                      {index + 1}/{mediaItems.length}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4 px-4 py-4 sm:px-5">
                          <div className="flex items-center gap-5 border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
                            <button
                              type="button"
                              disabled={feedActionId === post.id}
                              onClick={() => handleLikePost(post)}
                              className={`inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:opacity-60 ${post.liked ? 'text-blue-700' : 'hover:text-blue-700'}`}
                              aria-label="Like"
                            >
                              <svg className={`h-6 w-6 ${post.liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                              </svg>
                              <span>{post.like_count || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleComments(post)}
                              className={`inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${openCommentPostId === post.id ? 'text-blue-700' : ''}`}
                              aria-label="Comments"
                              aria-expanded={openCommentPostId === post.id}
                              aria-controls={`comment-box-${post.id}`}
                            >
                              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
                              </svg>
                              <span>{post.comment_count || 0}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSharePost(post)}
                              className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                              aria-label="Share"
                            >
                              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                              </svg>
                            </button>
                          </div>
                          {post.caption && (
                            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{post.caption}</p>
                          )}
                          {false && openCommentPostId === post.id && (
                            <>
                              <div
                                id={`comment-box-${post.id}`}
                                className="flex items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 p-2 transition focus-within:border-cyan-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-cyan-500/10"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
                                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M12 12a4 4 0 100-8 4 4 0 000 8zm7 8a7 7 0 00-14 0" />
                                  </svg>
                                </div>
                                <label htmlFor={`comment-${post.id}`} className="sr-only">Write a comment</label>
                                <input
                                  id={`comment-${post.id}`}
                                  value={commentDrafts[post.id] || ''}
                                  onChange={(event) => setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                                  placeholder="Write a comment..."
                                  className="min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                                />
                                <button
                                  type="button"
                                  disabled={feedActionId === `comment-${post.id}` || !String(commentDrafts[post.id] || '').trim()}
                                  onClick={() => handleAddComment(post)}
                                  className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:translate-y-0"
                                >
                                  Post
                                </button>
                              </div>
                              <div className="space-y-3 rounded-[22px] bg-slate-50 px-4 py-4">
                                {commentsLoadingId === post.id ? (
                                  <div className="space-y-3">
                                    {[0, 1].map((item) => (
                                      <div key={item} className="flex animate-pulse gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-200" />
                                        <div className="flex-1 space-y-2">
                                          <div className="h-3 w-32 rounded bg-slate-200" />
                                          <div className="h-3 w-3/4 rounded bg-slate-100" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : topLevelComments.length > 0 ? (
                                  topLevelComments.map((item) => {
                                    const canDeleteComment = currentUserId && String(item.user_id) === String(currentUserId)
                                    const replyingToThis = String(replyingToByPost[postId] || '') === String(item.id)
                                    const replyKey = `${postId}-${item.id}`
                                    const replies = repliesByCommentId[String(item.id)] || []
                                    const repliesOpen = Boolean(expandedReplyThreads[replyKey])
                                    return (
                                      <div key={item.id || `${item.user_id}-${item.created_at}-${item.comment}`} className="flex gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-black text-slate-500 shadow-sm">
                                          {String(item.user_name || 'U').slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                            <div className="flex items-start gap-3">
                                              <div className="min-w-0 flex-1">
                                                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                  <p className="text-sm font-bold text-slate-900">{item.user_name || 'TrueHire user'}</p>
                                                  <span className="text-xs text-slate-400">{formatTimeAgo(item.created_at) || 'Just now'}</span>
                                                </div>
                                                <p className="mt-1 whitespace-pre-line break-words text-sm leading-5 text-slate-700">{item.comment}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-4">
                                                  <button
                                                    type="button"
                                                    onClick={() => setReplyingToByPost((current) => ({ ...current, [postId]: replyingToThis ? null : item.id }))}
                                                    className="text-xs font-bold text-slate-500 transition hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                                  >
                                                    {replyingToThis ? 'Cancel reply' : 'Reply'}
                                                  </button>
                                                  {canDeleteComment && (
                                                    <button
                                                      type="button"
                                                      disabled={feedActionId === `delete-comment-${item.id}`}
                                                      onClick={() => handleDeleteComment(post, item)}
                                                      className="text-xs font-bold text-rose-500 transition hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                      {feedActionId === `delete-comment-${item.id}` ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => setReplyingToByPost((current) => ({ ...current, [postId]: replyingToThis ? null : item.id }))}
                                                className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-100 text-slate-400 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${replyingToThis ? 'border-cyan-200 bg-cyan-50 text-cyan-700' : ''}`}
                                                aria-label={`Reply to ${item.user_name || 'comment'}`}
                                              >
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
                                                </svg>
                                              </button>
                                            </div>
                                          </div>
                                          {replies.length > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => setExpandedReplyThreads((current) => ({ ...current, [replyKey]: !current[replyKey] }))}
                                              className="mt-3 inline-flex items-center gap-3 pl-4 text-xs font-bold text-slate-500 transition hover:text-cyan-700"
                                            >
                                              <span className="h-px w-8 bg-slate-300" />
                                              <span>{repliesOpen ? 'Hide replies' : `View ${replies.length} more ${replies.length === 1 ? 'reply' : 'replies'}`}</span>
                                            </button>
                                          )}
                                          {repliesOpen && (
                                            <div className="mt-3 space-y-3 border-l-2 border-slate-200 pl-4">
                                              {replies.map((reply) => {
                                                const canDeleteReply = currentUserId && String(reply.user_id) === String(currentUserId)
                                                return (
                                                  <div key={reply.id || `${reply.user_id}-${reply.created_at}-${reply.comment}`} className="flex gap-2">
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-black text-slate-500 shadow-sm">
                                                      {String(reply.user_name || 'U').slice(0, 1).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2 shadow-sm">
                                                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                                        <p className="text-xs font-bold text-slate-900">{reply.user_name || 'TrueHire user'}</p>
                                                        <span className="text-[11px] text-slate-400">{formatTimeAgo(reply.created_at) || 'Just now'}</span>
                                                      </div>
                                                      <p className="mt-0.5 whitespace-pre-line break-words text-sm leading-5 text-slate-700">{reply.comment}</p>
                                                      {canDeleteReply && (
                                                        <button
                                                          type="button"
                                                          disabled={feedActionId === `delete-comment-${reply.id}`}
                                                          onClick={() => handleDeleteComment(post, reply)}
                                                          className="mt-1 text-xs font-bold text-rose-500 transition hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                          {feedActionId === `delete-comment-${reply.id}` ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                      )}
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() => setReplyingToByPost((current) => ({ ...current, [postId]: replyingToThis ? null : item.id }))}
                                                      className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-cyan-50 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                                      aria-label={`Reply to ${reply.user_name || 'reply'}`}
                                                    >
                                                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                )
                                              })}
                                            </div>
                                          )}
                                          {replyingToThis && (
                                            <div className="mt-3 flex items-center gap-2 rounded-[20px] border border-slate-200 bg-white p-2 shadow-sm">
                                              <input
                                                value={replyDrafts[replyKey] || ''}
                                                onChange={(event) => setReplyDrafts((current) => ({ ...current, [replyKey]: event.target.value }))}
                                                onKeyDown={(event) => {
                                                  if (event.key === 'Enter') handleAddComment(post, item)
                                                }}
                                                placeholder={`Reply to ${item.user_name || 'comment'}...`}
                                                className="min-w-0 flex-1 border-0 bg-transparent px-2 py-1.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                                              />
                                              <button
                                                type="button"
                                                disabled={feedActionId === `reply-${item.id}` || !String(replyDrafts[replyKey] || '').trim()}
                                                onClick={() => handleAddComment(post, item)}
                                                className="inline-flex h-8 shrink-0 items-center justify-center rounded-full bg-slate-950 px-3 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                              >
                                                Reply
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })
                                ) : (
                                  <p className="text-center text-sm font-medium text-slate-500">No comments yet. Start the conversation.</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {openCommentPostId === post.id && (
                          <div className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-[30px] bg-white text-slate-950 shadow-2xl">
                            <div className="px-4 pt-3">
                              <div className="mx-auto h-1 w-16 rounded-full bg-slate-300" />
                            </div>
                            <div className="flex items-center justify-between px-5 py-4">
                              <div>
                                <p className="text-sm font-black text-slate-950">Comments</p>
                                <p className="text-xs font-semibold text-slate-500">{post.comment_count || 0} total</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setOpenCommentPostId(null)}
                                className="rounded-full border border-slate-200 bg-slate-50 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                                aria-label="Close comments"
                              >
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" /></svg>
                              </button>
                            </div>
                            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
                              {commentsLoadingId === post.id ? (
                                <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
                              ) : topLevelComments.length > 0 ? topLevelComments.map((comment) => {
                                const replyKey = `${postId}-${comment.id}`
                                const replies = repliesByCommentId[String(comment.id)] || []
                                const repliesOpen = Boolean(expandedReplyThreads[replyKey])
                                const canDelete = currentUserId && String(comment.user_id) === String(currentUserId) && String(comment.author_role || 'USER').toUpperCase() === currentCommentAuthorRole
                                const replyingToThis = String(replyingToByPost[postId] || '') === String(comment.id)
                                return (
                                  <div key={comment.id || `${comment.user_id}-${comment.created_at}-${comment.comment}`} className="mb-6 flex gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 p-[2px]">
                                      <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-sm font-black text-slate-950">
                                        {String(comment.user_name || 'U').slice(0, 1).toUpperCase()}
                                      </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-start gap-3">
                                        <div className="min-w-0 flex-1">
                                          <p className="text-base leading-6 text-slate-950">
                                            <span className="font-black">{comment.user_name || 'User'}</span>
                                            <span className="ml-2 font-medium text-slate-500">{formatTimeAgo(comment.created_at) || 'Just now'}</span>
                                          </p>
                                          <p className="mt-1 whitespace-pre-line break-words text-lg leading-6 text-slate-900">{comment.comment}</p>
                                          <div className="mt-2 flex items-center gap-6">
                                            <button
                                              type="button"
                                              onClick={() => setReplyingToByPost((current) => ({ ...current, [postId]: replyingToThis ? null : comment.id }))}
                                              className="appearance-none border-0 bg-transparent p-0 text-sm font-black text-slate-500 hover:text-slate-950"
                                            >
                                              {replyingToThis ? 'Cancel reply' : 'Reply'}
                                            </button>
                                            {canDelete && <button type="button" onClick={() => handleDeleteComment(post, comment)} className="appearance-none border-0 bg-transparent p-0 text-sm font-black text-slate-500 hover:text-rose-600">Delete</button>}
                                          </div>
                                        </div>
                                        <button type="button" onClick={() => handleToggleCommentLike(post, comment)} className={`mt-1 flex w-8 shrink-0 flex-col items-center gap-1 appearance-none border-0 bg-transparent p-0 transition hover:text-rose-500 ${comment.liked ? 'text-rose-500' : 'text-slate-500'}`} aria-label="Like comment">
                                          <svg className={`h-6 w-6 ${comment.liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                                          {Number(comment.like_count || 0) > 0 && <span className="text-xs font-bold leading-none text-slate-500">{comment.like_count}</span>}
                                        </button>
                                      </div>
                                      {replies.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => setExpandedReplyThreads((current) => ({ ...current, [replyKey]: !current[replyKey] }))}
                                          className="mt-4 inline-flex appearance-none items-center gap-3 border-0 bg-transparent p-0 text-sm font-black text-slate-500 transition hover:text-slate-950"
                                        >
                                          <span className="h-px w-10 bg-slate-300" />
                                          <span>{repliesOpen ? 'Hide replies' : `View ${replies.length} more ${replies.length === 1 ? 'reply' : 'replies'}`}</span>
                                        </button>
                                      )}
                                      {repliesOpen && (
                                        <div className="mt-4 space-y-4">
                                          {replies.map((reply) => {
                                            const canDeleteReply = currentUserId && String(reply.user_id) === String(currentUserId) && String(reply.author_role || 'USER').toUpperCase() === currentCommentAuthorRole
                                            return (
                                              <div key={reply.id || `${reply.user_id}-${reply.created_at}-${reply.comment}`} className="flex gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                                                  {String(reply.user_name || 'U').slice(0, 1).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                  <p className="text-sm leading-5 text-slate-950">
                                                    <span className="font-black">{reply.user_name || 'User'}</span>
                                                    <span className="ml-2 font-medium text-slate-500">{formatTimeAgo(reply.created_at) || 'Just now'}</span>
                                                  </p>
                                                  <p className="mt-0.5 whitespace-pre-line break-words text-base leading-6 text-slate-900">{reply.comment}</p>
                                                  {canDeleteReply && <button type="button" onClick={() => handleDeleteComment(post, reply)} className="mt-1 appearance-none border-0 bg-transparent p-0 text-xs font-black text-slate-500 hover:text-rose-600">Delete</button>}
                                                </div>
                                                <button type="button" onClick={() => handleToggleCommentLike(post, reply)} className={`flex w-6 shrink-0 flex-col items-center gap-1 appearance-none border-0 bg-transparent p-0 transition hover:text-rose-500 ${reply.liked ? 'text-rose-500' : 'text-slate-500'}`} aria-label="Like reply">
                                                  <svg className={`h-5 w-5 ${reply.liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                                                  {Number(reply.like_count || 0) > 0 && <span className="text-[11px] font-bold leading-none text-slate-500">{reply.like_count}</span>}
                                                </button>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                      {replyingToThis && (
                                        <div className="mt-3 flex gap-2">
                                          <input
                                            value={replyDrafts[replyKey] || ''}
                                            onChange={(event) => setReplyDrafts((current) => ({ ...current, [replyKey]: event.target.value }))}
                                            onKeyDown={(event) => {
                                              if (event.key === 'Enter') handleAddComment(post, comment)
                                            }}
                                            placeholder={`Reply to ${comment.user_name || 'comment'}...`}
                                            className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => handleAddComment(post, comment)}
                                            disabled={feedActionId === `reply-${comment.id}` || !String(replyDrafts[replyKey] || '').trim()}
                                            className="rounded-full bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                          >
                                            Reply
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )
                              }) : (
                                <p className="pt-8 text-center text-sm font-semibold text-slate-500">No comments yet</p>
                              )}
                            </div>
                            <div className="border-t border-slate-200 bg-white p-3">
                              <div className="flex gap-2">
                                <input
                                  value={commentDrafts[postId] || ''}
                                  onChange={(event) => setCommentDrafts((current) => ({ ...current, [postId]: event.target.value }))}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleAddComment(post)
                                  }}
                                  placeholder="Write a comment..."
                                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white focus:ring-4 focus:ring-slate-200/60"
                                />
                                <button type="button" onClick={() => handleAddComment(post)} disabled={feedActionId === `comment-${postId}` || !String(commentDrafts[postId] || '').trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Post</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    )
                  })}
                </div>
              )}
              <div ref={feedSentinelRef} className="h-1" aria-hidden="true" />
              {feedLoading && (feedPosts.length > 0 || standalonePulseJobs.length > 0) && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center text-sm font-medium text-slate-500">
                  Loading more posts...
                </div>
              )}
              {!feedHasMore && (feedPosts.length > 0 || standalonePulseJobs.length > 0) && (
                <p className="text-center text-sm text-slate-500">You are all caught up.</p>
              )}
            </div>
          </section>
        </div>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-20 items-center justify-around border-t border-white/10 bg-[#162742] px-5 text-white md:inset-x-auto md:left-1/2 md:w-[560px] md:max-w-[calc(100vw-3rem)] md:-translate-x-1/2 md:rounded-t-3xl md:border md:border-b-0 md:border-white/10 md:shadow-2xl">
        <button type="button" onClick={() => router.push('/overview')} className="appearance-none border-0 bg-transparent p-0 text-white" aria-label="Home">
          <Home className="h-8 w-8" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => router.push('/messages')} className="appearance-none border-0 bg-transparent p-0 text-white" aria-label="Messages">
          <Send className="h-8 w-8" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => router.push('/jobs')} className="appearance-none border-0 bg-transparent p-0 text-white" aria-label="Search">
          <Search className="h-8 w-8" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => router.push('/profile')} className="flex h-10 w-10 appearance-none items-center justify-center overflow-hidden rounded-full border border-white/25 bg-slate-700 p-0 text-xs font-black text-white" aria-label="Profile">
          {photoSrc ? <img src={photoSrc} alt="" className="h-full w-full object-cover" /> : String(displayName || 'U').slice(0, 1)}
        </button>
      </nav>
      {shareTargetPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6"
          onClick={closeShareDialog}
        >
          <div
            className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-700">Share to Messages</p>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Send Company Pulse post</h2>
                </div>
                <button
                  type="button"
                  onClick={closeShareDialog}
                  disabled={shareSending}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
                  aria-label="Close share dialog"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="truncate text-sm font-black text-slate-950">{shareTargetPost.company_name || 'Company Pulse'}</p>
                {shareTargetPost.caption && (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{shareTargetPost.caption}</p>
                )}
              </div>
            </div>

            <div className="border-b border-slate-200 bg-white px-5 py-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-100">
                <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z" />
                </svg>
                <input
                  value={shareConversationQuery}
                  onChange={(event) => setShareConversationQuery(event.target.value)}
                  placeholder="Search messages..."
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {shareConversationQuery && (
                  <button
                    type="button"
                    onClick={() => setShareConversationQuery('')}
                    className="text-xs font-bold text-slate-400 transition hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {shareConversationsLoading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((item) => (
                    <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 p-3">
                      <div className="h-11 w-11 rounded-full bg-slate-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-36 rounded bg-slate-200" />
                        <div className="h-3 w-52 rounded bg-slate-100" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : shareConversations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
                  <p className="text-sm font-black text-slate-800">No message conversations yet.</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Start a direct chat first, then shared Company Pulse posts can be sent here.</p>
                  <button
                    type="button"
                    onClick={() => router.push('/connections')}
                    className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Find people
                  </button>
                </div>
              ) : filteredShareConversations.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center text-sm font-semibold text-slate-500">
                  No matching conversations.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredShareConversations.map((conversation) => {
                    const other = conversation.otherUser || {}
                    const selected = selectedShareConversationIds.includes(String(conversation.id))
                    const imageSrc = other.profilePhoto
                      ? other.profilePhoto.startsWith('http')
                        ? other.profilePhoto
                        : `${apiOrigin || ''}${other.profilePhoto.startsWith('/') ? '' : '/'}${other.profilePhoto}`
                      : ''

                    return (
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() => toggleShareConversation(conversation.id)}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                          selected
                            ? 'border-cyan-300 bg-cyan-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-cyan-50/40'
                        }`}
                        aria-pressed={selected}
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-slate-700">
                          {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : String(other.name || 'U').slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-black text-slate-950">{other.name || 'User'}</span>
                          <span className="mt-0.5 block truncate text-xs text-slate-500">{conversation.lastMessage || 'Direct conversation'}</span>
                        </span>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          selected ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-300 text-transparent'
                        }`}>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="m3.5 8 3 3 6-6" />
                          </svg>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 bg-white px-5 py-4">
              {shareError && (
                <p className="mb-3 rounded-2xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{shareError}</p>
              )}
              {shareNotice && (
                <p className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{shareNotice}</p>
              )}
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold text-slate-500">
                  {selectedShareConversationIds.length} selected
                </p>
                <button
                  type="button"
                  onClick={sendCompanyPulseShare}
                  disabled={shareSending || selectedShareConversationIds.length === 0}
                  className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {shareSending ? 'Sharing...' : 'Share'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {selectedUserPost && (
        <div
          className="fixed inset-0 z-50 bg-white px-3 py-4"
          onClick={() => setSelectedUserPostTile(null)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-[430px] flex-col"
            onClick={(event) => event.stopPropagation()}
          >
            <div
              ref={userPostViewerScrollRef}
              onScroll={handleUserPostViewerScroll}
              className="min-h-0 flex-1 snap-y snap-mandatory space-y-5 overflow-y-auto scroll-smooth pb-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {userPosts.map((viewerPost) => {
                const viewerPostId = String(viewerPost.id)
                const mediaList = getUserPostMediaItems(viewerPost)
                const viewerMediaList = mediaList.length ? mediaList : [{ type: 'text', url: '' }]
                const isActiveViewerPost = viewerPostId === selectedUserPostId
                const mediaIndex = isActiveViewerPost
                  ? Math.min(selectedUserPostMediaIndex, viewerMediaList.length - 1)
                  : 0
                const mediaItem = viewerMediaList[mediaIndex] || viewerMediaList[0]
                return (
                <article
                  key={viewerPostId}
                  data-user-post-card={viewerPostId}
                  className="snap-start snap-always overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-black text-slate-950">
                      {photoSrc ? <img src={photoSrc} alt="" className="h-full w-full object-cover" /> : String(displayName || 'T').slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-black text-slate-950">{displayName}</p>
                      <p className="text-[10px] font-semibold text-slate-500">{formatTimeAgo(viewerPost.created_at) || 'Just now'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserPostTile(null)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-400 text-slate-700 transition hover:bg-slate-50"
                      aria-label="Close post"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                      </svg>
                    </button>
                  </div>
                  <div
                    className="relative bg-[#030715]"
                    onTouchStart={(event) => {
                      userPostTouchStartXRef.current = event.touches[0]?.clientX ?? null
                    }}
                    onTouchEnd={(event) => {
                      const startX = userPostTouchStartXRef.current
                      userPostTouchStartXRef.current = null
                      if (startX == null) return
                      const endX = event.changedTouches[0]?.clientX ?? startX
                      const delta = endX - startX
                      if (Math.abs(delta) > 45) moveSelectedUserPostMedia(delta < 0 ? 1 : -1)
                    }}
                  >
                    {mediaItem.type === 'video' ? (
                      <video src={mediaItem.url} controls playsInline className="max-h-[520px] min-h-[260px] w-full object-contain" />
                    ) : mediaItem.type === 'text' ? (
                      <div className="flex min-h-[360px] items-center justify-center bg-white p-6 text-center">
                        <p className="whitespace-pre-line text-base font-bold leading-7 text-slate-800">{viewerPost.caption || 'Profile update'}</p>
                      </div>
                    ) : (
                      <img src={mediaItem.url} alt="" className="max-h-[520px] min-h-[260px] w-full object-contain" />
                    )}
                    {mediaList.length > 1 && (
                      <span className="absolute right-2 top-2 rounded-full bg-slate-950/80 px-2 py-1 text-[10px] font-black text-white">
                        {mediaIndex + 1}/{mediaList.length}
                      </span>
                    )}
                  </div>
                  {mediaList.length > 1 && (
                    <div className="flex items-center justify-center gap-1 bg-white px-3 py-3">
                      {mediaList.map((item, index) => (
                        <button
                          key={`${item.url}-${index}`}
                          type="button"
                          onClick={() => {
                            setSelectedUserPostTile({ postId: viewerPostId, mediaIndex: index })
                          }}
                          className={`aspect-square h-2 shrink-0 rounded-full transition-colors ${
                            index === mediaIndex ? 'bg-blue-500' : 'bg-slate-300 hover:bg-slate-400'
                          }`}
                          aria-label={`Show media ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                  <div className="space-y-2 px-3 pb-4 pt-2">
                    <div className="flex items-center justify-between text-slate-950">
                      <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleLikeUserPost(viewerPost)}
                      disabled={userPostActionId === `like-${viewerPostId}`}
                      className={`inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-black leading-none transition hover:text-blue-600 disabled:opacity-60 ${viewerPost.liked ? 'text-blue-600' : ''}`}
                      aria-label="Like post"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill={viewerPost.liked ? 'currentColor' : 'none'} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                      </svg>
                      <span>{Number(viewerPost.like_count || 0)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOpenUserPostCommentsId((current) => current === viewerPostId ? null : viewerPostId)
                        if (!userPostCommentsByPost[viewerPostId]) loadUserPostComments(viewerPostId)
                      }}
                      className={`inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-xs font-black leading-none transition hover:text-blue-600 ${openUserPostCommentsId === viewerPostId ? 'text-blue-600' : ''}`}
                      aria-label="Open comments"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                      </svg>
                      <span>{Number(viewerPost.comment_count || 0)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareUserPost(viewerPost)}
                      disabled={userPostActionId === `share-${viewerPostId}`}
                      className="appearance-none border-0 bg-transparent p-0 leading-none transition hover:text-blue-600 disabled:opacity-60"
                      aria-label="Share post"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                      </svg>
                    </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteUserPost(viewerPost)}
                        disabled={userPostActionId === `delete-${viewerPostId}`}
                        className="appearance-none border-0 bg-transparent p-0 leading-none transition hover:text-rose-600 disabled:opacity-50"
                        aria-label="Delete post"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M8 7v12h8V7" />
                        </svg>
                      </button>
                    </div>
                    {viewerPost.caption && (
                      <p className="whitespace-pre-line text-xs font-semibold leading-5 text-slate-700">
                        <span className="font-black text-slate-950">{displayName}</span> {viewerPost.caption}
                      </p>
                    )}
                    <p className="text-[10px] font-black uppercase text-slate-400">{formatTimeAgo(viewerPost.created_at) || 'Just now'}</p>
                    {openUserPostCommentsId === viewerPostId && renderUserPostCommentsPanel(viewerPost)}
                  </div>
                </article>
              )})}
            </div>
          </div>
        </div>
      )}
      {messagePremiumTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 px-4"
          onClick={() => !messagePremiumPaying && setMessagePremiumTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Premium messaging</p>
                <h2 className="mt-1 text-lg font-black text-slate-950">Message {messagePremiumTarget.name}</h2>
              </div>
              <button
                type="button"
                disabled={messagePremiumPaying}
                onClick={() => setMessagePremiumTarget(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 disabled:opacity-50"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Complete the premium payment to start a chat with this recruiter.
            </p>
            {messagePremiumError && (
              <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                {messagePremiumError}
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={messagePremiumPaying}
                onClick={() => setMessagePremiumTarget(null)}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={messagePremiumPaying}
                onClick={startCompanyMessagePayment}
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {messagePremiumPaying ? 'Opening...' : 'Pay and Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
      {followListType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6" onClick={() => setFollowListType(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black capitalize text-slate-950">{followListType}</h2>
              <button type="button" onClick={() => setFollowListType(null)} className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-base font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950" aria-label="Close">
                ×
              </button>
            </div>
            {followListLoading ? (
              <p className="py-6 text-sm text-slate-500">Loading...</p>
            ) : followListUsers.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No {followListType} yet.</p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                {followListUsers.map((item) => {
                  const isCompany = item.followType === 'company'
                  const initials = String(item.name || (isCompany ? 'C' : 'U')).slice(0, 1).toUpperCase()
                  const imageSrc = item.profileImage
                    ? item.profileImage.startsWith('http')
                      ? item.profileImage
                      : `${apiOrigin || ''}${item.profileImage.startsWith('/') ? '' : '/'}${item.profileImage}`
                    : ''
                  return (
                    <div
                      key={item.id}
                      className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-cyan-200 hover:bg-cyan-50/30"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setFollowListType(null)
                          router.push(isCompany
                            ? `/manage-posts?companyId=${encodeURIComponent(item.id)}`
                            : `/users/${item.id}`)
                        }}
                        className="flex min-w-0 flex-1 appearance-none items-center gap-3 border-0 bg-transparent p-0 text-left transition hover:text-cyan-700"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                          {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black text-slate-950">{item.name || (isCompany ? 'Recruiter' : 'User')}</p>
                          <p className="mt-1 truncate text-xs font-medium text-slate-500">
                            {isCompany
                              ? [item.industry, item.headquarters_location].filter(Boolean).join(' • ') || 'Recruiter'
                              : [item.desiredJobRole, item.currentLocation].filter(Boolean).join(' • ') || item.email || 'TrueHire user'}
                          </p>
                        </div>
                      </button>
                      {isCompany && (
                        <button
                          type="button"
                          disabled={messagePremiumLoading || messagePremiumPaying}
                          onClick={() => openCompanyMessage(item)}
                          className="flex h-9 shrink-0 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          Message
                        </button>
                      )}
                      {!isCompany && item.viewerFollowing && (
                        <button
                          type="button"
                          onClick={() => openDirectUserMessage(item.id)}
                          className="flex h-9 shrink-0 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-black text-white transition hover:bg-slate-800"
                        >
                          Message
                        </button>
                      )}
                      {!isCompany && !item.viewerFollowing && (
                        <button
                          type="button"
                          onClick={() => followUserFromList(item.id)}
                          className="flex h-9 shrink-0 items-center justify-center rounded-full bg-cyan-600 px-4 text-xs font-black text-white transition hover:bg-cyan-700"
                        >
                          Follow
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
      {selectedStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 px-4 py-6 text-white">
          <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/20">
            <div className="h-full w-full bg-white/80" />
          </div>
          <div className="absolute left-4 top-5 z-20 flex items-center gap-3">
            <button
              type="button"
              onClick={() => selectedStatus.company_id && router.push(getCompanyManagePostsHref(selectedStatus.company_id))}
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 p-0 text-sm font-black transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={`Open ${selectedStatus.company_name || 'company'} Manage Posts page`}
            >
              {selectedStatus.company_logo ? (
                <img src={normalizeStatusMediaUrl(selectedStatus.company_logo)} alt="" className="h-full w-full object-cover" />
              ) : (
                String(selectedStatus.company_name || 'T').slice(0, 1)
              )}
            </button>
            <div>
              <button
                type="button"
                onClick={() => selectedStatus.company_id && router.push(getCompanyManagePostsHref(selectedStatus.company_id))}
                className="appearance-none border-0 bg-transparent p-0 text-left text-sm font-black text-white transition hover:text-cyan-200"
                aria-label={`Open ${selectedStatus.company_name || 'company'} Manage Posts page`}
              >
                {selectedStatus.company_name}
              </button>
              <p className="text-xs text-white/65">{formatTimeAgo(selectedStatus.created_at) || 'Just now'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedStatus(null)}
            className="absolute right-4 top-5 z-20 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Close status"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="flex h-full w-full max-w-md items-center justify-center">
            {statusViewerLoading ? (
              <div className="h-80 w-full animate-pulse rounded-3xl bg-white/10" />
            ) : isVideoMedia(selectedStatus.media_type, selectedStatus.media_url) ? (
              <video src={normalizeStatusMediaUrl(selectedStatus.media_url)} className="max-h-[82vh] w-full rounded-3xl object-contain" controls autoPlay muted playsInline />
            ) : (
              <img src={normalizeStatusMediaUrl(selectedStatus.media_url)} alt="" className="max-h-[82vh] w-full rounded-3xl object-contain" />
            )}
          </div>
          {selectedStatus.caption && (
            <div className="absolute bottom-6 left-4 right-4 mx-auto max-w-md rounded-2xl bg-black/40 px-4 py-3 text-sm leading-6 text-white backdrop-blur">
              {selectedStatus.caption}
            </div>
          )}
        </div>
      )}
    </>
  )
}
