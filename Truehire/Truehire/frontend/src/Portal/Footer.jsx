import { useRouter } from 'next/router'
import { ArrowUpRight, BriefcaseBusiness, Mail, MapPin, Phone, ShieldCheck, Sparkles, Users } from 'lucide-react'

export default function Footer() {
  const router = useRouter()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Careers', href: '/career' },
      { name: 'Contact', href: '/contact' }
    ],
    candidates: [
      { name: 'Browse Jobs', href: '/jobs' },
      { name: 'Career Advice', href: '/career-resources' },
      { name: 'Salary Guide', href: '/salary' }
    ],
    employers: [
      { name: 'Post a Job', href: '/post-job' },
      { name: 'Recruiting Solutions', href: '/recruiting' },
      { name: 'Support', href: '/support' }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Cookie Policy', href: '/cookies' }
    ]
  }

  const socialLinks = [
    {
      name: 'LinkedIn',
      href: 'https://www.linkedin.com/company/truerizeiq-strategic-solutions-pvt-ltd/',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      href: 'https://www.instagram.com/truerizeiq?igsh=MXc0MHdpajljN2Rldg==',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      name: 'Facebook',
      href: 'https://www.facebook.com/share/1A4sYccHf1/?mibextid=wwXIfr',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: 'Website',
      href: 'http://www.truerize.com/',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'X',
      href: 'https://x.com/truerize2025?s=21',
      icon: (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    }
  ]

  const linkGroups = [
    { title: 'Company', links: footerLinks.company },
    { title: 'Candidates', links: footerLinks.candidates },
    { title: 'Employers', links: footerLinks.employers },
    { title: 'Legal', links: footerLinks.legal }
  ]

  const isRecruiterArea = () => {
    const currentPath = String(router.pathname || '').toLowerCase()
    return (
      currentPath.includes('recruiter') ||
      currentPath.includes('post-job') ||
      currentPath.includes('jobs-posted')
    )
  }

  const handleBrowseJobsClick = (event) => {
    event.preventDefault()

    if (typeof window === 'undefined') return

    const isUserLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
    const isRecruiterLoggedIn = localStorage.getItem('recruiterLoggedIn') === 'true'

    if (isRecruiterLoggedIn) {
      router.push('/jobs-posted')
      return
    }

    if (isUserLoggedIn) {
      router.push('/jobs')
      return
    }

    router.push(isRecruiterArea() ? '/login' : '/login')
  }

  return (
    <footer className="relative overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
      <div className="pointer-events-none absolute -left-28 top-10 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-200">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-white">Built for career growth</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Tools for candidates, recruiters, and growing teams.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-400/15 text-indigo-200">
              <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-white">Smarter hiring workflows</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">Find, apply, review, and connect from one place.</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <p className="text-sm font-semibold text-white">Trusted by professionals</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">A focused experience for meaningful opportunities.</p>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.25fr_2fr]">
          <div>
            <a href="/" className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-3 py-2 shadow-2xl shadow-black/10 transition hover:bg-white/[0.11]">
              <img
                src="/images/truerizelogon.png"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/truerizelogon.png.jpg' }}
                alt="TrueHire Logo"
                className="h-10 w-10 rounded-full bg-white object-contain p-1"
              />
              <span className="pr-2 text-xl font-bold tracking-wide text-white">TrueHire</span>
            </a>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              Connecting exceptional talent with meaningful opportunities through a modern, human hiring experience.
            </p>

            <div className="mt-6 space-y-3 text-sm text-slate-300">
              <a href="tel:+916381250037" className="flex items-center gap-3 transition hover:text-cyan-200">
                <Phone className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                +91 63812 50037
              </a>
              <a href="mailto:support@truerize.com" className="flex items-center gap-3 transition hover:text-cyan-200">
                <Mail className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                support@truerize.com
              </a>
              <p className="flex items-start gap-3 leading-6">
                <MapPin className="mt-1 h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" />
                Plot No 40, 6th Sector, 14th Cross Road, HSR Layout, Bangalore, Karnataka
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] text-slate-300 transition hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/10 hover:text-cyan-100"
                  aria-label={social.name}
                  target="_blank"
                  rel="noreferrer"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-white">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
                  {group.title}
                </h3>
                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={link.name}>
                      <a
                        href={link.href}
                        onClick={link.name === 'Browse Jobs' ? handleBrowseJobsClick : undefined}
                        className="group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
                      >
                        <span>{link.name}</span>
                        <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">
              &copy; {currentYear} TrueHire. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <a href="/privacy" className="text-slate-500 transition hover:text-cyan-200">Privacy</a>
              <span className="text-slate-700">|</span>
              <a href="/terms" className="text-slate-500 transition hover:text-cyan-200">Terms</a>
              <span className="text-slate-700">|</span>
              <a href="/cookies" className="text-slate-500 transition hover:text-cyan-200">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
