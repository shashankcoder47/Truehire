import { useState } from 'react'
import { useRouter } from 'next/router'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const { pathname } = router

  const recruiterHiddenRoutes = ['/recruiter-dashboard', '/recruiter-profile', '/post-job']
  const hideNavigationForRoutes = ['/jobs/[id]/apply', '/jobs', '/companies']
  const shouldShowNavigation = !recruiterHiddenRoutes.includes(pathname) && !hideNavigationForRoutes.includes(pathname)

  const handleHome = () => window.location.href = '/'
  const handleRegister = () => window.location.href = '/register'
  const handleLogin = () => window.location.href = '/login'

  const navButtonClass = 'inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-200'

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/70 shadow-[0_16px_40px_-28px_rgba(15,23,42,0.45)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center">
            <div
              onClick={handleHome}
              className="cursor-pointer focus:outline-none flex items-center px-3 py-2 rounded-full border border-white/70 bg-white/60 hover:bg-white/90 transition-all duration-200 shadow-sm"
              role="button"
              tabIndex={0}
              aria-label="Go to Home Page"
            >
              <img
                src="/images/truerizelogon.png"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/truerizelogon.png.jpg' }}
                alt="TrueHire Logo"
                className="h-10 w-auto mr-3"
              />
              <span className="font-bold text-xl text-slate-900 tracking-wide">TrueHire</span>
            </div>
          </div>

          {shouldShowNavigation && (
            <>
              <nav className="hidden md:flex items-center space-x-6 ml-auto">
                <div className="relative">
                  <button
                    type="button"
                    className={`${navButtonClass} gap-2 border-indigo-200 bg-white text-slate-700 shadow-[0_16px_34px_-24px_rgba(99,102,241,0.75)] hover:-translate-y-0.5 hover:border-indigo-300 hover:text-indigo-700`}
                    onClick={handleLogin}
                  >
                    <span>Login</span>
                  </button>
                </div>
                <button
                  className={`${navButtonClass} border-slate-200 bg-white/85 text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white`}
                  onClick={handleRegister}
                >
                  Register
                </button>
              </nav>

              <button
                className="md:hidden p-2 rounded-full text-slate-700 bg-white/70 border border-white/70 shadow-sm transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </>
          )}
        </div>

        {shouldShowNavigation && isMenuOpen ? (
          <div className="md:hidden border-t border-white/70 pt-4 pb-4">
            <nav className="flex flex-col space-y-2">
              <a href="/login" className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm no-underline transition hover:border-slate-300 hover:bg-slate-50">
                Login
              </a>
              <a href="/register" className="block rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm no-underline transition hover:border-slate-300 hover:bg-slate-50">
                Register
              </a>
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  )
}
