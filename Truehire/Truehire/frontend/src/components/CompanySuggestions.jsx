import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import apiService from '../services/api'

const getCompanyId = (company) => String(company?.id || company?.recruiter_id || '')
const getCompanyManagePostsHref = (companyId) =>
  companyId ? `/manage-posts?companyId=${encodeURIComponent(companyId)}` : ''

export default function CompanySuggestions({ limit = 10, className = '', onFollowChange }) {
  const router = useRouter()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [followingById, setFollowingById] = useState({})
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadCompanies = async () => {
      setLoading(true)
      setError('')
      try {
        const [companiesResponse, followedResponse] = await Promise.all([
          apiService.request('/recruiters/companies', {
            returnErrorObject: true,
          }),
          apiService.getFollowedCompanies(),
        ])

        if (companiesResponse?.error) {
          throw new Error(companiesResponse.message || companiesResponse.error)
        }

        if (active) {
          const followedCompanies = Array.isArray(followedResponse?.companies)
            ? followedResponse.companies
            : []

          setCompanies(Array.isArray(companiesResponse?.companies) ? companiesResponse.companies : [])
          setFollowingById(
            Object.fromEntries(
              followedCompanies
                .map((company) => getCompanyId(company))
                .filter(Boolean)
                .map((companyId) => [companyId, true]),
            ),
          )
        }
      } catch (loadError) {
        if (active) setError(loadError?.message || 'Unable to load company suggestions.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadCompanies()
    return () => {
      active = false
    }
  }, [])

  const suggestions = useMemo(
    () => companies
      .filter((company) => {
        const companyId = getCompanyId(company)
        return companyId && !followingById[companyId]
      })
      .slice(0, limit),
    [companies, followingById, limit],
  )

  const handleFollow = async (company) => {
    const companyId = getCompanyId(company)
    if (!companyId || busyId) return

    setBusyId(companyId)
    setError('')
    try {
      const response = await apiService.followCompany(companyId)
      if (response?.error) {
        throw new Error(response.message || response.error)
      }

      setFollowingById((current) => ({
        ...current,
        [companyId]: true,
      }))
      onFollowChange?.()
      window.dispatchEvent(new Event('follow-stats-changed'))
    } catch (followError) {
      setError(followError?.message || 'Unable to follow company.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className={`w-fit max-w-full self-center text-slate-950 ${className}`}>
      <div className="mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-slate-400">Companies</p>
        <h2 className="mt-0.5 text-sm font-bold text-slate-950">Suggested Companies</h2>
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex gap-2.5 overflow-hidden">
          {[0, 1, 2].map((item) => (
            <div key={item} className="min-w-[150px] animate-pulse rounded-[18px] border border-slate-200 bg-slate-50 p-2.5">
              <div className="mx-auto h-16 w-16 rounded-full bg-slate-200" />
              <div className="mt-3 space-y-1.5">
                <div className="mx-auto h-2.5 w-20 rounded bg-slate-200" />
                <div className="mx-auto h-2.5 w-16 rounded bg-slate-100" />
              </div>
              <div className="mt-3 h-8 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
          No new company suggestions available
        </p>
      ) : (
        <div className="flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {suggestions.map((company) => {
            const companyId = getCompanyId(company)
            const companyHref = getCompanyManagePostsHref(companyId)
            const isFollowing = Boolean(followingById[companyId])

            return (
              <article
                key={companyId}
                role="button"
                tabIndex={0}
                onClick={() => router.push(companyHref)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    router.push(companyHref)
                  }
                }}
                className="flex min-w-[150px] flex-col rounded-[18px] border border-slate-200 bg-white p-2.5 shadow-sm transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg"
              >
                {company.company_logo ? (
                  <img
                    src={company.company_logo}
                    alt=""
                    className="mx-auto mt-2.5 h-16 w-16 rounded-full object-cover ring-1 ring-slate-200"
                  />
                ) : (
                  <div className="mx-auto mt-2.5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-700 ring-1 ring-slate-200">
                    {String(company.company_name || company.company || 'C').slice(0, 1).toUpperCase()}
                  </div>
                )}

                <div className="mt-3 min-w-0 text-center">
                  <p className="truncate text-xs font-semibold text-slate-950">
                    {company.company_name || company.company || 'Company'}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {company.industry || 'Company on TrueHire'}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={busyId === companyId || isFollowing}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleFollow(company)
                  }}
                  className="mt-3 rounded-lg bg-[#4f63f6] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#6073ff] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isFollowing ? 'Following' : busyId === companyId ? 'Following...' : 'Follow'}
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
