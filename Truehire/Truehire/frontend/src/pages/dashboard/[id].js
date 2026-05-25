import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { useAuth } from '../../context/AuthContext'

export default function UserDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { id } = router.query
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user && id) {
      if (user.id !== parseInt(id, 10)) {
        router.push('/dashboard')
        return
      }
      setIsLoading(false)
    }
  }, [user, loading, router, id])

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-500"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  })

  const cards = [
    {
      title: 'Applications',
      value: 'Track',
      description: 'Review your latest job submissions and follow-ups.',
      href: '/applications',
      accent: 'from-[#312E81] via-[#4338CA] to-[#0EA5E9]'
    },
    {
      title: 'Saved Jobs',
      value: 'Browse',
      description: 'Return to the roles you shortlisted for later.',
      href: '/saved-jobs',
      accent: 'from-[#0F766E] via-[#0EA5A4] to-[#67E8F9]'
    },
    {
      title: 'Profile',
      value: user.profile_complete ? '100%' : 'Build',
      description: 'Shape a stronger first impression for recruiters.',
      href: '/profile',
      accent: 'from-[#9A3412] via-[#F97316] to-[#FDBA74]'
    }
  ]

  return (
    <>
      <Head>
        <title>Dashboard - TrueHire</title>
      </Head>
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#F9FAFB] via-[#F3F4FF] to-[#EEF2FF] text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-indigo-200/70 blur-[120px]" />
          <div className="absolute right-[-7rem] top-10 h-72 w-72 rounded-full bg-sky-200/70 blur-[120px]" />
          <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-100/60 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <section className="overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(238,242,255,0.88),rgba(240,249,255,0.82))] p-8 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-10">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Legacy Dashboard</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                  Your account now feels like a real workspace.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  This route has been refreshed to match the newer TrueHire dashboard style with stronger hierarchy, cleaner cards, and clearer next steps.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/overview"
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-slate-900 via-indigo-700 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_16px_35px_-22px_rgba(15,23,42,0.7)] transition hover:opacity-95 hover:no-underline"
                  >
                    Open Main Overview
                  </Link>
                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/85 px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:no-underline"
                  >
                    Manage Profile
                  </Link>
                </div>
              </div>

              <div className="rounded-[32px] border border-slate-200/70 bg-slate-950 p-6 text-white shadow-[0_28px_60px_-35px_rgba(15,23,42,0.75)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">Member Snapshot</p>
                <h2 className="mt-4 text-2xl font-semibold">{user.name}</h2>
                <p className="mt-2 text-sm text-slate-300">Job seeker</p>
                <div className="mt-6 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                    Member since {memberSince}
                  </div>
                  {user.registration_number && (
                    <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                      Registration #: {user.registration_number}
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/12 bg-white/10 px-4 py-3">
                    Profile status: {user.profile_complete ? 'Complete' : 'Needs attention'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 md:grid-cols-3">
            {cards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group relative overflow-hidden rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.4)] no-underline transition hover:-translate-y-1 hover:no-underline hover:shadow-[0_26px_55px_-28px_rgba(15,23,42,0.55)]"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${card.accent}`} />
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{card.title}</p>
                  <p className="mt-4 text-4xl font-black tracking-tight text-slate-900">{card.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </>
  )
}
