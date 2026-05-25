import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect, useMemo, useState } from 'react'
import Header from '../../Portal/Header'
import Footer from '../../Portal/Footer'
import { jobs } from '../../utils/jobs'
import { useAuth } from '../../context/AuthContext'
import apiService from '../../utils/api'

const companies = [
  {
    id: 1,
    name: 'Mudassir Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Technology',
    size: '1000-5000 employees',
    location: 'Bangalore, Karnataka',
    description: 'Leading technology company specializing in innovative software solutions and digital transformation services.',
    jobs: 45,
    rating: 4.8,
    website: 'https://mudassir.com',
    founded: '2010',
    headquarters: 'Bangalore, Karnataka',
    employees: '2,500',
    about: 'Mudassir Pvt. Ltd. is a leading technology company specializing in innovative software solutions and digital transformation services. We are committed to pushing the boundaries of innovation and creating technology that makes a positive impact on the world. Our team of talented engineers, data scientists, and designers work together to build cutting-edge products that solve real-world problems.',
    culture: 'At Mudassir Pvt. Ltd., we foster a culture of innovation, collaboration, and continuous learning. We believe in empowering our employees to take ownership of their work and providing them with the resources they need to succeed.',
    benefits: [
      'Competitive salary and equity',
      'Comprehensive health insurance',
      'Flexible work arrangements',
      'Professional development budget',
      'Catered meals and wellness programs',
      'Modern office spaces'
    ]
  },
  {
    id: 2,
    name: 'Parvesh Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Data Analytics',
    size: '500-1000 employees',
    location: 'Mumbai, Maharashtra',
    description: 'Specialized in data analytics, business intelligence, and advanced reporting solutions for enterprises.',
    jobs: 23,
    rating: 4.6,
    website: 'https://parvesh.com',
    founded: '2012',
    headquarters: 'Mumbai, Maharashtra',
    employees: '750',
    about: 'Parvesh Pvt. Ltd. is a leading provider of data analytics and business intelligence platforms. We help organizations transform their data into actionable insights that drive business growth and innovation.',
    culture: 'Our culture is built on the principles of data-driven decision making, collaboration, and continuous improvement. We value diversity and inclusion and strive to create an environment where everyone can thrive.',
    benefits: [
      'Competitive compensation',
      'Health and dental insurance',
      'Flexible PTO',
      'Learning and development opportunities',
      'Stock options',
      'Remote work options'
    ]
  },
  {
    id: 3,
    name: 'Sabari Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Cloud Computing',
    size: '100-500 employees',
    location: 'Chennai, Tamil Nadu',
    description: 'Innovative cloud infrastructure and DevOps solutions provider for modern businesses.',
    jobs: 18,
    rating: 4.7,
    website: 'https://sabari.com',
    founded: '2015',
    headquarters: 'Chennai, Tamil Nadu',
    employees: '300',
    about: 'Sabari Pvt. Ltd. provides innovative cloud infrastructure and DevOps solutions to help businesses scale and modernize their operations. Our platform enables organizations to build, deploy, and manage applications with ease.',
    culture: 'We believe in fostering a culture of innovation and collaboration. Our team is passionate about technology and committed to delivering exceptional solutions that drive our clients\' success.',
    benefits: [
      'Competitive salary',
      'Health insurance',
      'Flexible work environment',
      'Technology stipend',
      'Professional development',
      'Team building activities'
    ]
  },
  {
    id: 4,
    name: 'Prathyusha Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Financial Technology',
    size: '5000+ employees',
    location: 'Hyderabad, Telangana',
    description: 'Global leader in financial technology and digital banking solutions for the modern economy.',
    jobs: 67,
    rating: 4.9,
    website: 'https://prathyusha.com',
    founded: '2008',
    headquarters: 'Hyderabad, Telangana',
    employees: '8,500',
    about: 'Prathyusha Pvt. Ltd. is a global leader in financial technology and digital banking solutions for the modern economy. We serve millions of customers worldwide, providing secure and innovative financial services that empower people and businesses.',
    culture: 'Our culture is centered around trust, innovation, and customer-centricity. We are committed to creating a diverse and inclusive workplace where employees can grow and succeed.',
    benefits: [
      'Competitive compensation package',
      'Comprehensive benefits',
      'Work-life balance',
      'Career development programs',
      'Global opportunities',
      'Employee wellness programs'
    ]
  },
  {
    id: 5,
    name: 'Prem Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Renewable Energy',
    size: '1000-5000 employees',
    location: 'Delhi, NCR',
    description: 'Pioneering sustainable energy solutions and renewable technology for a greener future.',
    jobs: 34,
    rating: 4.5,
    website: 'https://prem.com',
    founded: '2011',
    headquarters: 'Delhi, NCR',
    employees: '2,200',
    about: 'Prem Pvt. Ltd. is dedicated to pioneering sustainable energy solutions and renewable technology for a greener future. We develop and deploy renewable energy technologies that help combat climate change and create a sustainable world.',
    culture: 'We are passionate about sustainability and environmental responsibility. Our team works together to create innovative solutions that make a positive impact on the planet.',
    benefits: [
      'Competitive salary',
      'Health and wellness programs',
      'Flexible work arrangements',
      'Sustainability initiatives',
      'Professional development',
      'Green commuting options'
    ]
  },
  {
    id: 6,
    name: 'Hari Pvt. Ltd.',
    logo: '/images/company-placeholder.png',
    industry: 'Healthcare Technology',
    size: '500-1000 employees',
    location: 'Pune, Maharashtra',
    description: 'Revolutionizing healthcare through innovative technology solutions and medical software.',
    jobs: 28,
    rating: 4.8,
    website: 'https://hari.com',
    founded: '2013',
    headquarters: 'Pune, Maharashtra',
    employees: '650',
    about: 'Hari Pvt. Ltd. is revolutionizing healthcare through innovative technology solutions and medical software. We develop cutting-edge medical devices and software that improve patient outcomes and healthcare delivery.',
    culture: 'Our culture is built on innovation, compassion, and excellence. We are committed to improving healthcare outcomes and making a positive difference in people\'s lives.',
    benefits: [
      'Competitive compensation',
      'Comprehensive health benefits',
      'Flexible work options',
      'Innovation time',
      'Professional development',
      'Community involvement'
    ]
  }
]

const getLogoUrl = (logo) => {
  if (!logo) return '/images/company-placeholder.png'
  if (logo.startsWith('http')) return logo
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '').replace(/\/api$/, '') || ''
  if (logo.startsWith('/')) return `${apiBase}${logo}`
  return `${apiBase}/${logo}`
}

const normalizeCompanyRecord = (company) => {
  if (!company) return null
  const name = company.company_name || company.company || company.name || 'Unnamed Company'
  return {
    ...company,
    id: Number(company.id ?? company.company_id ?? company.recruiter_id),
    name,
    logo: getLogoUrl(company.company_logo || company.logo),
    industry: company.industry || 'Industry not specified',
    size: company.company_size || company.size || 'Not specified',
    location: company.headquarters_location || company.location || 'Location not specified',
    description: company.short_overview || company.description || 'This company has not added a short overview yet.',
    jobs: Number(company.open_jobs_count || company.jobs || 0),
    rating: Number(company.rating || 0),
    website: company.website || '',
    founded: company.founded || 'Not specified',
    headquarters: company.headquarters_location || company.headquarters || 'Not specified',
    employees: company.employees || company.company_size || 'Not specified',
    about: company.detailed_description || company.about || company.short_overview || 'Company details will be updated soon.',
    culture: company.culture || 'Culture details will be updated soon.',
    benefits: Array.isArray(company.benefits) ? company.benefits : []
  }
}

const formatJobSalary = (job) => {
  if (job?.salary) return job.salary
  if (job?.salary_min == null && job?.salary_max == null) return 'Salary not specified'
  const currency = job?.salary_currency || 'INR'
  if (job?.salary_min != null && job?.salary_max != null) return `${currency} ${job.salary_min} - ${job.salary_max}`
  if (job?.salary_min != null) return `${currency} ${job.salary_min}+`
  return `Up to ${currency} ${job.salary_max}`
}

export default function CompanyDetail() {
  const router = useRouter()
  const { id } = router.query
  const { user, isAuthenticated } = useAuth()
  const [fetchedCompany, setFetchedCompany] = useState(null)
  const [remoteJobs, setRemoteJobs] = useState([])
  const [pageLoading, setPageLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [followBusy, setFollowBusy] = useState(false)
  const [toast, setToast] = useState(null)
  const [followListType, setFollowListType] = useState(null)
  const [followList, setFollowList] = useState([])
  const [followListLoading, setFollowListLoading] = useState(false)

  const localCompany = useMemo(
    () => companies.find(c => c.id === parseInt(id, 10)) || null,
    [id]
  )

  useEffect(() => {
    if (!router.isReady || !id) return

    const loadCompanyData = async () => {
      setPageLoading(true)
      try {
        const [companiesResponse, jobsResponse] = await Promise.all([
          apiService.request('/recruiters/companies', { returnErrorObject: true }),
          apiService.request('/jobs', { returnErrorObject: true })
        ])

        if (!companiesResponse?.error) {
          const match = (companiesResponse?.companies || []).find((item) => String(item.id) === String(id))
          setFetchedCompany(normalizeCompanyRecord(match))
        }

        if (!jobsResponse?.error) {
          setRemoteJobs(Array.isArray(jobsResponse?.jobs) ? jobsResponse.jobs : [])
        }
      } catch (error) {
        console.error('Unable to load company profile:', error)
      } finally {
        setPageLoading(false)
      }
    }

    loadCompanyData()
  }, [id, router.isReady])

  useEffect(() => {
    if (!id || !apiService.getToken()) return

    const loadFollowStatus = async () => {
      const response = await apiService.getCompanyFollowStatus(id)
      if (response?.error) return
      setFollowing(Boolean(response.following))
      setFollowerCount(Number(response.followerCount || 0))
    }

    loadFollowStatus()
  }, [id, user])

  const company = fetchedCompany || normalizeCompanyRecord(localCompany)

  useEffect(() => {
    if (!company || followerCount > 0) return
    if (company.follower_count != null) {
      setFollowerCount(Number(company.follower_count || 0))
    }
  }, [company, followerCount])

  const handleFollowToggle = async () => {
    if (!isAuthenticated && !apiService.getToken()) {
      router.push('/login')
      return
    }

    if (!company?.id || followBusy || following) return

    setFollowBusy(true)
    setToast(null)
    const response = await apiService.followCompany(company.id)

    if (response?.error) {
      setToast({ type: 'error', message: response.message || response.error })
    } else {
      setFollowing(Boolean(response.following))
      setFollowerCount(Number(response.followerCount || 0))
      setToast({
        type: 'success',
        message: response.message || 'Company followed successfully'
      })
    }
    setFollowBusy(false)
  }

  const openFollowList = async (type) => {
    if (!company?.id) return
    setFollowListType(type)
    setFollowListLoading(true)
    try {
      const response = await apiService.request(`/companies/${company.id}/${type}`, {
        returnErrorObject: true,
      })
      setFollowList(Array.isArray(response?.data) ? response.data : [])
    } finally {
      setFollowListLoading(false)
    }
  }

  if (pageLoading || !router.isReady) {
    return (
      <>
        <Head>
          <title>Company Profile - TrueHire</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            <p className="text-gray-600">Loading company profile...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  if (!company) {
    return (
      <>
        <Head>
          <title>Company Not Found — TrueHire</title>
        </Head>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Company Not Found</h1>
            <p className="text-gray-600 mb-8">The company you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/companies')}
              className="btn btn-primary"
            >
              Back to Companies
            </button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Filter jobs for this company
  const companyJobs = (remoteJobs.length ? remoteJobs : jobs).filter((job) =>
    String(job.recruiter_id || job.company_id || '') === String(company.id) ||
    String(job.company || '').trim().toLowerCase() === String(company.name || '').trim().toLowerCase()
  )

  return (
    <>
      <Head>
        <title>{company.name} - TrueHire</title>
        <meta name="description" content={`Explore ${company.name}, company details, followers, and open roles on TrueHire.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />
      <main className="min-h-screen bg-[#edf4ff] text-slate-900">
        <section className="bg-[#10233f] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <button
              type="button"
              onClick={() => router.push('/companies')}
              className="mb-8 inline-flex items-center rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to companies
            </button>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div className="min-w-0">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-lg border border-white/15 bg-white shadow-lg">
                    <img src={company.logo} alt={company.name} className="h-16 max-w-[72px] object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">Company profile</p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">{company.name}</h1>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">{company.description}</p>
                  </div>
                </div>

                {toast && (
                  <div className={`mt-6 rounded-lg px-4 py-3 text-sm font-semibold ${
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {toast.message}
                  </div>
                )}

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-100">
                  <span className="rounded-lg border border-white/15 bg-white/10 px-4 py-2">{company.industry}</span>
                  <span className="rounded-lg border border-white/15 bg-white/10 px-4 py-2">{company.location}</span>
                  <span className="rounded-lg border border-white/15 bg-white/10 px-4 py-2">{company.size}</span>
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.07] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Open jobs', companyJobs.length || company.jobs],
                    ['Followers', followerCount],
                    ['Rating', `${company.rating || 0}/5`],
                    ['Employees', company.employees]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.08] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{label}</p>
                      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followBusy || following}
                  className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg px-4 text-sm font-semibold shadow-sm transition ${
                    following
                      ? 'border border-white/15 bg-white/15 text-white'
                      : 'bg-sky-500 text-white hover:bg-sky-600'
                  } ${followBusy ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {followBusy ? 'Updating...' : following ? 'Following' : 'Follow'}
                </button>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => openFollowList('followers')} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
                    View followers
                  </button>
                  <button type="button" onClick={() => openFollowList('following')} className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15">
                    View following
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Overview</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">About {company.name}</h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{company.about}</p>
                  </div>
                  {company.website && (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      Visit website
                    </a>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Culture</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-950">Working at {company.name}</h2>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{company.culture}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Company facts</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {[
                      ['Founded', company.founded],
                      ['Headquarters', company.headquarters],
                      ['Industry', company.industry],
                      ['Company size', company.size]
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-4 py-3">
                        <span className="text-slate-500">{label}</span>
                        <span className="text-right font-semibold text-slate-900">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {company.benefits.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Benefits</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">Benefits and perks</h2>
                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {company.benefits.map((benefit, index) => (
                      <div key={`${benefit}-${index}`} className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        {benefit}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div id="open-jobs" className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)] sm:p-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Open roles</p>
                    <h2 className="mt-2 text-2xl font-bold text-slate-950">Jobs at {company.name}</h2>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{companyJobs.length} listed</span>
                </div>

                {companyJobs.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {companyJobs.map((job) => (
                      <article key={job.id} className="rounded-lg border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-5 transition hover:border-sky-200">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-semibold text-slate-950">{job.title}</h3>
                              {job.is_urgent && (
                                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                                  Urgent
                                </span>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{job.location || 'Remote'}</span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{formatJobSalary(job)}</span>
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1">{job.type || job.employment_type || 'Full-time'}</span>
                            </div>
                            {job.description && (
                              <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{job.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-[#10233f] px-4 text-sm font-semibold text-white transition hover:bg-[#183761]"
                          >
                            View details
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <h3 className="text-lg font-semibold text-slate-950">No open positions right now</h3>
                    <p className="mt-2 text-sm text-slate-600">Follow this company to get notified when new jobs are posted.</p>
                  </div>
                )}
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
                <h3 className="text-lg font-semibold text-slate-950">Profile actions</h3>
                <button
                  type="button"
                  onClick={() => document.getElementById('open-jobs')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  View open positions
                </button>
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={followBusy || following}
                  className={`mt-3 inline-flex h-11 w-full items-center justify-center rounded-lg border px-4 text-sm font-semibold transition ${
                    following
                      ? 'border-slate-200 bg-slate-100 text-slate-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700'
                  } ${followBusy ? 'cursor-not-allowed opacity-70' : ''}`}
                >
                  {followBusy ? 'Updating...' : following ? 'Following' : 'Follow'}
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.35)]">
                <h3 className="text-lg font-semibold text-slate-950">Similar companies</h3>
                <div className="mt-4 space-y-3">
                  {companies
                    .filter(c => c.id !== company.id && c.industry === company.industry)
                    .slice(0, 3)
                    .map((similarCompany) => (
                      <button
                        key={similarCompany.id}
                        type="button"
                        onClick={() => router.push(`/companies/${similarCompany.id}`)}
                        className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-white"
                      >
                        <span>
                          <span className="block text-sm font-semibold text-slate-900">{similarCompany.name}</span>
                          <span className="text-xs text-slate-500">{similarCompany.location}</span>
                        </span>
                        <span className="text-sm font-semibold text-sky-700">View</span>
                      </button>
                    ))}
                  {companies.filter(c => c.id !== company.id && c.industry === company.industry).length === 0 && (
                    <p className="text-sm text-slate-500">No similar companies available.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
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
            ) : followList.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">No {followListType} yet.</p>
            ) : (
              <div className="max-h-[420px] space-y-3 overflow-y-auto">
                {followList.map((item) => (
                  <button key={item.id} type="button" onClick={() => router.push(`/users/${item.id}`)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 p-3 text-left hover:bg-slate-50">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-bold">{String(item.name || 'U').slice(0, 1)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold">{item.name || 'User'}</span>
                      <span className="block truncate text-xs text-slate-500">{item.desiredJobRole || item.email || 'TrueHire user'}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )

  return (
   <>
     <Head>
        <title>{company.name} — TrueHire</title>
        <meta name="description" content={`Learn about ${company.name} and explore career opportunities. ${company.description}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Company Header */}
        <div className="gradient-bg py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <img src={company.logo} alt={company.name} className="w-24 h-24 rounded-xl object-cover" />
              <div className="flex-1">
                <div className="flex flex-col gap-4 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{company.name}</h1>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleFollowToggle}
                      disabled={followBusy}
                      className={`inline-flex min-w-[150px] items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition ${
                        following
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } ${followBusy ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {followBusy ? 'Updating...' : following ? 'Following ✓' : 'Follow Company'}
                    </button>
                    <span className="text-sm font-medium text-gray-600">
                      {followerCount} {followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                  </div>
                </div>
                {toast && (
                  <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
                    toast.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {toast.message}
                  </div>
                )}
                <div className="mb-4 flex items-center">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className={`w-5 h-5 ${i < Math.floor(company.rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-lg text-gray-600 ml-2">{company.rating}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                    </svg>
                    {company.industry}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    {company.location}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/>
                    </svg>
                    {company.employees} employees
                  </div>
                </div>
                <p className="text-gray-600 text-lg">{company.description}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About {company.name}</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{company.about}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Company Details</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Founded:</span> {company.founded}</p>
                      <p><span className="font-medium">Headquarters:</span> {company.headquarters}</p>
                      <p><span className="font-medium">Industry:</span> {company.industry}</p>
                      <p><span className="font-medium">Company Size:</span> {company.size}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Quick Links</h3>
                    <div className="space-y-2">
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                        Visit Website →
                      </a>
                      <p className="text-gray-600 text-sm">{companyJobs.length || company.jobs} open positions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Culture */}
              <div id="open-jobs" className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Culture</h2>
                <p className="text-gray-700 leading-relaxed">{company.culture}</p>
              </div>

              {/* Benefits */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Benefits & Perks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
                      </svg>
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Jobs */}
              <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Open Positions at {company.name}</h2>
                {companyJobs.length > 0 ? (
                  <div className="space-y-4">
                    {companyJobs.map((job) => (
                    <div
                        key={job.id}
                        className="border rounded-lg p-6 hover:border-blue-300 transition-colors border-gray-200"
                      >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                                  {job.is_urgent && (
                                    <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wide rounded-full bg-[#fff3ec] text-[#b9391c] border border-[#f76e2f]">
                                      Urgent Hiring
                                    </span>
                                  )}
                                </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                {job.location}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                                </svg>
                                {formatJobSalary(job)}
                              </span>
                              <span className="flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                                </svg>
                                {job.type || job.employment_type || 'Full-time'}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{job.description}</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {(job.skills || String(job.skills_required || '').split(',').filter(Boolean)).slice(0, 3).map((skill) => (
                                <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <button
                            onClick={() => router.push(`/jobs/${job.id}`)}
                            className="btn btn-primary text-sm ml-4"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H8a2 2 0 01-2-2V6m8 0H8m0 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Open Positions</h3>
                    <p className="text-gray-600">There are currently no open positions at {company.name}. Check back later for new opportunities.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Founded</span>
                    <span className="font-medium">{company.founded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employees</span>
                    <span className="font-medium">{company.employees}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Open Positions</span>
                    <span className="font-medium text-blue-600">{companyJobs.length || company.jobs}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-medium text-emerald-600">{followerCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">{company.rating}/5</span>
                  </div>
                </div>
              </div>

              {/* Apply Now */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-md p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Ready to Join {company.name}?</h3>
                <p className="text-blue-100 mb-4">Explore our open positions and start your journey with us.</p>
                <button
                  onClick={() => document.getElementById('open-jobs').scrollIntoView({ behavior: 'smooth' })}
                  className="w-full bg-white text-blue-600 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  View Open Positions
                </button>
              </div>

              {/* Similar Companies */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Companies</h3>
                <div className="space-y-3">
                  {companies.filter(c => c.id !== company.id && c.industry === company.industry).slice(0, 3).map((similarCompany) => (
                    <div key={similarCompany.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img src={similarCompany.logo} alt={similarCompany.name} className="w-8 h-8 rounded object-cover mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{similarCompany.name}</p>
                          <p className="text-gray-600 text-xs">{similarCompany.location}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/companies/${similarCompany.id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        View →
                      </button>
                    </div>
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

