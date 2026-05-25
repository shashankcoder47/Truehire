import Link from 'next/link'

export default function FeaturedJobs({ jobs }) {
  const safeJobs = Array.isArray(jobs) ? jobs : []

  const uniqueJobs = safeJobs.filter((job, index, source) => {
    const jobId = job?.id
    if (jobId === undefined || jobId === null) return true
    return source.findIndex((item) => item?.id === jobId) === index
  })

  const orderedJobs = [...uniqueJobs]
    .sort((a, b) => new Date(b?.created_at || 0) - new Date(a?.created_at || 0))

  const animationDuration = `${Math.max(28, orderedJobs.length * 7)}s`

  // Helper function to format salary
  const formatSalary = (job) => {
    const currency = String(job.salary_currency || 'INR').toUpperCase()
    const min = job.salary_min != null ? Number(job.salary_min) : null
    const max = job.salary_max != null ? Number(job.salary_max) : null

    if (currency === 'LPA') {
      const formatLpa = (value) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, ''))
      if (Number.isFinite(min) && Number.isFinite(max)) {
        return `${formatLpa(min)} - ${formatLpa(max)} LPA`
      } else if (Number.isFinite(min)) {
        return `${formatLpa(min)}+ LPA`
      } else if (Number.isFinite(max)) {
        return `Up to ${formatLpa(max)} LPA`
      }
      return 'Salary not specified'
    }

    if (Number.isFinite(min) && Number.isFinite(max)) {
      return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`
    } else if (Number.isFinite(min)) {
      return `₹${min.toLocaleString('en-IN')}+`
    } else if (Number.isFinite(max)) {
      return `Up to ₹${max.toLocaleString('en-IN')}`
    }
    return 'Salary not specified'
  }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Recently'
    const postedDate = new Date(dateString)
    if (Number.isNaN(postedDate.getTime())) return 'Recently'

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const postedDay = new Date(postedDate)
    postedDay.setHours(0, 0, 0, 0)

    const diffMs = today.getTime() - postedDay.getTime()
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    const months = Math.floor(diffDays / 30)
    return `${months} month${months === 1 ? '' : 's'} ago`
  }

  // Helper function to get experience level display
  const getExperienceDisplay = (level) => {
    const levelMap = {
      'Entry': 'Entry Level',
      'ENTRY_LEVEL': 'Entry Level',
      'INTERNSHIP_LEVEL': 'Internship Level',
      'Mid': 'Mid Level',
      'MID_LEVEL': 'Mid Level',
      'Senior': 'Senior Level',
      'SENIOR_LEVEL': 'Senior Level',
      'Executive': 'Executive',
      'EXECUTIVE_LEVEL': 'Executive'
    }
    return levelMap[level] || level || 'Not specified'
  }

  const getEmploymentTypeDisplay = (type) => {
    const typeMap = {
      FULL_TIME: 'Full-time',
      'Full-time': 'Full-time',
      PART_TIME: 'Part-time',
      'Part-time': 'Part-time',
      CONTRACT: 'Contract',
      FREELANCE: 'Freelance',
      INTERNSHIP: 'Internship'
    }
    return typeMap[type] || type || 'Opportunity'
  }

  const getSkills = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((skill) => String(skill).trim()).filter(Boolean)
    const raw = String(value).trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((skill) => String(skill).trim()).filter(Boolean)
    } catch (_) {}
    return raw.split(/[\n,|]+/).map((skill) => skill.trim()).filter(Boolean)
  }

  return (
    <div className="flex flex-col gap-6">
      {orderedJobs.length === 0 ? (
        <div className="col-span-full">
          <div className="relative mx-auto flex min-h-[310px] max-w-3xl flex-col items-center justify-center overflow-hidden rounded-[28px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-indigo-50/80 px-6 py-12 text-center shadow-[0_22px_70px_-50px_rgba(79,70,229,0.8)]">
            <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300 to-transparent" aria-hidden="true" />
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white/80 bg-white/85 text-indigo-500 shadow-[0_18px_42px_-26px_rgba(79,70,229,0.85)] backdrop-blur">
              <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M10.5 6.75h3M6.75 9.75h10.5m-10.5 3h6.75M8.25 4.5h7.5A2.25 2.25 0 0 1 18 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-7.5A2.25 2.25 0 0 1 6 17.25V6.75A2.25 2.25 0 0 1 8.25 4.5Z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="m14.25 15.25 1.25 1.25 2.5-3" />
              </svg>
            </div>
            <p className="mb-3 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">
              New roles coming soon
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">No featured jobs right now</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
              We are refreshing this showcase with verified openings. Browse all jobs or check back soon for curated matches.
            </p>
            <Link
              href="/jobs"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full border border-indigo-100 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50"
            >
              Browse all jobs
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h4m0 0v4m0-4-6 6m-4 4h10" />
              </svg>
            </Link>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-24" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-24" />
          <div
            className="featured-jobs-marquee w-full overflow-hidden py-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{ '--featured-jobs-duration': animationDuration }}
          >
            <div className="featured-jobs-track flex w-max flex-nowrap gap-6 will-change-transform">
              {orderedJobs.map((job, index) => {
                const title = job.job_title || job.title || 'Job Opening'
                const companyName = job.company_name || job.company || 'Company'
                const location = job.location || 'Remote'
                const employmentType = getEmploymentTypeDisplay(job.employment_type || job.job_type || job.type)
                const skills = getSkills(job.skills_required || job.skillsRequired).slice(0, 3)
                const description = job.description || job.job_description || job.summary || 'We are looking for a creative and detail-oriented professional to join our team.'
                return (
                  <article
                    key={job.id || `job-${index}`}
                    data-job-card
                    data-job-index={index}
                    className="shrink-0 w-[280px] sm:w-[320px] lg:w-[340px] xl:w-[360px] min-h-[500px]"
                  >
                    <div
                      data-job-surface
                      data-job-index={index}
                      className="relative h-full rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.45)] flex flex-col overflow-hidden transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-[active=true]:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.55)] data-[active=true]:scale-[1.01] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_28px_60px_-30px_rgba(15,23,42,0.55)]"
                    >
                      <div className="bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#818cf8] px-5 py-5 text-white">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 break-words">{companyName}</p>
                        <h3 className="mt-2 text-lg font-semibold leading-snug break-words">{title}</h3>
                      </div>

                      <div className="flex flex-1 flex-col gap-3 px-5 py-5 text-sm text-slate-700">
                        <div className="grid grid-cols-1 gap-2 text-xs text-slate-600">
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">Company:</span> {companyName}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">Location:</span> {location}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">Experience:</span> {getExperienceDisplay(job.experience_level)}
                          </p>
                          <p className="break-words">
                            <span className="font-semibold text-slate-800">Type:</span> {employmentType}
                          </p>
                        </div>

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill) => (
                              <span key={skill} className="max-w-full rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 break-words">
                                {skill}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs leading-relaxed text-slate-600 break-words">
                          {description}
                        </p>

                        <div className="mt-auto border-t border-slate-200 pt-3 text-xs text-slate-500">
                          <div className="flex flex-col gap-1.5">
                            <span className="break-words">Posted {formatDate(job.created_at)}</span>
                            {job.application_deadline && (
                              <span className="text-rose-600 break-words">
                                Deadline: {new Date(job.application_deadline).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Link
                            href={`/jobs/${job.id}/apply`}
                            className="relative z-10 flex-1 rounded-xl bg-gradient-to-r from-[#4f46e5] to-[#6366f1] px-4 py-2.5 text-center text-xs font-semibold text-white shadow-sm transition-all duration-300 hover:shadow-md"
                          >
                            View Job & Apply
                          </Link>
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-slate-700"
                            aria-label="Save job"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 21l-5-4-5 4V5a2 2 0 012-2h6a2 2 0 012 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          <style jsx>{`
            .featured-jobs-track {
              animation: featuredJobsMarquee var(--featured-jobs-duration, 42s) linear infinite;
              transform: translate3d(-100%, 0, 0);
            }

            .featured-jobs-marquee:hover .featured-jobs-track {
              animation-play-state: paused;
            }

            @keyframes featuredJobsMarquee {
              from {
                transform: translate3d(-100%, 0, 0);
              }
              to {
                transform: translate3d(100vw, 0, 0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .featured-jobs-track {
                animation-duration: calc(var(--featured-jobs-duration, 42s) * 2);
              }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}
