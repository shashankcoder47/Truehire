import Head from 'next/head'
import Link from 'next/link'
import Header from '../../../Portal/Header'
import Footer from '../../../Portal/Footer'

const resourceLibrary = [
  {
    title: 'Resume Writing Guide',
    description: 'Polish your resume with structured templates, smarter edits, and ATS-ready formatting that is easier to ship fast.',
    link: '/resume-guide',
    category: 'Resume Studio',
    duration: '45 min workshop',
    level: 'All levels',
    format: 'Template sprint',
    accent: 'from-[#123C66] via-[#1F5B8F] to-[#6EA8DA]',
    surface: 'from-[#F8FBFF] to-[#EEF6FF]',
  },
  {
    title: 'Interview Practice',
    description: 'Run realistic mock interviews, rehearse answers, and sharpen delivery with guided response coaching.',
    link: '/interview-practice',
    category: 'Interview Lab',
    duration: '30 min lab',
    level: 'Mid & Senior',
    format: 'Live simulation',
    accent: 'from-[#5B34D6] via-[#6D4CFF] to-[#9AA6FF]',
    surface: 'from-[#FAF8FF] to-[#F1EEFF]',
  }
]

const focusAreas = [
  { label: 'Hands-on playbooks', value: '12+' },
  { label: 'Practice-first labs', value: '08' },
  { label: 'Weekly mentor drops', value: '04' },
]

const valuePillars = [
  {
    title: 'Build with structure',
    copy: 'Turn vague career goals into clear, repeatable steps with guided workflows and examples.',
  },
  {
    title: 'Practice with feedback',
    copy: 'Use interactive sessions and targeted exercises that mirror the pressure of real hiring loops.',
  },
  {
    title: 'Ship faster',
    copy: 'Leave with artifacts you can use immediately, from sharper resumes to stronger interview answers.',
  },
]

export default function CareerResources() {
  return (
    <>
      <Head>
        <title>Career Resources | TrueHire</title>
        <meta
          name="description"
          content="Advance your career with TrueHire playbooks: resume editing, interview prep, mentorship, and learning playlists."
        />
      </Head>

      <Header />

      <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#dbeafe_0,#f8fafc_28%,#eef2ff_60%,#e0e7ff_100%)] text-slate-900">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-5rem] top-20 h-72 w-72 rounded-full bg-sky-200/60 blur-[120px]" />
          <div className="absolute right-[-4rem] top-32 h-80 w-80 rounded-full bg-indigo-200/60 blur-[140px]" />
          <div className="absolute left-1/2 top-[34rem] h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-100/60 blur-[120px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <section className="grid gap-8 lg:grid-cols-[1.35fr_0.85fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(243,247,255,0.9))] p-8 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.45)] backdrop-blur xl:p-12">
              <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.18),transparent_68%)] lg:block" />
              <div className="relative max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">Career Resources</p>
                <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                  Learn the hiring moves that push your profile from seen to selected.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  Explore a tighter, more practical learning space for resume upgrades, interview prep, and career momentum.
                  Every resource is designed to feel closer to the real hiring journey, not generic advice.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-700">
                  <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">Playbooks that end in action</span>
                  <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">Labs built around hiring signals</span>
                  <span className="rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm">Zero fluff, practical outputs</span>
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/learning-hub"
                    className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f172a,#4f46e5,#38bdf8)] px-6 py-3 text-sm font-semibold text-white no-underline shadow-[0_18px_35px_-20px_rgba(79,70,229,0.6)] transition hover:scale-[1.01] hover:no-underline"
                  >
                    Explore all resources
                  </Link>
                  <Link
                    href="/interview-practice"
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 no-underline shadow-sm transition hover:border-slate-300 hover:bg-white hover:no-underline"
                  >
                    Start interview lab
                  </Link>
                </div>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[36px] border border-slate-200/70 bg-[linear-gradient(160deg,#11213f_0%,#1e3a8a_42%,#312e81_100%)] p-7 text-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]">
              <div className="flex h-full flex-col justify-between gap-8">
                <div>
                  <div className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white/75">
                    This week
                  </div>
                  <h2 className="mt-5 max-w-sm text-3xl font-bold tracking-[-0.04em]">
                    A focused library for job seekers who want stronger outcomes.
                  </h2>
                  <p className="mt-4 max-w-sm text-sm leading-7 text-white/75">
                    Pick a resource, work through a practical session, and leave with something you can use in your next application cycle.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  {focusAreas.map((item) => (
                    <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 p-4 backdrop-blur">
                      <p className="text-3xl font-black tracking-[-0.05em] text-white">{item.value}</p>
                      <p className="mt-1 text-sm text-white/70">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          <section className="mt-10 grid gap-5 md:grid-cols-3">
            {valuePillars.map((pillar) => (
              <article
                key={pillar.title}
                className="rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_55px_-38px_rgba(15,23,42,0.35)] backdrop-blur"
              >
                <div className="mb-4 h-11 w-11 rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#eef2ff)] ring-1 ring-slate-200/80" />
                <h3 className="text-xl font-bold tracking-[-0.03em] text-slate-900">{pillar.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.copy}</p>
              </article>
            ))}
          </section>

          <section className="mt-12 overflow-hidden rounded-[36px] border border-white/80 bg-white/88 p-6 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8 lg:p-10">
            <div className="flex flex-col gap-4 border-b border-slate-200/70 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Featured Tracks</p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">Pick a playbook and start moving.</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Designed to feel more like a modern product experience and less like a static resource list.
                </p>
              </div>
              <Link
                href="/learning-hub"
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700 no-underline transition hover:border-slate-300 hover:bg-white hover:no-underline"
              >
                View All Resources
              </Link>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {resourceLibrary.map((resource) => (
                <Link
                  key={resource.title}
                  href={resource.link}
                  className="group no-underline hover:no-underline"
                >
                  <article className={`relative flex h-full min-h-[360px] flex-col justify-between overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.96))] p-7 no-underline shadow-[0_24px_60px_-42px_rgba(15,23,42,0.4)] transition duration-300 hover:-translate-y-1.5 hover:no-underline hover:shadow-[0_35px_80px_-42px_rgba(15,23,42,0.5)]`}>
                    <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${resource.accent} opacity-95`} />
                    <div className={`absolute right-[-2rem] top-10 h-28 w-28 rounded-full bg-gradient-to-br ${resource.surface} blur-2xl`} />

                    <div className="relative">
                      <div className="inline-flex rounded-full border border-white/40 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-white shadow-sm backdrop-blur">
                        {resource.category}
                      </div>
                      <h3 className="mt-24 max-w-md text-3xl font-black tracking-[-0.04em] text-slate-950 no-underline">
                        {resource.title}
                      </h3>
                      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600 no-underline sm:text-base">
                        {resource.description}
                      </p>
                    </div>

                    <div className="relative mt-8 grid grid-cols-2 gap-3 text-xs text-slate-600">
                      <div className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4 no-underline shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Duration</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{resource.duration}</p>
                      </div>
                      <div className="rounded-[22px] border border-slate-200/80 bg-white/85 px-4 py-4 no-underline shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Level</p>
                        <p className="mt-2 text-sm font-semibold text-slate-900">{resource.level}</p>
                      </div>
                    </div>

                    <div className="relative mt-5 flex items-center justify-between rounded-[24px] border border-slate-200/80 bg-slate-50/90 px-4 py-4 text-sm font-semibold text-slate-900 no-underline">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Format</p>
                        <p className="mt-2">{resource.format}</p>
                      </div>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition group-hover:translate-x-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  )
}
