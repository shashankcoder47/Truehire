import Link from 'next/link'
import { motion } from 'framer-motion'

const metrics = [
  { label: 'Access', value: 'Unified' },
  { label: 'Routing', value: 'Role-aware' },
  { label: 'Security', value: 'JWT' },
]

export default function PremiumLoginBrandPanel() {
  return (
    <section className="relative hidden min-h-screen overflow-hidden bg-[#06111f] px-10 py-8 text-white lg:flex lg:flex-col xl:px-14">
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, 22, 0], y: [0, -16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ x: [0, -18, 0], y: [0, 20, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-[-140px] left-20 h-96 w-96 rounded-full bg-teal-300/16 blur-3xl"
      />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(14,165,233,0.18),transparent_42%),radial-gradient(circle_at_76%_18%,rgba(255,255,255,0.16),transparent_24%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.35)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative z-10 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/8 px-3 py-2 backdrop-blur-xl transition hover:bg-white/12">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xl">
            <img
              src="/images/truerizelogon.png"
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = '/images/truerizelogon.png.jpg'
              }}
              alt="TrueHire"
              className="h-7 w-7 object-contain"
            />
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.28em] text-cyan-50">TrueHire</span>
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.75, ease: 'easeOut' }}
        className="relative z-10 mt-auto max-w-2xl pb-14"
      >
        <p className="text-sm font-semibold uppercase tracking-[0.34em] text-cyan-100/80">
          Enterprise authentication
        </p>
        <h1 className="mt-6 max-w-xl text-5xl font-bold leading-[1.04] tracking-tight text-white xl:text-6xl">
          One secure workspace for your professional journey.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-100/76">
          Access your personalized experience through a seamless intelligent authentication system.
        </p>
        <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1, duration: 0.55 }}
              className="rounded-3xl border border-white/12 bg-white/10 px-4 py-4 shadow-2xl backdrop-blur-xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100/65">{metric.label}</p>
              <p className="mt-2 text-sm font-bold text-white">{metric.value}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
