import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'
import apiService from '../../../lib/api'

export default function Careers() {
  const router = useRouter()
  const [openRoles, setOpenRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(true)

  const reasonsToJoin = [
    {
      title: 'Career Growth',
      description: 'Grow with a team that values ownership, strong execution, and long-term career development.'
    },
    {
      title: 'Real Projects',
      description: 'Build features that directly improve the hiring experience for job seekers and employers.'
    },
    {
      title: 'Learning',
      description: 'Sharpen your skills through mentorship, feedback, and hands-on product challenges.'
    },
    {
      title: 'Flexible Work',
      description: 'Work in a setup that supports productivity, focus, and healthy work-life balance.'
    },
    {
      title: 'Good Culture',
      description: 'Join a collaborative team where ideas are heard and people genuinely support each other.'
    }
  ]

  const hiringSteps = [
    'Apply',
    'HR Call',
    'Technical Round',
    'Final Round',
    'Offer'
  ]

  const galleryItems = [
    {
      title: 'Team Collaboration',
      image: '/images/careers/team-collaboration.png'
    },
    {
      title: 'Work Sessions',
      image: '/images/careers/work-sessions.png'
    },
    {
      title: 'Learning Moments',
      image: '/images/careers/learning-moments.png'
    },
    {
      title: 'Team Energy',
      image: '/images/careers/team-energy.png'
    }
  ]

  const internshipPoints = [
    'Structured internship programs with practical product exposure',
    'Training support in frontend, backend, design, and operations',
    'Freshers are welcome to apply and grow with guided mentorship'
  ]

  const testimonials = [
    {
      role: 'Developer',
      text: 'Working at TRUEHIRE means building useful features fast and learning something new every sprint.'
    },
    {
      role: 'Designer',
      text: 'The team gives space for ideas, and design decisions are tied closely to real user needs.'
    },
    {
      role: 'Intern',
      text: 'I joined as a fresher and got hands-on experience, clear guidance, and real project ownership.'
    }
  ]

  const handleApplyNow = () => {
    if (typeof window === 'undefined') return

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    router.push(isLoggedIn ? '/login' : '/register')
  }

  const handleJobApply = (jobId) => {
    if (typeof window === 'undefined') return

    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    if (isLoggedIn) {
      router.push(`/jobs/${jobId}/apply`)
      return
    }

    router.push('/register')
  }

  const normalizeExperience = (value) => {
    const token = String(value || '').trim().toUpperCase()
    const map = {
      ENTRY: 'Entry Level',
      'ENTRY LEVEL': 'Entry Level',
      ENTRY_LEVEL: 'Entry Level',
      INTERNSHIP: 'Internship',
      'INTERNSHIP LEVEL': 'Internship',
      INTERNSHIP_LEVEL: 'Internship',
      MID: 'Mid Level',
      'MID LEVEL': 'Mid Level',
      MID_LEVEL: 'Mid Level',
      SENIOR: 'Senior Level',
      'SENIOR LEVEL': 'Senior Level',
      SENIOR_LEVEL: 'Senior Level',
      EXECUTIVE: 'Executive Level',
      'EXECUTIVE LEVEL': 'Executive Level',
      EXECUTIVE_LEVEL: 'Executive Level'
    }

    return map[token] || String(value || '').trim() || 'Not specified'
  }

  useEffect(() => {
    let isMounted = true

    const loadLatestJobs = async () => {
      setRolesLoading(true)

      try {
        const response = await apiService.request('/jobs?limit=50', { returnErrorObject: true })
        if (response?.error) {
          throw new Error(response.error)
        }

        const jobs = Array.isArray(response)
          ? response
          : Array.isArray(response?.jobs)
            ? response.jobs
            : Array.isArray(response?.data)
              ? response.data
              : Array.isArray(response?.results)
                ? response.results
                : []

        const dedupedJobs = []
        const seen = new Set()

        jobs.forEach((job) => {
          const idKey = job?.id != null ? `id:${job.id}` : null
          const fallbackKey = [
            String(job?.title || '').trim().toLowerCase(),
            String(job?.company_name || job?.company || '').trim().toLowerCase(),
            String(job?.location || '').trim().toLowerCase()
          ].join('::')

          const uniqueKey = idKey || fallbackKey
          if (!uniqueKey || seen.has(uniqueKey)) return
          seen.add(uniqueKey)
          dedupedJobs.push(job)
        })

        const sortedJobs = dedupedJobs
          .filter((job) => String(job?.status || '').toLowerCase() !== 'closed')
          .sort((a, b) => {
            const aTime = new Date(a?.created_at || a?.posted_at || a?.createdAt || 0).getTime()
            const bTime = new Date(b?.created_at || b?.posted_at || b?.createdAt || 0).getTime()
            return bTime - aTime
          })
          .slice(0, 4)
          .map((job) => ({
            id: job.id,
            title: job.title || 'Untitled Role',
            location: job.location || 'Remote',
            experience: normalizeExperience(job.experience_level || job.experience || job.experience_required)
          }))

        if (!isMounted) return
        setOpenRoles(sortedJobs)
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to load latest jobs for careers page:', error)
        setOpenRoles([])
      } finally {
        if (isMounted) setRolesLoading(false)
      }
    }

    loadLatestJobs()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <>
      <Head>
        <title>Careers at TRUEHIRE</title>
        <meta
          name="description"
          content="Join the TRUEHIRE team and help build the future of hiring. Explore open roles, internships, and life at TRUEHIRE."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50">
        <section className="gradient-bg py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-sm font-semibold text-blue-700 shadow-sm">
              Build with TRUEHIRE
            </span>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold text-gray-900">
              Careers at <span className="text-gradient">TRUEHIRE</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Join our team and help build the future of hiring.
            </p>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              About <span className="text-gradient">TRUEHIRE</span>
            </h2>
            <p className="text-lg text-gray-600 leading-8 max-w-4xl mx-auto">
              TRUEHIRE is a job portal platform built to make hiring simpler, faster, and more effective. Our mission is to connect great talent with the right companies through a better digital hiring experience. We focus on building practical tools that help employers hire confidently and help candidates find the right opportunities. Innovation, clarity, and user value guide everything we create.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Work With <span className="text-gradient">Us</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                A focused team, meaningful work, and room to grow.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
              {reasonsToJoin.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-bold mb-4">
                    {item.title.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-6">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="open-roles" className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Open <span className="text-gradient">Positions</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Browse the latest recruiter-posted jobs from the platform.
              </p>
            </div>

            {rolesLoading ? (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600 shadow-sm">
                Loading latest jobs...
              </div>
            ) : openRoles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {openRoles.map((role) => (
                  <div key={role.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-7 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{role.title}</h3>
                    <div className="space-y-2 text-gray-600 mb-6">
                      <p>
                        <span className="font-semibold text-gray-900">Location:</span> {role.location}
                      </p>
                      <p>
                        <span className="font-semibold text-gray-900">Experience:</span> {role.experience}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleJobApply(role.id)}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-300 hover:bg-blue-700"
                    >
                      Apply Now
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600 shadow-sm">
                No recent job postings available right now.
              </div>
            )}
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hiring <span className="text-gradient">Process</span>
              </h2>
              <p className="text-lg text-gray-600">Simple and transparent from application to offer.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {hiringSteps.map((step, index) => (
                <div key={step} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                    {index + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{step}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Life at <span className="text-gradient">TRUEHIRE</span>
              </h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                We keep things collaborative, practical, and people-first. The team works closely, learns quickly, and celebrates progress together.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleryItems.map((item) => (
                <div key={item.title} className="overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
                  <img src={item.image} alt={item.title} className="h-64 w-full object-cover" />
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900">{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-white p-8 md:p-10 shadow-sm">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Internships at <span className="text-gradient">TRUEHIRE</span>
                </h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                  Our internship track is designed for students and freshers who want real exposure, structured training, and a strong start in tech and product roles.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {internshipPoints.map((point) => (
                  <div key={point} className="rounded-2xl bg-blue-50 p-6">
                    <p className="text-gray-700 leading-7">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Team <span className="text-gradient">Testimonials</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((item) => (
                <div key={item.role} className="rounded-2xl bg-gray-50 p-7 shadow-sm">
                  <p className="text-gray-700 leading-7 mb-5">"{item.text}"</p>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">{item.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 bg-gradient-to-r from-blue-600 to-sky-500 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build the Future of Hiring?
            </h2>
            <p className="text-lg md:text-xl opacity-95 max-w-3xl mx-auto mb-8">
              Apply for a role that matches your skills and grow with the TRUEHIRE team.
            </p>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleApplyNow}
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-base font-semibold text-blue-700 transition-colors duration-300 hover:bg-blue-50"
              >
                Apply Now
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
