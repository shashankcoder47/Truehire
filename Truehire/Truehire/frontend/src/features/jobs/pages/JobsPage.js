import Head from 'next/head'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import { JobCard } from '../index'
import { useAuth } from '../../../context/AuthContext'
import apiService from '../../../lib/api'

const mockJobs = [
  {
    id: 101,
    title: 'Frontend Engineer',
    company_name: 'NovaStack',
    company: 'NovaStack',
    company_logo: '/images/design co.png',
    location: 'Remote - US',
    experience_level: 'Mid',
    description: 'Build modern UI experiences for a fast-growing SaaS product.',
    created_at: '2026-01-30T10:00:00.000Z',
    application_deadline: '2026-02-20T00:00:00.000Z',
    is_urgent: true,
    salary_amount: '₹6 LPA',
    salary_range: '₹6–8 LPA',
    isSalaryLocked: true,
    view_count: 1
  },
  {
    id: 102,
    title: 'Product Designer',
    company_name: 'Brightline Labs',
    company: 'Brightline Labs',
    company_logo: '/images/datalab.png',
    location: 'Austin, TX',
    experience_level: 'Senior',
    description: 'Lead product design for consumer-facing workflows and mobile.',
    created_at: '2026-01-28T14:30:00.000Z',
    application_deadline: '2026-02-18T00:00:00.000Z',
    is_urgent: false,
    salary_amount: '₹10 LPA',
    salary_range: '₹10–12 LPA',
    isSalaryLocked: false,
    view_count: 3
  },
  {
    id: 103,
    title: 'Data Analyst',
    company_name: 'ClearPath Analytics',
    company: 'ClearPath Analytics',
    company_logo: '/images/data flow.png',
    location: 'Chicago, IL',
    experience_level: 'Entry',
    description: 'Analyze product usage data and deliver insights to leadership.',
    created_at: '2026-01-25T09:15:00.000Z',
    application_deadline: '2026-02-25T00:00:00.000Z',
    is_urgent: false,
    salary_amount: '₹5 LPA',
    salary_range: '₹4–6 LPA',
    isSalaryLocked: false,
    view_count: 5
  },
  {
    id: 104,
    title: 'Customer Success Manager',
    company_name: 'PulseBridge',
    company: 'PulseBridge',
    company_logo: '/images/health.png',
    location: 'New York, NY',
    experience_level: 'Mid',
    description: 'Drive onboarding and retention for enterprise customer accounts.',
    created_at: '2026-01-22T16:00:00.000Z',
    application_deadline: '2026-02-15T00:00:00.000Z',
    is_urgent: true,
    salary_amount: '₹8 LPA',
    salary_range: '₹7–9 LPA',
    isSalaryLocked: true,
    view_count: 7
  },
  {
    id: 105,
    title: 'Backend Engineer',
    company_name: 'Cloud Harbor',
    company: 'Cloud Harbor',
    company_logo: '/images/cloud tech.png',
    location: 'Seattle, WA',
    experience_level: 'Senior',
    description: 'Design APIs and scalable services for a mission-critical platform.',
    created_at: '2026-01-20T12:45:00.000Z',
    application_deadline: '2026-02-28T00:00:00.000Z',
    is_urgent: false,
    salary_amount: '₹12 LPA',
    salary_range: '₹12–15 LPA',
    isSalaryLocked: false,
    view_count: 9
  }
]

export default function Jobs() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [allJobs, setAllJobs] = useState([])
  const [filteredJobs, setFilteredJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    company: '',
    companyId: '',
    location: '',
    employment_type: '',
    experience_category: '',
    experience_level: '',
    salary_min: '',
    salary_max: '',
    requirements: '',
    benefits: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [bookmarkedJobs, setBookmarkedJobs] = useState([])
  const jobsPerPage = 12
  const normalizeBookmarkIds = (value) => {
    if (!Array.isArray(value)) return []
    return value
      .map((entry) => {
        if (entry && typeof entry === 'object') return String(entry.id ?? entry.jobId ?? '')
        return String(entry)
      })
      .filter((id) => id && id !== 'undefined' && id !== 'null')
  }
  const BOOKMARK_IDS_KEY = 'bookmarkedJobs'
  const BOOKMARK_ITEMS_KEY = 'bookmarkedJobItems'
  const normalizeExperienceLevel = (value) => {
    const token = String(value || '').trim().toUpperCase()
    const map = {
      ENTRY: 'ENTRY_LEVEL',
      'ENTRY LEVEL': 'ENTRY_LEVEL',
      ENTRY_LEVEL: 'ENTRY_LEVEL',
      INTERNSHIP: 'INTERNSHIP_LEVEL',
      'INTERNSHIP LEVEL': 'INTERNSHIP_LEVEL',
      INTERNSHIP_LEVEL: 'INTERNSHIP_LEVEL',
      MID: 'MID_LEVEL',
      'MID LEVEL': 'MID_LEVEL',
      MID_LEVEL: 'MID_LEVEL',
      SENIOR: 'SENIOR_LEVEL',
      'SENIOR LEVEL': 'SENIOR_LEVEL',
      SENIOR_LEVEL: 'SENIOR_LEVEL',
      EXECUTIVE: 'EXECUTIVE_LEVEL',
      'EXECUTIVE LEVEL': 'EXECUTIVE_LEVEL',
      EXECUTIVE_LEVEL: 'EXECUTIVE_LEVEL'
    }
    return map[token] || value || ''
  }

  const normalizeExperienceCategory = (value) => {
    const token = String(value || '').trim().toUpperCase()
    const map = {
      FRESHER: 'FRESHER',
      FRESHER_JOBS: 'FRESHER',
      INTERNSHIPS: 'INTERNSHIPS',
      INTERNSHIP: 'INTERNSHIPS',
      CAREER_GROWTH: 'CAREER_GROWTH',
      CAREER_GROWTH_JOBS: 'CAREER_GROWTH'
    }
    return map[token] || ''
  }

  const normalizeEmploymentType = (value) => {
    const token = String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_')
    const map = {
      FULL_TIME: 'FULL_TIME',
      PART_TIME: 'PART_TIME',
      CONTRACT: 'CONTRACT',
      INTERNSHIP: 'INTERNSHIP',
      FREELANCE: 'FREELANCE'
    }
    return map[token] || ''
  }

  const includesText = (value, query) => {
    if (!query) return true
    return String(value || '').toLowerCase().includes(String(query).trim().toLowerCase())
  }

  const getOrCreateDeviceFingerprint = () => {
    if (typeof window === 'undefined') return null
    const existing = localStorage.getItem('device_fingerprint')
    if (existing) return existing

    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    const fingerprint = `${randomPart}-${Date.now()}`
    localStorage.setItem('device_fingerprint', fingerprint)
    return fingerprint
  }

  const formatSalaryRange = (job) => {
    if (job.salary_min == null && job.salary_max == null) return null
    const currency = String(job.salary_currency || 'INR').toUpperCase()
    const minNumber = job.salary_min != null ? Number(job.salary_min) : null
    const maxNumber = job.salary_max != null ? Number(job.salary_max) : null

    if (currency === 'LPA') {
      const formatLpa = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ''))
      const min = minNumber != null && Number.isFinite(minNumber) ? formatLpa(minNumber) : null
      const max = maxNumber != null && Number.isFinite(maxNumber) ? formatLpa(maxNumber) : null
      if (min && max) return `${min} - ${max} LPA`
      return `${min || max} LPA`
    }

    const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
    const min = minNumber != null && Number.isFinite(minNumber) ? formatter.format(minNumber) : null
    const max = maxNumber != null && Number.isFinite(maxNumber) ? formatter.format(maxNumber) : null
    if (min && max) return `${currency} ${min} - ${max}`
    return `${currency} ${min || max}`
  }

  const isJobExpired = (job) => {
    const status = String(job?.status || '').toLowerCase()
    if (status === 'expired' || status === 'closed' || status === 'inactive') return true
    if (!job?.application_deadline) return false

    const deadline = new Date(job.application_deadline)
    if (Number.isNaN(deadline.getTime())) return false

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const deadlineDate = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
    return deadlineDate < todayStart
  }

  const normalizeJob = (job) => ({
    ...job,
    company_name: job.company_name || job.company,
    employment_type: normalizeEmploymentType(job.employment_type || job.job_type || job.type) || job.employment_type,
    experience_level: normalizeExperienceLevel(job.experience_level),
    salary_range: formatSalaryRange(job),
    views_count: Number(job.views_count ?? job.view_count ?? 0)
  })

  // Load bookmarked jobs from localStorage on mount
  useEffect(() => {
    getOrCreateDeviceFingerprint()
    const saved = localStorage.getItem(BOOKMARK_IDS_KEY)
    if (saved) {
      try {
        setBookmarkedJobs(normalizeBookmarkIds(JSON.parse(saved)))
      } catch (error) {
        setBookmarkedJobs([])
      }
    }
  }, [])

  // Save bookmarked jobs to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(BOOKMARK_IDS_KEY, JSON.stringify(normalizeBookmarkIds(bookmarkedJobs)))
  }, [bookmarkedJobs])

  useEffect(() => {
    if (!router.isReady) return
    const queryCompany = Array.isArray(router.query.company)
      ? router.query.company[0]
      : router.query.company
    const queryCompanyId = Array.isArray(router.query.companyId)
      ? router.query.companyId[0]
      : router.query.companyId
    const queryExperience = Array.isArray(router.query.experience_level)
      ? router.query.experience_level[0]
      : router.query.experience_level
    const queryExperienceCategory = Array.isArray(router.query.experience_category)
      ? router.query.experience_category[0]
      : router.query.experience_category

    setFilters(prev => ({
      ...prev,
      company: queryCompany || '',
      companyId: queryCompanyId || '',
      experience_category: normalizeExperienceCategory(queryExperienceCategory || prev.experience_category),
      experience_level: normalizeExperienceLevel(queryExperience || prev.experience_level)
    }))
  }, [router.isReady, router.query.company, router.query.companyId, router.query.experience_level, router.query.experience_category])

  // Filter jobs whenever filters or allJobs change
  useEffect(() => {
    filterJobs()
  }, [filters, allJobs])

  useEffect(() => {
    let isMounted = true

    const loadJobs = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await apiService.request('/jobs?limit=200', { returnErrorObject: true })
        if (response?.error) {
          throw new Error(response.error)
        }

        const jobs = Array.isArray(response?.jobs) ? response.jobs : []
        if (!isMounted) return

        if (jobs.length === 0) {
          setAllJobs(mockJobs.filter((job) => !isJobExpired(job)).map(normalizeJob))
        } else {
          setAllJobs(jobs.filter((job) => !isJobExpired(job)).map(normalizeJob))
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Failed to load jobs:', err)
        setError(err?.message || 'Failed to load jobs')
        setAllJobs(mockJobs.filter((job) => !isJobExpired(job)).map(normalizeJob))
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadJobs()
    return () => { isMounted = false }
  }, [])

  const filterJobs = () => {
    let filtered = [...allJobs]

    // Apply search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm) ||
        String(job.company || '').toLowerCase().includes(searchTerm) ||
        String(job.requirements || job.job_requirements || '').toLowerCase().includes(searchTerm) ||
        String(job.benefits || '').toLowerCase().includes(searchTerm)
      )
    }

    // Apply exact company filter
    if (filters.companyId) {
      const companyId = String(filters.companyId)
      filtered = filtered.filter(job => String(job.recruiter_id) === companyId)
    } else if (filters.company) {
      const companyTerm = filters.company.toLowerCase().trim()
      filtered = filtered.filter(job => job.company && job.company.toLowerCase().trim() === companyTerm)
    }

    // Apply location filter
    if (filters.location) {
      const locationTerm = filters.location.toLowerCase()
      filtered = filtered.filter(job =>
        job.location && job.location.toLowerCase().includes(locationTerm)
      )
    }

    // Apply employment type filter
    if (filters.employment_type) {
      filtered = filtered.filter(job => normalizeEmploymentType(job.employment_type) === filters.employment_type)
    }

    // Apply experience category/group filter
    if (filters.experience_category) {
      const groupedLevels = {
        FRESHER: ['ENTRY_LEVEL'],
        INTERNSHIPS: ['INTERNSHIP_LEVEL'],
        CAREER_GROWTH: ['MID_LEVEL', 'SENIOR_LEVEL', 'EXECUTIVE_LEVEL']
      }
      const allowedLevels = groupedLevels[filters.experience_category] || []
      filtered = filtered.filter(job => allowedLevels.includes(normalizeExperienceLevel(job.experience_level)))
    } else if (filters.experience_level) {
      // Apply single experience level filter
      filtered = filtered.filter(job => job.experience_level === filters.experience_level)
    }

    // Apply salary filters
    if (filters.salary_min) {
      const minimumSalary = Number(filters.salary_min)
      if (Number.isFinite(minimumSalary)) {
        filtered = filtered.filter(job => {
          const salaryMax = job.salary_max != null ? Number(job.salary_max) : null
          const salaryMin = job.salary_min != null ? Number(job.salary_min) : null
          const effectiveMax = Number.isFinite(salaryMax) ? salaryMax : salaryMin
          return Number.isFinite(effectiveMax) && effectiveMax >= minimumSalary
        })
      }
    }
    if (filters.salary_max) {
      const maximumSalary = Number(filters.salary_max)
      if (Number.isFinite(maximumSalary)) {
        filtered = filtered.filter(job => {
          const salaryMin = job.salary_min != null ? Number(job.salary_min) : null
          const salaryMax = job.salary_max != null ? Number(job.salary_max) : null
          const effectiveMin = Number.isFinite(salaryMin) ? salaryMin : salaryMax
          return Number.isFinite(effectiveMin) && effectiveMin <= maximumSalary
        })
      }
    }

    if (filters.requirements) {
      filtered = filtered.filter(job => includesText(job.requirements || job.job_requirements, filters.requirements))
    }

    if (filters.benefits) {
      filtered = filtered.filter(job => includesText(job.benefits, filters.benefits))
    }

    setFilteredJobs(filtered)
    setTotalPages(Math.ceil(filtered.length / jobsPerPage))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleBookmark = (jobId) => {
    const normalizedId = String(jobId)
    const targetJob = allJobs.find((job) => String(job.id) === normalizedId) || null
    setBookmarkedJobs(prev => {
      const normalizedPrev = normalizeBookmarkIds(prev)
      const isBookmarked = normalizedPrev.includes(normalizedId)

      let savedItems = []
      try {
        savedItems = JSON.parse(localStorage.getItem(BOOKMARK_ITEMS_KEY) || '[]')
        if (!Array.isArray(savedItems)) savedItems = []
      } catch (error) {
        savedItems = []
      }

      if (isBookmarked) {
        const updatedItems = savedItems.filter((item) => String(item?.id) !== normalizedId)
        localStorage.setItem(BOOKMARK_ITEMS_KEY, JSON.stringify(updatedItems))
        return normalizedPrev.filter(id => id !== normalizedId)
      } else {
        if (targetJob) {
          const updatedItems = [
            ...savedItems.filter((item) => String(item?.id) !== normalizedId),
            targetJob
          ]
          localStorage.setItem(BOOKMARK_ITEMS_KEY, JSON.stringify(updatedItems))
        }
        return [...normalizedPrev, normalizedId]
      }
    })
  }

  const handleApply = async (jobId) => {
    const fingerprint = getOrCreateDeviceFingerprint()
    let shouldUseUserAuth = false
    if (typeof window !== 'undefined') {
      try {
        const rawUser = localStorage.getItem('user')
        const user = rawUser ? JSON.parse(rawUser) : null
        shouldUseUserAuth = String(user?.role || '').toLowerCase() === 'user'
      } catch (_) {}
    }
    if (jobId) {
      try {
        const viewResponse = await apiService.request(`/jobs/${jobId}/view`, {
          method: 'POST',
          headers: fingerprint ? { 'x-device-fingerprint': fingerprint } : {},
          skipAuth: !shouldUseUserAuth
        })
        if (typeof viewResponse?.views_count === 'number') {
          setAllJobs((prev) =>
            prev.map((job) =>
              String(job.id) === String(jobId)
                ? { ...job, views_count: viewResponse.views_count }
                : job
            )
          )
        }
      } catch (viewError) {
        console.log('View recording failed on card click:', viewError)
      }
    }

    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    router.push(`/jobs/${jobId}/apply`)
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'experience_level' ? { experience_category: '' } : {})
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      company: '',
      companyId: '',
      location: '',
      employment_type: '',
      experience_category: '',
      experience_level: '',
      salary_min: '',
      salary_max: '',
      requirements: '',
      benefits: ''
    })
    setCurrentPage(1)
  }

  return (
    <>
      <Head>
        <title>All Jobs — TrueHire</title>
        <meta name="description" content="Browse all job opportunities on TrueHire. Find your dream job with our comprehensive job listings." />
      </Head>

      <Header />

      <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF] text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-indigo-200/70 blur-[120px]" />
          <div className="absolute right-[-6rem] top-[-2rem] h-64 w-64 rounded-full bg-sky-200/70 blur-[110px]" />
          <div className="absolute inset-x-0 bottom-[-8rem] h-64 bg-gradient-to-t from-[#EEF2FF] via-transparent to-transparent" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
          <section className="rounded-[32px] border border-slate-200/70 bg-white/90 backdrop-blur p-10 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.35)]">
            <div className="text-center space-y-4">
              <p className="text-xs uppercase tracking-[0.5em] text-slate-500">Careers</p>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                All Job <span className="text-gradient">Opportunities</span>
              </h1>
              <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Discover your next career move from thousands of opportunities sourced from leading companies.
              </p>
            </div>
          </section>

          {/* Search & Filters */}
          <section className="relative z-30 overflow-visible rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.35)] space-y-8 text-slate-900">
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold">Find Your Perfect Job</h2>
              <p className="text-slate-600">Search through our comprehensive job database</p>
            </div>

            {(filters.company || filters.companyId) && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                <span className="font-semibold">Company:</span>
                <span className="font-medium">{filters.company || 'Selected company'}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      company: '',
                      companyId: ''
                    }))
                  }
                  className="ml-auto rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100 transition"
                >
                  Clear company filter
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="min-w-0 space-y-2">
                <label htmlFor="search" className="block text-sm font-medium text-slate-700">
                  Job Title, Company, or Keywords
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    name="search"
                    placeholder="e.g. Software Engineer, Google"
                    className="w-full box-border pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                    value={filters.search}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                  Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="City, state, or remote"
                    className="w-full box-border pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                    value={filters.location}
                    onChange={handleFilterChange}
                  />
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="employment_type" className="block text-sm font-medium text-slate-700">
                  Employment Type
                </label>
                <div className="relative z-20">
                  <select
                    id="employment_type"
                    name="employment_type"
                    className="w-full box-border pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                    value={filters.employment_type}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Types</option>
                    <option value="FULL_TIME">Full-time</option>
                    <option value="PART_TIME">Part-time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="FREELANCE">Freelance</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="experience_level" className="block text-sm font-medium text-slate-700">
                  Experience Level
                </label>
                <div className="relative z-20">
                  <select
                    id="experience_level"
                    name="experience_level"
                    className="w-full box-border pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm appearance-none"
                    value={filters.experience_level}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Levels</option>
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="INTERNSHIP_LEVEL">Internship Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR_LEVEL">Senior Level</option>
                    <option value="EXECUTIVE_LEVEL">Executive</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="min-w-0 space-y-2">
                <label htmlFor="salary_min" className="block text-sm font-medium text-slate-700">
                  Min Salary (LPA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  id="salary_min"
                  name="salary_min"
                  placeholder="e.g. 4"
                  className="w-full box-border px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                  value={filters.salary_min}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="salary_max" className="block text-sm font-medium text-slate-700">
                  Max Salary (LPA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  id="salary_max"
                  name="salary_max"
                  placeholder="e.g. 8"
                  className="w-full box-border px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                  value={filters.salary_max}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="requirements" className="block text-sm font-medium text-slate-700">
                  Requirements
                </label>
                <input
                  type="text"
                  id="requirements"
                  name="requirements"
                  placeholder="e.g. React, sales, SQL"
                  className="w-full box-border px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                  value={filters.requirements}
                  onChange={handleFilterChange}
                />
              </div>

              <div className="min-w-0 space-y-2">
                <label htmlFor="benefits" className="block text-sm font-medium text-slate-700">
                  Benefits
                </label>
                <input
                  type="text"
                  id="benefits"
                  name="benefits"
                  placeholder="e.g. remote, insurance"
                  className="w-full box-border px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-white shadow-sm"
                  value={filters.benefits}
                  onChange={handleFilterChange}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200/80">
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-6 py-3 bg-red-50 border border-red-200 hover:border-red-300 hover:bg-red-100 text-red-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-full">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {filteredJobs.length} jobs found
              </div>
            </div>
          </section>

          {/* Jobs List */}
          <section className="relative z-10 rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)] space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
                <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
              </div>
              <p className="mt-6 text-lg font-medium text-slate-600">Finding your perfect job...</p>
              <p className="mt-2 text-slate-500">Please wait while we load the latest opportunities</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-2xl shadow-[0_20px_45px_-30px_rgba(15,23,42,0.25)] border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Jobs</h3>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 mx-auto hover:shadow-lg hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {filteredJobs.length === 0 ? (
                  <div className="col-span-full">
                    <div className="bg-white rounded-2xl shadow-[0_20px_45px_-30px_rgba(15,23,42,0.25)] border border-slate-200 p-16 text-center">
                      <div className="w-24 h-24 bg-white/80 rounded-full border border-slate-200 flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 mb-3">No Jobs Found</h3>
                      <p className="text-slate-600 mb-8 max-w-md mx-auto">We couldn't find any jobs matching your criteria. Try adjusting your filters or check back later for new opportunities.</p>
                      <button
                        onClick={clearFilters}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 mx-auto hover:shadow-lg hover:scale-105"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredJobs.slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage).map((job) => {
                    const isBookmarked = bookmarkedJobs.includes(String(job.id))
                    return (
                      <JobCard
                        key={job.id}
                        job={job}
                        isBookmarked={isBookmarked}
                        onToggleBookmark={toggleBookmark}
                        onApply={handleApply}
                      />
                    )
                  })
                )}
              </div>

              {/* Premium Pagination */}
              {totalPages > 1 && (
                <div className="bg-white rounded-2xl shadow-[0_18px_40px_-30px_rgba(15,23,42,0.25)] border border-slate-200 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-slate-600">
                      Showing page <span className="font-semibold text-slate-900">{currentPage}</span> of{' '}
                      <span className="font-semibold text-slate-900">{totalPages}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Previous
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                currentPage === page
                                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 hover:shadow-md'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-50"
                      >
                        Next
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}



