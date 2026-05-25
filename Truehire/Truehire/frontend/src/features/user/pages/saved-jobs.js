import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../services/api'

const formatSalary = (job) => {
  if (!job.min_salary && !job.max_salary) return 'Salary undisclosed'
  const currency = job.salary_currency || 'INR'
  if (job.min_salary && job.max_salary) return `${currency} ${job.min_salary.toLocaleString()} - ${job.max_salary.toLocaleString()}`
  if (job.min_salary) return `Starting from ${currency} ${job.min_salary.toLocaleString()}`
  return `Up to ${currency} ${job.max_salary.toLocaleString()}`
}

const getExperienceDisplay = (level) => {
  const map = { Entry: 'Entry Level', Mid: 'Mid Level', Senior: 'Senior Level', Executive: 'Executive' }
  return map[level] || level || 'Not specified'
}

const getDeadlineLabel = (value) => {
  if (!value) return 'No deadline listed'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No deadline listed'
  return `Apply by ${date.toLocaleDateString()}`
}

const isRecentlySaved = (job) => {
  const value = job.savedAt || job.createdAt || job.updatedAt
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000
}

const getJobTone = (job) => {
  if (isRecentlySaved(job)) return 'bg-blue-500'
  if ((job.experience_level || '').toLowerCase() === 'senior') return 'bg-violet-500'
  if ((job.employment_type || '').toLowerCase().includes('remote')) return 'bg-emerald-500'
  return 'bg-slate-400'
}

export default function SavedJobs() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [savedJobs, setSavedJobs] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState(null)
  const BOOKMARK_IDS_KEY = 'bookmarkedJobs'
  const BOOKMARK_ITEMS_KEY = 'bookmarkedJobItems'
  const normalizeBookmarkIds = (value) => {
    if (!Array.isArray(value)) return []
    return value
      .map((entry) => {
        if (entry && typeof entry === 'object') return String(entry.id ?? entry.jobId ?? '')
        return String(entry)
      })
      .filter((id) => id && id !== 'undefined' && id !== 'null')
  }

  useEffect(() => {
    const token = apiService.getToken()
    const hasSessionUser = Boolean(apiService.getUserData())
    const canAccessSaved = Boolean(user || token || hasSessionUser)

    if (!loading && !canAccessSaved) {
      router.push('/login')
      return
    }

    if (!loading && canAccessSaved) loadSaved()
  }, [loading, router, user])

  const loadSaved = async () => {
    try {
      setIsLoading(true)
      const saved = localStorage.getItem(BOOKMARK_IDS_KEY) || '[]'
      const bookmarkedIds = normalizeBookmarkIds(JSON.parse(saved))
      setBookmarks(bookmarkedIds)

      const savedItemsRaw = localStorage.getItem(BOOKMARK_ITEMS_KEY) || '[]'
      let savedItems = []
      try {
        savedItems = JSON.parse(savedItemsRaw)
        if (!Array.isArray(savedItems)) savedItems = []
      } catch (error) {
        savedItems = []
      }

      const savedItemsByIds = savedItems.filter((job) => bookmarkedIds.includes(String(job?.id)))
      if (savedItemsByIds.length > 0) {
        setSavedJobs(savedItemsByIds)
      } else {
        setSavedJobs([])
      }

      const response = await apiService.request('/jobs?limit=1000', { returnErrorObject: true })
      if (response?.error) {
        return
      }
      const jobs = response.jobs || []
      const fresh = jobs.filter((job) => !job.application_deadline || new Date(job.application_deadline) > new Date())
      const selected = fresh.filter((job) => bookmarkedIds.includes(String(job.id)))
      // Keep locally saved bookmarked snapshots when API has no matching jobs.
      // This avoids wiping saved jobs due to transient API/visibility mismatches.
      if (selected.length > 0 || bookmarkedIds.length === 0) {
        setSavedJobs(selected)
        localStorage.setItem(BOOKMARK_ITEMS_KEY, JSON.stringify(selected))
      } else if (savedItemsByIds.length > 0) {
        setSavedJobs(savedItemsByIds)
      } else {
        const detailResults = await Promise.all(
          bookmarkedIds.map(async (id) => {
            try {
              const detail = await apiService.request(`/jobs/${id}`, { returnErrorObject: true })
              return detail?.job || null
            } catch (error) {
              return null
            }
          })
        )
        const detailedJobs = detailResults.filter(Boolean)
        setSavedJobs(detailedJobs)
        localStorage.setItem(BOOKMARK_ITEMS_KEY, JSON.stringify(detailedJobs))
      }
    } catch (error) {
      console.error('Failed to load saved jobs', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemove = (jobId) => {
    const normalizedId = String(jobId)
    const updated = savedJobs.filter((job) => String(job.id) !== normalizedId)
    const updatedBookmarks = bookmarks.filter((id) => id !== normalizedId)
    setSavedJobs(updated)
    setBookmarks(updatedBookmarks)
    localStorage.setItem(BOOKMARK_IDS_KEY, JSON.stringify(updatedBookmarks))
    localStorage.setItem(
      BOOKMARK_ITEMS_KEY,
      JSON.stringify(updated.filter((job) => updatedBookmarks.includes(String(job.id))))
    )
  }

  const openDetails = (job) => {
    setSelectedJob(job)
  }

  const closeDetails = () => {
    setSelectedJob(null)
  }

  const filtered = savedJobs
  const remoteJobs = savedJobs.filter((job) =>
    `${job.location || ''} ${job.employment_type || ''}`.toLowerCase().includes('remote')
  ).length
  const recentlySavedJobs = savedJobs.filter(isRecentlySaved).length
  const summaryCards = [
    { label: 'Saved jobs', value: savedJobs.length, caption: 'Ready to review', accent: 'from-cyan-500 to-sky-500', surface: 'bg-cyan-50 text-cyan-700' },
    { label: 'Active bookmarks', value: bookmarks.length, caption: 'Stored shortlist', accent: 'from-indigo-500 to-blue-500', surface: 'bg-indigo-50 text-indigo-700' },
    { label: 'Remote friendly', value: remoteJobs, caption: 'Flexible options', accent: 'from-emerald-500 to-teal-500', surface: 'bg-emerald-50 text-emerald-700' },
    { label: 'Recently saved', value: recentlySavedJobs, caption: 'Added this week', accent: 'from-amber-500 to-orange-500', surface: 'bg-amber-50 text-amber-700' }
  ]

  return (
    <>
      <Head>
        <title>Saved Jobs | TrueHire</title>
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
                  Saved Jobs
                </div>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  My saved jobs
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Keep promising roles organized, compare the essentials, and jump back into applications when you are ready.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={loadSaved}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                >
                  Refresh
                </button>
                <button
                  onClick={() => router.push('/jobs')}
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/80 bg-white px-5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:text-cyan-700"
                >
                  Browse jobs
                </button>
                <button
                  onClick={() => router.push('/applications')}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-bold text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-cyan-800"
                >
                  Applications
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
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
                <h2 className="text-xl font-black text-slate-950">Saved shortlist</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Showing {filtered.length} saved {filtered.length === 1 ? 'role' : 'roles'} with key details and quick actions.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center px-6 py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-cyan-600"></div>
                  <p className="text-sm font-medium text-slate-600">Loading saved jobs...</p>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700 shadow-sm">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-4-7 4V5z" />
                  </svg>
                </div>
                <p className="mt-5 text-xl font-semibold text-slate-950">No saved jobs yet</p>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">Bookmark jobs you like and they will appear here.</p>
                <button
                  onClick={() => router.push('/jobs')}
                  className="mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Browse Jobs
                </button>
              </div>
            ) : (
              <div className="space-y-4 bg-slate-50/80 p-4 sm:p-5">
                {filtered.map((job) => (
                  <article
                    key={job.id}
                    className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_55px_-38px_rgba(15,23,42,0.55)]"
                  >
                    <div className={`absolute inset-y-0 left-0 w-1.5 ${getJobTone(job)}`} />
                    <div className="grid gap-5 p-5 pl-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.95fr)_auto] xl:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Saved Role</p>
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
                            {job.status || 'Saved'}
                          </span>
                          {isRecentlySaved(job) && (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                              New
                            </span>
                          )}
                        </div>
                        <h3 className="mt-3 truncate text-xl font-semibold text-slate-950">{job.title}</h3>
                        <p className="mt-1 text-sm font-medium text-slate-600">{job.company || 'Company not set'}</p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">{job.location || 'Remote'}</span>
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">{formatSalary(job)}</span>
                          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1">{getExperienceDisplay(job.experience_level)}</span>
                        </div>
                      </div>

                        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Apply plan</p>
                            <p className="mt-1 text-sm font-semibold text-slate-900">{getDeadlineLabel(job.application_deadline)}</p>
                          </div>
                          <p className="text-xs font-medium text-slate-500">{job.employment_type || 'Role type not set'}</p>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {['Saved', 'Review', 'Apply'].map((label, index) => (
                            <div key={label}>
                              <div className={`h-1.5 rounded-full ${index === 0 ? 'bg-cyan-600' : 'bg-slate-200'}`} />
                              <p className={`mt-2 text-[11px] font-medium ${index === 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                                {label}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 xl:min-w-[210px] xl:flex-col">
                        <button
                          onClick={() => openDetails(job)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-xs font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-cyan-800 xl:w-full"
                        >
                          View details
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
                          </svg>
                        </button>
                        <button
                          onClick={() => router.push(`/jobs/${job.id}/apply`)}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-cyan-200 bg-cyan-50 px-4 text-xs font-bold uppercase tracking-wide text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100 xl:w-full"
                        >
                          Apply
                        </button>
                        <button
                          onClick={() => handleRemove(job.id)}
                          className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-xs font-bold uppercase tracking-wide text-slate-700 transition hover:border-red-200 hover:text-red-600 xl:w-full"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 px-4 py-10 backdrop-blur-sm">
          <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white text-slate-900 shadow-[0_35px_90px_rgba(2,6,23,0.35)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5 sm:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Saved Job</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-950">{selectedJob.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{selectedJob.company}</p>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Close"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
            <div className="space-y-6 px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{selectedJob.location || 'Remote'}</span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{formatSalary(selectedJob)}</span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{getExperienceDisplay(selectedJob.experience_level)}</span>
                {selectedJob.employment_type && (
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1">{selectedJob.employment_type}</span>
                )}
              </div>
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="space-y-5">
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Overview</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {selectedJob.description || 'No description available for this role.'}
                    </p>
                  </section>
                  <section>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Requirements</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {selectedJob.requirements || 'No requirements listed for this role.'}
                    </p>
                  </section>
                </div>
                <div className="space-y-5">
                  <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Benefits</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                      {selectedJob.benefits || 'Benefits not specified for this role.'}
                    </p>
                  </section>
                  <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Overview</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p><span className="font-semibold text-slate-700">Status:</span> {selectedJob.status || 'Saved'}</p>
                      <p><span className="font-semibold text-slate-700">Experience:</span> {getExperienceDisplay(selectedJob.experience_level)}</p>
                      <p><span className="font-semibold text-slate-700">Salary:</span> {formatSalary(selectedJob)}</p>
                      <p><span className="font-semibold text-slate-700">Deadline:</span> {getDeadlineLabel(selectedJob.application_deadline)}</p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:items-center sm:justify-end sm:px-8">
              <button
                type="button"
                onClick={() => router.push(`/jobs/${selectedJob.id}/apply`)}
                className="rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700"
              >
                Apply Now
              </button>
              <button
                type="button"
                onClick={() => {
                  handleRemove(selectedJob.id)
                  closeDetails()
                }}
                className="rounded-lg border border-red-100 bg-white px-5 py-2 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:border-red-200 hover:bg-red-50"
              >
                Remove
              </button>
              <button
                type="button"
                onClick={closeDetails}
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







