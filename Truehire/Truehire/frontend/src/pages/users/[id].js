import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import Header from "../../Portal/Header"
import Footer from "../../Portal/Footer"
import { useAuth } from "../../context/AuthContext"
import apiService from "../../utils/api"

const parseSkills = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.filter(Boolean)
  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.filter(Boolean)
      } catch (_) {
        // fallback to comma split
      }
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

const parseJsonList = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch (_) {
      return []
    }
  }
  return []
}

export default function PublicUserProfilePage() {
  const router = useRouter()
  const { id } = router.query
  const { user: authUser, loading: authLoading } = useAuth()

  const [profile, setProfile] = useState(null)
  const [followStats, setFollowStats] = useState({ followingCount: 0, followersCount: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [followListType, setFollowListType] = useState(null)
  const [followListUsers, setFollowListUsers] = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)
  const [statusData, setStatusData] = useState({ status: "none", requestId: null })
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [postActionId, setPostActionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState("")

  const numericId = useMemo(() => Number.parseInt(id, 10), [id])
  const skills = useMemo(() => parseSkills(profile?.core_skills), [profile?.core_skills])
  const softSkills = useMemo(
    () => parseSkills(profile?.soft_skills || profile?.secondary_skills),
    [profile?.soft_skills, profile?.secondary_skills]
  )
  const languages = useMemo(() => {
    const parsed = parseJsonList(profile?.languages_known)
    return parsed.length ? parsed : parseSkills(profile?.languages_known)
  }, [profile?.languages_known])
  const projects = useMemo(() => parseJsonList(profile?.projects), [profile?.projects])
  const certifications = useMemo(() => parseJsonList(profile?.certifications), [profile?.certifications])

  const loadProfile = async () => {
    if (!Number.isFinite(numericId) || numericId <= 0) return
    setLoading(true)
    setError("")
    try {
      const profileRes = await apiService.getPublicUserProfile(numericId)

      if (profileRes?.error) {
        setError(profileRes.error || "Failed to load user profile.")
        setProfile(null)
        setPosts([])
        setStatusData({ status: "none", requestId: null })
      } else {
        setProfile(profileRes?.user || null)
        setFollowStats({
          followingCount: Number(profileRes?.followStats?.followingCount || 0),
          followersCount: Number(profileRes?.followStats?.followersCount || 0)
        })
      }

      const [statusRes, followStatusRes, postsRes] = await Promise.all([
        apiService.getConnectionStatus(numericId).catch(() => null),
        apiService.getUserFollowStatus(numericId).catch(() => null),
        apiService.request(`/user/posts?userId=${numericId}&type=all`, { returnErrorObject: true }).catch(() => null)
      ])

      if (!statusRes?.error && statusRes?.data) {
        setStatusData(statusRes.data)
      } else {
        setStatusData({ status: "none", requestId: null })
      }

      setIsFollowing(Boolean(followStatusRes?.data?.following))
      setPosts(!postsRes?.error && Array.isArray(postsRes?.posts) ? postsRes.posts : [])
    } catch (err) {
      setError("Unable to load user profile.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!authUser) {
      router.push("/login")
      return
    }
    if (!Number.isFinite(numericId)) return
    const authRole = String(authUser.role || "").toLowerCase().replace(/_/g, "-")
    if (authRole === "user" && Number(authUser.id) === Number(numericId)) {
      router.push("/profile")
      return
    }
    loadProfile()
  }, [authLoading, authUser, numericId]) // eslint-disable-line react-hooks/exhaustive-deps

  const performAction = async (action) => {
    setActionLoading(true)
    try {
      let result = null
      if (action === "connect") {
        result = await apiService.sendConnectionRequest(numericId)
      } else if (action === "accept") {
        result = await apiService.acceptConnectionRequest(statusData.requestId)
      } else if (action === "reject") {
        result = await apiService.rejectConnectionRequest(statusData.requestId)
      }

      if (result?.error) {
        alert(result.error || "Action failed.")
        return
      }

      await loadProfile()
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async (targetUserId = numericId) => {
    const response = await apiService.request(`/messages/conversation/${targetUserId}`, {
      method: "POST",
      returnErrorObject: true
    })
    if (response?.error) {
      alert(response.message || response.error || "Unable to open conversation.")
      return
    }
    router.push(`/messages?conversationId=${response.conversationId}`)
  }

  const handleFollow = async (targetUserId = numericId) => {
    const normalizedTargetId = Number.parseInt(targetUserId, 10)
    const isProfileTarget = normalizedTargetId === numericId
    if (!Number.isFinite(normalizedTargetId) || normalizedTargetId <= 0 || (isProfileTarget && isFollowing)) return

    setActionLoading(true)
    try {
      const response = await apiService.followUser(normalizedTargetId)
      if (response?.error) {
        alert(response.error || "Unable to follow user.")
        return
      }

      if (isProfileTarget) {
        setIsFollowing(true)
        await loadProfile()
      } else {
        setFollowListUsers((items) => items.map((item) => (
          String(item.id) === String(normalizedTargetId)
            ? { ...item, viewerFollowing: true }
            : item
        )))
      }
      window.dispatchEvent(new Event("follow-stats-changed"))
    } finally {
      setActionLoading(false)
    }
  }

  const openFollowList = async (type) => {
    setFollowListType(type)
    setFollowListLoading(true)
    try {
      const response = await apiService.request(`/users/profile/${numericId}/follows/${type}`, {
        returnErrorObject: true,
      })
      setFollowListUsers(Array.isArray(response?.data) ? response.data : [])
    } finally {
      setFollowListLoading(false)
    }
  }

  const updatePost = (postId, updater) => {
    setPosts((items) => items.map((item) => (
      String(item.id) === String(postId) ? updater(item) : item
    )))
    setSelectedPost((item) => (
      item && String(item.id) === String(postId) ? updater(item) : item
    ))
  }

  const handleLikePost = async (post) => {
    const postId = String(post.id)
    const wasLiked = Boolean(post.liked)
    setPostActionId(`like-${postId}`)
    updatePost(postId, (item) => ({
      ...item,
      liked: !wasLiked,
      like_count: Math.max(0, Number(item.like_count || 0) + (wasLiked ? -1 : 1)),
    }))
    try {
      const response = await apiService.request(`/user/posts/${postId}/like`, {
        method: "POST",
        returnErrorObject: true,
      })
      if (response?.error) throw new Error(response.message || response.error)
      updatePost(postId, (item) => ({ ...item, liked: Boolean(response.liked) }))
    } catch (_error) {
      updatePost(postId, (item) => ({
        ...item,
        liked: wasLiked,
        like_count: Math.max(0, Number(item.like_count || 0) + (wasLiked ? 1 : -1)),
      }))
    } finally {
      setPostActionId(null)
    }
  }

  const handleSharePost = async (post) => {
    const postId = String(post.id)
    setPostActionId(`share-${postId}`)
    try {
      const response = await apiService.request(`/user/posts/${postId}/share`, {
        method: "POST",
        returnErrorObject: true,
      })
      if (response?.error) throw new Error(response.message || response.error)
      const shareUrl = `${window.location.origin}/users/${numericId}`
      if (navigator.share) {
        await navigator.share({ title: profile?.name || "TrueHire post", text: post.caption || "TrueHire post", url: shareUrl })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
      }
      updatePost(postId, (item) => ({
        ...item,
        share_count: Number(response.share_count ?? item.share_count ?? 0),
      }))
    } finally {
      setPostActionId(null)
    }
  }

  const renderConnectionAction = () => {
    const status = statusData?.status || "none"

    if (status === "connected") {
      return <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-800 font-semibold">Connected</span>
    }
    if (status === "pending_outgoing") {
      return <span className="px-4 py-2 rounded-xl bg-amber-100 text-amber-800 font-semibold">Pending</span>
    }
    if (status === "pending_incoming") {
      return (
        <div className="flex gap-3">
          <button
            disabled={actionLoading}
            onClick={() => performAction("accept")}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-60"
          >
            Accept
          </button>
          <button
            disabled={actionLoading}
            onClick={() => performAction("reject")}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )
    }
    if (status === "self") {
      return null
    }
    return (
      <button
        disabled={actionLoading}
        onClick={() => performAction("connect")}
        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold disabled:opacity-60"
      >
        Connect
      </button>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-700">Loading profile...</p>
      </div>
    )
  }

  const apiOrigin = (apiService?.baseURL || "").replace(/\/api$/, "").replace(/\/+$/, "")
  const profilePhoto = profile?.profile_photo
    ? profile.profile_photo.startsWith("http")
      ? profile.profile_photo
      : `${apiOrigin}${profile.profile_photo.startsWith("/") ? "" : "/"}${profile.profile_photo}`
    : ""
  const displayInitial = String(profile?.name || "U").slice(0, 1).toUpperCase()
  const currentRole = profile?.desired_job_role || "Current role not added"
  const displayLocation = profile?.current_location || "Location not added"
  const normalizeMediaUrl = (value = "") => {
    if (!value) return ""
    if (String(value).startsWith("http")) return value
    return `${apiOrigin}${String(value).startsWith("/") ? "" : "/"}${value}`
  }
  const getPostMediaItems = (post) => {
    const items = Array.isArray(post?.media) && post.media.length
      ? post.media
      : post?.media_url
        ? [{ media_url: post.media_url, media_type: post.media_type }]
        : []
    return items
      .map((item) => ({
        url: normalizeMediaUrl(item.media_url || item.url || item.path),
        type: String(item.media_type || item.type || post.media_type || "").toLowerCase().includes("video")
          ? "video"
          : "image"
      }))
      .filter((item) => item.url)
  }

  return (
    <>
      <Head>
        <title>{profile?.name ? `${profile.name} - Profile` : "User Profile"} - TrueHire</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef7f2_100%)] pt-16">
        <div className="mx-auto max-w-5xl px-4 py-8">
          {error ? (
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-700">{error}</div>
          ) : (
            <div className="space-y-5">
              <section className="overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_28px_70px_-45px_rgba(15,23,42,0.35)]">
                <div className="relative h-40 bg-[linear-gradient(120deg,#f8a24b_0%,#fff0a8_38%,#6fdcc5_72%,#73dde5_100%)]">
                  <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-sm">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0" />
                    </svg>
                  </div>
                </div>
                <div className="relative px-5 pb-5">
                  <div className="-mt-12 grid gap-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-end">
                    <div>
                      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[5px] border-white bg-white shadow-[0_18px_35px_-24px_rgba(15,23,42,0.55)]">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-black text-slate-700">
                            {displayInitial}
                          </div>
                        )}
                      </div>
                      <h1 className="mt-2 text-xl font-black tracking-tight text-slate-950">{profile?.name || "User"}</h1>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-bold text-slate-800">
                        <button type="button" onClick={() => openFollowList("following")} className="hover:text-indigo-700">
                          {followStats.followingCount} Following
                        </button>
                        <span className="text-slate-300">+</span>
                        <button type="button" onClick={() => openFollowList("followers")} className="hover:text-indigo-700">
                          {followStats.followersCount} Followers
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{displayLocation}</p>
                    </div>
                    <div className="space-y-3 md:text-right">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500">Current role</p>
                        <p className="mt-1 inline-flex rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-bold text-slate-800">
                          {currentRole}
                        </p>
                      </div>
                      <div className="flex justify-start md:justify-end">
                        <div className="flex flex-wrap gap-2">
                          {!isFollowing && (
                            <button
                              type="button"
                              disabled={actionLoading}
                              onClick={handleFollow}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                            >
                              Follow
                            </button>
                          )}
                          {renderConnectionAction()}
                          {isFollowing && (
                            <button
                              type="button"
                              disabled
                              className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600"
                            >
                              Following
                            </button>
                          )}
                          {isFollowing && (
                            <button
                              type="button"
                              onClick={() => handleMessage()}
                              className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Message
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_280px]">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">About</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {profile?.professional_summary || "No professional summary yet."}
                  </p>
                </section>
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(skills.length ? skills : ["No skills listed"]).map((skill, index) => (
                      <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Profile details</h2>
                  <div className="mt-4 space-y-3 text-sm text-slate-700">
                    <p><span className="font-bold text-slate-950">Email:</span> {profile?.email || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">Phone:</span> {profile?.contact_number || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">Headline:</span> {profile?.resume_headline || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">Open to relocation:</span> {profile?.relocated ? "Yes" : "No"}</p>
                    <p><span className="font-bold text-slate-950">Current salary:</span> {profile?.current_salary || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">Expected salary:</span> {profile?.expected_salary || "Not added"}</p>
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">More skills</h2>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">Soft skills</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(softSkills.length ? softSkills : ["No soft skills listed"]).map((skill, index) => (
                          <span key={index} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500">Languages</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(languages.length ? languages : ["No languages listed"]).map((language, index) => (
                          <span key={index} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                            {typeof language === "string" ? language : language?.name || "Language"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Projects</h2>
                  <div className="mt-4 space-y-3">
                    {projects.length ? projects.map((project, index) => (
                      <div key={index} className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-bold text-slate-950">{project.title || "Untitled project"}</p>
                        {project.description && <p className="mt-1 text-sm text-slate-600">{project.description}</p>}
                      </div>
                    )) : <p className="text-sm text-slate-500">No projects added.</p>}
                  </div>
                </section>

                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Certifications</h2>
                  <div className="mt-4 space-y-3">
                    {certifications.length ? certifications.map((certification, index) => (
                      <div key={index} className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-sm font-bold text-slate-950">{certification.name || "Certification"}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {[certification.issuer || certification.issuing_organization, certification.year].filter(Boolean).join(" • ")}
                        </p>
                      </div>
                    )) : <p className="text-sm text-slate-500">No certifications added.</p>}
                  </div>
                </section>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Links</h2>
                  <div className="mt-4 space-y-2 text-sm text-slate-700">
                    <p><span className="font-bold text-slate-950">LinkedIn:</span> {profile?.linkedin_url || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">GitHub:</span> {profile?.github_url || "Not added"}</p>
                    <p><span className="font-bold text-slate-950">Portfolio:</span> {profile?.portfolio_url || "Not added"}</p>
                  </div>
                </section>
                <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Interests</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-700">
                    {profile?.hobbies_interests || "No interests added."}
                  </p>
                </section>
              </div>

              <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Posts</h2>
                {posts.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">No posts yet.</p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {posts.map((post) => {
                      const mediaItems = getPostMediaItems(post)
                      const firstMedia = mediaItems[0]
                      return (
                        <article
                          key={post.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedPost(post)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault()
                              setSelectedPost(post)
                            }
                          }}
                          className="cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                        >
                          {firstMedia ? (
                            firstMedia.type === "video" ? (
                              <video src={firstMedia.url} className="aspect-square w-full bg-slate-950 object-cover" controls />
                            ) : (
                              <img src={firstMedia.url} alt="" className="aspect-square w-full object-cover" />
                            )
                          ) : (
                            <div className="flex aspect-square items-center justify-center bg-slate-50 p-4 text-center text-xs font-semibold text-slate-500">
                              Text post
                            </div>
                          )}
                          {post.caption && <p className="truncate px-3 py-2 text-xs text-slate-600">{post.caption}</p>}
                          <div className="flex items-center gap-4 border-t border-slate-100 px-3 py-2 text-slate-700">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleLikePost(post)
                              }}
                              disabled={postActionId === `like-${post.id}`}
                              className={`inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold transition hover:text-blue-600 disabled:opacity-60 ${post.liked ? "text-blue-600" : ""}`}
                              aria-label="Like post"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill={post.liked ? "currentColor" : "none"} stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                              </svg>
                              <span>{Number(post.like_count || 0)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedPost(post)
                              }}
                              className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold transition hover:text-blue-600"
                              aria-label="Open comments"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                              </svg>
                              <span>{Number(post.comment_count || 0)}</span>
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                handleSharePost(post)
                              }}
                              disabled={postActionId === `share-${post.id}`}
                              className="inline-flex appearance-none items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold transition hover:text-blue-600 disabled:opacity-60"
                              aria-label="Share post"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                              </svg>
                              <span>{Number(post.share_count || 0)}</span>
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" onClick={() => setSelectedPost(null)}>
          <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <p className="text-sm font-bold text-slate-950">{profile?.name || "User"}'s post</p>
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
                aria-label="Close post"
              >
                ×
              </button>
            </div>
            {(() => {
              const mediaItems = getPostMediaItems(selectedPost)
              const firstMedia = mediaItems[0]
              return firstMedia ? (
                firstMedia.type === "video" ? (
                  <video src={firstMedia.url} className="max-h-[70vh] w-full bg-slate-950 object-contain" controls autoPlay />
                ) : (
                  <img src={firstMedia.url} alt="" className="max-h-[70vh] w-full bg-slate-950 object-contain" />
                )
              ) : (
                <div className="flex min-h-[260px] items-center justify-center bg-slate-50 p-6 text-sm text-slate-600">
                  Text post
                </div>
              )
            })()}
            {selectedPost.caption && (
              <p className="px-5 py-4 text-sm leading-6 text-slate-700">{selectedPost.caption}</p>
            )}
            <div className="flex items-center gap-5 border-t border-slate-100 px-5 py-4 text-slate-700">
              <button
                type="button"
                onClick={() => handleLikePost(selectedPost)}
                disabled={postActionId === `like-${selectedPost.id}`}
                className={`inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600 disabled:opacity-60 ${selectedPost.liked ? "text-blue-600" : ""}`}
                aria-label="Like post"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill={selectedPost.liked ? "currentColor" : "none"} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
                <span>{Number(selectedPost.like_count || 0)}</span>
              </button>
              <button
                type="button"
                className="inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600"
                aria-label="Comments"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                </svg>
                <span>{Number(selectedPost.comment_count || 0)}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSharePost(selectedPost)}
                disabled={postActionId === `share-${selectedPost.id}`}
                className="inline-flex appearance-none items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-bold transition hover:text-blue-600 disabled:opacity-60"
                aria-label="Share post"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />
                </svg>
                <span>{Number(selectedPost.share_count || 0)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
      {followListType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4" onClick={() => setFollowListType(null)}>
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black capitalize text-slate-950">{followListType}</h2>
              <button type="button" onClick={() => setFollowListType(null)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close">x</button>
            </div>
            {followListLoading ? (
              <p className="py-6 text-sm text-slate-500">Loading...</p>
            ) : followListUsers.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No {followListType} yet.</p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto">
                {followListUsers.map((item) => {
                  const isCompany = item.followType === "company"
                  return (
                    <div key={`${item.followType || "user"}:${item.id}`} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3">
                      <button
                        type="button"
                        onClick={() => router.push(isCompany ? `/manage-posts?companyId=${encodeURIComponent(item.id)}` : `/users/${item.id}`)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left hover:text-indigo-700"
                      >
                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-bold">
                          {item.profileImage ? <img src={item.profileImage} alt="" className="h-full w-full object-cover" /> : String(item.name || "U").slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold">{item.name || (isCompany ? "Recruiter" : "User")}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {isCompany
                              ? [item.industry, item.headquarters_location].filter(Boolean).join(" | ") || "Recruiter"
                              : item.desiredJobRole || item.email || "TrueHire user"}
                          </span>
                        </span>
                      </button>
                      {!isCompany && item.viewerFollowing && (
                        <button type="button" onClick={() => handleMessage(item.id)} className="shrink-0 rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800">
                          Message
                        </button>
                      )}
                      {!isCompany && !item.viewerFollowing && String(item.id) !== String(authUser?.id) && (
                        <button type="button" onClick={() => handleFollow(item.id)} className="shrink-0 rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700">
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
    </>
  )
}

