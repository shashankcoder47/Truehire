import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import apiService from '../../../utils/api'

export default function ApplyJob() {
  const router = useRouter()
  const { id } = router.query
  const viewedJobIdsRef = useRef(new Set())

  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [profileEligibilityChecked, setProfileEligibilityChecked] = useState(false)

  const [personal, setPersonal] = useState({
    name: '',
    email: '',
    phone: '',
    location: ''
  })

  const [professional, setProfessional] = useState({
    experience_level: '',
    current_salary: '',
    expected_salary: '',
    notice_period: ''
  })

  const [links, setLinks] = useState({
    linkedin: '',
    portfolio: ''
  })

  // extras WITHOUT cover letter
  const [extras, setExtras] = useState({
    additionalComments: ''
  })

  const [resumeFile, setResumeFile] = useState(null)
  const [resumeName, setResumeName] = useState('')
  const [profileResumePath, setProfileResumePath] = useState('')
  const [resumeError, setResumeError] = useState(null)

  const [fieldErrors, setFieldErrors] = useState({})
  const [showLimitReachedPopup, setShowLimitReachedPopup] = useState(false)
  const fileInputRef = useRef(null)
  const dropRef = useRef(null)

  // regexes
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[0-9+\-\s]{7,20}$/

  const hasValue = (value) => {
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    return value !== null && value !== undefined
  }

  const parseList = (value, fallback = []) => {
    if (!value) return fallback
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    }
    return fallback
  }

  const parseJsonList = (value, fallback = []) => {
    if (!value) return fallback
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : fallback
      } catch (_error) {
        return fallback
      }
    }
    return fallback
  }

  const parseLanguageList = (value, fallback = []) => {
    if (!value) return fallback
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (trimmed.startsWith('[')) {
        return parseJsonList(trimmed, fallback)
      }
      return parseList(trimmed, fallback)
    }
    if (Array.isArray(value)) return value
    return fallback
  }

  const toNumberOrZero = (value) => {
    if (value === null || value === undefined || value === '') return 0
    const num = Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const normalizeProfileForCompletion = (sourceUser = {}) => ({
    name: sourceUser.name || '',
    email: sourceUser.email || '',
    phone: sourceUser.contact_number || sourceUser.phone || '',
    location: sourceUser.current_location || sourceUser.location || '',
    bio: sourceUser.professional_summary || sourceUser.bio || '',
    skills: parseList(sourceUser.core_skills, sourceUser.skills || []),
    languagesKnown: parseLanguageList(
      sourceUser.languages_known || sourceUser.languagesKnown || [],
      sourceUser.languagesKnown || []
    ),
    projects: parseJsonList(sourceUser.projects, sourceUser.projects || []),
    certifications: parseJsonList(sourceUser.certifications, sourceUser.certifications || []),
    currentSalary: toNumberOrZero(sourceUser.current_salary ?? sourceUser.currentSalary ?? ''),
    expectedSalary: toNumberOrZero(sourceUser.expected_salary ?? sourceUser.expectedSalary ?? ''),
    softSkills: parseList(sourceUser.soft_skills, sourceUser.softSkills || []),
    hobbiesInterests: sourceUser.hobbies_interests || sourceUser.hobbiesInterests || '',
    relocated: sourceUser.relocated,
    profilePhoto: sourceUser.profile_photo || sourceUser.profilePhoto || null,
  })

  const calculateProfileCompletion = (profile = {}) => {
    const safeProfile = profile || {}
    const sections = [
      {
        weight: 20,
        fields: [
          safeProfile.name,
          safeProfile.email,
          safeProfile.contact_number || safeProfile.phone,
          safeProfile.current_location || safeProfile.location,
          safeProfile.profile_photo || safeProfile.profilePhoto,
        ],
      },
      {
        weight: 20,
        fields: [
          safeProfile.professional_summary || safeProfile.summary || safeProfile.bio,
          Array.isArray(safeProfile.skills) ? safeProfile.skills : parseList(safeProfile.core_skills, safeProfile.skills || []),
          Array.isArray(safeProfile.languagesKnown)
            ? safeProfile.languagesKnown
            : parseLanguageList(safeProfile.languages_known, safeProfile.languagesKnown || []),
        ],
      },
      {
        weight: 20,
        fields: [
          Array.isArray(safeProfile.projects) ? safeProfile.projects : parseJsonList(safeProfile.projects, safeProfile.projects || []),
          Array.isArray(safeProfile.certifications)
            ? safeProfile.certifications
            : parseJsonList(safeProfile.certifications, safeProfile.certifications || []),
        ],
      },
      {
        weight: 10,
        fields: [safeProfile.hobbies_interests || safeProfile.hobbiesInterests],
      },
      {
        weight: 10,
        fields: [safeProfile.relocated],
      },
      {
        weight: 20,
        fields: [
          safeProfile.current_salary ?? safeProfile.currentSalary,
          safeProfile.expected_salary ?? safeProfile.expectedSalary,
          Array.isArray(safeProfile.softSkills) ? safeProfile.softSkills : parseList(safeProfile.soft_skills, safeProfile.softSkills || []),
        ],
      },
    ]

    let total = 0
    sections.forEach((section) => {
      const filled = section.fields.filter(hasValue).length
      total += (filled / section.fields.length) * section.weight
    })

    return Math.round(Math.max(0, Math.min(100, total)))
  }

  useEffect(() => {
    if (!router.isReady || !id) return

    const token = apiService.getToken()
    const user = apiService.getUserData()
    const role = String(user?.role || '').toLowerCase()

    if (!token || role !== 'user') {
      router.replace(`/login?next=${encodeURIComponent(`/jobs/${id}/apply`)}`)
    }
  }, [router, id])

  // load saved personal info
  useEffect(() => {
    try {
      const savedName = localStorage.getItem('profile_name')
      const savedEmail = localStorage.getItem('profile_email')
      const savedPhone = localStorage.getItem('profile_phone')
      const savedLocation = localStorage.getItem('profile_location')
      setPersonal(prev => ({
        ...prev,
        name: savedName || prev.name,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone,
        location: savedLocation || prev.location
      }))
    } catch (err) {
      // ignore
    }
  }, [])

  // fetch job details
  useEffect(() => {
    if (!id) return
    fetchJob()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const currentUser = apiService.getUserData()
      if (String(currentUser?.role || '').toLowerCase() !== 'user') {
        return 0
      }

      const response = await apiService.getProfile()
      console.log('User API response:', response)
      setProfileResumePath(response?.user?.resume_file || response?.user?.resumeFile || '')
      const serverPct = Number(
        response?.user?.profile_completeness_percentage ??
        response?.user?.profileCompleteness ??
        response?.user?.profile_completeness ??
        0
      ) || 0
      const storedPct = Number(
        currentUser?.profileCompleteness ??
        currentUser?.profile_completeness_percentage ??
        currentUser?.profile_completeness ??
        0
      ) || 0
      const storedFallbackPct = calculateProfileCompletion(normalizeProfileForCompletion(currentUser || {}))
      const fallbackPct = calculateProfileCompletion(normalizeProfileForCompletion(response?.user || {}))
      const isStoredProfileComplete = Boolean(currentUser?.profile_complete)
      const pct = Math.max(
        serverPct,
        storedPct,
        storedFallbackPct,
        fallbackPct,
        isStoredProfileComplete ? 80 : 0
      )
      console.log('Profile %:', pct)
      setProfileCompletion(Math.max(0, Math.min(100, pct)))
      return pct
    } catch (error) {
      console.error('Failed to fetch latest profile:', error)
      setProfileCompletion(0)
      return 0
    } finally {
      setProfileEligibilityChecked(true)
    }
  }

  const getOrCreateDeviceFingerprint = () => {
    if (typeof window === 'undefined') return null
    const existing = localStorage.getItem('device_fingerprint')
    if (existing) return existing
    const fingerprint =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('device_fingerprint', fingerprint)
    return fingerprint
  }

  useEffect(() => {
    if (!id) return
    const normalizedJobId = String(id)
    if (viewedJobIdsRef.current.has(normalizedJobId)) return
    viewedJobIdsRef.current.add(normalizedJobId)

    const recordView = async () => {
      try {
        const fingerprint = getOrCreateDeviceFingerprint()
        let shouldUseUserAuth = false
        if (typeof window !== 'undefined') {
          try {
            const rawUser = localStorage.getItem('user')
            const user = rawUser ? JSON.parse(rawUser) : null
            shouldUseUserAuth = String(user?.role || '').toLowerCase() === 'user'
          } catch (_) {}
        }
        await apiService.request(`/jobs/${id}/view`, {
          method: 'POST',
          headers: fingerprint ? { 'x-device-fingerprint': fingerprint } : {},
          skipAuth: !shouldUseUserAuth
        })
      } catch (error) {
        console.log('View tracking failed on apply page:', error)
      }
    }

    recordView()
  }, [id])

  const fetchJob = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiService.request(`/jobs/${id}`)
      const resolvedJob = res?.job || res?.data || null
      if (!resolvedJob) throw new Error('Job not found')
      setJob(resolvedJob)
    } catch (err) {
      console.error('fetchJob:', err)
      setError('Unable to load job details. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Drag & drop UX for resume
  useEffect(() => {
    const el = dropRef.current
    if (!el) return
    const onDragOver = e => {
      e.preventDefault()
      el.classList.add('ring', 'ring-2', 'ring-indigo-300', 'bg-indigo-50/30')
    }
    const onDragLeave = e => {
      e.preventDefault()
      el.classList.remove('ring', 'ring-2', 'ring-indigo-300', 'bg-indigo-50/30')
    }
    const onDrop = e => {
      e.preventDefault()
      el.classList.remove('ring', 'ring-2', 'ring-indigo-300', 'bg-indigo-50/30')
      const file = e.dataTransfer.files && e.dataTransfer.files[0]
      if (file) handleFile(file)
    }
    el.addEventListener('dragover', onDragOver)
    el.addEventListener('dragleave', onDragLeave)
    el.addEventListener('drop', onDrop)
    return () => {
      el.removeEventListener('dragover', onDragOver)
      el.removeEventListener('dragleave', onDragLeave)
      el.removeEventListener('drop', onDrop)
    }
  }, [dropRef.current])

  // helpers
  const updatePersonal = (k, v) => {
    setPersonal(prev => ({ ...prev, [k]: v }))
    setFieldErrors(prev => ({ ...prev, [k]: null }))
    setError(null)
  }
  const updateProfessional = (k, v) => {
    setProfessional(prev => ({ ...prev, [k]: v }))
    setFieldErrors(prev => ({ ...prev, [k]: null }))
    setError(null)
  }
  const updateLinks = (k, v) => {
    setLinks(prev => ({ ...prev, [k]: v }))
    setFieldErrors(prev => ({ ...prev, [k]: null }))
    setError(null)
  }
  const updateExtras = (k, v) => {
    setExtras(prev => ({ ...prev, [k]: v }))
    setFieldErrors(prev => ({ ...prev, [k]: null }))
    setError(null)
  }

  // file handling
  const handleFile = (file) => {
    setResumeError(null)
    if (!file) return
    const maxSize = 5 * 1024 * 1024
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    if (!allowed.includes(file.type)) {
      setResumeError('Only PDF, DOC, DOCX files are allowed.')
      return
    }
    if (file.size > maxSize) {
      setResumeError('File too large — maximum 5MB allowed.')
      return
    }
    setResumeFile(file)
    setResumeName(file.name)
    setFieldErrors(prev => ({ ...prev, resume: null }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0]
    handleFile(file)
  }

  const removeResume = () => {
    setResumeFile(null)
    setResumeName('')
    setResumeError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // validation (note: no cover letter)
  const validateAll = () => {
    const errs = {}
    if (!personal.name.trim()) errs.name = 'Full name is required.'
    if (!emailRegex.test(personal.email.trim())) errs.email = 'Enter a valid email address.'
    if (personal.phone && !phoneRegex.test(personal.phone.trim())) errs.phone = 'Enter a valid phone number.'
    if (!professional.experience_level) errs.experience_level = 'Select experience level.'
    if (resumeError) errs.resume = resumeError
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  // submit
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const latestProfileCompletion = Number(await fetchUserProfile()) || 0

    if (latestProfileCompletion < 80) {
      const gateMessage = `Your profile is only ${latestProfileCompletion}% complete. Please complete your profile (minimum 80%) before applying for jobs`
      alert(gateMessage)
      setError(gateMessage)
      return
    }

    if (!validateAll()) {
      setError('Please fix the highlighted errors and try again.')
      return
    }

    setSubmitting(true)
    try {
      const payload = new FormData()
      // Personal
      payload.append('name', personal.name.trim())
      payload.append('email', personal.email.trim())
      payload.append('phone', personal.phone.trim() || '')
      payload.append('location', personal.location.trim() || '')

      // Professional
      payload.append('experience_level', professional.experience_level)
      if (professional.current_salary) payload.append('current_salary', professional.current_salary)
      if (professional.expected_salary) payload.append('expected_salary', professional.expected_salary)
      if (professional.notice_period) payload.append('notice_period', professional.notice_period)

      // Links
      if (links.linkedin) payload.append('linkedin', links.linkedin.trim())
      if (links.portfolio) payload.append('portfolio', links.portfolio.trim())

      // Extras — NO COVER LETTER
      if (extras.additionalComments) payload.append('additionalComments', extras.additionalComments.trim())

      // Resume
      if (resumeFile) payload.append('resume', resumeFile)

      // meta
      payload.append('applied_at', new Date().toISOString())

      // NOTE: utils/api.js baseURL already includes /api
      const res = await apiService.request(`/jobs/${id}/apply`, {
        method: 'POST',
        body: payload,
        returnErrorObject: true
      })

      if (res?.error) {
        const limitMessage = res?.details?.message || res?.error || ''
        if (typeof limitMessage === 'string' && limitMessage.includes('Application limit reached for this job')) {
          setShowLimitReachedPopup(true)
          setError(null)
          return
        }
        throw new Error(res?.details?.message || res?.error || 'Failed to submit application.')
      }

      if (!res || (!res.success && !res.application_id && !res.application && !res.data)) {
        throw new Error(res?.message || 'Failed to submit application.')
      }

      setSuccessMsg(res.message || 'Your application has been submitted successfully.')
      setSubmitted(true)

      // persist personal info
      try {
        localStorage.setItem('profile_name', personal.name.trim())
        localStorage.setItem('profile_email', personal.email.trim())
        if (personal.phone) localStorage.setItem('profile_phone', personal.phone.trim())
        if (personal.location) localStorage.setItem('profile_location', personal.location.trim())
      } catch (err) {}

    } catch (err) {
      console.error('submit:', err)
      const limitMessage = err?.details?.message || err?.message || ''
      if (typeof limitMessage === 'string' && limitMessage.includes('Application limit reached for this job')) {
        setShowLimitReachedPopup(true)
        setError(null)
        return
      }
      const details = typeof err?.details?.details === 'string' ? err.details.details : ''
      const message = err?.message || 'Failed to submit application. Please try again.'
      setError(details ? `${message}: ${details}` : message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <Head><title>Apply — TrueHire</title></Head>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin w-14 h-14 rounded-full border-4 border-slate-200 border-t-indigo-600 mx-auto mb-6" />
            <p className="text-slate-600 font-medium">Loading job details...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (submitted) {
    return (
      <>
        <Head><title>Application Submitted — TrueHire</title></Head>
        <Header />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center py-24 px-4">
          <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500"></div>
            <div className="p-10 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Received</h1>
              <p className="text-slate-600 mb-6">{successMsg} — we’ll contact shortlisted applicants for next steps.</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Link href="/jobs" className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold text-center">Browse Jobs</Link>
                <Link href={`/jobs/${id}`} className="px-4 py-3 rounded-xl border bg-white text-slate-700 text-center">View Job</Link>
                <Link href="/" className="px-4 py-3 rounded-xl bg-slate-100 text-slate-700 text-center">Home</Link>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // main UI (keeps the same layout you had)
  return (
    <>
      <Head>
        <title>Apply for {job?.title} — TrueHire</title>
        <meta name="description" content={`Apply for ${job?.title} at ${job?.company} on TrueHire`} />
      </Head>

      <Header />

      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef2ff_54%,#f8fafc_100%)] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero / top card */}
          <div className="mb-10 overflow-hidden rounded-[36px] border border-slate-200/70 bg-[linear-gradient(150deg,#0f172a_0%,#1d4ed8_42%,#4f46e5_100%)] shadow-[0_32px_90px_-44px_rgba(15,23,42,0.62)]">
            <div className="h-1.5 bg-gradient-to-r from-sky-300 via-white to-emerald-300"></div>
            <div className="p-8 md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-start gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/15 bg-white/10 shadow-sm backdrop-blur">
                    <span className="text-2xl font-black text-white">{job?.company ? job.company[0].toUpperCase() : 'C'}</span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">Application Preview</p>
                    <h1 className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] text-white md:text-5xl">{job?.title}</h1>
                    <p className="mt-2 text-lg font-semibold text-sky-100">{job?.company}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/90">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-medium">{job?.employment_type || 'Full-time'}</span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-medium">{job?.location || 'Remote'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 md:mt-0">
                  <button
                    onClick={() => router.back()}
                    className="rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Back
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Role Type</p>
                  <p className="mt-2 text-lg font-bold text-white">{job?.employment_type || 'Full-time'}</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Location</p>
                  <p className="mt-2 text-lg font-bold text-white">{job?.location || 'Remote'}</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">Profile Status</p>
                  <p className="mt-2 text-lg font-bold text-white">{profileCompletion}% complete</p>
                </div>
              </div>
            </div>
          </div>

          {/* Layout: left content + right form */}
          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            {/* LEFT: Job description & details */}
            <div className="space-y-6">
              <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-8 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Overview</p>
                <h2 className="mt-2 mb-4 text-2xl font-black tracking-[-0.04em] text-slate-950">Job Description</h2>
                <div className="prose max-w-none whitespace-pre-line text-slate-700">{job?.description || 'No description provided.'}</div>
              </section>

              {job?.requirements && (
                <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-8 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Checklist</p>
                  <h3 className="mt-2 mb-4 text-2xl font-black tracking-[-0.04em] text-slate-950">Requirements</h3>
                  <ul className="space-y-3">
                    {job.requirements.split('\n').filter(Boolean).map((req, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-slate-700">{req.trim()}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {job?.benefits && (
                <section className="rounded-[30px] border border-slate-200/80 bg-white/94 p-8 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.35)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Perks</p>
                  <h3 className="mt-2 mb-4 text-2xl font-black tracking-[-0.04em] text-slate-950">Benefits</h3>
                  <ul className="space-y-3">
                    {job.benefits.split('\n').filter(Boolean).map((b, i) => (
                      <li key={i} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4">
                        <div className="mt-1 text-indigo-600">•</div>
                        <p className="text-slate-700">{b.trim()}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* RIGHT: Sectioned apply form (sticky) */}
            <aside className="">
              <div className="sticky top-8 overflow-hidden rounded-[34px] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_30px_80px_-42px_rgba(15,23,42,0.42)]">
                {/* top gradient bar */}
                <div className="h-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400" />

                <div className="p-7 space-y-5">
                  <h3 className="text-2xl font-bold text-slate-900">Apply — Professional Form</h3>
                  <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Candidate Submission</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">Fill in the essentials, add your resume, and send everything in one step.</p>
                    </div>
                    <div className="rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700">
                      {profileCompletion}% profile
                    </div>
                  </div>

                  {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">{error}</div>}
                  {profileEligibilityChecked && profileCompletion < 80 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-lg">
                      Please complete your profile (minimum 80%) before applying for jobs
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5" aria-label="Application form">
                    <div className="rounded-[28px] border border-sky-100 bg-[linear-gradient(180deg,#ffffff_0%,#f6fbff_100%)] p-5 shadow-sm">
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Personal Information</h4>

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">Full name *</label>
                      <input
                        type="text"
                        value={personal.name}
                        onChange={(e) => updatePersonal('name', e.target.value)}
                        className={`w-full p-3 rounded-lg border ${fieldErrors.name ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                        placeholder="Your full name"
                        aria-invalid={!!fieldErrors.name}
                        required
                      />
                      {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mt-3 mb-1">Email *</label>
                      <input
                        type="email"
                        value={personal.email}
                        onChange={(e) => updatePersonal('email', e.target.value)}
                        className={`w-full p-3 rounded-lg border ${fieldErrors.email ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                        placeholder="you@example.com"
                        aria-invalid={!!fieldErrors.email}
                        required
                      />
                      {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mt-3 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={personal.phone}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        className={`w-full p-3 rounded-lg border ${fieldErrors.phone ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                        placeholder="+91 98xxxxxxx"
                        aria-invalid={!!fieldErrors.phone}
                      />
                      {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mt-3 mb-1">Current Location</label>
                      <input
                        type="text"
                        value={personal.location}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="City, State or Remote"
                      />
                    </div>

                    <div className="rounded-[28px] border border-indigo-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7f7ff_100%)] p-5 shadow-sm">
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Professional Details</h4>

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">Experience Level *</label>
                      <select
                        value={professional.experience_level}
                        onChange={(e) => updateProfessional('experience_level', e.target.value)}
                        className={`w-full p-3 rounded-lg border ${fieldErrors.experience_level ? 'border-red-300' : 'border-slate-200'} focus:outline-none focus:ring-2 focus:ring-indigo-200`}
                        required
                        aria-invalid={!!fieldErrors.experience_level}
                      >
                        <option value="">Select level</option>
                        <option value="Entry">Entry Level</option>
                        <option value="Mid">Mid Level</option>
                        <option value="Senior">Senior Level</option>
                        <option value="Executive">Executive</option>
                      </select>
                      {fieldErrors.experience_level && <p className="text-xs text-red-600 mt-1">{fieldErrors.experience_level}</p>}

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">Current Salary</label>
                          <input
                            type="text"
                            value={professional.current_salary}
                            onChange={(e) => updateProfessional('current_salary', e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="e.g., ₹6,00,000"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-1">Expected Salary</label>
                          <input
                            type="text"
                            value={professional.expected_salary}
                            onChange={(e) => updateProfessional('expected_salary', e.target.value)}
                            className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            placeholder="e.g., ₹8,00,000"
                          />
                        </div>
                      </div>

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mt-3 mb-1">Notice Period</label>
                      <input
                        type="text"
                        value={professional.notice_period}
                        onChange={(e) => updateProfessional('notice_period', e.target.value)}
                        className="w-full p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="e.g., 30 days / Immediate"
                      />
                    </div>

                    <div className="rounded-[28px] border border-emerald-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_100%)] p-5 shadow-sm">
                      <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-700">Resume & Links</h4>

                      <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-2">Resume (optional)</label>
                      <div
                        ref={dropRef}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-4 py-6 text-center transition hover:border-indigo-200 hover:shadow-sm"
                        aria-hidden="true"
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                        />
                        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V8a4 4 0 014-4h6v12M12 12l-3 3m0 0l3 3m-3-3h12" />
                        </svg>
                        <div className="text-sm text-slate-600">Click or drag & drop your resume</div>
                        <div className="text-xs text-slate-400">PDF, DOC, DOCX — max 5MB</div>
                      </div>

                      {resumeError && <p className="text-xs text-red-600 mt-2">{resumeError}</p>}

                      {resumeName && (
                        <div className="mt-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100 px-3 py-2">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 1.1.9 2 2 2h10l4-4V7a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
                            </svg>
                            <span className="text-sm text-slate-700">{resumeName}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={removeResume} className="text-xs text-red-600 hover:underline">Remove</button>
                          </div>
                        </div>
                      )}

                      {!resumeName && profileResumePath && (
                        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                          Your profile resume will be attached automatically.
                        </div>
                      )}

                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full rounded-xl px-4 py-3 font-semibold text-white shadow-[0_18px_35px_-22px_rgba(79,70,229,0.65)] ${submitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-[linear-gradient(135deg,#0f172a,#4f46e5,#38bdf8)] hover:brightness-105'}`}
                      >
                        {submitting ? 'Submitting…' : 'Submit Application'}
                      </button>
                    </div>

                    <div className="text-xs text-slate-500 mt-2">
                      By applying you consent to TrueHire processing your personal data for the recruitment purpose.
                    </div>
                  </form>

                  <div className="mt-4 rounded-[28px] border border-slate-200/80 bg-[linear-gradient(135deg,#eef2ff_0%,#f8fbff_100%)] p-5 text-sm text-slate-700">
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">What happens next</div>
                    <ul className="list-disc list-inside space-y-1">
                      <li>We review applications within 3–7 business days.</li>
                      <li>If shortlisted, you’ll get an email with interview steps.</li>
                    </ul>
                  </div>

                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {showLimitReachedPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/70 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.4)]">
            <h3 className="text-lg font-semibold text-slate-900">Applications Closed</h3>
            <p className="mt-3 text-sm text-slate-700">
              Applications for this job are now closed as the application limit has been reached.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowLimitReachedPopup(false)}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

