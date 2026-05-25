import React, { useCallback, useEffect, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import { useAuth } from "../../../context/AuthContext"
import apiService from "../../../utils/api"
import {
  checkCompanyFavourited,
  favouriteCompany,
  getFavouriteCompanies,
  unfavouriteCompany
} from "../../../utils/favourite-companies"

export default function CompaniesPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [search, setSearch] = useState("")
  const [industryFilter, setIndustryFilter] = useState("All")
  const [sizeFilter, setSizeFilter] = useState("All")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ratingsByCompany, setRatingsByCompany] = useState({})
  const [companyRatingStats, setCompanyRatingStats] = useState({})
  const [favoriteCompanies, setFavoriteCompanies] = useState({})
  const [favoriteBusyByCompany, setFavoriteBusyByCompany] = useState({})
  const [followedCompanies, setFollowedCompanies] = useState({})
  const [followCounts, setFollowCounts] = useState({})
  const [followBusyByCompany, setFollowBusyByCompany] = useState({})
  const [toastMessage, setToastMessage] = useState("")

  const loadCompanies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiService.request("/recruiters/companies")
      setCompanies(data?.companies || [])
    } catch (err) {
      console.error("Failed to load companies:", err)
      setError("Unable to load companies right now. Please try again shortly.")
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCompanies()
  }, [loadCompanies])

  const applyFilters = useCallback(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const normalizedIndustryFilter = industryFilter.trim().toLowerCase()
    const normalizedSizeFilter = sizeFilter.trim().toLowerCase()

    const result = companies.filter((company) => {
      const companyName = (company?.company_name || "").toString().trim().toLowerCase()
      const companyIndustry = (company?.industry || "").toString().trim().toLowerCase()
      const companySize = (company?.company_size || "").toString().trim().toLowerCase()
      const nameMatch = normalizedSearch === "" || companyName.includes(normalizedSearch)
      const industryMatch = normalizedIndustryFilter === "all" || companyIndustry === normalizedIndustryFilter
      const sizeMatch = normalizedSizeFilter === "all" || companySize === normalizedSizeFilter
      return nameMatch && industryMatch && sizeMatch
    })

    setFilteredCompanies(result)
  }, [companies, industryFilter, search, sizeFilter])

  useEffect(() => {
    applyFilters()
  }, [applyFilters])

  const clearFilters = () => {
    setSearch("")
    setIndustryFilter("All")
    setSizeFilter("All")
  }

  const resolveCompanyId = (company) => {
    const id = company?.id ?? company?.recruiter_id ?? company?.company_id
    if (id === undefined || id === null) return null
    const numericId = Number(id)
    return Number.isNaN(numericId) ? null : numericId
  }

  const getCompanyKey = (company) => {
    const resolvedId = resolveCompanyId(company)
    return resolvedId ?? company?.company_name ?? "unknown-company"
  }
  const hasAuthToken = Boolean(apiService.getToken())
  const canUseCompanyFavorites = isAuthenticated || hasAuthToken
  const normalizedRole = String(user?.role || "").toLowerCase().replace(/_/g, "-")
  const canManageCompanyRatings = normalizedRole === "user"
  const canFollowCompanies = canManageCompanyRatings && (isAuthenticated || hasAuthToken)

  const getLogo = (logo) => {
    if (!logo) return "/placeholder.png"
    if (logo.startsWith("http")) return logo
    const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "").replace(/\/api$/, "") || ""
    if (logo.startsWith("/")) return `${API_BASE}${logo}`
    return `${API_BASE}/${logo}`
  }

  const syncFavoriteCompanies = useCallback(async () => {
    if (!canUseCompanyFavorites) {
      setFavoriteCompanies({})
      return
    }

    if (!companies.length) {
      setFavoriteCompanies({})
      return
    }

    const fetchedFavoriteKeys = {}

    try {
      const savedListResponse = await getFavouriteCompanies()
      if (!savedListResponse?.error) {
        const savedSet = new Set((savedListResponse?.data || []).map((item) => String(item.company_id)))
        companies.forEach((company) => {
          const companyId = resolveCompanyId(company)
          const companyKey = getCompanyKey(company)
          if (companyId && savedSet.has(String(companyId))) {
            fetchedFavoriteKeys[companyKey] = true
          }
        })
      }
    } catch (err) {
      console.error("Failed to fetch saved companies list:", err)
    }

    await Promise.all(
      companies.map(async (company) => {
        const companyId = resolveCompanyId(company)
        const companyKey = getCompanyKey(company)
        if (!companyId || !companyKey) return
        try {
          const response = await checkCompanyFavourited(companyId)
          if (response?.error) return
          if (response?.favourited || response?.data?.favourited) {
            fetchedFavoriteKeys[companyKey] = true
          }
        } catch (err) {
          console.error("Failed to check company saved state:", err)
        }
      })
    )

    setFavoriteCompanies(fetchedFavoriteKeys)
  }, [canUseCompanyFavorites, companies])

  const loadRatingSummary = useCallback(async () => {
    try {
      const response = await apiService.request("/recruiters/companies/ratings", {
        returnErrorObject: true
      })
      if (response?.error) {
        setCompanyRatingStats({})
        return
      }
      const ratings = response?.ratings || []
      const summary = ratings.reduce((acc, item) => {
        acc[item.company_id] = {
          average: Number(item.average_rating || 0),
          count: Number(item.ratings_count || 0)
        }
        return acc
      }, {})
      setCompanyRatingStats(summary)
    } catch (err) {
      console.error("Failed to load company ratings:", err)
      setCompanyRatingStats({})
    }
  }, [])

  const loadUserRatings = useCallback(async () => {
    if (!isAuthenticated || !canManageCompanyRatings) {
      setRatingsByCompany({})
      return
    }
    try {
      const response = await apiService.request("/recruiters/companies/ratings/me", {
        returnErrorObject: true
      })
      if (response?.error) {
        setRatingsByCompany({})
        return
      }
      const ratings = response?.ratings || []
      const mapped = ratings.reduce((acc, item) => {
        acc[item.company_id] = Number(item.rating || 0)
        return acc
      }, {})
      setRatingsByCompany(mapped)
    } catch (err) {
      console.error("Failed to load user ratings:", err)
      setRatingsByCompany({})
    }
  }, [canManageCompanyRatings, isAuthenticated])

  const handleRateCompany = async (companyId, rating) => {
    if (!isAuthenticated || !canManageCompanyRatings) {
      router.push("/login")
      return
    }
    if (!companyId) return
    const previousRating = ratingsByCompany[companyId] || 0
    setRatingsByCompany((prev) => ({ ...prev, [companyId]: rating }))
    try {
      const response = await apiService.request(`/recruiters/companies/${companyId}/ratings`, {
        method: "POST",
        body: JSON.stringify({ rating }),
        returnErrorObject: true
      })
      if (response?.error) {
        console.error("Failed to submit rating:", response.error, response.details)
        setRatingsByCompany((prev) => {
          const next = { ...prev }
          if (previousRating) {
            next[companyId] = previousRating
          } else {
            delete next[companyId]
          }
          return next
        })
        return
      }
      setCompanyRatingStats((prev) => ({
        ...prev,
        [companyId]: {
          average: Number(response?.average_rating || prev?.[companyId]?.average || 0),
          count: Number(response?.ratings_count || prev?.[companyId]?.count || 0)
        }
      }))
    } catch (err) {
      console.error("Failed to submit rating:", err)
      setRatingsByCompany((prev) => {
        const next = { ...prev }
        if (previousRating) {
          next[companyId] = previousRating
        } else {
          delete next[companyId]
        }
        return next
      })
    }
  }

  const getAverageRating = (companyId) => {
    const stats = companyRatingStats[companyId]
    return stats?.average || 0
  }

  const getRatingCount = (companyId) => {
    const stats = companyRatingStats[companyId]
    return stats?.count || 0
  }

  const handleRatingClick = (companyId, value) => {
    if (!isAuthenticated || !canManageCompanyRatings) {
      router.push("/login")
      return
    }
    handleRateCompany(companyId, value)
  }

  const handleViewJobs = (companyId) => {
    if (!companyId) return
    router.push(`/companies/${companyId}/jobs`)
  }

  const showToast = (message) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(""), 3000)
  }

  const syncFollowedCompanies = useCallback(async () => {
    if (!canFollowCompanies) {
      setFollowedCompanies({})
      setFollowCounts({})
      return
    }

    const nextFollowed = {}
    const nextCounts = {}

    await Promise.all(
      companies.map(async (company) => {
        const companyId = resolveCompanyId(company)
        const companyKey = getCompanyKey(company)
        if (!companyId || !companyKey) return

        const response = await apiService.getCompanyFollowStatus(companyId)
        if (response?.error) return
        if (response.following) nextFollowed[companyKey] = true
        nextCounts[companyKey] = Number(response.followerCount || 0)
      })
    )

    setFollowedCompanies(nextFollowed)
    setFollowCounts(nextCounts)
  }, [canFollowCompanies, companies])

  const toggleFollow = async (event, company) => {
    event?.stopPropagation?.()

    const companyId = resolveCompanyId(company)
    const companyKey = getCompanyKey(company)
    if (!companyId || !companyKey) {
      showToast("Invalid company id.")
      return
    }

    if (!canFollowCompanies) {
      router.push("/login")
      return
    }

    if (followBusyByCompany[companyKey]) return

    const wasFollowing = Boolean(followedCompanies[companyKey])
    setFollowBusyByCompany((prev) => ({ ...prev, [companyKey]: true }))
    setFollowedCompanies((prev) => {
      const next = { ...prev }
      if (wasFollowing) {
        delete next[companyKey]
      } else {
        next[companyKey] = true
      }
      return next
    })

    const response = wasFollowing
      ? await apiService.unfollowCompany(companyId)
      : await apiService.followCompany(companyId)

    if (response?.error) {
      setFollowedCompanies((prev) => {
        const next = { ...prev }
        if (wasFollowing) {
          next[companyKey] = true
        } else {
          delete next[companyKey]
        }
        return next
      })
      showToast(response.message || response.error || "Unable to update follow status.")
    } else {
      setFollowedCompanies((prev) => {
        const next = { ...prev }
        if (response.following) {
          next[companyKey] = true
        } else {
          delete next[companyKey]
        }
        return next
      })
      setFollowCounts((prev) => ({
        ...prev,
        [companyKey]: Number(response.followerCount || 0)
      }))
      showToast(response.message || (response.following ? "Company followed successfully." : "Company unfollowed successfully."))
    }

    setFollowBusyByCompany((prev) => {
      const next = { ...prev }
      delete next[companyKey]
      return next
    })
  }

  const toggleFavorite = async (event, company) => {
    event?.stopPropagation?.()

    const companyId = resolveCompanyId(company)
    const companyKey = getCompanyKey(company)
    if (!companyId || !companyKey) {
      alert("Invalid company id.")
      return
    }

    if (!canUseCompanyFavorites) {
      router.push("/login")
      return
    }

    if (favoriteBusyByCompany[companyKey]) {
      return
    }

    const wasFavorite = Boolean(favoriteCompanies[companyKey])

    setFavoriteBusyByCompany((prev) => ({ ...prev, [companyKey]: true }))
    setFavoriteCompanies((prev) => {
      const next = { ...prev }
      if (wasFavorite) {
        delete next[companyKey]
      } else {
        next[companyKey] = true
      }
      return next
    })

    try {
      const response = wasFavorite
        ? await unfavouriteCompany(companyId)
        : await favouriteCompany(companyId)

      if (response?.error) {
        console.error("Failed to toggle company favorite:", response.error, response.details)
        setFavoriteCompanies((prev) => {
          const next = { ...prev }
          if (wasFavorite) {
            next[companyKey] = true
          } else {
            delete next[companyKey]
          }
          return next
        })
        if (response?.status === 403) {
          alert("Only user accounts can favorite companies.")
        } else if (response?.status === 401) {
          alert("Please log in to favorite companies.")
        } else {
          alert(response.error || "Unable to update favorite company right now.")
        }
      }
    } catch (err) {
      console.error("Failed to toggle company favorite:", err)
      setFavoriteCompanies((prev) => {
        const next = { ...prev }
        if (wasFavorite) {
          next[companyKey] = true
        } else {
          delete next[companyKey]
        }
        return next
      })
      alert("Unable to update favorite company right now.")
    } finally {
      setFavoriteBusyByCompany((prev) => {
        const next = { ...prev }
        delete next[companyKey]
        return next
      })
    }
  }

  useEffect(() => {
    loadRatingSummary()
  }, [loadRatingSummary])

  useEffect(() => {
    loadUserRatings()
  }, [loadUserRatings])

  useEffect(() => {
    syncFavoriteCompanies()
  }, [syncFavoriteCompanies])

  useEffect(() => {
    syncFollowedCompanies()
  }, [syncFollowedCompanies])

  const industriesCount = new Set(
    companies
      .map((company) => (company?.industry || "").toString().trim())
      .filter(Boolean)
  ).size
  const savedCompaniesCount = Object.values(favoriteCompanies).filter(Boolean).length
  const ratedCompaniesCount = Object.keys(companyRatingStats).length
  const summaryCards = [
    { label: "Companies", value: companies.length, caption: "Verified employers", accent: "from-cyan-500 to-sky-500", surface: "bg-cyan-50 text-cyan-700" },
    { label: "Industries", value: industriesCount, caption: "Hiring categories", accent: "from-indigo-500 to-blue-500", surface: "bg-indigo-50 text-indigo-700" },
    { label: "Saved", value: savedCompaniesCount, caption: "Your favorites", accent: "from-emerald-500 to-teal-500", surface: "bg-emerald-50 text-emerald-700" },
    { label: "Rated", value: ratedCompaniesCount, caption: "Community signal", accent: "from-amber-500 to-orange-500", surface: "bg-amber-50 text-amber-700" }
  ]

  return (
    <>
      <Head>
        <title>Top Companies | TrueHire</title>
        <meta
          name="description"
          content="Browse verified employers, innovative teams, and organizations hiring through TrueHire."
        />
      </Head>

      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ecfeff_100%)] text-slate-900">
        {toastMessage && (
          <div className="fixed right-4 top-4 z-50 max-w-sm rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-[0_18px_45px_-24px_rgba(15,23,42,0.45)]">
            {toastMessage}
          </div>
        )}
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
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                  Employers
                </div>
                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  Find teams worth building your career with.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Explore verified employers, compare culture signals, and open roles from one focused company directory.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {summaryCards.map((card) => (
                  <div
                    key={card.label}
                    className="relative overflow-hidden rounded-2xl border border-white/80 bg-white/90 px-5 py-5 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.5)] transition hover:-translate-y-1"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.accent}`} />
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{card.label}</p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${card.surface}`}>Live</span>
                    </div>
                    <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{card.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{card.caption}</p>
                  </div>
                ))}
              </div>
              {/* previous summary markup replaced by cards above */}
              <div className="hidden rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
                <div className="grid grid-cols-2 gap-3">
                  {summaryCards.map((card, index) => (
                    <div
                      key={card.label}
                      className={`rounded-lg border border-white/10 bg-white/[0.08] px-4 py-4 ${
                        index === 1 ? "bg-[#17365f]" : index === 2 ? "bg-[#27346d]" : index === 3 ? "bg-[#16465f]" : ""
                      }`}
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/55">{card.label}</p>
                      <p className="mt-3 text-3xl font-bold text-white">{card.value}</p>
                      <p className="mt-1 text-xs text-white/60">{card.caption}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <section className="mt-8 overflow-hidden rounded-[28px] border border-white/75 bg-white/80 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.45)] backdrop-blur-xl">
            <div className="border-b border-slate-200/80 bg-white/70 px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Company explorer</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Showing <span className="font-semibold text-slate-900">{filteredCompanies.length}</span> matching companies.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={loadCompanies}
                    className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-cyan-200 hover:text-cyan-700"
                  >
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1fr)]">
                <div className="space-y-2 min-w-0">
                  <label htmlFor="company-search" className="text-xs font-medium text-slate-700">
                    Search Companies
                  </label>
                  <div className="relative min-w-0">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg
                        className="h-4 w-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="company-search"
                      className="block h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                      placeholder="Search by company name, culture, or mission"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2 min-w-0">
                  <label htmlFor="industry-filter" className="text-xs font-medium text-slate-700">
                    Industry
                  </label>
                  <select
                    id="industry-filter"
                    className="block h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    value={industryFilter}
                    onChange={(e) => setIndustryFilter(e.target.value)}
                  >
                    <option value="All">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Retail">Retail</option>
                    <option value="Education">Education</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Manufacturing">Manufacturing</option>
                  </select>
                </div>

                <div className="space-y-2 min-w-0">
                  <label htmlFor="size-filter" className="text-xs font-medium text-slate-700">
                    Company Size
                  </label>
                  <select
                    id="size-filter"
                    className="block h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-3 text-sm shadow-sm transition focus:border-cyan-300 focus:ring-4 focus:ring-cyan-100"
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                  >
                    <option value="All">All Sizes</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>

              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center px-6 py-20">
                <div className="relative">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"></div>
                  <div
                    className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-slate-500"
                    style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                  ></div>
                </div>
                <p className="mt-5 text-sm font-medium text-slate-600">Gathering companies...</p>
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-red-100 bg-red-50 p-10 text-center">
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-red-100 bg-white">
                  <svg className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-950">Unable to load companies</h3>
                <p className="mx-auto mb-6 max-w-md text-sm text-slate-600">{error}</p>
                <button
                  onClick={loadCompanies}
                  className="mx-auto inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Try Again
                </button>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-100 bg-cyan-50 text-cyan-700">
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l3-3 3 3m-3-3v7m0-14V7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-950">No companies matched</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
                  We could not find any companies that match your current filters. Try resetting filters or broadening
                  your search.
                </p>
                <button
                  onClick={clearFilters}
                  className="mx-auto mt-6 inline-flex items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 bg-slate-50/80 p-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCompanies.map((company) => {
                  const companyId = resolveCompanyId(company)
                  const companyKey = getCompanyKey(company)
                  const isFavorite = Boolean(favoriteCompanies[companyKey])
                  const isFavoriteBusy = Boolean(favoriteBusyByCompany[companyKey])
                  const isFollowing = Boolean(followedCompanies[companyKey])
                  const isFollowBusy = Boolean(followBusyByCompany[companyKey])
                  const followerCount = Number(followCounts[companyKey] || 0)
                  const shortOverview = (company.short_overview || "").toString().trim()
                  const detailedDescription = (company.detailed_description || "").toString().trim()
                  return (
                  <article
                    key={companyId || company.company_name}
                    className="relative flex min-h-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_22px_55px_-38px_rgba(15,23,42,0.55)]"
                  >
                    <button
                      type="button"
                      onClick={(event) => toggleFavorite(event, company)}
                      aria-pressed={isFavorite}
                      aria-label={`${isFavorite ? "Unfavorite" : "Favorite"} ${company.company_name || "company"}`}
                      disabled={isFavoriteBusy}
                      className={`pointer-events-auto absolute right-4 top-4 z-20 rounded-full border px-2.5 py-2 shadow-sm transition ${
                        isFavorite
                          ? "border-rose-200 bg-rose-50 text-rose-600"
                          : "border-white/20 bg-white/95 text-slate-500 hover:text-rose-500"
                      } ${isFavoriteBusy ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill={isFavorite ? "currentColor" : "none"}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 21s-7-4.35-9-9a5.1 5.1 0 0 1 9-5 5.1 5.1 0 0 1 9 5c-2 4.65-9 9-9 9z" />
                      </svg>
                    </button>
                    <div className="relative border-b border-slate-900/10 bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-900 px-5 pb-6 pt-5 pr-16 text-white">
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-indigo-400 to-emerald-300" />
                      <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-white shadow-sm">
                        <img
                          src={getLogo(company.company_logo)}
                          alt={`${company.company_name || "Company"} logo`}
                          className="h-11 max-w-[46px] object-contain"
                        />
                      </div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#93c5fd]">Company</p>
                      <h3 className="mt-2 line-clamp-2 text-2xl font-semibold leading-8 text-white">
                        {company.company_name || "Unnamed Company"}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-white/75">
                        <span>{company.industry || "Industry not specified"}</span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col px-5 py-5">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Size</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {company.company_size ? `${company.company_size}` : "Not specified"}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-3 py-2">
                          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Status</p>
                          <p className="mt-1 text-sm font-semibold text-[#0369a1]">Hiring now</p>
                        </div>
                      </div>
                      {(shortOverview || detailedDescription) ? (
                        <div className="mt-4 min-h-[72px] space-y-2">
                          {shortOverview && (
                            <div>
                              <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-800">{shortOverview}</p>
                            </div>
                          )}
                          {detailedDescription && (
                            <div>
                              <p className="line-clamp-3 text-sm leading-6 text-slate-600">{detailedDescription}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="mt-4 min-h-[72px]">
                          <p className="text-sm text-slate-500">Overview not provided.</p>
                        </div>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[#e0f2fe] px-3 py-1 text-xs font-semibold text-sky-700">
                          Verified
                        </span>
                        <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-indigo-700">
                          Hiring Now
                        </span>
                      </div>
                      <div className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-semibold uppercase tracking-[0.2em] text-slate-400">
                            Ratings
                          </span>
                          <span>
                            {getAverageRating(companyId).toFixed(1)} / 5
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                          {[1, 2, 3, 4, 5].map((value) => {
                            const userRating = ratingsByCompany[companyId] || 0
                            const averageRating = getAverageRating(companyId)
                            const displayRating = userRating > 0 ? userRating : averageRating
                            const isActive = displayRating >= value
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleRatingClick(companyId, value)}
                                className={`h-8 w-8 rounded-xl border transition ${
                                  isActive
                                    ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                                    : "border-slate-200 bg-white text-slate-300 hover:text-slate-400"
                                }`}
                                aria-label={`Rate ${company.company_name || "company"} ${value} stars`}
                              >
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="mx-auto h-4 w-4"
                                  aria-hidden="true"
                                >
                                  <path d="M12 2l2.9 6.3 6.9.9-5 4.9 1.3 7-6.1-3.4-6.1 3.4 1.3-7-5-4.9 6.9-.9L12 2z" />
                                </svg>
                              </button>
                            )
                          })}
                          <span className="ml-2 text-xs text-slate-500">
                            {getRatingCount(companyId)} ratings
                          </span>
                        </div>
                        {!canManageCompanyRatings && (
                          <p className="text-xs text-slate-500">Log in with a user account to rate this company.</p>
                        )}
                      </div>
                      <div className="mt-auto flex flex-wrap gap-2 pt-5">
                        <button
                          type="button"
                          onClick={(event) => toggleFollow(event, company)}
                          disabled={isFollowBusy}
                          className={`inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold shadow-sm transition ${
                            isFollowing
                              ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "border border-slate-950 bg-slate-950 text-white hover:bg-cyan-800"
                          } ${isFollowBusy ? "cursor-not-allowed opacity-60" : ""}`}
                        >
                          {isFollowBusy ? "Updating..." : isFollowing ? "Following ✓" : "Follow"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleViewJobs(companyId)}
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-800"
                        >
                          View Jobs
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h6m-6 6h6m-6 6h6" />
                          </svg>
                        </button>
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noreferrer"
                          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:text-cyan-700"
                          >
                            Website
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l14-14" />
                            </svg>
                          </a>
                        )}
                      </div>
                      <p className="mt-3 text-xs font-medium text-slate-500">
                        {followerCount} {followerCount === 1 ? "follower" : "followers"}
                      </p>
                    </div>
                  </article>
                )})}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  )
}



