export default function JobCard({ job, isBookmarked, onToggleBookmark, onApply }) {
  const getCompanyLogoUrl = (logoPath) => {
    if (!logoPath) return '/images/job1.png'
    if (/^https?:\/\//i.test(logoPath)) return logoPath
    const rawBase = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '')
    const baseOrigin = rawBase.endsWith('/api') ? rawBase.replace(/\/api$/, '') : rawBase
    if (logoPath.startsWith('/')) return `${baseOrigin}${logoPath}`
    return `${baseOrigin}/${logoPath}`
  }

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

  const getExperienceDisplay = (level) => {
    const levelMap = {
      'Entry': 'Entry Level',
      'ENTRY_LEVEL': 'Entry Level',
      'Internship': 'Internship Level',
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
    return typeMap[type] || type || 'Not specified'
  }

  const getSkills = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.map((skill) => String(skill).trim()).filter(Boolean)
    const raw = String(value).trim()
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((skill) => String(skill).trim()).filter(Boolean)
      }
    } catch (_) {}
    return raw
      .split(/[\n,|]+/)
      .map((skill) => skill.trim())
      .filter(Boolean)
  }

  const isSalaryLocked = Boolean(job.isSalaryLocked)
  const salaryText = isSalaryLocked
    ? job.salary_amount
    : (job.salary_range || job.salary_amount)
  const employmentType = getEmploymentTypeDisplay(job.employment_type || job.job_type || job.type)
  const skills = getSkills(job.skills_required || job.skillsRequired)
  const visibleSkills = skills.slice(0, 4)
  const hiddenSkillsCount = Math.max(0, skills.length - visibleSkills.length)
  const requirementsText = String(job.requirements || job.job_requirements || '').trim()
  const benefitsText = String(job.benefits || '').trim()

  return (
    <article className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div className={`text-white px-4 py-4 text-center ${job.is_urgent ? 'bg-gradient-to-r from-[#f76e2f] to-[#ffa056]' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`}>
        <div className="flex items-center justify-center gap-3 mb-2">
          <img
            src={getCompanyLogoUrl(job.company_logo)}
            alt="Company logo"
            className="w-12 h-12 rounded-lg object-contain bg-white/10 p-1"
            onError={(e) => {
              e.target.src = '/images/job1.png'
            }}
          />
          <div className="text-left">
            <p className="text-xs uppercase tracking-[0.3em] text-white/80">{job.company_name || job.company || 'TrueHire'}</p>
            <h2 className="text-xl font-semibold mt-1">{job.title}</h2>
          </div>
        </div>
        {job.is_urgent && (
          <span className="inline-flex items-center justify-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#f76e2f] border border-[#f76e2f]">
            Urgent Hiring
          </span>
        )}
      </div>
      <div className="px-3 py-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
            <p className="text-sm text-slate-500">Company: {job.company_name || job.company || 'TrueHire'}</p>
          </div>
          {visibleSkills.length > 0 && (
            <div className="flex max-w-[45%] flex-wrap justify-end gap-1.5">
              {visibleSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
              {hiddenSkillsCount > 0 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                  +{hiddenSkillsCount}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
          <p><span className="font-semibold text-slate-800">Location:</span> {job.location || 'Remote'}</p>
          <p><span className="font-semibold text-slate-800">Experience:</span> {getExperienceDisplay(job.experience_level)}</p>
          <p><span className="font-semibold text-slate-800">Type:</span> {employmentType}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span><span className="font-semibold text-slate-800">Salary:</span> {salaryText || 'Salary not specified'}</span>
          {isSalaryLocked && (
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700">
              Fixed Salary
            </span>
          )}
        </div>
        {(requirementsText || benefitsText) && (
          <div className="space-y-1 text-sm text-slate-600">
            {requirementsText && (
              <p>
                <span className="font-semibold text-slate-800">Requirements:</span> {requirementsText.slice(0, 80)}
              </p>
            )}
            {benefitsText && (
              <p>
                <span className="font-semibold text-slate-800">Benefits:</span> {benefitsText.slice(0, 80)}
              </p>
            )}
          </div>
        )}
        <div className="pt-3 border-t border-slate-200 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Posted {formatDate(job.created_at)}
            </span>
            {job.application_deadline && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 font-semibold text-xs">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deadline: {new Date(job.application_deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
          <button
            onClick={() => onApply(job.id)}
            className={`flex-1 min-w-[140px] text-center font-semibold py-2 rounded-xl transition-colors text-white ${job.is_urgent ? 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600'}`}
          >
            View Job &amp; Apply
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onToggleBookmark(job.id)
            }}
            aria-pressed={isBookmarked}
            className={`rounded-full border px-3 py-2 flex items-center justify-center text-xs font-semibold transition ${
              isBookmarked
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="sr-only">{isBookmarked ? 'Bookmarked' : 'Bookmark this job'}</span>
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4a2 2 0 012-2h8a2 2 0 012 2v16l-6-3-6 3V4z" />
            </svg>
          </button>
        </div>
      </div>
    </article>
  )
}

