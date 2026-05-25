import Head from 'next/head'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import Header from '../../../Portal/Header'
import { Hero, Stats, Testimonials } from '../index'
import { FeaturedJobs } from '../../jobs'
import Footer from '../../../Portal/Footer'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { gsap } from 'gsap'
import apiService from '../../../lib/api'
import { initParallax } from '../../../utils/parallax'
import { useAuth } from '../../../context/AuthContext'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAll, setShowAll] = useState(false)
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(true)
  const [companiesError, setCompaniesError] = useState(null)
  const [ratingsByCompany, setRatingsByCompany] = useState({})
  const [companyRatingStats, setCompanyRatingStats] = useState({})
  const companiesListRef = useRef(null)
  const companiesInnerRef = useRef(null)
  const companiesTickerRef = useRef(null)
  const companiesXRef = useRef(0)
  const companiesLoopWidthRef = useRef(0)
  const companiesBaseSpeedRef = useRef(0.6)
  const companiesSpeedRef = useRef(0.6)
  const companiesStepWidthRef = useRef(0)
  const companiesSurfacesRef = useRef([])
  const companiesActiveIndexRef = useRef(0)
  const companiesDirectionRef = useRef(1)
  const companiesInitRef = useRef(false)
  const companiesLastCountRef = useRef(0)
  const [canScrollCompaniesLeft, setCanScrollCompaniesLeft] = useState(false)
  const [canScrollCompaniesRight, setCanScrollCompaniesRight] = useState(false)
  const normalizedRole = String(user?.role || '').toLowerCase().replace(/_/g, '-')
  const canManageCompanyRatings = normalizedRole === 'user'
  const canRateCompanies = isAuthenticated && canManageCompanyRatings
  const featuredCompanies = useMemo(() => {
    const map = new Map()
    companies.forEach((company) => {
      const nameKey = String(company?.company_name || company?.name || '')
        .trim()
        .toLowerCase()
      if (!nameKey) return
      if (!map.has(nameKey)) {
        map.set(nameKey, company)
      }
    })
    return Array.from(map.values())
  }, [companies])

  const resolveCompanyId = (company) => {
    const id = company?.id ?? company?.recruiter_id ?? company?.company_id
    if (id === undefined || id === null) return null
    const numericId = Number(id)
    return Number.isNaN(numericId) ? null : numericId
  }

  const handleRatingClick = async (companyId, ratingValue) => {
    if (!companyId) return
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
    if (!canManageCompanyRatings) return

    const previousRating = Number(ratingsByCompany[companyId] || 0)
    setRatingsByCompany((prev) => ({ ...prev, [companyId]: ratingValue }))

    try {
      const response = await apiService.request(`/recruiters/companies/${companyId}/ratings`, {
        method: 'POST',
        body: JSON.stringify({ rating: ratingValue }),
        returnErrorObject: true
      })

      if (response?.error) {
        throw new Error(response.error || 'Unable to submit rating')
      }

      setCompanyRatingStats((prev) => ({
        ...prev,
        [companyId]: {
          average: Number(response?.average_rating || prev?.[companyId]?.average || 0),
          count: Number(response?.ratings_count || prev?.[companyId]?.count || 0)
        }
      }))
    } catch (submitError) {
      console.error('Failed to submit company rating:', submitError)
      setRatingsByCompany((prev) => ({
        ...prev,
        [companyId]: previousRating
      }))
    }
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

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await apiService.request('/jobs?limit=50') // Fetch more jobs for expansion
        const resolvedJobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.jobs)
            ? response.jobs
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.results)
                ? response.results
                : []
        setJobs(resolvedJobs.filter((job) => !isJobExpired(job)))
      } catch (error) {
        console.error('Error fetching jobs:', error)
        setError('Failed to load jobs. Please try again later.')
        // Fallback to empty array
        setJobs([])
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompaniesLoading(true)
        const response = await apiService.request('/recruiters/companies')
        const resolvedCompanies = Array.isArray(response?.companies)
          ? response.companies
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.data)
              ? response.data
              : []
        const normalizedCompanies = resolvedCompanies.filter((company) => {
          const companyName = String(company?.company_name || company?.name || '').trim()
          return companyName.length > 0
        })

        // Remove duplicate companies (prefer unique id; fallback to normalized name)
        const uniqueCompaniesMap = new Map()
        normalizedCompanies.forEach((company) => {
          const companyId = company?.id ?? company?.recruiter_id ?? company?.company_id
          const companyName = String(company?.company_name || company?.name || '')
            .trim()
            .toLowerCase()
          const key = companyId != null ? `id:${companyId}` : `name:${companyName}`
          if (!uniqueCompaniesMap.has(key)) {
            uniqueCompaniesMap.set(key, company)
          }
        })

        setCompanies(Array.from(uniqueCompaniesMap.values()))
      } catch (fetchError) {
        console.error('Error fetching companies:', fetchError)
        setCompaniesError('Unable to load companies right now.')
        setCompanies([])
      } finally {
        setCompaniesLoading(false)
      }
    }

    fetchCompanies()
  }, [])

  useEffect(() => {
    const loadRatingSummary = async () => {
      try {
        const response = await apiService.request('/recruiters/companies/ratings', {
          returnErrorObject: true
        })
        if (response?.error) return
        const ratings = Array.isArray(response?.ratings) ? response.ratings : []
        const summary = ratings.reduce((acc, item) => {
          acc[item.company_id] = {
            average: Number(item.average_rating || 0),
            count: Number(item.ratings_count || 0)
          }
          return acc
        }, {})
        setCompanyRatingStats(summary)
      } catch (summaryError) {
        console.error('Failed to load company rating summary:', summaryError)
      }
    }
    loadRatingSummary()
  }, [])

  useEffect(() => {
    const loadUserRatings = async () => {
      if (!canRateCompanies) {
        setRatingsByCompany({})
        return
      }
      try {
        const response = await apiService.request('/recruiters/companies/ratings/me', {
          returnErrorObject: true
        })
        if (response?.error) return
        const ratings = Array.isArray(response?.ratings) ? response.ratings : []
        const mapped = ratings.reduce((acc, item) => {
          acc[item.company_id] = Number(item.rating || 0)
          return acc
        }, {})
        setRatingsByCompany(mapped)
      } catch (userRatingsError) {
        console.error('Failed to load user company ratings:', userRatingsError)
      }
    }
    loadUserRatings()
  }, [canRateCompanies])

  const updateCompaniesScrollState = () => {
    const hasMultiple = featuredCompanies.length > 1
    setCanScrollCompaniesLeft(hasMultiple)
    setCanScrollCompaniesRight(hasMultiple)
  }

  const getCompanyStepWidth = () => {
    const list = companiesListRef.current
    if (!list) return 0
    const card = list.querySelector('[data-company-card]')
    if (!card) return 0
    const styleTarget = companiesInnerRef.current || list
    const styles = getComputedStyle(styleTarget)
    const gap = parseFloat(styles.columnGap || styles.gap || '0')
    return card.getBoundingClientRect().width + gap
  }

  const setCompaniesActiveIndex = (nextIndex) => {
    if (companiesActiveIndexRef.current === nextIndex) return
    companiesActiveIndexRef.current = nextIndex
    const surfaces = companiesSurfacesRef.current
    if (!surfaces || !surfaces.length) return
    const target = String(nextIndex)
    surfaces.forEach((surface) => {
      surface.dataset.active = surface.dataset.companyIndex === target ? 'true' : 'false'
    })
  }

  const handleCompaniesDirection = (direction) => {
    companiesDirectionRef.current = direction
  }

  useEffect(() => {
    const handleResize = () => {
      const inner = companiesInnerRef.current
      if (!inner) return
      const totalWidth = inner.scrollWidth
      companiesLoopWidthRef.current = totalWidth ? totalWidth / 2 : 0
      companiesStepWidthRef.current = getCompanyStepWidth()
      updateCompaniesScrollState()
    }

    updateCompaniesScrollState()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [featuredCompanies.length])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!companiesListRef.current) return
    const companiesChanged = companiesLastCountRef.current !== featuredCompanies.length
    if (!companiesInitRef.current || companiesChanged) {
      companiesInitRef.current = true
      companiesLastCountRef.current = featuredCompanies.length
      companiesDirectionRef.current = 1
      const list = companiesListRef.current
      const inner = list.firstElementChild
      if (!inner) return
      companiesInnerRef.current = inner
      inner.querySelectorAll('[data-clone="true"]').forEach((node) => node.remove())
      const children = Array.from(inner.children)
      // Clone only when there are enough unique cards; avoids visible duplicates
      // when list is very small.
      if (children.length > 3) {
        children.forEach((child) => {
          const clone = child.cloneNode(true)
          clone.setAttribute('data-clone', 'true')
          inner.appendChild(clone)
        })
      }
      const totalWidth = inner.scrollWidth
      companiesLoopWidthRef.current = totalWidth ? totalWidth / 2 : 0
      companiesStepWidthRef.current = getCompanyStepWidth()
      companiesSurfacesRef.current = Array.from(inner.querySelectorAll('[data-company-surface]'))
      companiesXRef.current = 0
      gsap.set(inner, { x: companiesXRef.current })
      setCompaniesActiveIndex(0)
      updateCompaniesScrollState()
    }
    companiesDirectionRef.current = 1
  }, [featuredCompanies.length])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!companiesListRef.current || !companiesInnerRef.current) return
    if (companiesTickerRef.current) return

    const tick = () => {
      if (!companiesLoopWidthRef.current) return
      const delta = gsap.ticker.deltaRatio(60)
      companiesXRef.current += companiesDirectionRef.current * companiesSpeedRef.current * delta
      if (companiesXRef.current <= -companiesLoopWidthRef.current) {
        companiesXRef.current += companiesLoopWidthRef.current
      } else if (companiesXRef.current >= 0) {
        companiesXRef.current -= companiesLoopWidthRef.current
      }
      gsap.set(companiesInnerRef.current, { x: companiesXRef.current })
      if (companiesStepWidthRef.current && featuredCompanies.length) {
        const nextIndex = Math.round(Math.abs(companiesXRef.current) / companiesStepWidthRef.current) % featuredCompanies.length
        setCompaniesActiveIndex(nextIndex)
      }
    }

    companiesTickerRef.current = tick
    gsap.ticker.add(tick)

    return () => {
      if (companiesTickerRef.current) {
        gsap.ticker.remove(companiesTickerRef.current)
        companiesTickerRef.current = null
      }
    }
  }, [featuredCompanies.length])

  const getCompanyLogoUrl = (path) => {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    const configuredBase = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '')
    const effectiveBase = apiService.getEffectiveBaseURL?.() || ''
    const assetBase = (effectiveBase.startsWith('/api') ? configuredBase : effectiveBase).replace(/\/api\/?$/, '')
    if (!assetBase) {
      if (typeof window !== 'undefined') {
        return path.startsWith('/') ? `${window.location.origin}${path}` : `${window.location.origin}/${path}`
      }
      return path.startsWith('/') ? path : `/${path}`
    }
    return path.startsWith('/') ? `${assetBase}${path}` : `${assetBase}/${path}`
  }

  const featuredJobs = [...jobs]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 8)

  useEffect(() => {
    return initParallax('[data-parallax-scope="home"]')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const revealElements = Array.from(document.querySelectorAll('[data-reveal]'))

    if (!revealElements.length) return
    if (prefersReduced) {
      revealElements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    revealElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [featuredJobs.length])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (prefersReduced || isTouch) return

    const tiltCards = Array.from(document.querySelectorAll('[data-tilt]'))
    if (!tiltCards.length) return

    const cleanup = []

    tiltCards.forEach((card) => {
      const state = {
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        rafId: null
      }

      const animate = () => {
        state.currentX += (state.targetX - state.currentX) * 0.08
        state.currentY += (state.targetY - state.currentY) * 0.08

        card.style.transform = `perspective(900px) rotateX(${state.currentX.toFixed(2)}deg) rotateY(${state.currentY.toFixed(2)}deg) translateZ(0)`

        if (Math.abs(state.targetX - state.currentX) + Math.abs(state.targetY - state.currentY) > 0.01) {
          state.rafId = requestAnimationFrame(animate)
        } else {
          state.rafId = null
        }
      }

      const handleMove = (event) => {
        const rect = card.getBoundingClientRect()
        const percentX = (event.clientX - rect.left) / rect.width
        const percentY = (event.clientY - rect.top) / rect.height
        const rotateY = (percentX - 0.5) * 3
        const rotateX = (0.5 - percentY) * 3

        state.targetX = rotateX
        state.targetY = rotateY

        if (!state.rafId) {
          state.rafId = requestAnimationFrame(animate)
        }
      }

      const handleLeave = () => {
        state.targetX = 0
        state.targetY = 0
        if (!state.rafId) {
          state.rafId = requestAnimationFrame(animate)
        }
      }

      card.addEventListener('mousemove', handleMove)
      card.addEventListener('mouseleave', handleLeave)
      card.addEventListener('blur', handleLeave)

      cleanup.push(() => {
        card.removeEventListener('mousemove', handleMove)
        card.removeEventListener('mouseleave', handleLeave)
        card.removeEventListener('blur', handleLeave)
        if (state.rafId) cancelAnimationFrame(state.rafId)
        card.style.transform = ''
      })
    })

    return () => {
      cleanup.forEach((fn) => fn())
    }
  }, [])

  return (
    <>
      <Head>
        <title>TrueHire — Find Your Dream Job with AI-Powered Matching</title>
        <meta name="description" content="Connect with top companies and discover job opportunities that match your skills and career goals. Join thousands of successful professionals." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="jobs, career, employment, hiring, recruitment, AI matching" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main data-parallax-scope="home" className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <Hero />
        <Stats />



        <section data-reveal className="relative overflow-hidden py-24 bg-gradient-to-br from-white via-[#f7f9ff] to-[#eef4ff] reveal-on-scroll">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" aria-hidden="true" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-3xl text-center">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 shadow-[0_18px_45px_-32px_rgba(79,70,229,0.75)] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-500 to-sky-500" />
                Curated roles
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-950 mb-5">
                Featured <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">Opportunities</span>
              </h2>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-7">
                Discover handpicked roles from verified companies, matched for relevance, momentum, and career growth.
              </p>
            </div>

            <div>
              {loading ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-slate-100 bg-white/70 py-14 text-center">
                  <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-100 border-t-indigo-600"></div>
                  <span className="mt-4 text-sm font-medium text-slate-600">Loading featured jobs...</span>
                </div>
              ) : error ? (
                <div className="flex min-h-[280px] flex-col items-center justify-center rounded-[24px] border border-rose-100 bg-rose-50/70 px-6 py-14 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-rose-500 shadow-sm">
                    <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v4m0 4h.01M10.3 3.9 2.9 17.1A2 2 0 0 0 4.6 20h14.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                    </svg>
                  </div>
                  <div className="mb-5 text-sm font-medium text-rose-700">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <FeaturedJobs jobs={featuredJobs} />
              )}
            </div>

            <div className="text-center mt-10">
              <button
                onClick={() => window.location.href = '/jobs'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_22px_45px_-24px_rgba(79,70,229,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_55px_-24px_rgba(79,70,229,1)]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h10" />
                  </svg>
                </span>
                View All Jobs
              </button>
            </div>
          </div>
        </section>

        {/* Featured Companies */}
        <section data-reveal className="relative overflow-hidden py-24 bg-gradient-to-br from-[#F9FAFB] via-[#EEF2FF] to-[#E0E7FF] reveal-on-scroll">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.055)_1px,transparent_1px),linear-gradient(rgba(99,102,241,0.045)_1px,transparent_1px)] bg-[size:52px_52px] opacity-60" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" aria-hidden="true" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative text-center mb-14">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600 shadow-[0_18px_45px_-32px_rgba(79,70,229,0.75)] backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-gradient-to-r from-emerald-500 to-sky-500" />
                Hiring partners
              </div>
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 mb-5">
                Top <span className="text-gradient">Companies</span> Hiring
              </h2>
              <p className="text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-7">
                Join industry leaders and innovative companies that are shaping the future
              </p>
            </div>
            <div className="relative overflow-hidden py-7">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-14 bg-gradient-to-r from-[#f9fafb] via-[#eef2ff]/85 to-transparent sm:w-28" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-14 bg-gradient-to-l from-[#e0e7ff] via-[#eef2ff]/85 to-transparent sm:w-28" />
              <div
                className="company-marquee w-full overflow-hidden py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                style={{ '--company-marquee-duration': `${Math.max(38, featuredCompanies.length * 8)}s` }}
              >
                <div className="company-marquee-track flex w-max flex-nowrap gap-6 will-change-transform">
                  {companiesLoading ? (
                    <div className="w-full text-center text-slate-600 py-6">Loading companies...</div>
                  ) : companiesError ? (
                    <div className="w-full text-center text-slate-600 py-6">{companiesError}</div>
                  ) : companies.length === 0 ? (
                    <div className="w-full text-center text-slate-600 py-6">No companies available right now.</div>
                  ) : (
                    featuredCompanies.map((company, index) => {
                          const companyName = company.company_name || company.name || ''
                          const logo = company.company_logo || company.logo || null
                          const logoUrl = getCompanyLogoUrl(logo)
                          const industry = company.industry || ''
                          const companySize = company.company_size || company.size || ''
                          const companyCategory = (company.category || company.company_category || '').toString().trim()
                          const shortOverview = (company.short_overview || '').toString().trim()
                          const detailedDescription = (company.detailed_description || '').toString().trim()
                          const companyId = resolveCompanyId(company)
                          const ratingAverage = Number(companyRatingStats?.[companyId]?.average ?? company.average_rating ?? 0)
                          const ratingCount = Number(companyRatingStats?.[companyId]?.count ?? company.ratings_count ?? 0)
                          const userRating = Number(ratingsByCompany?.[companyId] || 0)
                          const displayRating = userRating > 0 ? userRating : 0
                          const initials = companyName
                            .split(' ')
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join('')
                            .toUpperCase()
                          const companyLink = companyId ? `/companies/${companyId}` : '/companies'
                          const jobsLink = companyId ? `/companies/${companyId}/jobs` : '/companies'
                          return (
                            <article
                              key={companyId || companyName || index}
                              data-company-card
                              data-company-index={index}
                              className="shrink-0 w-[300px] sm:w-[340px] lg:w-[360px] xl:w-[380px]"
                            >
                              <div
                                role="link"
                                tabIndex={0}
                                onClick={() => {
                                  window.location.href = companyLink
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault()
                                    window.location.href = companyLink
                                  }
                                }}
                                data-company-surface
                                data-company-index={index}
                                className="relative h-full min-h-[475px] cursor-pointer overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_22px_55px_-34px_rgba(15,23,42,0.55)] transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1.5 [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.02] [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_30px_70px_-38px_rgba(15,23,42,0.65)]"
                              >
                                <div className="relative overflow-hidden bg-gradient-to-br from-[#2563eb] via-[#4f46e5] to-[#0891b2] px-5 py-5 text-white">
                                  <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" aria-hidden="true" />
                                  <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/75">Company</p>
                                  <h3 className="mt-2 line-clamp-2 text-2xl font-semibold leading-tight">{companyName || 'Unnamed Company'}</h3>
                                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/85">
                                    <span>{industry || 'Industry not specified'}</span>
                                    {companyCategory && (
                                      <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">
                                        {companyCategory}
                                      </span>
                                    )}
                                  </div>
                                </div>

                            <div className="px-5 py-5 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden">
                                  {logoUrl ? (
                                    <img src={logoUrl} alt={companyName} className="h-12 object-contain" />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-white/80 text-slate-500 flex items-center justify-center text-lg font-semibold shadow-sm">
                                      {initials?.[0] || 'C'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Company Size</p>
                                  <p className="text-3xl font-semibold text-slate-900 leading-tight">
                                    {companySize ? `${companySize} employees` : 'Size not specified'}
                                  </p>
                                </div>
                              </div>

                              {(shortOverview || detailedDescription) ? (
                                <div className="space-y-2">
                                  {shortOverview && (
                                    <p className="text-sm font-semibold leading-relaxed text-slate-900 line-clamp-2">{shortOverview}</p>
                                  )}
                                  {detailedDescription && (
                                    <p className="text-sm font-semibold leading-relaxed text-slate-800 line-clamp-3">{detailedDescription}</p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-slate-600">Overview not provided</p>
                              )}

                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700">
                                  Verified
                                </span>
                                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                  Hiring Now
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-slate-500">
                                  <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">Ratings</span>
                                  <span>{ratingAverage.toFixed(1)} / 5</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {[1, 2, 3, 4, 5].map((value) => {
                                    const isActive = displayRating >= value
                                    return (
                                      <button
                                        key={value}
                                        type="button"
                                        onClick={(event) => {
                                          event.preventDefault()
                                          event.stopPropagation()
                                          handleRatingClick(companyId, value)
                                        }}
                                        disabled={!companyId || (isAuthenticated && !canManageCompanyRatings)}
                                        aria-label={`Rate ${companyName || 'company'} ${value} stars`}
                                        className={`h-8 w-8 rounded-full border inline-flex items-center justify-center ${
                                          isActive ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-slate-200 bg-white text-slate-300'
                                        }`}
                                      >
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                                          <path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.3 7-6.1-3.4-6.1 3.4 1.3-7-5-4.9 6.9-.9L12 2z" />
                                        </svg>
                                      </button>
                                    )
                                  })}
                                  <span className="ml-2 text-xs text-slate-500">{ratingCount} ratings</span>
                                </div>
                                {!isAuthenticated && (
                                  <p className="text-xs text-slate-500">Log in to rate this company.</p>
                                )}
                                {isAuthenticated && !canManageCompanyRatings && (
                                  <p className="text-xs text-slate-500">Only job seeker accounts can rate companies.</p>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <Link
                                  href={jobsLink}
                                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-slate-200 bg-white text-slate-700 font-semibold text-sm shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  View Jobs
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 6h6m-6 6h6" />
                                  </svg>
                                </Link>
                                {company.website && (
                                  <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-[#2563eb] via-[#4f46e5] to-[#0891b2] text-white font-semibold text-sm shadow-lg hover:shadow-2xl transition-all duration-200"
                                  >
                                    Visit Website
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
                                    </svg>
                                  </a>
                                )}
                              </div>
                            </div>
                              </div>
                            </article>
                          )
                        })
                  )}
                </div>
              </div>

              <style jsx>{`
                .company-marquee-track {
                  animation: companyMarquee var(--company-marquee-duration, 48s) linear infinite;
                  transform: translate3d(-100%, 0, 0);
                }

                .company-marquee:hover .company-marquee-track {
                  animation-play-state: paused;
                }

                @keyframes companyMarquee {
                  from {
                    transform: translate3d(-100%, 0, 0);
                  }
                  to {
                    transform: translate3d(100vw, 0, 0);
                  }
                }
              `}</style>
            </div>
            <div className="text-center mt-16">
              <button className="btn btn-secondary px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-shadow duration-300">
                View All Companies
              </button>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section data-reveal className="relative overflow-hidden py-24 bg-gradient-to-br from-white via-[#f7f8ff] to-[#edf4ff] reveal-on-scroll">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.06)_1px,transparent_1px),linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" aria-hidden="true" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-950 mb-5">
                Quick <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">Actions</span>
              </h2>
              <p className="text-base md:text-lg text-slate-600 max-w-2xl mx-auto leading-7">
                Start hiring, build your profile, or explore career resources from one simple launch point.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
              {[
                {
                  title: 'Post a Job',
                  description: 'Find qualified candidates quickly with AI-assisted hiring workflows.',
                  image: '/images/quick-actions/post-job-3d.png',
                  alt: '3D briefcase and job posting illustration',
                  cta: 'Get Started',
                  onClick: () => { window.location.href = '/login' },
                },
                {
                  title: 'Register',
                  description: 'Create a polished profile and unlock smarter job matching.',
                  image: '/images/quick-actions/register-profile-3d.png',
                  alt: '3D profile registration clipboard illustration',
                  cta: 'Sign Up',
                  onClick: () => {
                    const authDropdown = document.querySelector('[data-auth-dropdown]')
                    if (authDropdown) {
                      authDropdown.click()
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                      setTimeout(() => {
                        const dropdown = document.querySelector('.relative [class*="Login / Register"]')
                        if (dropdown) dropdown.click()
                      }, 500)
                    }
                  },
                },
                {
                  title: 'Career Resources',
                  description: 'Access guides, tools, and learning paths to grow your career.',
                  image: '/images/quick-actions/career-resources-3d.png',
                  alt: '3D books and tablet career resources illustration',
                  cta: 'Learn More',
                  onClick: () => { window.location.href = '/career' },
                },
              ].map((action, index) => (
                <motion.article
                  key={action.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative overflow-hidden rounded-[24px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_26px_80px_-52px_rgba(79,70,229,0.85)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_34px_95px_-48px_rgba(79,70,229,1)] sm:p-8"
                >
                  <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent opacity-80" aria-hidden="true" />

                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto mb-7 flex h-52 items-center justify-center"
                  >
                    <img
                      src={action.image}
                      alt={action.alt}
                      loading="lazy"
                      className="h-full w-full object-contain drop-shadow-[0_24px_28px_rgba(79,70,229,0.18)] transition-transform duration-300 group-hover:scale-105"
                    />
                  </motion.div>

                  <h3 className="text-2xl font-semibold tracking-tight text-slate-950">{action.title}</h3>
                  <p className="mx-auto mt-3 min-h-[48px] max-w-xs text-sm leading-6 text-slate-600">{action.description}</p>

                  <button
                    type="button"
                    onClick={action.onClick}
                    className="mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_-22px_rgba(79,70,229,0.95)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_46px_-22px_rgba(79,70,229,1)]"
                  >
                    {action.cta}
                  </button>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

