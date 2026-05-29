import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { useAuth } from "../../context/AuthContext"
import apiService from "../../utils/api"

const formatTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatConversationTime = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const now = new Date()
  const oneDayMs = 24 * 60 * 60 * 1000
  if (now.getTime() - date.getTime() < oneDayMs) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return date.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {})
  })
}

const avatarUrl = (path) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const origin = (apiService?.baseURL || "").replace(/\/api$/, "").replace(/\/+$/, "")
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`
}

const isVideoUrl = (url = "") => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url)

const COMPANY_PULSE_SHARE_PREFIX = "__TRUEHIRE_COMPANY_PULSE_SHARE__"

const parseSharedCompanyPulseMessage = (value) => {
  const rawValue = String(value || "")

  if (rawValue.startsWith(COMPANY_PULSE_SHARE_PREFIX)) {
    try {
      const payload = JSON.parse(rawValue.slice(COMPANY_PULSE_SHARE_PREFIX.length))
      const mediaItems = Array.isArray(payload.mediaItems) && payload.mediaItems.length
        ? payload.mediaItems
        : payload.mediaUrl
          ? [{ url: payload.mediaUrl, type: payload.mediaType || "image" }]
          : []
      const normalizedMediaItems = mediaItems.map((item) => ({
        url: String(item.url || item.mediaUrl || ""),
        type: String(item.type || item.mediaType || "").toLowerCase().includes("video") || isVideoUrl(item.url || item.mediaUrl)
          ? "video"
          : "image"
      })).filter((item) => item.url)
      if (normalizedMediaItems.length === 0) return null
      const primaryMedia = normalizedMediaItems[0]
      return {
        postId: String(payload.postId || ""),
        companyId: String(payload.companyId || ""),
        mediaItems: normalizedMediaItems,
        mediaUrl: primaryMedia.url,
        mediaType: primaryMedia.type,
        postUrl: payload.postId ? `/overview?pulsePost=${payload.postId}` : ""
      }
    } catch {
      return null
    }
  }

  const lines = rawValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const mediaLine = lines.find((line) => line.toLowerCase().startsWith("media:"))
  if (!mediaLine) return null

  const mediaUrl = mediaLine.replace(/^media:\s*/i, "").trim()
  if (!mediaUrl) return null

  const viewLine = lines.find((line) => line.toLowerCase().startsWith("view post:"))
  const postUrl = viewLine ? viewLine.replace(/^view post:\s*/i, "").trim() : ""
  const contentLines = lines.filter((line) => (
    !line.toLowerCase().startsWith("media:") &&
    !line.toLowerCase().startsWith("view post:")
  ))

  return {
    title: contentLines[0] || "",
    caption: contentLines.slice(1).join("\n"),
    mediaItems: [{ url: mediaUrl, type: isVideoUrl(mediaUrl) ? "video" : "image" }],
    mediaUrl,
    mediaType: isVideoUrl(mediaUrl) ? "video" : "image",
    postUrl
  }
}

const getConversationPreviewText = (value) => (
  parseSharedCompanyPulseMessage(value) ? "Shared a Company Pulse post" : value
)

const getReplyPreviewText = (message) => {
  const text = String(message?.message || "")
  if (parseSharedCompanyPulseMessage(text)) return "Shared a Company Pulse post"
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}

const MessageContent = ({ text, onOpenSharedPost }) => {
  const sharedPost = parseSharedCompanyPulseMessage(text)
  if (!sharedPost) return <p className="break-words text-sm">{text}</p>
  const mediaItems = sharedPost.mediaItems?.length ? sharedPost.mediaItems : [{ url: sharedPost.mediaUrl, type: sharedPost.mediaType }]
  const primaryMedia = mediaItems[0]

  return (
    <button
      type="button"
      onClick={() => onOpenSharedPost(sharedPost)}
      className="relative block w-full overflow-hidden rounded-xl bg-black p-0 text-left"
      aria-label="Open shared Company Pulse post"
    >
      <span className="block">
        {primaryMedia.type === "video" ? (
          <video src={primaryMedia.url} muted playsInline preload="metadata" className="max-h-72 w-full bg-black object-contain" />
        ) : (
          <img src={primaryMedia.url} alt="" className="max-h-72 w-full object-contain" />
        )}
      </span>
      {mediaItems.length > 1 && (
        <span className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-bold text-white">
          1/{mediaItems.length}
        </span>
      )}
    </button>
  )
}

export default function DirectMessagesPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const requestedConversationId = String(router.query.conversationId || "")
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState("")
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [pageLoading, setPageLoading] = useState(true)
  const [chatLoading, setChatLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [swipeMessageId, setSwipeMessageId] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const scrollRef = useRef(null)
  const pointerStartRef = useRef(null)
  const swipeOffsetRef = useRef(0)
  const messageRefs = useRef({})

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => String(conversation.id) === String(selectedId)),
    [conversations, selectedId]
  )

  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return conversations.filter((conversation) => {
      if (filter === "unread" && Number(conversation.unreadCount || 0) === 0) return false
      if (!normalizedQuery) return true
      const other = conversation.otherUser || {}
      return [
        other.name,
        conversation.lastMessage
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery))
    })
  }, [conversations, filter, query])

  const unreadTotal = useMemo(
    () => conversations.reduce((total, conversation) => total + Number(conversation.unreadCount || 0), 0),
    [conversations]
  )

  const replyPreviewMessage = replyToMessage
    ? messages.find((message) => String(message.id) === String(replyToMessage.id)) || replyToMessage
    : null

  const displayName = user?.name || user?.fullName || user?.email || "TrueHire User"

  const loadConversations = async ({ showLoading = true } = {}) => {
    if (showLoading) setPageLoading(true)
    const response = await apiService.request("/messages/conversations?type=direct", { returnErrorObject: true })
    const rows = Array.isArray(response?.conversations) ? response.conversations : []
    setConversations(rows)
    const nextId = requestedConversationId || selectedId || ""
    if (nextId) setSelectedId(String(nextId))
    if (showLoading) setPageLoading(false)
  }

  const loadMessages = async (conversationId, { showLoading = true } = {}) => {
    if (!conversationId) return
    if (showLoading) setChatLoading(true)
    try {
      const response = await apiService.request(`/messages/direct/${conversationId}`, { returnErrorObject: true })
      setMessages(Array.isArray(response?.messages) ? response.messages : [])
      await apiService.request(`/messages/direct/${conversationId}/read`, { method: "PATCH", returnErrorObject: true })
      setConversations((current) => current.map((item) => (
        String(item.id) === String(conversationId) ? { ...item, unreadCount: 0 } : item
      )))
    } finally {
      if (showLoading) setChatLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login")
      return
    }
    loadConversations()
  }, [loading, user, requestedConversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setReplyToMessage(null)
    messageRefs.current = {}
    if (selectedId) loadMessages(selectedId)
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return
    const intervalId = window.setInterval(() => {
      if (selectedId) {
        loadMessages(selectedId, { showLoading: false })
        return
      }
      loadConversations({ showLoading: false })
    }, 30000)
    return () => window.clearInterval(intervalId)
  }, [selectedId, user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  const sendMessage = async () => {
    const message = draft.trim()
    if (!message || !selectedId || sending) return
    setSending(true)
    try {
      const response = await apiService.request(`/messages/direct/${selectedId}`, {
        method: "POST",
        body: JSON.stringify({
          message,
          replyToMessageId: replyPreviewMessage?.id || null
        }),
        returnErrorObject: true
      })
      if (!response?.error) {
        setDraft("")
        setReplyToMessage(null)
        await Promise.all([loadMessages(selectedId), loadConversations()])
      }
    } finally {
      setSending(false)
    }
  }

  const openConversation = (conversationId) => {
    setSelectedId(String(conversationId))
    router.replace(`/messages?conversationId=${conversationId}`, undefined, { shallow: true })
  }

  const returnToConversationList = () => {
    setSelectedId("")
    setMessages([])
    router.replace("/messages", undefined, { shallow: true })
  }

  const openSharedCompanyPulsePost = (sharedPost) => {
    if (sharedPost?.postId) router.push(`/overview?pulsePost=${sharedPost.postId}`)
  }

  const selectReplyTarget = (message) => {
    setReplyToMessage({
      id: String(message.id),
      senderId: String(message.senderId),
      senderType: message.senderType,
      message: message.message
    })
  }

  const scrollToMessage = (messageId) => {
    const node = messageRefs.current[String(messageId)]
    if (!node) return
    node.scrollIntoView({ behavior: "smooth", block: "center" })
    node.classList.add("ring-4", "ring-cyan-300/60")
    window.setTimeout(() => node.classList.remove("ring-4", "ring-cyan-300/60"), 900)
  }

  const handleSwipePointerDown = (event, message) => {
    event.currentTarget.setPointerCapture?.(event.pointerId)
    swipeOffsetRef.current = 0
    pointerStartRef.current = {
      id: String(message.id),
      x: event.clientX,
      y: event.clientY,
      dragging: false
    }
  }

  const handleSwipePointerMove = (event, message) => {
    const start = pointerStartRef.current
    if (!start || start.id !== String(message.id)) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (!start.dragging && Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return

    start.dragging = true
    if (deltaX < 0) {
      swipeOffsetRef.current = Math.max(deltaX, -72)
      setSwipeMessageId(String(message.id))
      setSwipeOffset(swipeOffsetRef.current)
    }
  }

  const resetSwipeState = () => {
    pointerStartRef.current = null
    swipeOffsetRef.current = 0
    setSwipeMessageId(null)
    setSwipeOffset(0)
  }

  const handleSwipePointerEnd = (message) => {
    const start = pointerStartRef.current
    const shouldReply = start?.dragging && start.id === String(message.id) && swipeOffsetRef.current <= -54
    if (shouldReply) selectReplyTarget(message)
    resetSwipeState()
  }

  return (
    <>
      <Head><title>Messages - TrueHire</title></Head>
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_52%,#ecfeff_100%)]">
        <div className="pointer-events-none absolute right-[-90px] top-16 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl" />
        <div className="pointer-events-none absolute bottom-10 left-[-120px] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="relative mx-auto max-w-[1320px] px-4 py-8">
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
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-700">TrueHire Inbox</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Messages</h1>
              <p className="mt-2 text-sm font-medium text-slate-600">Keep every candidate and professional conversation in one focused place.</p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
              {unreadTotal} unread
            </div>
          </div>
          <section className="grid min-h-[720px] overflow-hidden rounded-[30px] border border-white/75 bg-white/70 shadow-[0_28px_90px_-50px_rgba(15,23,42,0.45)] backdrop-blur-xl lg:grid-cols-[340px_minmax(0,1fr)]">

            <aside className={`${selectedConversation ? "hidden lg:block" : "block"} border-b border-white/10 bg-slate-950 text-white lg:border-b-0 lg:border-r`}>
              <div className="border-b border-white/10 p-5">
                <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2.5 shadow-inner shadow-black/10">
                  <svg className="h-4 w-4 shrink-0 text-white/45" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z" />
                  </svg>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search people..."
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                  />
                </div>
              </div>
              <div className="border-b border-white/10 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-cyan-200/70">My chats</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight text-white">Conversations</h2>
                  </div>
                  <span className="rounded-full bg-cyan-400 px-2.5 py-1 text-xs font-black text-slate-950">{unreadTotal}</span>
                </div>
              </div>
              <div className="max-h-[620px] overflow-y-auto">
                {pageLoading ? (
                  <p className="p-5 text-sm text-white/60">Loading conversations...</p>
                ) : conversations.length === 0 ? (
                  <div className="p-5">
                    <p className="text-sm font-semibold text-white">No conversations yet.</p>
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Open another user&apos;s profile and click Message to start chatting.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/connections")}
                      className="mt-4 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500"
                    >
                      Find people
                    </button>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-5">
                    <p className="text-sm font-semibold text-white">No matching conversations.</p>
                    <p className="mt-1 text-xs leading-5 text-white/60">
                      Try a different name or clear your search.
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredConversations.map((conversation) => {
                  const active = String(conversation.id) === String(selectedId)
                  const other = conversation.otherUser || {}
                  return (
                    <button
                      key={conversation.id}
                      type="button"
                      onClick={() => openConversation(conversation.id)}
                      className={`relative block w-full appearance-none border-0 bg-transparent px-5 py-4 text-left transition ${
                        active
                          ? "bg-white/10 text-white"
                          : "text-white/78 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {active && <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-cyan-300" />}
                      <span className="flex min-w-0 items-center justify-between gap-3">
                        <span className="truncate text-sm font-bold">{other.name || "User"}</span>
                        {conversation.lastMessageAt && (
                          <span className="shrink-0 text-[10px] font-semibold text-white/45">
                            {formatConversationTime(conversation.lastMessageAt)}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 flex min-w-0 items-center justify-between gap-3">
                        <span className={`truncate text-xs ${conversation.unreadCount > 0 ? "font-semibold text-white/85" : "text-white/55"}`}>
                          {getConversationPreviewText(conversation.lastMessage) || "Start conversation"}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-[#0b1142]">{conversation.unreadCount}</span>
                        )}
                      </span>
                    </button>
                  )
                    })}

                  </>
                )}
              </div>
            </aside>
            <section className={`${selectedConversation ? "flex" : "hidden lg:flex"} min-h-[520px] flex-col bg-white/95`}>
              {!selectedConversation ? (
                <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                    </svg>
                  </div>
                  <p className="mt-4 text-base font-black text-slate-800">
                    {conversations.length === 0 ? "Start your first conversation" : "Choose a conversation"}
                  </p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    {conversations.length === 0
                      ? "Visit a profile and send a message. Your chats will appear here once the conversation begins."
                      : "Select someone from the left to read messages and continue the conversation."}
                  </p>
                  {conversations.length === 0 && (
                    <button
                      type="button"
                      onClick={() => router.push("/connections")}
                      className="mt-5 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500"
                    >
                      Find people
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur">
                    <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={returnToConversationList}
                      className="mr-1 rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 lg:hidden"
                      aria-label="Back to conversations"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
                      </svg>
                    </button>
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-black text-slate-700 ring-2 ring-indigo-200">
                          {selectedConversation.otherUser?.profilePhoto ? (
                            <img src={avatarUrl(selectedConversation.otherUser.profilePhoto)} alt="" className="h-full w-full object-cover" />
                          ) : String(selectedConversation.otherUser?.name || "U").slice(0, 1)}
                        </div>
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-950">{selectedConversation.otherUser?.name || "User"}</p>
                        <p className="text-xs font-medium text-slate-500">Direct conversation</p>
                      </div>
                    </div>
                    <div className="hidden items-center gap-2 text-slate-400 sm:flex">
                      <button type="button" className="rounded-full p-2 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Search conversation">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z" />
                        </svg>
                      </button>
                      <button type="button" className="rounded-full p-2 transition hover:bg-slate-100 hover:text-slate-700" aria-label="More options">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="5" r="1.8" />
                          <circle cx="12" cy="12" r="1.8" />
                          <circle cx="12" cy="19" r="1.8" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] p-5">
                    {chatLoading ? (
                      <p className="text-sm text-slate-500">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-sm text-slate-500">No messages yet. Say hello.</p>
                    ) : messages.map((message) => {
                      const mine = String(message.senderId) === String(user?.id)
                      return (
                        <div
                          key={message.id}
                          ref={(node) => {
                            if (node) messageRefs.current[String(message.id)] = node
                          }}
                          className={`relative flex rounded-2xl transition-shadow ${mine ? "justify-end" : "justify-start"}`}
                        >
                          {swipeMessageId === String(message.id) && swipeOffset < 0 && (
                            <div className={`pointer-events-none absolute inset-y-0 flex items-center ${mine ? "right-1" : "left-[calc(78%-2.25rem)]"}`}>
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600 text-white shadow-sm">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v1" />
                                </svg>
                              </span>
                            </div>
                          )}
                          <div
                            onPointerDown={(event) => handleSwipePointerDown(event, message)}
                            onPointerMove={(event) => handleSwipePointerMove(event, message)}
                            onPointerUp={() => handleSwipePointerEnd(message)}
                            onPointerLeave={() => handleSwipePointerEnd(message)}
                            onPointerCancel={resetSwipeState}
                            style={{
                              touchAction: "pan-y",
                              transform: swipeMessageId === String(message.id) ? `translateX(${swipeOffset}px)` : undefined,
                              transition: swipeMessageId === String(message.id) ? "none" : "transform 160ms ease"
                            }}
                            className={`max-w-[78%] select-none rounded-xl px-4 py-3 shadow-sm ${
                            mine
                              ? "rounded-br-sm bg-indigo-600 text-white shadow-indigo-100"
                              : "rounded-bl-sm border border-slate-200 bg-slate-50 text-slate-900"
                          }`}>
                            {message.replyTo && (
                              <button
                                type="button"
                                onClick={() => scrollToMessage(message.replyTo.id)}
                                className={`mb-2 block w-full rounded-xl border-l-4 px-3 py-2 text-left text-xs ${
                                  mine
                                    ? "border-cyan-200 bg-white/12 text-white/78"
                                    : "border-cyan-500 bg-white text-slate-600"
                                }`}
                              >
                                <span className={`block font-black ${mine ? "text-white" : "text-slate-800"}`}>
                                  {String(message.replyTo.senderId) === String(user?.id) ? "You" : selectedConversation?.otherUser?.name || "User"}
                                </span>
                                <span className="line-clamp-2 break-words">{getReplyPreviewText(message.replyTo)}</span>
                              </button>
                            )}
                            <MessageContent text={message.message} onOpenSharedPost={openSharedCompanyPulsePost} />
                            <p className={`mt-1 text-[10px] ${mine ? "text-indigo-100" : "text-slate-400"}`}>{formatTime(message.createdAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="border-t border-slate-200/80 bg-white/90 p-4 backdrop-blur">
                    {replyPreviewMessage && (
                      <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                        <div className="min-w-0 border-l-4 border-cyan-500 pl-3">
                          <p className="text-xs font-black text-slate-800">
                            Replying to {String(replyPreviewMessage.senderId) === String(user?.id) ? "yourself" : selectedConversation?.otherUser?.name || "User"}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-600">{getReplyPreviewText(replyPreviewMessage)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setReplyToMessage(null)}
                          className="rounded-full p-1 text-slate-400 transition hover:bg-white hover:text-slate-700"
                          aria-label="Cancel reply"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l12 12M18 6 6 18" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm transition focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-100">
                      <input
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") sendMessage()
                        }}
                        placeholder="Write a message..."
                        className="min-w-0 flex-1 border-0 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-slate-400"
                      />
                      <button type="button" onClick={sendMessage} disabled={!draft.trim() || sending} className="rounded-full bg-gradient-to-r from-slate-950 to-cyan-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 disabled:opacity-50">
                        Send
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>

          </section>
        </div>
      </main>
    </>
  )
}
