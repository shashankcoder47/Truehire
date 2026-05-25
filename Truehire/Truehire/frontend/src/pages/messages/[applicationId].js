import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../context/AuthContext'
import apiService from '../../utils/api'

const formatTimestamp = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const formatSeenTime = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

const buildFileUrl = (filePath) => {
  if (!filePath) return ''
  if (filePath.startsWith('http')) return filePath
  const base = (apiService.getEffectiveBaseURL?.() || '').replace(/\/api$/, '').replace(/\/+$/, '')
  const normalized = `${filePath.startsWith('/') ? '' : '/'}${filePath}`
  return base ? `${base}${normalized}` : normalized
}

const recruiterQuickReplies = [
  { label: 'Thanks for applying', value: 'Thanks for applying.' },
  { label: 'Please share your availability', value: 'Please share your availability.' },
  { label: 'You are shortlisted for the next round', value: 'You are shortlisted for the next round.' }
]

export default function ApplicationMessages() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { applicationId } = router.query
  const [conversation, setConversation] = useState(null)
  const [application, setApplication] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [actionError, setActionError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [roleHint, setRoleHint] = useState(null)
  const [tokenReady, setTokenReady] = useState(false)
  const endRef = useRef(null)

  const resolvedRole = user?.role || roleHint
  const isRecruiter = resolvedRole === 'recruiter' || resolvedRole === 'sub-recruiter'
  const counterpartName = useMemo(() => {
    if (!application) return ''
    return isRecruiter ? application.userName || 'Candidate' : application.recruiterName || 'Recruiter'
  }, [application, isRecruiter])

  const jobContext = useMemo(() => ({
    title: application?.jobTitle || 'Job',
    company: application?.jobCompany || 'Company',
    status: application?.applicationStatus || 'Applied'
  }), [application])

  const candidateProfile = useMemo(() => {
    if (!application) return null
    const resumePath = application.applicationResumePath || application.userResumeFile || null
    const experienceYears = Number(application.userExperienceYears || 0)
    const experienceMonths = Number(application.userExperienceMonths || 0)
    const experienceLabel = experienceYears || experienceMonths
      ? `${experienceYears}y ${experienceMonths}m`
      : (application.applicationExperienceLevel || 'Not specified')
    return {
      name: application.userName || 'Candidate',
      email: application.userEmail || null,
      resumePath,
      coreSkills: application.userCoreSkills || null,
      experienceLabel
    }
  }, [application])

  useEffect(() => {
    if (loading) return
    if (!user) {
      const storedRole = apiService.getUserData()?.role || null
      setRoleHint(storedRole)
      const token = apiService.getToken()
      setTokenReady(Boolean(token))
      if (!token) {
        router.push(storedRole === 'recruiter' || storedRole === 'sub-recruiter' ? '/login' : '/login')
        return
      }
    }
  }, [loading, user])

  useEffect(() => {
    if (!router.isReady) return
    if (!user && !tokenReady) return
    fetchConversation()
  }, [router.isReady, user, applicationId, tokenReady])

  useEffect(() => {
    if (!endRef.current) return
    endRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const pinnedMessages = useMemo(() => (
    messages
      .filter((msg) => msg.isPinned)
      .sort((a, b) => new Date(b.pinnedAt || 0) - new Date(a.pinnedAt || 0))
  ), [messages])

  const fetchConversation = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiService.request(`/messages/conversations/${applicationId}`, {
        returnErrorObject: true
      })
      if (response?.error) {
        throw response
      }
      setConversation(response?.conversation || null)
      setApplication(response?.application || null)
      setMessages(response?.messages || [])
      await apiService.request(`/messages/conversations/${applicationId}/read`, {
        method: 'POST',
        returnErrorObject: true
      })
    } catch (err) {
      console.error('Failed to load messages:', err)
      setError(err?.message || err?.error || 'Unable to load this conversation.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg'
    ]
    const maxSize = 5 * 1024 * 1024
    const filtered = []
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setError('Only PDF, DOC, DOCX, PNG, or JPG files are allowed.')
        return
      }
      if (file.size > maxSize) {
        setError('Each attachment must be 5 MB or less.')
        return
      }
      filtered.push(file)
    }
    setAttachments((prev) => [...prev, ...filtered].slice(0, 5))
  }

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleQuickReply = (text) => {
    setMessageText(text)
  }

  const handlePinMessage = async (messageId, shouldPin) => {
    if (!messageId || typeof messageId === 'string') return
    setError('')
    try {
      const response = await apiService.request(`/messages/conversations/${applicationId}/pins`, {
        method: 'POST',
        body: JSON.stringify({ messageId, pinned: shouldPin }),
        returnErrorObject: true
      })
      if (response?.error) throw response
      setMessages((prev) => prev.map((msg) => (
        msg.id === messageId
          ? {
              ...msg,
              isPinned: Boolean(response?.message?.isPinned),
              pinnedAt: response?.message?.pinnedAt || null,
              pinnedByRole: response?.message?.pinnedByRole || null,
              pinnedById: response?.message?.pinnedById || null
            }
          : msg
      )))
    } catch (err) {
      console.error('Pin message failed:', err)
      setError(err?.message || err?.error || 'Unable to update pinned message.')
    }
  }

  const handleRecruiterAction = async (action) => {
    if (!application?.applicationId) return
    setActionError('')
    try {
      if (action === 'shortlist') {
        const response = await apiService.request(`/recruiters/applications/${application.applicationId}/shortlist`, {
          method: 'PUT',
          returnErrorObject: true
        })
        if (response?.error) throw response
      }
      if (action === 'reject') {
        const reasonInput = window.prompt('Optional rejection reason (leave blank to skip):', '')
        const reason = reasonInput && reasonInput.trim() ? reasonInput.trim() : null
        const response = await apiService.request(`/recruiters/applications/${application.applicationId}/reject`, {
          method: 'PUT',
          body: JSON.stringify({ rejectionReason: reason }),
          returnErrorObject: true
        })
        if (response?.error) throw response
      }
      fetchConversation()
    } catch (err) {
      console.error('Recruiter action failed:', err)
      setActionError(err?.message || err?.error || 'Unable to complete action.')
    }
  }

  const handleSaveNotes = async (notes) => {
    if (!application?.applicationId) return
    setActionError('')
    try {
      const response = await apiService.request(`/messages/conversations/${application.applicationId}/notes`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
        returnErrorObject: true
      })
      if (response?.error) throw response
      fetchConversation()
    } catch (err) {
      console.error('Save notes failed:', err)
      setActionError(err?.message || err?.error || 'Unable to save notes.')
    }
  }

  const handleSend = async () => {
    const trimmed = messageText.trim()
    if (!trimmed || sending) return
    setSending(true)
    setError('')
    const tempId = `temp-${Date.now()}`
    const optimisticMessage = {
      id: tempId,
      conversationId: conversation?.id || null,
      applicationId: application?.applicationId || applicationId,
      jobId: application?.jobId || null,
      senderId: user?.id || null,
      senderRole: isRecruiter ? 'recruiter' : 'user',
      receiverId: null,
      receiverRole: isRecruiter ? 'user' : 'recruiter',
      message: trimmed,
      readStatus: 'sent',
      readAt: null,
      isPinned: 0,
      pinnedAt: null,
      pinnedByRole: null,
      pinnedById: null,
      createdAt: new Date().toISOString(),
      attachments: attachments.map((file) => ({
        fileName: file.name,
        filePath: '',
        fileType: file.type,
        fileSize: file.size
      }))
    }
    setMessages((prev) => [...prev, optimisticMessage])
    try {
      const hasAttachments = attachments.length > 0
      let response
      if (hasAttachments) {
        const formData = new FormData()
        formData.append('message', trimmed)
        attachments.forEach((file) => formData.append('attachments', file))
        response = await apiService.request(`/messages/conversations/${applicationId}/messages`, {
          method: 'POST',
          body: formData,
          returnErrorObject: true
        })
      } else {
        response = await apiService.request(`/messages/conversations/${applicationId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message: trimmed }),
          returnErrorObject: true
        })
      }
      if (response?.error) {
        throw response
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId).concat(response.message))
      setMessageText('')
      setAttachments([])
    } catch (err) {
      console.error('Send message failed:', err)
      const details = typeof err?.details?.details === 'string' ? err.details.details : ''
      const message = err?.message || err?.error || 'Unable to send message.'
      setError(details ? `${message}: ${details}` : message)
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Head>
        <title>Messages - TrueHire</title>
      </Head>
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 text-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-[28px] border border-slate-200/70 bg-white/90 shadow-[0_30px_70px_-45px_rgba(15,23,42,0.35)]">
              <div className="border-b border-slate-200 px-6 py-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Application Messages</p>
                <h1 className="text-2xl font-semibold text-slate-900">{counterpartName || 'Conversation'}</h1>
                {application?.jobTitle && (
                  <p className="text-sm text-slate-600">
                    {application.jobTitle} {application.jobCompany ? `--- ${application.jobCompany}` : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push('/inbox')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                >
                  Back to Inbox
                </button>
                <button
                  onClick={fetchConversation}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <p className="text-slate-600 text-center">Loading messages...</p>
              ) : error ? (
                <p className="text-rose-600 text-center">{error}</p>
              ) : messages.length === 0 ? (
                <p className="text-slate-600 text-center">No messages yet. Start the conversation.</p>
              ) : (
                <div className="space-y-5">
                  {pinnedMessages.length > 0 && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-amber-700">Pinned</p>
                      <div className="mt-3 space-y-3">
                        {pinnedMessages.map((msg) => (
                          <div key={`pinned-${msg.id}`} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {msg.senderRole === 'recruiter' ? (application?.recruiterName || 'Recruiter') : (application?.userName || 'Candidate')}
                                </p>
                                <p className="whitespace-pre-line text-slate-700">{msg.message}</p>
                                <p className="mt-1 text-[11px] text-slate-500">{formatTimestamp(msg.createdAt)}</p>
                              </div>
                              <button
                                onClick={() => handlePinMessage(msg.id, false)}
                                className="rounded-full border border-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-700"
                              >
                                Unpin
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {messages.map((msg) => {
                    if (msg.senderRole === 'system') {
                      return (
                        <div key={msg.id} className="flex justify-center">
                          <div className="rounded-full bg-slate-200 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            {msg.message}
                          </div>
                        </div>
                      )
                    }
                    const isSender = msg.senderRole === (isRecruiter ? 'recruiter' : 'user')
                    const counterpartSeenAt = isRecruiter ? conversation?.user_seen_at : conversation?.recruiter_seen_at
                    const counterpartLastSeenId = isRecruiter
                      ? Number(conversation?.user_last_seen_message_id || 0)
                      : Number(conversation?.recruiter_last_seen_message_id || 0)
                    const showSeenAt = isSender && counterpartLastSeenId && Number(msg.id) === counterpartLastSeenId && counterpartSeenAt
                    const statusLabel = isSender
                      ? (showSeenAt
                        ? `Seen at ${formatSeenTime(counterpartSeenAt)}`
                        : (msg.readStatus === 'sent' ? 'Sent' : (msg.readStatus === 'read' ? 'Seen' : 'Delivered')))
                      : ''
                    return (
                      <div key={msg.id} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`relative max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                            isSender
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="whitespace-pre-line">{msg.message}</p>
                            <button
                              onClick={() => handlePinMessage(msg.id, !msg.isPinned)}
                              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                isSender
                                  ? 'bg-white/20 text-white'
                                  : 'bg-white text-slate-600'
                              }`}
                            >
                              {msg.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                          </div>
                          {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {msg.attachments.map((attachment) => {
                                const href = attachment.filePath ? buildFileUrl(attachment.filePath) : ''
                                const classes = `block rounded-lg px-3 py-2 text-xs font-semibold ${
                                  isSender ? 'bg-indigo-500 text-white' : 'bg-white text-slate-700'
                                }`
                                if (!href) {
                                  return (
                                    <span key={`${msg.id}-${attachment.fileName}`} className={classes}>
                                      {attachment.fileName}
                                    </span>
                                  )
                                }
                                return (
                                  <a
                                    key={`${msg.id}-${attachment.id || attachment.filePath}`}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={classes}
                                  >
                                    {attachment.fileName}
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          <p className={`mt-2 text-[11px] ${isSender ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {formatTimestamp(msg.createdAt)} {statusLabel ? `-?- ${statusLabel}` : ''}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-6 py-5 space-y-4">
              {isRecruiter && (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    Quick Replies
                  </label>
                  <select
                    onChange={(event) => {
                      const value = event.target.value
                      if (value) handleQuickReply(value)
                      event.target.selectedIndex = 0
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700"
                  >
                    <option value="">Choose a template</option>
                    {recruiterQuickReplies.map((reply) => (
                      <option key={reply.label} value={reply.value}>{reply.label}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <textarea
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Type your message..."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !messageText.trim()}
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                  Attach files
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={handleAttachmentChange}
                    className="text-xs text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </label>
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <button
                        key={`${file.name}-${index}`}
                        onClick={() => removeAttachment(index)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600"
                      >
                        {file.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Job Context</p>
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{jobContext.title}</h2>
                <p className="text-sm text-slate-600">{jobContext.company}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  {jobContext.status}
                </p>
              </div>

              {isRecruiter && candidateProfile && (
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Candidate</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-900">{candidateProfile.name}</h3>
                    {candidateProfile.email && (
                      <p className="text-xs text-slate-500 break-all">{candidateProfile.email}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 space-y-2">
                    <p><span className="font-semibold text-slate-700">Experience:</span> {candidateProfile.experienceLabel}</p>
                    {candidateProfile.coreSkills && (
                      <p><span className="font-semibold text-slate-700">Skills:</span> {candidateProfile.coreSkills}</p>
                    )}
                  </div>
                  {candidateProfile.resumePath && (
                    <a
                      href={buildFileUrl(candidateProfile.resumePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700"
                    >
                      View Resume
                    </a>
                  )}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleRecruiterAction('shortlist')}
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleQuickReply('We would like to schedule an interview. Please share your availability.')}
                      className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
                    >
                      Schedule Interview
                    </button>
                    <button
                      onClick={() => handleRecruiterAction('reject')}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600"
                    >
                      Reject
                    </button>
                  </div>
                  {actionError && (
                    <p className="text-xs text-rose-600">{actionError}</p>
                  )}
                </div>
              )}

              {isRecruiter && (
                <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Internal Notes</p>
                  <textarea
                    defaultValue={conversation?.recruiter_notes || ''}
                    onBlur={(event) => handleSaveNotes(event.target.value)}
                    rows={4}
                    className="mt-3 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
                    placeholder="Notes only visible to recruiters..."
                  />
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
    </>
  )
}




