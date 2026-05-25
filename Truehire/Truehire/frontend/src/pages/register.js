import { useEffect, useMemo, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import UserRegisterPage from '../features/user/pages/register'
import RecruiterRegisterPage from '../features/recruiter/pages/recruiter-register'

const REGISTER_MODES = {
  USER: 'user',
  RECRUITER: 'recruiter'
}

const getValidMode = (value) => {
  return value === REGISTER_MODES.RECRUITER ? REGISTER_MODES.RECRUITER : REGISTER_MODES.USER
}

export default function CombinedRegisterPage() {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState(REGISTER_MODES.USER)

  const queryMode = useMemo(() => {
    const rawMode = Array.isArray(router.query?.mode) ? router.query.mode[0] : router.query?.mode
    return getValidMode(rawMode)
  }, [router.query])

  useEffect(() => {
    setSelectedMode(queryMode)
  }, [queryMode])

  const handleModeChange = (mode) => {
    const nextMode = getValidMode(mode)
    setSelectedMode(nextMode)
    const nextQuery = { ...router.query, mode: nextMode }
    router.replace({ pathname: '/register', query: nextQuery }, undefined, { shallow: true })
  }

  return (
    <>
      <Head>
        <title>Register - TrueHire</title>
        <meta
          name="description"
          content="Create a TrueHire account as a user or recruiter from one registration page."
        />
      </Head>

      <div className="relative overflow-hidden bg-[#061120]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.15),_transparent_28%),radial-gradient(circle_at_75%_15%,_rgba(250,204,21,0.12),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(59,130,246,0.12),_transparent_36%)]" />
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-amber-300/10 blur-3xl" />
        </div>

        <header className="relative z-20 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 backdrop-blur">
                <img
                  src="/images/truerizelogon.png"
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = '/images/truerizelogon.png.jpg'
                  }}
                  alt="TrueHire logo"
                  className="h-8 w-8 object-contain"
                />
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-100">TrueHire</span>
            </Link>

            <div className="rounded-full border border-white/10 bg-white/10 p-1.5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleModeChange(REGISTER_MODES.USER)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                    selectedMode === REGISTER_MODES.USER
                      ? 'bg-[linear-gradient(135deg,#0891b2,#2563eb)] text-white shadow-[0_18px_35px_-20px_rgba(37,99,235,0.8)]'
                      : 'bg-transparent text-slate-200 hover:bg-white/10'
                  }`}
                >
                  User Registration
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange(REGISTER_MODES.RECRUITER)}
                  className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 ${
                    selectedMode === REGISTER_MODES.RECRUITER
                      ? 'bg-[linear-gradient(135deg,#f59e0b,#0ea5e9)] text-white shadow-[0_18px_35px_-20px_rgba(14,165,233,0.8)]'
                      : 'bg-transparent text-slate-200 hover:bg-white/10'
                  }`}
                >
                  Recruiter Registration
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10">
          {selectedMode === REGISTER_MODES.RECRUITER ? <RecruiterRegisterPage /> : <UserRegisterPage />}
        </div>
      </div>
    </>
  )
}
