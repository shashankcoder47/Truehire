import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { useAuth } from "../../../context/AuthContext"
import apiService from "../../../utils/api"

const formatTime = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const MESSAGE_EDIT_WINDOW_MS = 2 * 60 * 1000

const canEditMessage = (message, now = Date.now()) => {
  const createdAt = new Date(message?.createdAt).getTime()
  return Number.isFinite(createdAt) && now - createdAt < MESSAGE_EDIT_WINDOW_MS
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

const getReplyPreviewText = (message) => {
  const text = String(message?.message || "")
  if (parseSharedCompanyPulseMessage(text)) return "Shared a Company Pulse post"
  return text.length > 120 ? `${text.slice(0, 120)}...` : text
}

const startOfLocalDay = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const formatMessageDayLabel = (value) => {
  const messageDay = startOfLocalDay(value)
  if (!messageDay) return ""

  const today = startOfLocalDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (messageDay.getTime() === today.getTime()) return "Today"
  if (messageDay.getTime() === yesterday.getTime()) return "Yesterday"

  return messageDay.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })
}

const getMessageDayKey = (value) => {
  const day = startOfLocalDay(value)
  if (!day) return "unknown"
  const month = String(day.getMonth() + 1).padStart(2, "0")
  const date = String(day.getDate()).padStart(2, "0")
  return `${day.getFullYear()}-${month}-${date}`
}

const groupMessagesByDay = (items = []) => {
  const groups = []

  items.forEach((message) => {
    const key = getMessageDayKey(message.createdAt)
    const lastGroup = groups[groups.length - 1]

    if (!lastGroup || lastGroup.key !== key) {
      groups.push({
        key,
        label: formatMessageDayLabel(message.createdAt),
        messages: [message]
      })
      return
    }

    lastGroup.messages.push(message)
  })

  return groups
}

const avatarUrl = (path) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const origin = (apiService?.baseURL || "").replace(/\/api$/, "").replace(/\/+$/, "")
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`
}

export default function DirectConversationPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const conversationId = String(router.query.conversationId || "")
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState("")
  const [pageLoading, setPageLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [activeMessageId, setActiveMessageId] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingDraft, setEditingDraft] = useState("")
  const [messageActionBusy, setMessageActionBusy] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [replyToMessage, setReplyToMessage] = useState(null)
  const [swipeMessageId, setSwipeMessageId] = useState(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const scrollRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const pointerStartRef = useRef(null)
  const swipeOffsetRef = useRef(0)
  const messageRefs = useRef({})
  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const visibleMessages = normalizedSearchQuery
    ? messages.filter((message) => String(message.message || "").toLowerCase().includes(normalizedSearchQuery))
    : messages
  const groupedMessages = groupMessagesByDay(visibleMessages)
  const replyPreviewMessage = replyToMessage
    ? messages.find((message) => String(message.id) === String(replyToMessage.id)) || replyToMessage
    : null

  const loadConversation = async ({ showLoading = true } = {}) => {
    if (!conversationId) return
    if (showLoading) setPageLoading(true)
    try {
      const [conversationResponse, messagesResponse] = await Promise.all([
        apiService.request("/messages/conversations?type=direct", { returnErrorObject: true }),
        apiService.request(`/messages/direct/${conversationId}`, { returnErrorObject: true })
      ])

      const rows = Array.isArray(conversationResponse?.conversations) ? conversationResponse.conversations : []
      setConversation(rows.find((item) => String(item.id) === conversationId) || null)
      setMessages(Array.isArray(messagesResponse?.messages) ? messagesResponse.messages : [])
      await apiService.request(`/messages/direct/${conversationId}/read`, { method: "PATCH", returnErrorObject: true })
    } finally {
      if (showLoading) setPageLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push("/login")
      return
    }
    if (!conversationId) return

    setReplyToMessage(null)
    messageRefs.current = {}
    loadConversation()
  }, [conversationId, loading, router, user])

  useEffect(() => {
    if (!conversationId || !user) return
    const intervalId = window.setInterval(() => {
      loadConversation({ showLoading: false })
    }, 30000)
    return () => window.clearInterval(intervalId)
  }, [conversationId, user])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length])

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(Date.now()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!editingMessageId) return
    const editingMessage = messages.find((message) => String(message.id) === String(editingMessageId))
    if (editingMessage && !canEditMessage(editingMessage, currentTime)) {
      setEditingMessageId(null)
      setEditingDraft("")
      setToastMessage("Message can only be edited within 2 minutes")
    }
  }, [currentTime, editingMessageId, messages])

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!event.target.closest("[data-message-actions], [data-message-trigger]")) {
        setActiveMessageId(null)
      }
    }
    document.addEventListener("click", handleDocumentClick)
    return () => {
      document.removeEventListener("click", handleDocumentClick)
      clearLongPressTimer()
    }
  }, [])

  const sendMessage = async () => {
    const message = draft.trim()
    if (!message || !conversationId || sending) return
    setSending(true)
    try {
      const response = await apiService.request(`/messages/direct/${conversationId}`, {
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
        await loadConversation({ showLoading: false })
      }
    } finally {
      setSending(false)
    }
  }

  const openMessageActions = (messageId) => {
    setActiveMessageId(String(messageId))
  }

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  const handleMessagePointerDown = (messageId) => {
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      openMessageActions(messageId)
    }, 550)
  }

  const selectReplyTarget = (message) => {
    setReplyToMessage({
      id: String(message.id),
      senderId: String(message.senderId),
      senderType: message.senderType,
      message: message.message
    })
    setActiveMessageId(null)
    setToastMessage("Reply selected")
  }

  const scrollToMessage = (messageId) => {
    const node = messageRefs.current[String(messageId)]
    if (!node) return
    node.scrollIntoView({ behavior: "smooth", block: "center" })
    node.classList.add("ring-4", "ring-cyan-300/60")
    window.setTimeout(() => node.classList.remove("ring-4", "ring-cyan-300/60"), 900)
  }

  const handleSwipePointerDown = (event, message) => {
    if (editingMessageId === String(message.id)) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    swipeOffsetRef.current = 0
    pointerStartRef.current = {
      id: String(message.id),
      x: event.clientX,
      y: event.clientY,
      dragging: false
    }
    handleMessagePointerDown(message.id)
  }

  const handleSwipePointerMove = (event, message) => {
    const start = pointerStartRef.current
    if (!start || start.id !== String(message.id)) return

    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    if (!start.dragging && Math.abs(deltaX) < 8 && Math.abs(deltaY) < 8) return
    if (Math.abs(deltaX) <= Math.abs(deltaY)) return

    start.dragging = true
    clearLongPressTimer()
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
    clearLongPressTimer()
  }

  const handleSwipePointerEnd = (message) => {
    const start = pointerStartRef.current
    const shouldReply = start?.dragging && start.id === String(message.id) && swipeOffsetRef.current <= -54
    if (shouldReply) selectReplyTarget(message)
    resetSwipeState()
  }

  const handleCopyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.message)
    } catch {
      const textarea = document.createElement("textarea")
      textarea.value = message.message
      textarea.style.position = "fixed"
      textarea.style.opacity = "0"
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
    }
    setToastMessage("Message Copied")
    setActiveMessageId(null)
  }

  const startEditingMessage = (message) => {
    if (!canEditMessage(message)) {
      setToastMessage("Message can only be edited within 2 minutes")
      setActiveMessageId(null)
      return
    }
    setEditingMessageId(String(message.id))
    setEditingDraft(message.message)
    setActiveMessageId(null)
  }

  const saveEditedMessage = async () => {
    const nextMessage = editingDraft.trim()
    if (!nextMessage || !editingMessageId || messageActionBusy) return
    const editingMessage = messages.find((message) => String(message.id) === String(editingMessageId))
    if (editingMessage && !canEditMessage(editingMessage)) {
      setEditingMessageId(null)
      setEditingDraft("")
      setToastMessage("Message can only be edited within 2 minutes")
      return
    }
    setMessageActionBusy(true)
    try {
      const response = await apiService.request(`/messages/direct/${conversationId}/${editingMessageId}`, {
        method: "PATCH",
        body: JSON.stringify({ message: nextMessage }),
        returnErrorObject: true
      })
      if (!response?.error) {
        setMessages((current) => current.map((item) => (
          String(item.id) === String(editingMessageId)
            ? { ...item, message: nextMessage, editedAt: response?.message?.editedAt || new Date().toISOString() }
            : item
        )))
        setEditingMessageId(null)
        setEditingDraft("")
      }
    } finally {
      setMessageActionBusy(false)
    }
  }

  useEffect(() => {
    if (!toastMessage) return
    const timeoutId = window.setTimeout(() => setToastMessage(""), 1800)
    return () => window.clearTimeout(timeoutId)
  }, [toastMessage])

  const deleteMessage = async (messageId) => {
    if (!messageId || messageActionBusy) return
    setMessageActionBusy(true)
    try {
      const response = await apiService.request(`/messages/direct/${conversationId}/${messageId}`, {
        method: "DELETE",
        returnErrorObject: true
      })
      if (!response?.error) {
        setMessages((current) => current.filter((item) => String(item.id) !== String(messageId)))
        setActiveMessageId(null)
      }
    } finally {
      setMessageActionBusy(false)
    }
  }

  const openSharedCompanyPulsePost = (sharedPost) => {
    if (sharedPost?.postId) router.push(`/overview?pulsePost=${sharedPost.postId}`)
  }

  return (
    <>
      <Head><title>Chat - TrueHire</title></Head>
      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.24),transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#164e63_100%)]">
        <div className="pointer-events-none absolute left-[-100px] top-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="mx-auto max-w-3xl px-4 py-8">
          <button
            type="button"
            onClick={() => router.push("/messages")}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
          <section className="relative flex min-h-[720px] flex-col overflow-hidden rounded-[30px] border border-white/15 bg-white/95 shadow-[0_30px_90px_-45px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/messages")}
                  className="rounded-full border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Back to messages"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200">
                  {conversation?.otherUser?.profilePhoto ? (
                    <img src={avatarUrl(conversation.otherUser.profilePhoto)} alt="" className="h-full w-full object-cover" />
                  ) : String(conversation?.otherUser?.name || "U").slice(0, 1)}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-950">{conversation?.otherUser?.name || "User"}</p>
                  <p className="text-xs text-slate-500">Direct conversation</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <button
                  type="button"
                  onClick={() => {
                    setShowSearch((current) => !current)
                    if (showSearch) setSearchQuery("")
                  }}
                  className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-50"
                  aria-label="Search conversation"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z" />
                  </svg>
                </button>
                <button type="button" className="rounded-full border border-slate-200 p-2 transition hover:bg-slate-50" aria-label="More options">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.8" />
                    <circle cx="12" cy="12" r="1.8" />
                    <circle cx="12" cy="19" r="1.8" />
                  </svg>
                </button>
              </div>
            </div>

            {showSearch && (
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-indigo-300 focus-within:ring-4 focus-within:ring-indigo-100">
                  <svg className="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m21 21-4.35-4.35m1.85-5.4a7.25 7.25 0 1 1-14.5 0 7.25 7.25 0 0 1 14.5 0Z" />
                  </svg>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search messages..."
                    className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {normalizedSearchQuery && (
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    {visibleMessages.length} matching {visibleMessages.length === 1 ? "message" : "messages"}
                  </p>
                )}
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-5">
              {pageLoading ? (
                <p className="text-sm text-slate-500">Loading messages...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">No messages yet. Say hello.</p>
              ) : normalizedSearchQuery && visibleMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No matching messages found.</p>
              ) : groupedMessages.map((group) => (
                <div key={group.key} className="space-y-4">
                  <div className="sticky top-0 z-10 flex justify-center py-1">
                    <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1 text-[11px] font-semibold text-slate-500 shadow-sm backdrop-blur">
                      {group.label}
                    </span>
                  </div>

                  {group.messages.map((message) => {
                    const mine = String(message.senderId) === String(user?.id)
                    const readReceiptLabel = message.isRead ? "Read" : "Sent"
                    const messageCanBeEdited = canEditMessage(message, currentTime)
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
                          data-message-trigger
                          onPointerDown={(event) => handleSwipePointerDown(event, message)}
                          onPointerMove={(event) => handleSwipePointerMove(event, message)}
                          onPointerUp={() => handleSwipePointerEnd(message)}
                          onPointerLeave={() => handleSwipePointerEnd(message)}
                          onPointerCancel={resetSwipeState}
                          onContextMenu={(event) => {
                            event.preventDefault()
                            openMessageActions(message.id)
                          }}
                          style={{
                            touchAction: "pan-y",
                            transform: swipeMessageId === String(message.id) ? `translateX(${swipeOffset}px)` : undefined,
                            transition: swipeMessageId === String(message.id) ? "none" : "transform 160ms ease"
                          }}
                          className={`max-w-[78%] select-none ${
                          mine
                            ? "rounded-2xl rounded-br-md bg-gradient-to-r from-slate-950 to-cyan-800 px-4 py-3 text-white shadow-sm"
                            : "rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm"
                        }`}
                        >
                          {editingMessageId === String(message.id) ? (
                            <div className="space-y-2">
                              <input
                                value={editingDraft}
                                onChange={(event) => setEditingDraft(event.target.value)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") saveEditedMessage()
                                  if (event.key === "Escape") {
                                    setEditingMessageId(null)
                                    setEditingDraft("")
                                  }
                                }}
                                autoFocus
                                className="w-full rounded-lg border border-white/20 bg-white px-3 py-2 text-sm text-slate-950 outline-none"
                              />
                              <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => { setEditingMessageId(null); setEditingDraft("") }} className="text-xs font-semibold text-white/75">Cancel</button>
                                <button type="button" onClick={saveEditedMessage} disabled={!editingDraft.trim() || messageActionBusy} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0b1142] disabled:opacity-50">Save</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {message.replyTo && (
                                <button
                                  type="button"
                                  onClick={() => scrollToMessage(message.replyTo.id)}
                                  className={`mb-2 block w-full rounded-xl border-l-4 px-3 py-2 text-left text-xs ${
                                    mine
                                      ? "border-cyan-200 bg-white/12 text-white/78"
                                      : "border-cyan-500 bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  <span className={`block font-black ${mine ? "text-white" : "text-slate-800"}`}>
                                    {String(message.replyTo.senderId) === String(user?.id) ? "You" : conversation?.otherUser?.name || "User"}
                                  </span>
                                  <span className="line-clamp-2 break-words">{getReplyPreviewText(message.replyTo)}</span>
                                </button>
                              )}
                              <MessageContent text={message.message} onOpenSharedPost={openSharedCompanyPulsePost} />
                            </>
                          )}
                          {message.editedAt && editingMessageId !== String(message.id) && (
                            <p className={`mt-1 text-[10px] font-medium ${mine ? "text-white/55" : "text-slate-400"}`}>
                              Edited
                            </p>
                          )}
                          <div className={`mt-2 flex items-center gap-2 text-[10px] font-medium ${mine ? "justify-end text-white/70" : "text-slate-400"}`}>
                            <span>{formatTime(message.createdAt)}</span>
                            {mine && (
                              <span
                                className={`inline-flex h-5 items-center justify-center rounded-full px-1.5 ${
                                  message.isRead ? "bg-white/18 text-white" : "bg-white/10 text-white/75"
                                }`}
                                aria-label={readReceiptLabel}
                                title={readReceiptLabel}
                              >
                                {message.isRead ? (
                                  <svg className="h-3.5 w-5" viewBox="0 0 20 12" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 6.5 4.8 9.5 10.8 2.5" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 6.5 11.3 9.5 18.5 2.5" />
                                  </svg>
                                ) : (
                                  <svg className="h-3.5 w-4" viewBox="0 0 14 12" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1.5 6.5 4.8 9.5 12.5 2.5" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {activeMessageId === String(message.id) && (
                          <div data-message-actions className={`absolute z-20 mt-2 min-w-[150px] overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-[0_18px_45px_-20px_rgba(15,23,42,0.35)] ${
                            mine ? "right-0 top-full" : "left-0 top-full"
                          }`}>
                            <button type="button" onClick={() => selectReplyTarget(message)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 6 6v1" />
                              </svg>
                              Reply
                            </button>
                            <button type="button" onClick={() => handleCopyMessage(message)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                              <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8 8h10v10H8zM6 16H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                              Copy
                            </button>
                            {mine && (
                              <>
                                {messageCanBeEdited && (
                                  <button type="button" onClick={() => startEditingMessage(message)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                                    <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.862 4.487Z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19.5 7.125 16.875 4.5M18 14v5.25A2.25 2.25 0 0 1 15.75 21H4.5A2.25 2.25 0 0 1 2.25 18.75V7.5A2.25 2.25 0 0 1 4.5 5.25H9" />
                                    </svg>
                                    Edit
                                  </button>
                                )}
                                <button type="button" onClick={() => deleteMessage(message.id)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50">
                                  <svg className="h-4 w-4 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 7h12M10 11v6M14 11v6M9 7l1-2h4l1 2M8 7v12h8V7" />
                                  </svg>
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200/80 bg-white/90 p-3 backdrop-blur">
              {replyPreviewMessage && (
                <div className="mb-2 flex items-start justify-between gap-3 rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                  <div className="min-w-0 border-l-4 border-cyan-500 pl-3">
                    <p className="text-xs font-black text-slate-800">
                      Replying to {String(replyPreviewMessage.senderId) === String(user?.id) ? "yourself" : conversation?.otherUser?.name || "User"}
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
              <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm focus-within:border-cyan-300 focus-within:ring-4 focus-within:ring-cyan-100">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") sendMessage()
                  }}
                  placeholder="Write a message..."
                  className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  disabled={!draft.trim() || sending}
                  className="rounded-full bg-gradient-to-r from-slate-950 to-cyan-700 px-5 py-2 text-sm font-bold text-white transition hover:opacity-95 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg">
          {toastMessage}
        </div>
      )}
    </>
  )
}
