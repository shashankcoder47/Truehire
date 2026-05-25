import Head from 'next/head'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../../Portal/Header'
import Footer from '../../Portal/Footer'
import apiService from '../../utils/api'

const toList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (value === null || value === undefined) return [];

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (_) {
      // Fall through to delimiter parsing
    }

    return trimmed
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const formatSalaryRange = (job) => {
  const minValue = job?.salary_min != null ? Number(job.salary_min) : null;
  const maxValue = job?.salary_max != null ? Number(job.salary_max) : null;
  if (!Number.isFinite(minValue) && !Number.isFinite(maxValue)) return null;

  const currency = String(job?.salary_currency || 'INR').toUpperCase();
  if (currency === 'LPA') {
    const formatLpa = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ''));
    if (Number.isFinite(minValue) && Number.isFinite(maxValue)) return `${formatLpa(minValue)} - ${formatLpa(maxValue)} LPA`;
    return `${formatLpa(Number.isFinite(minValue) ? minValue : maxValue)} LPA`;
  }

  const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
  const min = Number.isFinite(minValue) ? formatter.format(minValue) : null;
  const max = Number.isFinite(maxValue) ? formatter.format(maxValue) : null;
  if (min && max) return `${currency} ${min} - ${max}`;
  return `${currency} ${min || max}`;
};

const normalizeJob = (rawJob) => {
  const job = rawJob && typeof rawJob === 'object' ? rawJob : {};
  const company = typeof job.company === 'string' && job.company.trim() ? job.company : 'Company';
  const salaryRange = formatSalaryRange(job);

  return {
    ...job,
    company,
    salary: salaryRange || job.salary || 'Salary not specified',
    requirements: toList(job.requirements),
    responsibilities: toList(job.responsibilities),
    benefits: toList(job.benefits),
    skills: toList(job.skills)
  };
};

const getCompanyLogoUrl = (logoPath) => {
  if (!logoPath || typeof logoPath !== 'string') return null;
  if (logoPath.startsWith('http')) return logoPath;
  const rawBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '');
  const baseOrigin = rawBase.endsWith('/api') ? rawBase.replace(/\/api$/, '') : rawBase;
  if (logoPath.startsWith('/')) return `${baseOrigin}${logoPath}`;
  return `${baseOrigin}/${logoPath}`;
};

export default function JobPage() {
  const router = useRouter()
  const { id } = router.query
  const [job, setJob] = useState(null)
  const [relatedJobs, setRelatedJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const viewedJobIdsRef = useRef(new Set())

  const handleApplyNow = () => {
    const nextUrl = `/jobs/${id}/apply`
    const token = apiService.getToken()
    const user = apiService.getUserData()
    const role = String(user?.role || '').toLowerCase()

    if (!token || role !== 'user') {
      router.push(`/login?next=${encodeURIComponent(nextUrl)}`)
      return
    }

    router.push(nextUrl)
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

    const fetchJob = async () => {
      try {
        setLoading(true)
        const response = await apiService.request(`/jobs/${id}`)
        const normalizedJob = normalizeJob(response?.job)
        setJob(normalizedJob)

        // Fetch related jobs
        const jobsResponse = await apiService.request('/jobs')
        const related = Array.isArray(jobsResponse?.jobs) ? jobsResponse.jobs : []
        setRelatedJobs(
          related
            .map((j) => normalizeJob(j))
            .filter((j) => j.id !== normalizedJob.id)
            .slice(0, 3)
        )

        const normalizedJobId = String(id)
        if (!viewedJobIdsRef.current.has(normalizedJobId)) {
          viewedJobIdsRef.current.add(normalizedJobId)
          const fingerprint = getOrCreateDeviceFingerprint()
          let shouldUseUserAuth = false
          if (typeof window !== 'undefined') {
            try {
              const rawUser = localStorage.getItem('user')
              const user = rawUser ? JSON.parse(rawUser) : null
              shouldUseUserAuth = String(user?.role || '').toLowerCase() === 'user'
            } catch (_) {}
          }
          try {
            const viewResponse = await apiService.request(`/jobs/${id}/view`, {
              method: 'POST',
              headers: fingerprint ? { 'x-device-fingerprint': fingerprint } : {},
              skipAuth: !shouldUseUserAuth
            })
            if (typeof viewResponse?.views_count === 'number') {
              setJob((prev) =>
                prev
                  ? {
                      ...prev,
                      views_count: viewResponse.views_count
                    }
                  : prev
              )
            }
          } catch (viewError) {
            console.log('View recording failed:', viewError)
          }
        }
      } catch (error) {
        console.error('Error fetching job:', error)
        setError('Failed to load job details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchJob()
  }, [id])

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-600">Loading job details...</p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !job) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Job Not Found</h1>
            <p className="text-gray-600 mb-8">{error || "The job you're looking for doesn't exist or has been removed."}</p>
            <Link href="/" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Head>
        <title>{`${job.title} at ${job.company} | TrueHire`}</title>
        <meta name="description" content={`${job.title} position at ${job.company} ${job.description}`} />
        <meta property="og:title" content={`${job.title} at ${job.company}`} />
        <meta property="og:description" content={job.description} />
        <meta property="og:type" content="website" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <nav className="flex" aria-label="Breadcrumb">
              <ul className="flex items-center space-x-4">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-gray-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-9 9a1 1 0 001.414 1.414L2 12.414V19a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 011-1h2a1 1 0 011 1v3a1 1 0 001 1h3a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-9-9z"/>
                    </svg>
                  </Link>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    <Link href="/jobs" className="ml-4 text-gray-400 hover:text-gray-500">
                      Jobs
                    </Link>
                  </div>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="ml-4 text-gray-500">{job.title}</span>
                  </div>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Job Header */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-xl flex items-center justify-center font-bold text-xl shadow-sm overflow-hidden">
                    {getCompanyLogoUrl(job.company_logo) ? (
                      <img
                        src={getCompanyLogoUrl(job.company_logo)}
                        alt={`${job.company} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      job.company[0]
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                    <p className="text-xl text-gray-600 mb-4">{job.company}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{job.type}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800">
                    {job.level}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {job.type}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    Posted {job.posted}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Job View Count: 👁 {job.views_count || 0} views
                  </span>
                </div>

                <p className="text-gray-600 text-lg leading-relaxed">{job.description}</p>
              </div>

              {/* Job Details */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Job Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h3>
                    <ul className="space-y-3">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-gray-600">{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Responsibilities</h3>
                    <ul className="space-y-3">
                      {job.responsibilities.map((resp, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-gray-600">{resp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Benefits & Perks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-gray-600">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Apply Card */}
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Ready to Apply?</h3>
                <p className="text-gray-600 mb-6">Take the next step in your career journey</p>
                <button onClick={handleApplyNow} className="w-full btn btn-primary text-lg font-semibold py-3 mb-4">
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Apply Now
                </button>
                <button className="w-full btn btn-secondary text-sm py-2">
                  <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  Save Job
                </button>
              </div>

              {/* Company Info */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">About {job.company}</h3>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg overflow-hidden">
                    {getCompanyLogoUrl(job.company_logo) ? (
                      <img
                        src={getCompanyLogoUrl(job.company_logo)}
                        alt={`${job.company} logo`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      job.company[0]
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{job.company}</p>
                    <p className="text-sm text-gray-500">Technology Company</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8" />
                    </svg>
                    <span>500-1000 employees</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <span>techcorp.com</span>
                  </div>
                </div>
              </div>

              {/* Related Jobs */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Similar Jobs</h3>
                <div className="space-y-4">
                  {relatedJobs.map((relatedJob) => (
                    <Link key={relatedJob.id} href={`/jobs/${relatedJob.id}`} className="block group">
                      <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm overflow-hidden">
                          {getCompanyLogoUrl(relatedJob.company_logo) ? (
                            <img
                              src={getCompanyLogoUrl(relatedJob.company_logo)}
                              alt={`${relatedJob.company} logo`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            relatedJob.company[0]
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{relatedJob.title}</h4>
                          <p className="text-sm text-gray-600">{relatedJob.company}</p>
                          <p className="text-sm text-gray-500">{relatedJob.location}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}



