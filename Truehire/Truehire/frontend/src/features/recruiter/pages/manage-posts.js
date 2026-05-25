import { useEffect, useMemo, useRef, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import {
  ArrowLeft,
  BadgeCheck,
  FileVideo,
  Grid3X3,
  Image as ImageIcon,
  ImagePlus,
  MapPin,
  Pencil,
  PlayCircle,
  Plus,
  Send,
  SmilePlus,
  Sparkles,
  Type,
  Upload,
  X
} from 'lucide-react'
import apiService from '../../../utils/api'

export default function ManagePosts({ forceCreatePost = false } = {}) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [sessionUser, setSessionUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [companyProfile, setCompanyProfile] = useState(null)
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activePostTab, setActivePostTab] = useState('grid')
  const [showPostModal, setShowPostModal] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [postForm, setPostForm] = useState({ caption: '', media: [] })
  const [existingMedia, setExistingMedia] = useState([])
  const [postMediaPreviewUrls, setPostMediaPreviewUrls] = useState([])
  const [postSaving, setPostSaving] = useState(false)
  const [postError, setPostError] = useState('')
  const [deletingPostId, setDeletingPostId] = useState(null)
  const [viewingPostMedia, setViewingPostMedia] = useState(null)
  const [feedActionId, setFeedActionId] = useState(null)
  const [openCommentPostId, setOpenCommentPostId] = useState(null)
  const [commentsByPost, setCommentsByPost] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [replyDrafts, setReplyDrafts] = useState({})
  const [replyingToByPost, setReplyingToByPost] = useState({})
  const [expandedReplyThreads, setExpandedReplyThreads] = useState({})
  const [commentsLoadingId, setCommentsLoadingId] = useState(null)
  const [carouselIndexes, setCarouselIndexes] = useState({})
  const [savedPostIds, setSavedPostIds] = useState({})
  const [expandedCaptions, setExpandedCaptions] = useState({})
  const [shareMessage, setShareMessage] = useState('')
  const [viewingCarouselPost, setViewingCarouselPost] = useState(null)
  const [viewingCarouselIndex, setViewingCarouselIndex] = useState(0)
  const [likeBurstPostIds, setLikeBurstPostIds] = useState({})
  const carouselScrollerRef = useRef(null)
  const mediaSwipeRef = useRef(null)
  const suppressMediaClickRef = useRef({})
  const lastMediaTapRef = useRef({})
  const mediaClickTimerRef = useRef({})
  const createPostOpenedRef = useRef(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ caption: '', media: null })
  const [statusMediaPreviewUrl, setStatusMediaPreviewUrl] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [viewingStatus, setViewingStatus] = useState(null)
  const [showStatusViewers, setShowStatusViewers] = useState(false)
  const [statusViewers, setStatusViewers] = useState([])
  const [statusViewersLoading, setStatusViewersLoading] = useState(false)
  const [statusViewersError, setStatusViewersError] = useState('')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followListType, setFollowListType] = useState('followers')
  const [companyFollowers, setCompanyFollowers] = useState([])
  const [companyFollowersLoading, setCompanyFollowersLoading] = useState(false)
  const [companyFollowersError, setCompanyFollowersError] = useState('')
  const [companyFollowing, setCompanyFollowing] = useState([])
  const [companyFollowingLoading, setCompanyFollowingLoading] = useState(false)
  const [companyFollowingError, setCompanyFollowingError] = useState('')
  const [publicCompanyFollowing, setPublicCompanyFollowing] = useState(false)
  const [publicCompanyFollowerCount, setPublicCompanyFollowerCount] = useState(null)
  const [publicCompanyFollowBusy, setPublicCompanyFollowBusy] = useState(false)

  const quickEmojis = ['💼', '🚀', '🎉', '👏', '📢', '✨', '📍', '🤝']

  const normalizeBoolean = (value) => {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value === 1
    if (typeof value === 'string') return ['1', 'true', 'yes'].includes(value.toLowerCase())
    return false
  }

  const normalizePost = (post) => ({
    ...post,
    liked: normalizeBoolean(post?.liked),
    like_count: Number(post?.like_count || 0),
    comment_count: Number(post?.comment_count || 0)
  })

  const normalizeComment = (comment) => ({
    ...comment,
    liked: normalizeBoolean(comment?.liked),
    like_count: Number(comment?.like_count || 0)
  })

  const buildFileUrl = (filePath) => {
    if (!filePath) return ''
    if (/^https?:\/\//i.test(filePath)) return filePath
    const raw = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '')
    const base = raw.endsWith('/api') ? raw.replace(/\/api$/, '') : raw
    return `${base}${filePath.startsWith('/') ? filePath : `/${filePath}`}`
  }

  const isVideoMedia = (mediaType, mediaUrl = '') => {
    const type = String(mediaType || '').toLowerCase()
    const url = String(mediaUrl || '').toLowerCase()
    return type.includes('video') || type.includes('reel') || /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)
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

    setPostForm((current) => {
      const nextFiles = [...current.media]
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

      if (nextFiles.length === current.media.length && files.length) {
        setPostError('Those files are already selected.')
      } else if (current.media.length + files.length > 15) {
        setPostError('Only the first 15 images or videos were selected.')
      } else {
        setPostError('')
      }

      return { ...current, media: nextFiles }
    })
    event.target.value = ''
  }

  const goToManagePosts = () => {
    const target = publicCompanyId ? `/manage-posts?companyId=${encodeURIComponent(publicCompanyId)}` : '/manage-posts'
    if (typeof window !== 'undefined') {
      window.location.assign(target)
      return
    }
    router.push(target)
  }

  useEffect(() => {
    setMounted(true)
    setSessionUser(apiService.getUserData() || {})
  }, [])

  const user = sessionUser || {}
  const publicCompanyId = router.isReady
    ? String(Array.isArray(router.query.companyId) ? router.query.companyId[0] : router.query.companyId || '').trim()
    : ''
  const isPublicCompanyView = Boolean(publicCompanyId)
  const canManagePosts = !isPublicCompanyView
  const companyPageLabel = isPublicCompanyView ? 'company profile' : 'Manage Posts'
  const shouldOpenCreatePost = forceCreatePost || (
    router.isReady &&
    String(Array.isArray(router.query.create) ? router.query.create[0] : router.query.create || '') === '1'
  )

  const profile = useMemo(() => {
    const firstPost = posts[0] || {}
    const firstStatus = statuses[0] || {}
    const name = companyProfile?.company_name || companyProfile?.company || firstPost.company_name || firstPost.company || firstStatus.company_name || firstStatus.company || user.company_name || user.company || user.name || 'TrueHire Company'
    const logo = buildFileUrl(companyProfile?.company_logo || firstPost.company_logo || firstStatus.company_logo || user.company_logo || user.logo || '')
    const detailItems = [
      ['Industry', companyProfile?.industry || user.industry],
      ['Category', companyProfile?.category || companyProfile?.company_type || user.category || user.company_type],
      ['Company size', companyProfile?.company_size || companyProfile?.companySize || user.company_size || user.companySize],
      ['Founded', companyProfile?.year_founded || companyProfile?.foundedYear || user.year_founded || user.foundedYear],
      ['Headquarters', companyProfile?.headquarters_location || companyProfile?.address || user.headquarters_location || user.address]
    ].filter(([, value]) => value != null && String(value).trim() !== '')

    return {
      name,
      logo,
      initial: String(name || 'T').slice(0, 1).toUpperCase(),
      bio: companyProfile?.short_overview || companyProfile?.bio || user.short_overview || user.bio || '',
      description: companyProfile?.detailed_description || companyProfile?.description || user.detailed_description || user.description || '',
      detailItems,
      socialLinks: [
        ['LinkedIn', companyProfile?.linkedin || user.linkedin],
        ['Instagram', companyProfile?.instagram || user.instagram],
        ['Facebook', companyProfile?.facebook || user.facebook]
      ].filter(([, value]) => value != null && String(value).trim() !== ''),
      website: companyProfile?.website || companyProfile?.company_website || user.website || user.company_website || '',
      postsCount: Number(companyProfile?.posts_count ?? posts.length),
      followersCount: Number(publicCompanyFollowerCount ?? companyProfile?.followers_count ?? firstPost.followers_count ?? user.followers_count ?? user.followersCount ?? user.company_followers_count ?? 0),
      followingCount: Number(user.following_count || user.followingCount || 0)
    }
  }, [companyProfile, posts, publicCompanyFollowerCount, statuses, user])

  const activeStatuses = useMemo(() => {
    const now = Date.now()
    return statuses.filter((status) => {
      if (String(status.status || '').toUpperCase() === 'DELETED') return false
      if (!status.expires_at) return true
      const expiresAt = new Date(status.expires_at).getTime()
      return Number.isNaN(expiresAt) || expiresAt >= now
    })
  }, [statuses])

  const latestStatus = activeStatuses[0] || null

  const ensureRecruiterSession = () => {
    const token = apiService.getToken()
    const role = String(user?.role || '').toLowerCase().replace(/_/g, '-')
    if (!token || (role !== 'recruiter' && role !== 'sub-recruiter')) {
      router.push('/login')
      return false
    }
    return true
  }

  const loadPosts = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiService.request('/recruiter/posts', { returnErrorObject: true })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to load posts.')
      setPosts(Array.isArray(response.posts) ? response.posts.map(normalizePost) : [])
      setCompanyProfile(response.profile || null)
    } catch (err) {
      setError(err?.message || 'Unable to load posts.')
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyPosts = async (companyId) => {
    setLoading(true)
    setError('')
    try {
      const response = await apiService.request(`/companies/${encodeURIComponent(companyId)}/posts`, { returnErrorObject: true })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to load company posts.')
      setPosts(Array.isArray(response.posts) ? response.posts.map(normalizePost) : [])
      setCompanyProfile(response.profile || null)
    } catch (err) {
      setError(err?.message || 'Unable to load company posts.')
      setPosts([])
      setCompanyProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const loadCompanyFollowers = async () => {
    setFollowListType('followers')
    setShowFollowersModal(true)
    if (companyFollowers.length > 0 || companyFollowersLoading) return

    setCompanyFollowersLoading(true)
    setCompanyFollowersError('')
    try {
      const endpoint = isPublicCompanyView
        ? `/companies/${encodeURIComponent(publicCompanyId)}/followers`
        : '/recruiter/company-followers'
      const response = await apiService.request(endpoint, { returnErrorObject: true })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to load followers.')
      setCompanyFollowers(Array.isArray(response.followers) ? response.followers : Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setCompanyFollowers([])
      setCompanyFollowersError(err?.message || 'Unable to load followers.')
    } finally {
      setCompanyFollowersLoading(false)
    }
  }

  const loadCompanyFollowing = async () => {
    setFollowListType('following')
    setShowFollowersModal(true)
    if (companyFollowing.length > 0 || companyFollowingLoading) return

    setCompanyFollowingLoading(true)
    setCompanyFollowingError('')
    try {
      const endpoint = isPublicCompanyView
        ? `/companies/${encodeURIComponent(publicCompanyId)}/following`
        : '/recruiter/company-following'
      const response = await apiService.request(endpoint, { returnErrorObject: true })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to load following.')
      setCompanyFollowing(Array.isArray(response.following) ? response.following : Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setCompanyFollowing([])
      setCompanyFollowingError(err?.message || 'Unable to load following.')
    } finally {
      setCompanyFollowingLoading(false)
    }
  }

  const loadStatuses = async () => {
    try {
      const response = await apiService.request('/recruiter/statuses', { returnErrorObject: true })
      if (response?.error) return
      setStatuses(Array.isArray(response.statuses) ? response.statuses : [])
    } catch (_err) {
      // Statuses are optional on this profile page; posts should still render.
    }
  }

  useEffect(() => {
    if (!mounted || !router.isReady) return
    if (isPublicCompanyView) {
      loadCompanyPosts(publicCompanyId)
      return
    }
    if (!ensureRecruiterSession()) return
    loadPosts()
    loadStatuses()
  }, [mounted, router.isReady, isPublicCompanyView, publicCompanyId])

  useEffect(() => {
    if (!mounted || !router.isReady || !canManagePosts || !shouldOpenCreatePost || createPostOpenedRef.current) return
    createPostOpenedRef.current = true
    setEditingPost(null)
    setPostForm({ caption: '', media: [] })
    setExistingMedia([])
    setPostError('')
    setShowPostModal(true)
  }, [mounted, router.isReady, canManagePosts, shouldOpenCreatePost])

  useEffect(() => {
    if (!mounted || !router.isReady || !isPublicCompanyView || !publicCompanyId || !apiService.getToken()) return

    const loadPublicCompanyFollowStatus = async () => {
      const response = await apiService.getCompanyFollowStatus(publicCompanyId)
      if (response?.error) return
      setPublicCompanyFollowing(Boolean(response.following))
      setPublicCompanyFollowerCount(Number(response.followerCount || 0))
    }

    loadPublicCompanyFollowStatus()
  }, [mounted, router.isReady, isPublicCompanyView, publicCompanyId])

  const handlePublicCompanyFollow = async () => {
    if (!publicCompanyId || publicCompanyFollowBusy || publicCompanyFollowing) return
    if (!apiService.getToken()) {
      router.push('/login')
      return
    }

    setPublicCompanyFollowBusy(true)
    try {
      const response = await apiService.followCompany(publicCompanyId)
      if (response?.error) throw new Error(response.message || response.error || 'Unable to follow company.')
      setPublicCompanyFollowing(Boolean(response.following))
      setPublicCompanyFollowerCount(Number(response.followerCount || 0))
      window.dispatchEvent(new Event('follow-stats-changed'))
    } catch (err) {
      setError(err?.message || 'Unable to follow company.')
    } finally {
      setPublicCompanyFollowBusy(false)
    }
  }

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
    if (!statusForm.media) {
      setStatusMediaPreviewUrl('')
      return undefined
    }
    const previewUrl = URL.createObjectURL(statusForm.media)
    setStatusMediaPreviewUrl(previewUrl)
    return () => URL.revokeObjectURL(previewUrl)
  }, [statusForm.media])

  useEffect(() => {
    if (!viewingCarouselPost || !carouselScrollerRef.current) return
    const scroller = carouselScrollerRef.current
    window.requestAnimationFrame(() => {
      scroller.scrollTo({ top: scroller.clientHeight * viewingCarouselIndex, behavior: 'auto' })
    })
  }, [viewingCarouselPost, viewingCarouselIndex])

  useEffect(() => {
    if (!viewingCarouselPost) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setViewingCarouselPost(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewingCarouselPost])

  const openCreateModal = () => {
    setEditingPost(null)
    setPostForm({ caption: '', media: [] })
    setExistingMedia([])
    setPostError('')
    setShowPostModal(true)
  }

  const openEditModal = (post) => {
    setEditingPost(post)
    setPostForm({ caption: post.caption || '', media: [] })
    setExistingMedia(getPostMediaItems(post))
    setPostError('')
    setShowPostModal(true)
  }

  const closePostModal = () => {
    if (postSaving) return
    setShowPostModal(false)
    setEditingPost(null)
    setPostForm({ caption: '', media: [] })
    setExistingMedia([])
    setPostError('')
  }

  const savePost = async (event) => {
    event.preventDefault()
    setPostError('')

    const caption = postForm.caption.trim()
    if (!caption && !postForm.media.length && !existingMedia.length) {
      setPostError('Add a caption, image, or video before publishing.')
      return
    }

    const formData = new FormData()
    formData.append('caption', caption)
    if (postForm.media.length) {
      postForm.media.forEach((file) => formData.append('media', file))
    } else if (editingPost && existingMedia.length) {
      formData.append('existing_media', JSON.stringify(existingMedia.map((item) => ({
        media_url: item.url,
        media_type: item.type
      }))))
    }

    setPostSaving(true)
    try {
      const response = await apiService.request(editingPost ? `/recruiter/posts/${editingPost.id}` : '/recruiter/posts', {
        method: editingPost ? 'PUT' : 'POST',
        body: formData,
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to save post.')
      await loadPosts()
      closePostModal()
    } catch (err) {
      setPostError(err?.message || 'Unable to save post. Please try again.')
    } finally {
      setPostSaving(false)
    }
  }

  const deletePost = async (postId) => {
    if (!window.confirm('Delete this post from the user feed?')) return
    setDeletingPostId(postId)
    try {
      const response = await apiService.request(`/recruiter/posts/${postId}`, {
        method: 'DELETE',
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to delete post.')
      setPosts((current) => current.filter((post) => String(post.id) !== String(postId)))
    } catch (err) {
      alert(err?.message || 'Unable to delete post. Please try again.')
    } finally {
      setDeletingPostId(null)
    }
  }

  const updatePost = (postId, updater) => {
    setPosts((current) => current.map((post) => (
      String(post.id) === String(postId) ? updater(post) : post
    )))
  }

  const currentUserId = user?.id ?? user?.userId ?? user?.user_id
  const currentCommentAuthorRole = String(user?.role || '').toLowerCase().includes('recruiter') ? 'RECRUITER' : 'USER'

  const handleLikePost = (post) => {
    const postId = String(post.id)
    const wasLiked = normalizeBoolean(post.liked)
    updatePost(postId, (current) => ({
      ...current,
      liked: !wasLiked,
      like_count: Math.max(0, Number(current.like_count || 0) + (wasLiked ? -1 : 1))
    }))
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

  const loadPostComments = async (postId) => {
    const normalizedPostId = String(postId)
    setCommentsLoadingId(normalizedPostId)
    const response = await apiService.request(`/posts/${normalizedPostId}/comments`, {
      returnErrorObject: true
    })
    setCommentsLoadingId(null)

    if (response?.error) return

    setCommentsByPost((current) => ({
      ...current,
      [normalizedPostId]: Array.isArray(response.comments) ? response.comments.map(normalizeComment) : []
    }))
  }

  const handleToggleComments = (post) => {
    const postId = String(post.id)
    setOpenCommentPostId((current) => {
      if (current === postId) return null
      if (!commentsByPost[postId]) {
        loadPostComments(postId)
      }
      return postId
    })
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
    updatePost(postId, (current) => ({
      ...current,
      comment_count: Number(current.comment_count || 0) + 1
    }))
  }

  const handleDeleteComment = async (post, comment) => {
    if (!comment?.id) return
    const postId = String(post.id)

    setFeedActionId(`delete-comment-${comment.id}`)
    const response = await apiService.request(`/posts/${postId}/comments/${comment.id}`, {
      method: 'DELETE',
      returnErrorObject: true
    })
    setFeedActionId(null)
    if (response?.error) return

    setCommentsByPost((current) => ({
      ...current,
      [postId]: (current[postId] || []).filter((item) => (
        String(item.id) !== String(comment.id) && String(item.parent_comment_id || '') !== String(comment.id)
      ))
    }))
    updatePost(postId, (current) => ({
      ...current,
      comment_count: Math.max(0, Number(current.comment_count || 0) - 1)
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

  const handleSharePost = async (post) => {
    const url = `${window.location.origin}/manage-posts?post=${post.id}`
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        setShareMessage('Post link copied')
        window.setTimeout(() => setShareMessage(''), 1800)
      } else if (navigator.share) {
        await navigator.share({ title: profile.name, text: post.caption || 'Company update', url })
      }
    } catch (_err) {
      // Sharing is optional; keep the feed interaction quiet if the browser blocks it.
    }
  }

  const handleToggleSave = (post) => {
    const postId = String(post.id)
    setSavedPostIds((current) => ({ ...current, [postId]: !current[postId] }))
  }

  const updateCarouselIndex = (postId, itemCount, nextIndex) => {
    setCarouselIndexes((current) => ({
      ...current,
      [postId]: Math.min(itemCount - 1, Math.max(0, nextIndex))
    }))
  }

  const handleMediaSwipeStart = (event, postId, activeIndex) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    mediaSwipeRef.current = {
      postId,
      activeIndex,
      startX: event.clientX,
      startY: event.clientY
    }
  }

  const handleMediaSwipeEnd = (event, postId, itemCount, activeIndex) => {
    const swipe = mediaSwipeRef.current
    mediaSwipeRef.current = null
    if (!swipe || swipe.postId !== postId || itemCount < 2) return

    const deltaX = event.clientX - swipe.startX
    const deltaY = event.clientY - swipe.startY
    const isHorizontalSwipe = Math.abs(deltaX) > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.2

    if (!isHorizontalSwipe) return

    const nextIndex = deltaX < 0 ? activeIndex + 1 : activeIndex - 1
    updateCarouselIndex(postId, itemCount, nextIndex)
    suppressMediaClickRef.current[postId] = true
    window.setTimeout(() => {
      delete suppressMediaClickRef.current[postId]
    }, 150)
  }

  const handleMediaSwipeCancel = () => {
    mediaSwipeRef.current = null
  }

  const handlePostMediaClick = (post, activeIndex) => {
    const postId = String(post.id)
    if (suppressMediaClickRef.current[postId]) {
      delete suppressMediaClickRef.current[postId]
      return
    }
    const now = Date.now()
    const lastTap = lastMediaTapRef.current[postId] || 0
    if (now - lastTap < 320) {
      lastMediaTapRef.current[postId] = 0
      if (mediaClickTimerRef.current[postId]) {
        window.clearTimeout(mediaClickTimerRef.current[postId])
        delete mediaClickTimerRef.current[postId]
      }
      handleDoubleTapLikePost(post)
      return
    }
    lastMediaTapRef.current[postId] = now
    mediaClickTimerRef.current[postId] = window.setTimeout(() => {
      delete mediaClickTimerRef.current[postId]
      openPostCarouselPreview(post, activeIndex)
    }, 320)
  }

  const addEmojiToCaption = (emoji) => {
    setPostForm((current) => ({ ...current, caption: `${current.caption}${emoji}` }))
  }

  const openStatusModal = () => {
    setStatusForm({ caption: '', media: null })
    setStatusError('')
    setShowStatusModal(true)
  }

  const closeStatusModal = () => {
    if (statusSaving) return
    setShowStatusModal(false)
    setStatusForm({ caption: '', media: null })
    setStatusError('')
  }

  const closeStatusViewer = () => {
    setViewingStatus(null)
    setShowStatusViewers(false)
    setStatusViewers([])
    setStatusViewersError('')
  }

  const openStatusViewer = (status) => {
    setViewingStatus(status)
    setShowStatusViewers(false)
    setStatusViewers([])
    setStatusViewersError('')
  }

  const toggleStatusViewers = async () => {
    if (!viewingStatus?.id) return

    const shouldOpen = !showStatusViewers
    setShowStatusViewers(shouldOpen)
    if (!shouldOpen || statusViewers.length > 0 || statusViewersLoading) return

    setStatusViewersLoading(true)
    setStatusViewersError('')
    try {
      const response = await apiService.request(`/recruiter/statuses/${viewingStatus.id}/views`, {
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error)
      setStatusViewers(Array.isArray(response.viewers) ? response.viewers : [])
    } catch (err) {
      setStatusViewersError(err?.message || 'Unable to load status viewers.')
    } finally {
      setStatusViewersLoading(false)
    }
  }

  const saveStatus = async (event) => {
    event.preventDefault()
    setStatusError('')
    if (!statusForm.media) {
      setStatusError('Upload an image or video status before publishing.')
      return
    }

    const formData = new FormData()
    formData.append('caption', statusForm.caption.trim())
    formData.append('media', statusForm.media)

    setStatusSaving(true)
    try {
      const response = await apiService.request('/recruiter/statuses', {
        method: 'POST',
        body: formData,
        returnErrorObject: true
      })
      if (response?.error) throw new Error(response.message || response.error || 'Unable to publish status.')
      await loadStatuses()
      closeStatusModal()
    } catch (err) {
      setStatusError(err?.message || 'Unable to publish status. Please try again.')
    } finally {
      setStatusSaving(false)
    }
  }

  const menuItems = [
    ['Dashboard', '/recruiter-dashboard'],
    ['Post Job', '/post-job'],
    ['Manage Posts', '/manage-posts'],
    ['Messages', '/recruiter-chats'],
    ['Notifications', '/notifications'],
    ['Settings', '/recruiter-settings']
  ]

  const videoPosts = useMemo(
    () => posts.filter((post) => isVideoMedia(post.media_type, post.media_url)),
    [posts]
  )

  const imagePosts = useMemo(
    () => posts.filter((post) => buildFileUrl(post.media_url) && !isVideoMedia(post.media_type, post.media_url)),
    [posts]
  )

  const postTabs = [
    {
      key: 'grid',
      label: 'Posts',
      icon: <Grid3X3 className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
    },
    {
      key: 'videos',
      label: 'Videos',
      icon: <PlayCircle className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
    },
    {
      key: 'images',
      label: 'Images',
      icon: <ImageIcon className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
    }
  ]

  const visiblePosts = activePostTab === 'videos' ? videoPosts : activePostTab === 'images' ? imagePosts : posts
  const activeTabLabel = postTabs.find((tab) => tab.key === activePostTab)?.label || 'Posts'
  const statCards = [
    ['Following', profile.followingCount],
    ['Followers', profile.followersCount],
    ['Posts', profile.postsCount]
  ]
  const detailMap = Object.fromEntries(profile.detailItems)
  const industryText = detailMap.Industry || detailMap.Category || 'Industry not specified'
  const locationText = detailMap.Headquarters || 'Location not specified'
  const taglineText = profile.bio || profile.description || 'Share your company story, hiring updates, and workplace culture with candidates.'
  const aboutText = profile.description && profile.description !== taglineText ? profile.description : ''
  const infoCards = [
    ['Website', profile.website],
    ['Company Size', detailMap['Company size']],
    ['About company', aboutText]
  ].filter(([, value]) => value != null && String(value).trim() !== '')

  const formatPostTime = (post) => {
    const dateValue = post.created_at || post.createdAt || post.updated_at || post.updatedAt
    if (!dateValue) return 'Recently posted'
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return 'Recently posted'
    const diffMs = Date.now() - date.getTime()
    const minute = 60 * 1000
    const hour = 60 * minute
    const day = 24 * hour
    if (diffMs < hour) return `${Math.max(1, Math.floor(diffMs / minute))}m ago`
    if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`
    if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateValue) => {
    if (!dateValue) return 'Just now'
    return formatPostTime({ created_at: dateValue })
  }

  const toggleVideoPlayback = (event) => {
    event.stopPropagation()
    const postId = event.currentTarget.dataset.postId
    if (postId && suppressMediaClickRef.current[postId]) {
      delete suppressMediaClickRef.current[postId]
      return
    }
    const video = event.currentTarget
    if (video.paused) {
      video.play().catch(() => {})
    } else {
      video.pause()
    }
  }

  const handlePostVideoClick = (event, post) => {
    event.stopPropagation()
    const postId = String(post.id)
    const now = Date.now()
    const lastTap = lastMediaTapRef.current[postId] || 0
    if (now - lastTap < 320) {
      lastMediaTapRef.current[postId] = 0
      handleDoubleTapLikePost(post)
      return
    }
    lastMediaTapRef.current[postId] = now
    toggleVideoPlayback(event)
  }

  const getPostMediaItems = (post) => {
    const rawItems = Array.isArray(post.media)
      ? post.media
      : Array.isArray(post.media_urls)
        ? post.media_urls
        : Array.isArray(post.mediaUrls)
          ? post.mediaUrls
          : post.media_url
            ? [{ url: post.media_url, type: post.media_type }]
            : []

    return rawItems
      .map((item) => {
        const url = typeof item === 'string' ? item : item.url || item.media_url || item.path
        if (!url) return null
        const type = String((typeof item === 'string' ? post.media_type : item.type || item.media_type) || '').toLowerCase()
        const normalizedUrl = buildFileUrl(url)
        const isVideo = isVideoMedia(type, normalizedUrl)
        return {
          url: normalizedUrl,
          type: isVideo ? 'video' : 'image'
        }
      })
      .filter(Boolean)
  }

  const visibleMediaItems = useMemo(() => (
    visiblePosts.flatMap((post) => getPostMediaItems(post).map((item) => ({ ...item, post })))
  ), [visiblePosts])

  const openPostCarouselPreview = (post, mediaIndex = 0) => {
    const postIndex = visiblePosts.findIndex((item) => String(item.id) === String(post.id))
    setCarouselIndexes((current) => ({ ...current, [String(post.id)]: mediaIndex }))
    setViewingCarouselIndex(postIndex >= 0 ? postIndex : 0)
    setViewingCarouselPost(post)
  }

  const renderMediaItem = (item, post, orderedItems, index, className = '') => (
    <button
      key={`${item.url}-${index}`}
      type="button"
      onClick={() => setViewingPostMedia({ url: item.url, type: item.type, caption: post.caption || '', name: profile.name, items: orderedItems, index })}
      className={`group/media relative overflow-hidden rounded-xl bg-slate-100 ${className}`}
      aria-label={item.type === 'video' ? 'Play post video' : 'View post image'}
    >
      {item.type === 'video' ? (
        <video src={item.url} className="h-full w-full bg-slate-950 object-cover" muted playsInline preload="metadata" />
      ) : (
        <img src={item.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover/media:scale-105" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover/media:bg-black/35 group-hover/media:opacity-100">
        <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
          {item.type === 'video' ? 'Play' : 'View'}
        </span>
      </span>
      {item.type === 'video' && (
        <span className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
      )}
    </button>
  )

  const renderMediaGrid = (items, post) => {
    if (items.length === 0) return null

    if (items.length === 1) {
      const item = items[0]
      return (
        <button
          type="button"
          onClick={() => setViewingPostMedia({ url: item.url, type: item.type, caption: post.caption || '', name: profile.name, items, index: 0 })}
          className="group/media relative block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
          aria-label={item.type === 'video' ? 'Play post video' : 'View post image'}
        >
          {item.type === 'video' ? (
            <video src={item.url} className="max-h-[360px] w-full bg-slate-950 object-contain" muted playsInline preload="metadata" />
          ) : (
            <img src={item.url} alt="" loading="lazy" className="max-h-[360px] w-full object-contain transition duration-300 group-hover/media:scale-[1.01]" />
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover/media:bg-black/25 group-hover/media:opacity-100">
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold backdrop-blur">
              {item.type === 'video' ? 'Play' : 'View'}
            </span>
          </span>
          {item.type === 'video' && (
            <span className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
          )}
        </button>
      )
    }

    return (
      <div className="flex gap-3 overflow-x-auto scroll-smooth rounded-xl bg-slate-100 p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item, index) => (
          <div key={`${item.url}-${index}`} className="w-44 shrink-0 sm:w-56">
            {renderMediaItem(item, post, items, index, 'aspect-[4/5] w-full rounded-lg bg-white')}
            {items.length > 1 && <p className="mt-1 text-center text-[11px] font-bold text-slate-400">{index + 1}/{items.length}</p>}
          </div>
        ))}
      </div>
    )
  }

  const renderPostThumbnail = (post) => {
    const mediaItems = getPostMediaItems(post)
    const firstMedia = mediaItems[0]
    const isVideo = firstMedia?.type === 'video'

    return (
      <button
        key={post.id}
        type="button"
        onClick={() => openPostCarouselPreview(post, 0)}
        className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md"
        aria-label="Open post preview"
      >
        {firstMedia ? (
          isVideo ? (
            <video src={firstMedia.url} className="h-full w-full bg-slate-950 object-cover" muted playsInline preload="metadata" />
          ) : (
            <img src={firstMedia.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 text-center text-xs font-semibold text-slate-500">
            {post.caption || 'Text post'}
          </div>
        )}
        {isVideo && (
          <div className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </div>
        )}
        {isVideo && (
          <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {Number(post.view_count || 0)} views
          </div>
        )}
        {mediaItems.length > 1 && (
          <div className="absolute left-3 top-3 rounded-full bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">
            1/{mediaItems.length}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
          <span className="flex items-center gap-1 text-sm font-semibold">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21 4.2 13.4a5.5 5.5 0 0 1 7.8-7.8 5.5 5.5 0 0 1 7.8 7.8L12 21Z" /></svg>
            {post.like_count || 0}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>
            {post.comment_count || 0}
          </span>
        </div>
      </button>
    )
  }

  const renderPostCard = (post) => {
    const postId = String(post.id)
    const mediaItems = getPostMediaItems(post)
    const activeIndex = Math.min(mediaItems.length - 1, carouselIndexes[postId] || 0)
    const activeMedia = mediaItems[activeIndex]
    const comments = commentsByPost[postId] || []
    const topLevelComments = comments.filter((comment) => !comment.parent_comment_id)
    const repliesByCommentId = comments.reduce((acc, comment) => {
      if (comment.parent_comment_id) {
        const parentId = String(comment.parent_comment_id)
        acc[parentId] = [...(acc[parentId] || []), comment]
      }
      return acc
    }, {})
    const commentsOpen = openCommentPostId === postId
    const caption = String(post.caption || '')
    const captionIsLong = caption.length > 130
    const captionText = captionIsLong && !expandedCaptions[postId] ? `${caption.slice(0, 130)}...` : caption
    const verified = Boolean(companyProfile?.verified || companyProfile?.is_verified || post.verified || post.is_verified)

    return (
      <article key={post.id} className="relative mx-auto overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => latestStatus ? openStatusViewer(latestStatus) : goToManagePosts()}
            className="flex h-10 w-10 shrink-0 appearance-none items-center justify-center overflow-hidden rounded-lg border-0 bg-slate-950 p-0 text-sm font-semibold text-white transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            aria-label={latestStatus ? 'Open company status' : `Open ${companyPageLabel}`}
          >
            {profile.logo ? <img src={profile.logo} alt="" className="h-full w-full object-cover" /> : profile.initial}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={goToManagePosts}
                className="min-w-0 appearance-none border-0 bg-transparent p-0 text-left"
                aria-label={`Open ${companyPageLabel}`}
              >
                <span className="block truncate text-sm font-semibold text-slate-950 transition hover:text-teal-700">{profile.name}</span>
              </button>
              {verified && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-white">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="m5 13 4 4L19 7" /></svg>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-500">{formatPostTime(post)}</p>
          </div>
          {canManagePosts && (
            <button type="button" className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Post menu">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M5 12a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Zm7 0a2 2 0 1 0 0 .01V12Z" /></svg>
            </button>
          )}
        </div>

        {activeMedia ? (
          <div className="relative border-y border-slate-100 bg-slate-100">
            <div
              className="flex aspect-square cursor-pointer touch-pan-y select-none items-center justify-center bg-slate-950 transition hover:brightness-95 sm:aspect-[4/5]"
              onPointerDown={(event) => handleMediaSwipeStart(event, postId, activeIndex)}
              onPointerUp={(event) => handleMediaSwipeEnd(event, postId, mediaItems.length, activeIndex)}
              onPointerCancel={handleMediaSwipeCancel}
              onClick={() => handlePostMediaClick(post, activeIndex)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  openPostCarouselPreview(post, activeIndex)
                }
              }}
              aria-label="Open post preview"
            >
              {activeMedia.type === 'video' ? (
                <video
                  key={activeMedia.url}
                  src={activeMedia.url}
                  className="h-full w-full object-contain"
                  playsInline
                  preload="metadata"
                  data-post-id={postId}
                  onClick={(event) => handlePostVideoClick(event, post)}
                />
              ) : (
                <img src={activeMedia.url} alt="" loading="lazy" className="h-full w-full object-contain" />
              )}
              {likeBurstPostIds[postId] && (
                <div key={likeBurstPostIds[postId]} className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                  <svg className="h-24 w-24 animate-[ping_0.65s_ease-out_1] fill-rose-500 text-rose-500 drop-shadow-[0_12px_28px_rgba(0,0,0,0.35)]" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21 4.2 13.4a5.5 5.5 0 0 1 7.8-7.8 5.5 5.5 0 0 1 7.8 7.8L12 21Z" />
                  </svg>
                </div>
              )}
            </div>
            {mediaItems.length > 1 && (
              <div className="absolute right-3 top-3 rounded-full bg-slate-950/65 px-2.5 py-1 text-xs font-bold text-white">
                {activeIndex + 1}/{mediaItems.length}
              </div>
            )}
            {activeMedia.type === 'video' && (
              <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                {Number(post.view_count || 0)} views
              </div>
            )}
          </div>
        ) : (
          <div className="border-y border-slate-100 bg-slate-50 px-4 py-12 text-center text-sm font-semibold text-slate-500">Text post</div>
        )}

        {mediaItems.length > 1 && (
          <div className="flex justify-center gap-1.5 px-4 pt-3">
            {mediaItems.map((item, index) => (
              <span
                key={`${item.url}-${index}`}
                className={`h-2 w-2 rounded-full transition ${index === activeIndex ? 'bg-blue-600' : 'bg-slate-300'}`}
                aria-label={`Media ${index + 1}${index === activeIndex ? ' active' : ''}`}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col px-4 py-3">
          <div className="flex items-center gap-5 text-sm font-bold text-slate-900">
            <button type="button" onClick={() => handleLikePost(post)} className={`inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition ${post.liked ? 'text-blue-700' : 'hover:text-blue-700'}`} aria-label="Like">
              <svg className={`h-6 w-6 ${post.liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
              <span>{post.like_count || 0}</span>
            </button>
            <button type="button" onClick={() => handleToggleComments(post)} className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700" aria-label="Comments">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>
              <span>{post.comment_count || 0}</span>
            </button>
            <button type="button" onClick={() => handleSharePost(post)} className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700" aria-label="Share">
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
            </button>
            <button type="button" onClick={() => handleToggleSave(post)} className={`ml-auto appearance-none border-0 bg-transparent p-0 transition hover:text-blue-700 ${savedPostIds[postId] ? 'text-blue-700' : ''}`} aria-label="Save">
              <svg className={`h-6 w-6 ${savedPostIds[postId] ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" /></svg>
            </button>
          </div>

          {caption && (
            <p className="mt-2 text-sm leading-6 text-slate-800">
              <span className="mr-1 font-black text-slate-950">{profile.name}</span>
              {captionText}
              {captionIsLong && (
                <button type="button" onClick={() => setExpandedCaptions((current) => ({ ...current, [postId]: !current[postId] }))} className="ml-1 font-bold text-slate-500 hover:text-slate-900">
                  {expandedCaptions[postId] ? 'less' : 'more'}
                </button>
              )}
            </p>
          )}
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{formatTime(post.created_at || post.createdAt || post.updated_at || post.updatedAt)}</p>

        </div>
        {commentsOpen && (
            <div className="absolute inset-0 z-30 flex flex-col overflow-hidden rounded-lg bg-white text-slate-950 shadow-2xl">
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
              {commentsLoadingId === postId ? (
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
                            <span className="ml-2 font-medium text-slate-500">{formatTime(comment.created_at)}</span>
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
                                    <span className="ml-2 font-medium text-slate-500">{formatTime(reply.created_at)}</span>
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
  }

  const previewMediaItems = postForm.media.length
    ? postForm.media.map((file, index) => ({
      url: postMediaPreviewUrls[index],
      type: file.type?.startsWith('video/') ? 'video' : 'image',
      name: file.name,
    }))
    : existingMedia.map((item, index) => ({
      url: item.url,
      type: item.type,
      name: `Current media ${index + 1}`,
    }))
  const activePreviewMedia = viewingPostMedia?.items?.[viewingPostMedia.index] || viewingPostMedia
  const activePreviewPost = activePreviewMedia?.post
    ? posts.find((post) => String(post.id) === String(activePreviewMedia.post.id)) || activePreviewMedia.post
    : null
  const activePreviewPostId = activePreviewPost ? String(activePreviewPost.id) : ''
  const activePreviewComments = activePreviewPostId ? commentsByPost[activePreviewPostId] || [] : []
  const activeFollowList = followListType === 'following' ? companyFollowing : companyFollowers
  const activeFollowListLoading = followListType === 'following' ? companyFollowingLoading : companyFollowersLoading
  const activeFollowListError = followListType === 'following' ? companyFollowingError : companyFollowersError
  const activeFollowListCount = followListType === 'following' ? profile.followingCount : profile.followersCount
  const activeFollowListLabel = followListType === 'following' ? 'Following' : 'Followers'

  return (
    <>
      <Head>
        <title>{isPublicCompanyView ? `${profile.name} | TrueHire` : 'Manage Posts | TrueHire'}</title>
      </Head>
      {!mounted ? (
        <div className="min-h-screen bg-white">
          <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
            <div className="h-10 w-48 animate-pulse rounded bg-slate-100" />
            <div className="mt-10 grid grid-cols-[96px_1fr] gap-5 sm:grid-cols-[168px_1fr] sm:gap-12">
              <div className="h-24 w-24 animate-pulse rounded-full bg-slate-100 sm:h-36 sm:w-36" />
              <div className="space-y-4">
                <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
                <div className="h-20 max-w-md animate-pulse rounded-2xl bg-slate-100" />
                <div className="h-16 max-w-xl animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          </main>
        </div>
      ) : (
      <div className="min-h-screen bg-[#f5f7f2]">
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <section className="overflow-hidden rounded-[22px] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
            <div className="relative overflow-hidden bg-[#1f4f9a] p-6 text-white sm:p-8 lg:p-10">
              <div className="absolute inset-y-0 right-0 hidden w-52 skew-x-[-14deg] bg-[#2a68b1] opacity-70 lg:block" />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => router.push('/recruiter-dashboard')}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  <ArrowLeft className="h-4 w-4" strokeWidth={2.2} />
                  Back to Dashboard
                </button>
                <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-50">
                  <Sparkles className="h-3.5 w-3.5" />
                  Company Studio
                </div>
                <h1 className="mt-4 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">
                  Shape your company story.
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-blue-50">
                  Publish updates, track brand engagement, and keep candidates close to the work your team is building.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-7 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="h-24 bg-[linear-gradient(135deg,#93c5fd_0%,#bae6fd_48%,#e0f2fe_100%)]" />
            <div className="px-5 pb-5 sm:px-7">
              <div className="-mt-9 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                  <div className="relative h-20 w-20 shrink-0">
                    <button
                      type="button"
                      onClick={() => latestStatus ? openStatusViewer(latestStatus) : goToManagePosts()}
                      className={`flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-[5px] border-white bg-blue-700 text-3xl font-black text-white shadow-lg transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${activeStatuses.length > 0 ? 'ring-4 ring-blue-300' : ''}`}
                      aria-label={latestStatus ? 'Open company status' : `Open ${companyPageLabel}`}
                    >
                      {profile.logo ? <img src={profile.logo} alt="" className="h-full w-full object-cover" /> : profile.initial}
                    </button>
                    {canManagePosts && (
                      <button
                        type="button"
                        onClick={openStatusModal}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
                        aria-label="Create status"
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                      </button>
                    )}
                  </div>
                  <div className="min-w-0 text-center sm:pt-8 sm:text-left">
                    <button type="button" onClick={goToManagePosts} className="max-w-full appearance-none border-0 bg-transparent p-0 text-center sm:text-left" aria-label={`Open ${companyPageLabel}`}>
                      <span className="block truncate text-2xl font-black text-slate-950 transition hover:text-blue-700">{profile.name}</span>
                    </button>
                    <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs font-semibold text-slate-600 sm:justify-start">
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">{industryText}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.2} />
                        {locationText}
                      </span>
                    </div>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{taglineText}</p>
                  </div>
                </div>
                {(canManagePosts || isPublicCompanyView) && (
                  <div className="flex flex-col gap-2 sm:mt-0 sm:flex-row sm:pt-8">
                    {canManagePosts && (
                      <>
                        <button type="button" onClick={() => router.push('/recruiter-profile')} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-700">
                          <Pencil className="h-4 w-4" strokeWidth={2.2} />
                          Edit Profile
                        </button>
                        <button type="button" onClick={openCreateModal} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.26)] transition hover:-translate-y-0.5 hover:bg-blue-700">
                          <Plus className="h-4 w-4" strokeWidth={2.4} />
                          Create Post
                        </button>
                      </>
                    )}
                    {isPublicCompanyView && (
                      <button
                        type="button"
                        onClick={handlePublicCompanyFollow}
                        disabled={publicCompanyFollowBusy || publicCompanyFollowing}
                        className={`inline-flex min-h-10 min-w-28 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${publicCompanyFollowing ? 'border border-slate-200 bg-slate-100 text-slate-600' : 'bg-blue-600 text-white hover:-translate-y-0.5 hover:bg-blue-700'} ${publicCompanyFollowBusy ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        {publicCompanyFollowBusy ? 'Updating...' : publicCompanyFollowing ? 'Following' : 'Follow'}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {statCards.map(([label, value]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (label === 'Followers') loadCompanyFollowers()
                        if (label === 'Following') loadCompanyFollowing()
                      }}
                      disabled={label !== 'Followers' && label !== 'Following'}
                      className={`inline-flex min-w-[76px] flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-center shadow-sm ${label === 'Followers' || label === 'Following' ? 'transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300' : 'cursor-default'}`}
                    >
                      <span className="text-sm font-black leading-none text-slate-950">{value}</span>
                      <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {error && <div className="mt-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div>}

          <section className="mt-0 overflow-hidden rounded-b-[22px] border border-t-0 border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
            <div className="grid grid-cols-3 border-b border-slate-200 bg-white">
              {postTabs.map((tab) => {
                const active = activePostTab === tab.key
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActivePostTab(tab.key)}
                    className={`relative flex min-h-16 items-center justify-center gap-2 border-0 bg-white px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
                      active ? 'text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                    aria-label={tab.label}
                    aria-pressed={active}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                    {active && <span className="absolute inset-x-8 bottom-0 h-1 rounded-t-full bg-blue-600" />}
                  </button>
                )
              })}
            </div>
            <div className="bg-white p-5 sm:p-6">
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="aspect-square animate-pulse rounded-xl bg-slate-100" />)}
              </div>
            ) : visiblePosts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 shadow-sm">
                  {postTabs.find((tab) => tab.key === activePostTab)?.icon}
                </div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">
                  {activePostTab === 'grid' ? 'No posts yet' : `No ${activeTabLabel.toLowerCase()} yet`}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {activePostTab === 'grid'
                    ? 'Create your first company update.'
                    : `${activeTabLabel} will appear here when they are available.`}
                </p>
                {canManagePosts && (activePostTab === 'grid' || activePostTab === 'videos') && (
                  <button type="button" onClick={openCreateModal} className="mt-5 rounded-lg bg-blue-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700">Create Post</button>
                )}
              </div>
            ) : activePostTab === 'grid' ? (
              <div className="grid grid-cols-3 gap-2 sm:gap-5">
                {visiblePosts.map((post) => renderPostThumbnail(post))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:gap-5">
                {visiblePosts.map((post) => {
                  const mediaItems = getPostMediaItems(post)
                  const mediaItem = activePostTab === 'videos'
                    ? mediaItems.find((item) => item.type === 'video')
                    : mediaItems.find((item) => item.type !== 'video')
                  return (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => openPostCarouselPreview(post, 0)}
                      className="group relative aspect-square overflow-hidden rounded-xl bg-slate-100 text-left shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {mediaItem ? (
                        mediaItem.type === 'video' ? (
                          <video
                            src={mediaItem.url}
                            className="h-full w-full bg-slate-950 object-contain"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img src={mediaItem.url} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        )
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100 p-4 text-center text-xs font-semibold text-slate-500">{post.caption || 'Text post'}</div>
                      )}
                      {mediaItem?.type === 'video' && (
                        <div className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white">
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                      )}
                      <div className="absolute inset-0 hidden items-center justify-center gap-4 bg-black/0 text-white opacity-0 transition group-hover:bg-black/45 group-hover:opacity-100">
                        <span className="flex items-center gap-1 text-sm font-black">♥ {post.like_count || 0}</span>
                        <span className="flex items-center gap-1 text-sm font-black">● {post.comment_count || 0}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            </div>
          </section>
        </main>

        {shareMessage && (
          <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-lg">
            {shareMessage}
          </div>
        )}

        {viewingCarouselPost && (
          <div
            className="fixed inset-0 z-50 bg-white px-4 py-6"
            onClick={(event) => {
              if (event.target === event.currentTarget) setViewingCarouselPost(null)
            }}
          >
            <div className="relative mx-auto h-full w-full max-w-xl">
              <button
                type="button"
                onClick={() => setViewingCarouselPost(null)}
                className="absolute left-2 top-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow transition hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                aria-label="Back to posts"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" /></svg>
              </button>
              <div
                ref={carouselScrollerRef}
                className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={(event) => {
                  const scroller = event.currentTarget
                  const nextIndex = Math.round(scroller.scrollTop / Math.max(1, scroller.clientHeight))
                  if (nextIndex !== viewingCarouselIndex) setViewingCarouselIndex(Math.min(visiblePosts.length - 1, Math.max(0, nextIndex)))
                }}
              >
                {visiblePosts.map((post) => (
                  <section key={post.id} className="flex min-h-full snap-start items-center justify-center py-10">
                    <div className="w-full">
                      {renderPostCard(posts.find((item) => String(item.id) === String(post.id)) || post)}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewingPostMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 py-6 backdrop-blur-sm">
            <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{viewingPostMedia.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {viewingPostMedia.items?.length ? `${Number(viewingPostMedia.index || 0) + 1} of ${viewingPostMedia.items.length}` : viewingPostMedia.caption}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingPostMedia(null)}
                  className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Close media preview"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              <div
                className="min-h-0 flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth bg-slate-950 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={(event) => {
                  const container = event.currentTarget
                  const nextIndex = Math.round(container.scrollTop / Math.max(1, container.clientHeight))
                  if (viewingPostMedia.items?.length && nextIndex !== viewingPostMedia.index) {
                    setViewingPostMedia((current) => ({ ...current, index: Math.min(current.items.length - 1, Math.max(0, nextIndex)) }))
                  }
                }}
              >
                {(viewingPostMedia.items || [viewingPostMedia]).map((item, index) => (
                  <section key={`${item.url}-${index}`} className="flex h-[68vh] snap-start items-center justify-center bg-slate-950">
                    {item.type === 'video' ? (
                      <video
                        src={item.url}
                        className="max-h-full w-full object-contain"
                        autoPlay={index === viewingPostMedia.index}
                        playsInline
                        onClick={toggleVideoPlayback}
                      />
                    ) : (
                      <img src={item.url} alt="" className="max-h-full w-full object-contain" />
                    )}
                  </section>
                ))}
              </div>
              {activePreviewPost && (
                <div className="flex flex-col border-t border-slate-200 bg-white px-3 py-2">
                  <div className="flex items-center gap-5 text-sm font-bold text-slate-900">
                    <button
                      type="button"
                      onClick={() => handleLikePost(activePreviewPost)}
                      disabled={feedActionId === `like-${activePreviewPostId}`}
                      className={`inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition ${activePreviewPost.liked ? 'text-blue-700' : 'hover:text-blue-700'}`}
                      aria-label="Like"
                    >
                      <svg className={`h-5 w-5 ${activePreviewPost.liked ? 'fill-current' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /></svg>
                      <span>{activePreviewPost.like_count || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleComments(activePreviewPost)}
                      className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700"
                      aria-label="Comments"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>
                      <span>{activePreviewPost.comment_count || 0}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSharePost(activePreviewPost)}
                      className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 transition hover:text-blue-700"
                      aria-label="Share"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
                      <span>{activePreviewPost.share_count || 0}</span>
                    </button>
                  </div>
                  {activePreviewPost.caption && (
                    <p className="mt-1 text-sm leading-5 text-slate-800">
                      <span className="mr-1 font-black text-slate-950">{profile.name}</span>
                      {activePreviewPost.caption}
                    </p>
                  )}
                  {openCommentPostId === activePreviewPostId && (
                    <div className="order-first mb-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex gap-2">
                        <input
                          value={commentDrafts[activePreviewPostId] || ''}
                          onChange={(event) => setCommentDrafts((current) => ({ ...current, [activePreviewPostId]: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleAddComment(activePreviewPost)
                          }}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        />
                        <button type="button" onClick={() => handleAddComment(activePreviewPost)} disabled={feedActionId === `comment-${activePreviewPostId}` || !String(commentDrafts[activePreviewPostId] || '').trim()} className="rounded-full bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Post</button>
                      </div>
                      <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                        {commentsLoadingId === activePreviewPostId ? (
                          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                        ) : activePreviewComments.length > 0 ? (
                          activePreviewComments.map((comment) => {
                            const canDelete = currentUserId && String(comment.user_id) === String(currentUserId)
                            return (
                              <div key={comment.id || `${comment.user_id}-${comment.created_at}-${comment.comment}`} className="rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-100">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-black text-slate-900">{comment.user_name || 'User'}</p>
                                    <p className="text-[11px] font-semibold text-slate-400">{formatTime(comment.created_at)}</p>
                                  </div>
                                  {canDelete && (
                                    <button type="button" onClick={() => handleDeleteComment(activePreviewPost, comment)} disabled={feedActionId === `delete-comment-${comment.id}`} className="text-[11px] font-bold text-rose-600 hover:text-rose-700 disabled:opacity-50">Delete</button>
                                  )}
                                </div>
                                <p className="mt-1 whitespace-pre-line text-sm leading-5 text-slate-700">{comment.comment}</p>
                              </div>
                            )
                          })
                        ) : (
                          <p className="text-center text-sm font-semibold text-slate-500">No comments yet</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {viewingPostMedia.items?.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto bg-white px-3 py-3">
                  <span className="mr-1 text-xs font-bold text-slate-500">Scroll</span>
                  {viewingPostMedia.items.map((item, index) => (
                    <button
                      key={`${item.url}-${index}`}
                      type="button"
                      onClick={(event) => {
                        setViewingPostMedia((current) => ({ ...current, index }))
                        const scroller = event.currentTarget.closest('.relative')?.querySelector('.snap-y')
                        if (scroller) scroller.scrollTo({ top: scroller.clientHeight * index, behavior: 'smooth' })
                      }}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition ${index === viewingPostMedia.index ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200'}`}
                    >
                      {item.type === 'video' ? (
                        <video src={item.url} className="h-full w-full bg-slate-950 object-cover" muted playsInline preload="metadata" />
                      ) : (
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {showFollowersModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-md"
            onClick={() => setShowFollowersModal(false)}
          >
            <div
              className="flex max-h-[84vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.35)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50 px-5 py-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-cyan-700">Company {activeFollowListLabel}</p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">
                    {activeFollowListCount} {activeFollowListCount === 1 ? activeFollowListLabel.slice(0, -1).toLowerCase() : activeFollowListLabel.toLowerCase()}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFollowersModal(false)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  aria-label={`Close ${activeFollowListLabel.toLowerCase()}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                  </svg>
                </button>
              </div>
              <div className="overflow-y-auto px-4 py-4">
                {activeFollowListLoading ? (
                  <div className="space-y-3">
                    {[0, 1, 2].map((item) => (
                      <div key={item} className="flex animate-pulse items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                        <div className="h-11 w-11 rounded-full bg-slate-100" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-32 rounded bg-slate-100" />
                          <div className="h-3 w-44 rounded bg-slate-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activeFollowListError ? (
                  <div className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
                    {activeFollowListError}
                  </div>
                ) : activeFollowList.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                    <p className="text-sm font-black text-slate-800">No {activeFollowListLabel.toLowerCase()} yet</p>
                    <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500">
                      {followListType === 'following'
                        ? 'Users your company follows will appear here.'
                        : 'Users who follow your company will appear here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeFollowList.map((follower) => {
                      const imageSrc = follower.profileImage ? buildFileUrl(follower.profileImage) : ''
                      const subtitle = [follower.desiredJobRole, follower.currentLocation].filter(Boolean).join(' | ')
                      return (
                        <button
                          key={follower.id}
                          type="button"
                          onClick={() => router.push(`/users/${follower.id}`)}
                          className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black uppercase text-slate-700 ring-1 ring-slate-200">
                            {imageSrc ? <img src={imageSrc} alt="" className="h-full w-full object-cover" /> : String(follower.name || 'U').slice(0, 1)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-950">{follower.name || 'TrueHire user'}</p>
                            {subtitle && (
                              <p className="truncate text-xs font-semibold text-slate-500">{subtitle}</p>
                            )}
                            {follower.followedAt && (
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">Followed {formatTime(follower.followedAt)}</p>
                            )}
                          </div>
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-white group-hover:text-cyan-700">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 6l6 6-6 6" />
                            </svg>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canManagePosts && showPostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-6 backdrop-blur-sm">
            <div className="relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_32px_90px_rgba(15,23,42,0.38)]">
              <button type="button" onClick={closePostModal} className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700" aria-label="Close post modal">
                <X className="h-5 w-5" strokeWidth={2.3} />
              </button>

              <form onSubmit={savePost} className="grid max-h-[92vh] overflow-y-auto bg-white lg:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="relative overflow-hidden bg-[linear-gradient(160deg,#0f172a_0%,#1d4ed8_48%,#38bdf8_100%)] p-6 text-white sm:p-8">
                  <div className="absolute inset-x-8 top-28 h-px bg-white/20" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-sky-50">
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={2.3} />
                      {editingPost ? 'Edit Post' : 'Create Post'}
                    </div>
                    <h2 className="mt-5 max-w-xs text-3xl font-black leading-tight tracking-tight">
                      {editingPost ? 'Refresh the story behind this update.' : 'Craft a company update candidates remember.'}
                    </h2>
                    <p className="mt-4 text-sm leading-6 text-sky-50/90">
                      Pair concise hiring context with visual proof of your team, culture, events, or product momentum.
                    </p>

                    <div className="mt-8 rounded-2xl border border-white/18 bg-white/12 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/25 bg-white text-lg font-black text-blue-700">
                          {profile.logo ? <img src={profile.logo} alt="" className="h-full w-full object-cover" /> : profile.initial}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-black">{profile.name}</p>
                            <BadgeCheck className="h-4 w-4 shrink-0 text-sky-100" strokeWidth={2.4} />
                          </div>
                          <p className="truncate text-xs font-semibold text-sky-100/85">{industryText}</p>
                        </div>
                      </div>
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        {[
                          ['Media', previewMediaItems.length || 0],
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
                    <h3 className="mt-2 text-2xl font-black text-slate-950">{editingPost ? 'Update post details' : 'Publish to company feed'}</h3>
                  </div>

                  {postError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{postError}</div>}

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <label htmlFor="manage-post-caption" className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                        <Type className="h-4 w-4 text-sky-600" strokeWidth={2.4} />
                        Caption
                      </label>
                      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                        <SmilePlus className="h-4 w-4 text-slate-400" strokeWidth={2.2} />
                        {quickEmojis.map((emoji) => (
                          <button key={emoji} type="button" onClick={() => addEmojiToCaption(emoji)} className="flex h-8 w-8 items-center justify-center rounded-md text-base transition hover:bg-white hover:shadow-sm">{emoji}</button>
                        ))}
                      </div>
                    </div>
                    <textarea id="manage-post-caption" value={postForm.caption} onChange={(event) => setPostForm((current) => ({ ...current, caption: event.target.value }))} rows={7} maxLength={1200} placeholder="Write a caption..." className="mt-4 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 text-sm leading-6 text-slate-950 shadow-inner transition placeholder:text-slate-400 hover:border-slate-300 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-100" />
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-slate-500">Posts with context and visuals tend to get stronger candidate response.</span>
                      <span className="shrink-0 font-bold text-slate-500">{postForm.caption.length}/1200</span>
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="manage-post-media" className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
                        <ImagePlus className="h-4 w-4 text-sky-600" strokeWidth={2.4} />
                        Media
                      </label>
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700">
                        {previewMediaItems.length ? `${previewMediaItems.length}/15 added` : 'Optional'}
                      </span>
                    </div>
                    <label htmlFor="manage-post-media" className={`mt-4 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-sky-200 bg-sky-50/50 text-center transition hover:border-sky-400 hover:bg-sky-50 ${previewMediaItems.length ? 'p-2' : 'px-4 py-10'}`}>
                      {previewMediaItems.length ? (
                        <div className="w-full">
                          <div className={`grid gap-2 ${previewMediaItems.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {previewMediaItems.map((item, index) => (
                              <div key={`${item.url}-${index}`} className="relative overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
                                {item.type === 'video' ? (
                                  <video src={item.url} className="max-h-[360px] w-full bg-slate-950 object-contain" playsInline onClick={toggleVideoPlayback} />
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
                            <span className="truncate font-semibold">
                              {postForm.media.length ? `${postForm.media.length} selected` : `${existingMedia.length} current media item${existingMedia.length === 1 ? '' : 's'}`}
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-black text-sky-700 shadow-sm">
                              <Upload className="h-3.5 w-3.5" strokeWidth={2.5} />
                              Change media
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-sky-600 shadow-sm"><Upload className="h-7 w-7" strokeWidth={2.1} /></span>
                          <span className="mt-4 text-sm font-black text-slate-900">Drop in polished visuals</span>
                          <span className="mt-1 max-w-md text-xs leading-5 text-slate-500">Upload up to 15 JPG, PNG, WEBP, GIF, MP4, WEBM, or MOV files up to 100MB each.</span>
                        </>
                      )}
                    </label>
                    <input id="manage-post-media" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={handlePostMediaChange} className="sr-only" />
                  </section>

                  <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs font-semibold text-slate-500">Your post appears in the company feed after publishing.</p>
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                      <button type="button" onClick={closePostModal} className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">Cancel</button>
                      <button type="submit" disabled={postSaving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                        <Send className="h-4 w-4" strokeWidth={2.5} />
                        {postSaving ? 'Saving...' : editingPost ? 'Save Changes' : 'Publish Post'}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
        {canManagePosts && showStatusModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,#111827,#0f766e,#38bdf8)] px-6 py-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100">Create Status</p>
                <h2 className="mt-2 text-2xl font-black">Share a 24-hour company story</h2>
                <p className="mt-2 text-sm leading-6 text-cyan-50/90">Upload a short image or video status for candidates to view at the top of their feed.</p>
                <button type="button" onClick={closeStatusModal} className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/15 p-2 text-white transition hover:bg-white/25" aria-label="Close status modal">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              <form onSubmit={saveStatus} className="space-y-5 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-6 py-6">
                {statusError && <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{statusError}</div>}
                <div>
                  <label htmlFor="company-status-media" className="text-sm font-black text-slate-800">Status media</label>
                  <label htmlFor="company-status-media" className={`mt-3 flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[26px] border border-dashed border-slate-300 bg-white text-center shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50/40 ${statusMediaPreviewUrl ? 'p-2' : 'px-4 py-10'}`}>
                    {statusMediaPreviewUrl ? (
                      <div className="w-full">
                        {statusForm.media?.type?.startsWith('video/') ? (
                          <video src={statusMediaPreviewUrl} className="max-h-[420px] w-full rounded-xl bg-slate-950 object-contain" playsInline onClick={toggleVideoPlayback} />
                        ) : (
                          <img src={statusMediaPreviewUrl} alt="" className="max-h-[420px] w-full rounded-xl object-contain" />
                        )}
                        <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-slate-500">
                          <span className="truncate font-semibold">{statusForm.media.name}</span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 font-bold text-slate-600">Change media</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-inner">
                          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14" /></svg>
                        </span>
                        <span className="mt-3 text-sm font-bold text-slate-800">Upload image or video status</span>
                        <span className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP, MP4, WEBM, or MOV up to 100MB</span>
                      </>
                    )}
                  </label>
                  <input id="company-status-media" type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" onChange={(event) => setStatusForm((current) => ({ ...current, media: event.target.files?.[0] || null }))} className="sr-only" />
                </div>
                <div>
                  <label htmlFor="company-status-caption" className="text-sm font-black text-slate-800">Caption</label>
                  <textarea id="company-status-caption" value={statusForm.caption} onChange={(event) => setStatusForm((current) => ({ ...current, caption: event.target.value }))} rows={3} maxLength={400} placeholder="Add a short story caption..." className="mt-3 w-full resize-none rounded-[22px] border border-slate-200 bg-white px-5 py-4 text-sm leading-6 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-4 focus:ring-cyan-100" />
                  <div className="mt-2 text-right text-xs text-slate-500">{statusForm.caption.length}/400</div>
                </div>
                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button type="button" onClick={closeStatusModal} className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={statusSaving} className="inline-flex items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#020617,#0f766e)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60">
                    {statusSaving ? 'Publishing...' : 'Publish Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {viewingStatus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 px-4 py-6 text-white">
            <div className="absolute left-0 right-0 top-0 z-10 h-1 bg-white/20">
              <div className="h-full w-full bg-white/80" />
            </div>
            <div className="absolute left-4 top-5 z-20 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/10 text-sm font-black">
                {profile.logo ? (
                  <img src={profile.logo} alt="" className="h-full w-full object-cover" />
                ) : (
                  profile.initial
                )}
              </div>
              <div>
                <p className="text-sm font-black">{profile.name}</p>
                <p className="text-xs text-white/65">Active company status</p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeStatusViewer}
              className="absolute right-4 top-5 z-20 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close status"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            <div className="flex h-full w-full max-w-md items-center justify-center">
              {isVideoMedia(viewingStatus.media_type, viewingStatus.media_url) ? (
              <video
                src={buildFileUrl(viewingStatus.media_url)}
                className="max-h-[82vh] w-full rounded-3xl object-contain"
                autoPlay
                muted
                playsInline
                onClick={toggleVideoPlayback}
              />
              ) : (
                <img src={buildFileUrl(viewingStatus.media_url)} alt="" className="max-h-[82vh] w-full rounded-3xl object-contain" />
              )}
            </div>
            <div className="absolute bottom-6 left-4 right-4 mx-auto max-w-md rounded-2xl bg-black/40 px-4 py-3 text-white backdrop-blur">
              {viewingStatus.caption && (
                <p className="text-sm leading-6">{viewingStatus.caption}</p>
              )}
              {canManagePosts && (
                <button
                  type="button"
                  onClick={toggleStatusViewers}
                  className="mt-3 flex w-full items-center gap-2 rounded-xl border border-white/35 bg-transparent px-3 py-2 text-left text-xs font-bold text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-expanded={showStatusViewers}
                >
                  <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15.25a3.25 3.25 0 100-6.5 3.25 3.25 0 000 6.5Z" />
                  </svg>
                  <span>{Number(viewingStatus.view_count || 0)} views</span>
                  <span className="ml-auto text-white/50">{showStatusViewers ? 'Hide' : 'See names'}</span>
                </button>
              )}
              {canManagePosts && showStatusViewers && (
                <div className="mt-3 max-h-52 overflow-y-auto rounded-2xl border border-white/40 bg-white/10 p-2">
                  {statusViewersLoading ? (
                    <p className="px-2 py-3 text-xs font-semibold text-white/70">Loading viewers...</p>
                  ) : statusViewersError ? (
                    <p className="px-2 py-3 text-xs font-semibold text-rose-100">{statusViewersError}</p>
                  ) : statusViewers.length === 0 ? (
                    <p className="px-2 py-3 text-xs font-semibold text-white/70">No one has viewed this status yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {statusViewers.map((viewer) => (
                        <div key={viewer.id} className="flex items-center gap-3 rounded-xl border border-white/45 bg-white/10 px-3 py-3 shadow-sm transition hover:border-white/70 hover:bg-white/15">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-xs font-black text-white">
                            {viewer.profile_photo ? (
                              <img src={buildFileUrl(viewer.profile_photo)} alt="" className="h-full w-full object-cover" />
                            ) : (
                              String(viewer.name || 'T').slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">{viewer.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}
    </>
  )
}
