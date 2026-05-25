import { useEffect, useState } from "react"
import Head from "next/head"
import { useRouter } from "next/router"
import Header from "../../../Portal/Header"
import Footer from "../../../Portal/Footer"
import { useAuth } from "../../../context/AuthContext"
import apiService from "../../../utils/api"

export default function CompanyJobsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { id } = router.query
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    const loadCompanyJobs = async () => {
      setLoading(true)
      setError(null)
      try {
        const [companiesRes, jobsRes] = await Promise.all([
          apiService.request("/recruiters/companies"),
          apiService.request("/jobs?limit=1000")
        ])

        const companies = companiesRes?.companies || []
        const companyMatch = companies.find((item) => String(item.id) === String(id)) || null
        setCompany(companyMatch)

        const rawJobs = jobsRes?.jobs || []
        const normalizedCompanyName = companyMatch?.company_name
          ? companyMatch.company_name.toLowerCase().trim()
          : ""
        const companyJobs = rawJobs.filter((job) => {
          const recruiterMatch = String(job.recruiter_id) === String(id)
          if (recruiterMatch) return true
          if (!normalizedCompanyName) return false
          const jobCompany = (job.company || job.company_name || "").toLowerCase().trim()
          return jobCompany === normalizedCompanyName
        })
        setJobs(companyJobs)
      } catch (err) {
        console.error("Failed to load company jobs:", err)
        setError("Unable to load jobs for this company. Please try again shortly.")
      } finally {
        setLoading(false)
      }
    }

    loadCompanyJobs()
  }, [id])

  const formatSalary = (job) => {
    const currency = job.salary_currency || "INR"
    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`
    }
    if (job.salary_min) {
      return `${currency} ${job.salary_min.toLocaleString()}+`
    }
    if (job.salary_max) {
      return `${currency} ${job.salary_max.toLocaleString()}`
    }
    return "Salary not specified"
  }

  const formatDate = (dateString) => {
    if (!dateString) return "Recently"
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "1 day ago"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  const isPastDeadline = (deadline) => {
    if (!deadline) return false
    const deadlineDate = new Date(deadline)
    if (Number.isNaN(deadlineDate.getTime())) return false
    deadlineDate.setHours(23, 59, 59, 999)
    return new Date() > deadlineDate
  }

  const companyName = company?.company_name || "Company"

  return (
    <>
      <Head>
        <title>{`${companyName} Jobs | TrueHire`}</title>
        <meta
          name="description"
          content={`Explore open roles from ${companyName} on TrueHire.`}
        />
      </Head>

      <Header />

      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#020617] via-[#11172a] to-[#151c38] text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-purple-500/30 blur-[120px]" />
          <div className="absolute right-[-6rem] top-[-2rem] h-64 w-64 rounded-full bg-cyan-500/30 blur-[100px]" />
          <div className="absolute inset-x-0 bottom-[-8rem] h-64 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-10">
          <section className="rounded-[32px] border border-white/10 bg-white/10 backdrop-blur-xl p-10 shadow-[0_25px_80px_rgba(2,6,23,0.65)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-[0.5em] text-slate-300">Company Jobs</p>
                <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                  {companyName}
                </h1>
                <p className="text-lg text-slate-200 max-w-3xl leading-relaxed mt-2">
                  Explore only the roles published by this company.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/companies")}
                className="px-5 py-3 rounded-2xl border border-white/20 text-white font-semibold hover:bg-white/10 transition"
              >
                Back to Companies
              </button>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-white/90 p-8 shadow-[0_30px_60px_rgba(2,6,23,0.45)] space-y-6 text-slate-900">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-indigo-600"></div>
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"
                    style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                  ></div>
                </div>
                <p className="mt-6 text-lg font-medium text-slate-600">Loading company roles...</p>
              </div>
            ) : error ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Jobs</h3>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">{error}</p>
                <button
                  onClick={() => router.reload()}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Try Again
                </button>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center space-y-4">
                <h3 className="text-2xl font-semibold text-slate-900">No open roles found</h3>
                <p className="text-slate-600 max-w-lg mx-auto">
                  This company does not have any active job postings right now.
                </p>
                <button
                  onClick={() => router.push("/companies")}
                  className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  Browse Companies
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {jobs.map((job) => {
                  const isExpired = isPastDeadline(job.application_deadline)
                  return (
                    <article
                      key={job.id}
                      className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                    >
                      <div
                        className={`text-white px-4 py-4 text-center ${
                          job.is_urgent
                            ? "bg-gradient-to-r from-[#f76e2f] to-[#ffa056]"
                            : "bg-gradient-to-r from-indigo-600 to-blue-500"
                        }`}
                      >
                        <p className="text-xs uppercase tracking-[0.3em] text-white/80">{job.company || companyName}</p>
                        <h2 className="text-xl font-semibold mt-1">{job.title}</h2>
                        {isExpired && (
                          <span className="mt-2 inline-flex items-center justify-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-red-600 border border-red-200">
                            Closed
                          </span>
                        )}
                        {job.is_urgent && (
                          <span className="mt-2 inline-flex items-center justify-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#f76e2f] border border-[#f76e2f]">
                            Urgent Hiring
                          </span>
                        )}
                      </div>
                      <div className="px-4 py-5 space-y-3">
                        <div className="grid grid-cols-1 gap-2 text-sm text-slate-600">
                          <p>
                            <span className="font-semibold text-slate-800">Location:</span>{" "}
                            {job.location || "Remote"}
                          </p>
                          <p>
                            <span className="font-semibold text-slate-800">Salary:</span>{" "}
                            {formatSalary(job)}
                          </p>
                        </div>
                        <p className="text-sm text-slate-600">
                          {job.description?.slice(0, 90) ||
                            "A new role has opened. Apply early to stand out."}
                        </p>
                        <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
                          Posted {formatDate(job.created_at)}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              router.push("/login")
                              return
                            }
                            if (isExpired) {
                              return
                            }
                            router.push(`/jobs/${job.id}/apply`)
                          }}
                          className={`w-full text-center font-semibold py-2 rounded-xl text-white ${
                            isExpired
                              ? "bg-slate-300 cursor-not-allowed"
                              : "bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600"
                          }`}
                        >
                          {isExpired ? "Expired" : "View Job &amp; Apply"}
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}

