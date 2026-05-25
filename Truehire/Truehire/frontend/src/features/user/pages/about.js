import Head from 'next/head'
import { useEffect } from 'react'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

export default function About() {
  const offerings = [
    {
      title: 'Job Seekers',
      items: ['Profile setup', 'Resume upload', 'One-click apply', 'Application tracking']
    },
    {
      title: 'Recruiters',
      items: ['Company verification', 'Job posting tools', 'Candidate management', 'Shortlist workflows']
    }
  ]

  const candidateFlow = [
    'Create a profile and upload a resume',
    'Discover roles that match skills and goals',
    'Apply and track status in one dashboard',
    'Receive clear updates and outcomes'
  ]

  const recruiterFlow = [
    'Verify your company and recruiter identity',
    'Post roles with detailed requirements',
    'Review applicants and manage stages',
    'Respond with offers or clear rejections'
  ]

  const trustItems = [
    {
      title: 'Verified recruiters',
      description: 'Identity checks and company validation keep listings credible.'
    },
    {
      title: 'Real jobs only',
      description: 'Active monitoring prevents expired or misleading roles.'
    },
    {
      title: 'Clear outcomes',
      description: 'Candidates receive decision updates and rejection reasons.'
    },
    {
      title: 'Secure data',
      description: 'Profiles and resumes are protected with strict access controls.'
    }
  ]

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
  }, [])

  return (
    <>
      <Head>
        <title>About Us - TrueHire</title>
        <meta
          name="description"
          content="TrueHire is a job portal connecting job seekers with verified recruiters through a transparent and efficient hiring experience."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />
      <main className="min-h-screen bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <section data-reveal className="py-24 reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-semibold tracking-[0.2em] text-slate-500 uppercase">
              About Us
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-900 mt-4 mb-6">
              A trusted job portal built for <span className="text-gradient">real hiring outcomes</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              TrueHire connects job seekers with verified recruiters so every application,
              interview, and decision is clear and credible.
            </p>
          </div>
        </section>

        <section data-reveal className="py-24 bg-gradient-to-r from-[#F9FAFB] via-[#EEF2FF] to-[#E0E7FF] reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
                Job Portal <span className="text-gradient">Overview</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                We connect job seekers with verified recruiters and real opportunities,
                removing noise and keeping the hiring journey focused on quality.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Verified recruiters',
                  description: 'Recruiters go through identity and company checks before posting.'
                },
                {
                  title: 'Real-time status',
                  description: 'Track every application step with consistent updates.'
                },
                {
                  title: 'Role clarity',
                  description: 'Listings include requirements, timelines, and decision stages.'
                },
                {
                  title: 'Trusted communication',
                  description: 'Messages stay on-platform with clear audit trails.'
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70"
                >
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-reveal className="py-24 reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
                Vision & <span className="text-gradient">Mission</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Our vision is a hiring world where every opportunity is real and every
                decision is transparent. Our mission is to make hiring efficient for
                recruiters and respectful of candidates by keeping communication clear.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Transparency first',
                  description: 'Clear expectations, timelines, and outcomes for all sides.'
                },
                {
                  title: 'Efficient hiring',
                  description: 'Streamlined workflows to reduce time-to-hire.'
                }
              ].map((item) => (
                <div
                  key={item.title}
                  className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70"
                >
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-reveal className="py-24 bg-gradient-to-r from-[#F9FAFB] via-[#EEF2FF] to-[#E0E7FF] reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
                Job Seeker & <span className="text-gradient">Recruiter Features</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Purpose-built tools for both sides of the hiring process.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {offerings.map((offering) => (
                <div
                  key={offering.title}
                  className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70"
                >
                  <h3 className="text-2xl font-semibold text-slate-900 mb-6">{offering.title}</h3>
                  <ul className="space-y-4 text-slate-600">
                    {offering.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section data-reveal className="py-24 reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
                How It <span className="text-gradient">Works</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Clear steps for candidates and recruiters, designed to remove uncertainty.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Candidate Flow</h3>
                <ol className="space-y-4 text-slate-600">
                  {candidateFlow.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="h-9 w-9 rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white font-semibold flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70">
                <h3 className="text-2xl font-semibold text-slate-900 mb-6">Recruiter Flow</h3>
                <ol className="space-y-4 text-slate-600">
                  {recruiterFlow.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="h-9 w-9 rounded-full bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white font-semibold flex items-center justify-center shadow-sm">
                        {index + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        <section data-reveal className="py-24 bg-gradient-to-r from-[#F9FAFB] via-[#EEF2FF] to-[#E0E7FF] reveal-on-scroll">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-slate-900 mb-6">
                Trust & <span className="text-gradient">Safety</span>
              </h2>
              <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                We protect the integrity of the job portal with recruiter verification,
                real job postings, and clear rejection reasons to respect candidate time.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {trustItems.map((item) => (
                <div
                  key={item.title}
                  className="p-10 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#E0E7FF] rounded-3xl shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] border border-white/70"
                >
                  <h3 className="text-2xl font-semibold text-slate-900 mb-4">{item.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}




