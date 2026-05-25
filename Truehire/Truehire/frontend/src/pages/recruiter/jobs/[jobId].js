import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import apiService from '../../../utils/api'

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value === null || value === undefined) return []

  const text = String(value).trim()
  if (!text) return []

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed.filter(Boolean)
  } catch (_error) {}

  return text.split(/\r?\n|,|;/).map((item) => item.trim()).filter(Boolean)
}

const formatDateTime = (value) => {
  if (!value) return 'Not set'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Not set'
  return date.toLocaleString()
}

const displayValue = (value, fallback = 'Not provided') => {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'string' && value.trim() === '') return fallback
  return value
}

const getMatchStatus = (application) => (
  String(application?.matchStatus || application?.match_status || 'MATCHED').toUpperCase() === 'NOT_MATCHED'
    ? 'NOT_MATCHED'
    : 'MATCHED'
)

const normalizeApplication = (application = {}) => ({
  ...application,
  applicationId: application.applicationId || application.id,
  jobId: application.jobId || application.job_id,
  candidateName: application.candidateName || application.name || 'Candidate',
  candidateEmail: application.candidateEmail || application.email || '',
  appliedAt: application.appliedAt || application.applied_at || null,
  matchScore: application.matchScore ?? application.match_score ?? null,
  matchStatus: application.matchStatus || application.match_status || 'MATCHED',
})

export default function RecruiterJobDetailsPage() {
  const router = useRouter()
  const { jobId } = router.query
  const [job, setJob] = useState(null)
  const [applications, setApplications] = useState([])
  const [candidateFilter, setCandidateFilter] = useState('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!jobId) return

    const loadJobDetails = async () => {
      const token = apiService.getToken()
      const user = apiService.getUserData()
      const role = String(user?.role || '').toLowerCase()

      if (!token || (role !== 'recruiter' && role !== 'sub-recruiter')) {
        router.push('/login')
        return
      }

      try {
        setLoading(true)
        setError('')
        const [jobResponse, applicationsResponse] = await Promise.all([
          apiService.request(`/jobs/${jobId}`, { returnErrorObject: true }),
          apiService.request('/recruiters/applications', { returnErrorObject: true }),
        ])

        if (jobResponse?.error || !jobResponse?.job) {
          throw new Error(jobResponse?.message || jobResponse?.error || 'Unable to load job details.')
        }

        setJob(jobResponse.job)
        const rows = Array.isArray(applicationsResponse?.applications)
          ? applicationsResponse.applications.map(normalizeApplication)
          : []
        setApplications(rows.filter((application) => String(application.jobId) === String(jobId)))
      } catch (loadError) {
        setError(loadError?.message || 'Failed to load job details.')
      } finally {
        setLoading(false)
      }
    }

    loadJobDetails()
  }, [jobId, router])

  const candidateCounts = useMemo(() => applications.reduce((counts, application) => {
    counts.ALL += 1
    counts[getMatchStatus(application)] += 1
    return counts
  }, { ALL: 0, MATCHED: 0, NOT_MATCHED: 0 }), [applications])

  const visibleApplications = useMemo(() => applications.filter((application) => (
    candidateFilter === 'ALL' || getMatchStatus(application) === candidateFilter
  )), [applications, candidateFilter])

  const skills = toList(job?.skills_required)

  return (
    <>
      <Head>
        <title>{job?.title ? `${job.title} - Job Details` : 'Job Details'} - TrueHire</title>
      </Head>
      <Header />
      <main className="min-h-screen bg-[#f6f8f4] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => router.push('/manage-jobs')}
            className="mb-6 inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
          >
            Back to Manage Jobs
          </button>

          {loading ? (
            <div className="rounded-2xl border border-white/70 bg-white/80 p-10 text-center text-slate-600 shadow-sm">
              Loading job details...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-10 text-center text-rose-700 shadow-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-2xl border border-white/70 bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-indigo-600">Recruiter Job Details</p>
                    <h1 className="mt-2 text-3xl font-bold text-slate-950">{job.title}</h1>
                    <p className="mt-2 text-sm text-slate-600">{displayValue(job.company, 'Company')} - {displayValue(job.location, 'Location not set')}</p>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    {displayValue(job.status, 'Status unknown')}
                  </span>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Employment Type</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(job.employment_type)}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Experience Level</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(job.experience_level)}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Minimum Experience</p>
                  <p className="mt-1 font-semibold text-slate-900">{job.min_experience_years != null ? `${job.min_experience_years} years` : 'Not specified'}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Match Threshold</p>
                  <p className="mt-1 font-semibold text-slate-900">{job.match_percentage ?? 0}%</p>
                </div>
              </section>

              <section className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Description</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{displayValue(job.description)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Requirements</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{displayValue(job.requirements)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Benefits</h2>
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{displayValue(job.benefits)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-900">Required Skills</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.length ? skills.map((skill) => (
                      <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-100">
                        {skill}
                      </span>
                    )) : (
                      <p className="text-sm text-slate-600">Not provided</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Salary Min</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(job.salary_min)}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Salary Max</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(job.salary_max)}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Currency</p>
                  <p className="mt-1 font-semibold text-slate-900">{displayValue(job.salary_currency || 'INR')}</p>
                </div>
                <div className="rounded-xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-xs text-slate-500">Application Deadline</p>
                  <p className="mt-1 font-semibold text-slate-900">{formatDateTime(job.application_deadline)}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-white/70 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Candidates</h2>
                    <p className="mt-1 text-sm text-slate-600">Candidate categories are based on resume match score.</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  {[
                    { value: 'ALL', label: 'All Candidates', count: candidateCounts.ALL },
                    { value: 'MATCHED', label: 'Matched Candidates', count: candidateCounts.MATCHED },
                    { value: 'NOT_MATCHED', label: 'Unmatched Candidates', count: candidateCounts.NOT_MATCHED },
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setCandidateFilter(tab.value)}
                      className={`inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-xs font-semibold transition ${
                        candidateFilter === tab.value
                          ? 'bg-slate-950 text-white'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-950'
                      }`}
                    >
                      {tab.label}
                      <span className={`rounded-full px-2 py-0.5 ${candidateFilter === tab.value ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {visibleApplications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No candidates in this category yet.
                    </div>
                  ) : visibleApplications.map((application) => {
                    const isMatched = getMatchStatus(application) === 'MATCHED'
                    return (
                      <div key={application.applicationId} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{application.candidateName}</p>
                            <p className="mt-1 text-xs text-slate-500">{application.candidateEmail || 'Email not provided'}</p>
                            <p className="mt-1 text-xs text-slate-500">Applied {formatDateTime(application.appliedAt)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isMatched ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {application.matchScore ?? 'N/A'}% match
                            </span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${isMatched ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'}`}>
                              {isMatched ? 'Matched' : 'Unmatched'}
                            </span>
                            <button
                              type="button"
                              onClick={() => router.push(`/review-applications?applicationId=${encodeURIComponent(application.applicationId)}`)}
                              className="inline-flex min-h-9 items-center rounded-full bg-slate-950 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
