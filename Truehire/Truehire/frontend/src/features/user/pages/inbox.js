import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'

const formatTimestamp = (value) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString()
}

const groupConversations = (conversations = []) => {
  const groups = []
  const map = new Map()
  conversations.forEach((conversation) => {
    const key = String(conversation.jobId || 'unknown')
    if (!map.has(key)) {
      const group = {
        jobId: conversation.jobId || null,
        jobTitle: conversation.jobTitle || 'Job',
        jobCompany: conversation.jobCompany || 'Company',
        jobLocation: conversation.jobLocation || null,
        conversations: []
      }
      map.set(key, group)
      groups.push(group)
    }
    map.get(key).conversations.push(conversation)
  })
  return groups
}

export default function Inbox() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState([])
  const [totalUnread, setTotalUnread] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [roleHint, setRoleHint] = useState(null)
  const [tokenReady, setTokenReady] = useState(false)

  const resolvedRole = user?.role || roleHint
  const isRecruiter = resolvedRole === 'recruiter' || resolvedRole === 'sub-recruiter'

  const grouped = useMemo(() => groupConversations(conversations), [conversations])

  useEffect(() => {
    if (loading) return
    const storedRole = apiService.getUserData()?.role || null
    setRoleHint(storedRole)
    const token = apiService.getToken()
    setTokenReady(Boolean(token))
    if (!user && !token) {
      router.push(storedRole === 'recruiter' || storedRole === 'sub-recruiter' ? '/login' : '/login')
      return
    }
    fetchConversations()
  }, [loading, user])

  const fetchConversations = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiService.request('/messages/conversations', { returnErrorObject: true })
      if (response?.error) {
        throw response
      }
      setConversations(response?.conversations || [])
      setTotalUnread(response?.totalUnread || 0)
    } catch (err) {
      console.error('Failed to load conversations:', err)
      setError(err?.message || err?.error || 'Unable to load conversations.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Inbox - TrueHire</title>
      </Head>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ecfeff_100%)] text-slate-900">
        <div className="relative overflow-hidden border-b border-white/70">
          <div className="pointer-events-none absolute right-[-120px] top-[-100px] h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-130px] left-[-80px] h-80 w-80 rounded-full bg-indigo-200/50 blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
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

            <section className="rounded-[30px] border border-white/70 bg-white/75 p-6 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                    Inbox
                  </div>
                  <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Your conversations</h1>
                  <p className="mt-2 text-sm text-slate-600">
                    {isRecruiter ? 'Messages with candidates per application.' : 'Messages with recruiters per application.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                    Unread
                    <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-cyan-700">{totalUnread}</span>
                  </span>
                  <button
                    type="button"
                    onClick={fetchConversations}
                    className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="rounded-[28px] border border-white/75 bg-white/80 p-12 text-center text-slate-600 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600" />
              <p className="text-sm font-semibold">Loading conversations...</p>
            </div>
          ) : error ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-center font-semibold text-rose-600">
              {error}
            </div>
          ) : conversations.length === 0 ? (
            <div className="rounded-[28px] border border-white/75 bg-white/80 p-12 text-center text-slate-600 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M21 12a8 8 0 0 1-8 8H7l-4 3v-7a8 8 0 1 1 18-4Z" />
                </svg>
              </div>
              <p className="mt-5 text-xl font-black text-slate-950">No conversations yet</p>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Application messages will appear here when a conversation starts.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {grouped.map((group) => (
                <section
                  key={group.jobId || group.jobTitle}
                  className="overflow-hidden rounded-[28px] border border-white/75 bg-white/85 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                >
                  <div className="flex flex-col gap-2 border-b border-slate-200/80 bg-white/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-black text-slate-950">{group.jobTitle}</h2>
                      <p className="text-sm text-slate-600">
                        {group.jobCompany}
                        {group.jobLocation ? ` - ${group.jobLocation}` : ''}
                      </p>
                    </div>
                    <span className="w-fit rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      {group.conversations.length} conversation{group.conversations.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-white/70">
                    {group.conversations.map((conversation) => {
                      const counterpartName = isRecruiter
                        ? conversation.userName || 'Candidate'
                        : conversation.recruiterName || 'Recruiter'
                      const jobTitle = conversation.jobTitle || 'Job'
                      const company = conversation.jobCompany || 'Company'
                      const preview = conversation.lastMessage || 'No messages yet.'
                      const applicationStatus = conversation.applicationStatus
                      return (
                        <button
                          key={conversation.applicationId}
                          type="button"
                          onClick={() => router.push(`/messages/${conversation.applicationId}`)}
                          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition hover:bg-cyan-50/55"
                        >
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-black text-slate-950">
                              {jobTitle} - {counterpartName}
                            </p>
                            <p className="text-xs text-slate-600">
                              {company}
                            </p>
                            {applicationStatus && isRecruiter && (
                              <p className="text-[11px] uppercase tracking-wide text-slate-500">
                                {applicationStatus}
                              </p>
                            )}
                            <p className="max-w-[520px] truncate text-xs text-slate-600">
                              {preview}
                            </p>
                            {conversation.lastMessageAt && (
                              <p className="text-xs text-slate-400">{formatTimestamp(conversation.lastMessageAt)}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {conversation.unreadCount > 0 && (
                              <span className="rounded-full bg-cyan-600 px-2.5 py-1 text-[11px] font-bold text-white">
                                {conversation.unreadCount}
                              </span>
                            )}
                            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">Open</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
