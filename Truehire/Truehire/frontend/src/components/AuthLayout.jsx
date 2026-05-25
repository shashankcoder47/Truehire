import Link from 'next/link'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#07111f_0%,#12315a_48%,#0f766e_100%)] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.22),transparent_26%),radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.18),transparent_24%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.12),transparent_30%)]" />
      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col">
        <header className="flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white shadow-xl backdrop-blur transition hover:bg-white/15">
            <img
              src="/images/truerizelogon.png"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = '/images/truerizelogon.png.jpg'
              }}
              alt="TrueHire"
              className="h-9 w-9 object-contain"
            />
            <span className="text-sm font-bold uppercase tracking-[0.24em]">TrueHire</span>
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_460px]">
          <div className="hidden max-w-xl text-white lg:block">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-100/80">One secure workspace</p>
            <h1 className="mt-5 text-5xl font-bold leading-tight">{title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-100/80">{subtitle}</p>
          </div>

          <div className="rounded-[28px] border border-white/25 bg-white/80 p-5 shadow-[0_30px_90px_-35px_rgba(2,6,23,0.85)] backdrop-blur-2xl sm:p-8">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
