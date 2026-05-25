import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../Portal/Header'
import Footer from '../../Portal/Footer'
import apiService from '../../utils/api'

export default function RecruiterApplicantProfilePage() {
  const router = useRouter()
  const { applicationId } = router.query
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [application, setApplication] = useState(null)
  const [applicant, setApplicant] = useState(null)

  const parseList = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    const raw = String(value).trim()
    if (!raw) return []
    if (raw.startsWith('[')) {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
      } catch (_error) {}
    }
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  const parseJsonArray = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value.filter(Boolean)
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.filter(Boolean) : []
      } catch (_error) {
        return []
      }
    }
    return []
  }

  const normalizeProjects = (value) =>
    parseJsonArray(value)
      .map((project) => {
        if (!project || typeof project !== 'object') return null
        return {
          title: project.title || project.project_title || 'Untitled project',
          description: project.description || '',
          techStack: parseList(project.techStack || project.technologies_used || project.tech_stack || ''),
          link: project.link || project.live_link || project.github_link || ''
        }
      })
      .filter(Boolean)

  const normalizeCertifications = (value) =>
    parseJsonArray(value)
      .map((cert) => {
        if (!cert || typeof cert !== 'object') return null
        const issueDate = cert.issue_date || cert.year || ''
        const year = typeof issueDate === 'string' ? issueDate.slice(0, 4) : ''
        return {
          name: cert.name || cert.certification_name || 'Untitled certification',
          issuer: cert.issuer || cert.issuing_organization || '',
          year: cert.year || year || '',
          documentName: cert.documentName || cert.document_name || cert.fileName || cert.file_name || '',
          documentPath: cert.documentPath || cert.document_path || cert.documentUrl || cert.document_url || cert.credential_url || ''
        }
      })
      .filter(Boolean)

  const formatDateTime = (value) => {
    if (!value) return 'Not provided'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Not provided'
    return date.toLocaleString()
  }

  const buildFileUrl = (path) => {
    if (!path) return null
    if (/^https?:\/\//i.test(path)) return path
    const raw = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '')
    const base = raw.endsWith('/api') ? raw.replace(/\/api$/, '') : raw
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    return `${base}${normalizedPath}`
  }

  useEffect(() => {
    const token = apiService.getToken()
    const parsed = apiService.getUserData()
    if (!token || !parsed) {
      router.replace('/login')
      return
    }
    try {
      const role = String(parsed?.role || '').toLowerCase().replace(/_/g, '-')
      if (role !== 'recruiter' && role !== 'sub-recruiter') {
        router.replace('/login')
      }
    } catch (err) {
      router.replace('/login')
    }
  }, [router])

  useEffect(() => {
    if (!applicationId) return

    const loadApplicantProfile = async () => {
      setLoading(true)
      setError('')
      const response = await apiService.request(`/recruiters/applications/${applicationId}/profile`, {
        returnErrorObject: true
      })

      if (response?.error) {
        setError(response.error || response.message || 'Failed to load applicant profile.')
        setLoading(false)
        return
      }

      setApplication(response?.application || null)
      setApplicant(response?.applicant || null)
      setLoading(false)
    }

    loadApplicantProfile()
  }, [applicationId])

  const primarySkills = useMemo(() => parseList(applicant?.core_skills), [applicant?.core_skills])
  const secondarySkills = useMemo(() => parseList(applicant?.secondary_skills), [applicant?.secondary_skills])
  const softSkills = useMemo(() => parseList(applicant?.soft_skills), [applicant?.soft_skills])
  const languages = useMemo(() => parseList(applicant?.languages_known), [applicant?.languages_known])
  const projects = useMemo(() => normalizeProjects(applicant?.projects), [applicant?.projects])
  const certifications = useMemo(() => normalizeCertifications(applicant?.certifications), [applicant?.certifications])
  const resumePath = application?.resume_path || applicant?.resume_file || applicant?.resumeFile || ''

  return (
    <>
      <Head>
        <title>Applicant Profile | TrueHire</title>
      </Head>

      <Header />
      <main className="min-h-screen bg-slate-50 pt-20 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Back
          </button>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading applicant profile...</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-rose-700">{error}</div>
          ) : !applicant ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-700">Applicant profile not found.</div>
          ) : (
            <>
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Applicant</p>
                <h1 className="mt-2 text-3xl font-bold text-slate-900">{applicant.name || 'Candidate'}</h1>
                <p className="mt-2 text-sm text-slate-600">
                  {application?.jobTitle || 'Job'} at {application?.jobCompany || 'Company'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    Status: {application?.status || 'Applied'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    Applied: {formatDateTime(application?.appliedAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    User ID: {application?.userId || 'N/A'}
                  </span>
                </div>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Email</p>
                  <p className="mt-1 text-sm font-medium text-slate-900 break-all">{applicant.email || 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Phone</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{applicant.contact_number || 'Not provided'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Location</p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{applicant.current_location || 'Not provided'}</p>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Professional Summary</p>
                <p className="mt-2 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
                  {applicant.professional_summary || 'Not provided'}
                </p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SkillPanel title="Core Skills" items={primarySkills} />
                <SkillPanel title="Secondary Skills" items={secondarySkills} />
                <SkillPanel title="Soft Skills" items={softSkills} />
                <SkillPanel title="Languages" items={languages} />
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Links</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <ProfileLink label="LinkedIn" href={applicant.linkedin_url} />
                  <ProfileLink label="GitHub" href={applicant.github_url} />
                  <ProfileLink label="Portfolio" href={applicant.portfolio_url} />
                </div>
              </section>

              <ProjectPanel projects={projects} />

              <CertificationPanel certifications={certifications} buildFileUrl={buildFileUrl} />

              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Resume</p>
                <div className="mt-3">
                  {resumePath ? (
                    <a
                      href={buildFileUrl(resumePath)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      View Resume
                    </a>
                  ) : (
                    <p className="text-sm text-slate-700">Not provided</p>
                  )}
                </div>
                {application?.additional_comments && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Comments</p>
                    <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">{application.additional_comments}</p>
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function SkillPanel({ title, items }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
      {items && items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span key={`${title}-${index}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-700">Not provided</p>
      )}
    </div>
  )
}

function ProjectPanel({ projects }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Projects</p>
      {projects && projects.length > 0 ? (
        <div className="mt-4 space-y-4">
          {projects.map((project, index) => (
            <div key={`project-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-base font-semibold text-slate-900">{project.title}</h3>
                {project.link && (
                  <a
                    href={String(project.link).startsWith('http') ? project.link : `https://${project.link}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    View project
                  </a>
                )}
              </div>
              {project.techStack.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {project.techStack.map((tech, techIndex) => (
                    <span key={`project-${index}-tech-${techIndex}`} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                      {tech}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-sm leading-6 text-slate-700 whitespace-pre-wrap">
                {project.description || 'No description provided'}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-700">Not provided</p>
      )}
    </section>
  )
}

function CertificationPanel({ certifications, buildFileUrl }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Certifications</p>
      {certifications && certifications.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {certifications.map((cert, index) => (
            <div key={`cert-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-base font-semibold text-slate-900">{cert.name}</h3>
              <p className="mt-1 text-sm text-slate-700">
                {cert.issuer || 'Issuer not provided'}{cert.year ? ` - ${cert.year}` : ''}
              </p>
              {cert.documentPath && (
                <a
                  href={buildFileUrl(cert.documentPath)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {cert.documentName || 'View document'}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-700">Not provided</p>
      )}
    </section>
  )
}

function ProfileLink({ label, href }) {
  if (!href) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
        <p className="mt-1 text-sm text-slate-700">Not provided</p>
      </div>
    )
  }

  const normalized = String(href).startsWith('http') ? href : `https://${href}`
  return (
    <a
      href={normalized}
      target="_blank"
      rel="noreferrer"
      className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition hover:border-indigo-300 hover:bg-indigo-50"
    >
      <p className="text-xs font-semibold text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-sm text-indigo-700 break-all">{href}</p>
    </a>
  )
}

