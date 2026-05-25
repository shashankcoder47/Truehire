import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'

const STATS = [
  {
    value: 12500,
    suffix: '+',
    label: 'Jobs Posted',
    image: '/images/stats/jobs-posted-3d.png',
    alt: '3D hiring briefcase and job posting illustration',
  },
  {
    value: 750,
    suffix: '+',
    label: 'Partner Companies',
    image: '/images/stats/partner-companies-3d.png',
    alt: '3D recruiter search illustration with magnifying glass',
  },
  {
    value: 50000,
    suffix: '+',
    label: 'Happy Candidates',
    image: '/images/stats/happy-candidates-3d.png',
    alt: '3D happy professional team illustration',
  },
  {
    value: 94,
    suffix: '%',
    label: 'Success Rate',
    image: '/images/stats/success-rate-3d.png',
    alt: '3D shield checkmark and analytics illustration',
  },
]

function AnimatedNumber({ value, suffix, shouldStart }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (!shouldStart) return undefined

    let frameId
    const duration = 1500
    const startedAt = performance.now()

    const tick = (now) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(value * eased))

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => cancelAnimationFrame(frameId)
  }, [shouldStart, value])

  return (
    <span>
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  )
}

export default function Stats() {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, { once: true, margin: '-120px' })

  const cardVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 28 },
    visible: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.08,
        duration: 0.55,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  }), [])

  return (
    <section
      ref={sectionRef}
      data-reveal
      className="relative overflow-hidden bg-gradient-to-br from-white via-[#f8f7ff] to-[#eef5ff] py-20 sm:py-24 reveal-on-scroll"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.08)_1px,transparent_1px),linear-gradient(rgba(99,102,241,0.07)_1px,transparent_1px)] bg-[size:44px_44px] opacity-40" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mx-auto mb-14 max-w-3xl text-center sm:mb-16"
        >
          <div className="mx-auto mb-5 inline-flex h-10 items-center rounded-full border border-indigo-100 bg-white/70 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-600 shadow-[0_16px_40px_-28px_rgba(79,70,229,0.75)] backdrop-blur">
            TrueHire impact
          </div>
          <h2 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
              Thousands
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Join a growing community of professionals and companies building perfect matches every day.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat, index) => (
            <motion.article
              key={stat.label}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="group relative overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-6 text-center shadow-[0_24px_70px_-44px_rgba(79,70,229,0.75)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_34px_90px_-42px_rgba(79,70,229,0.95)] sm:p-7"
            >
              <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-violet-300 to-transparent opacity-80" aria-hidden="true" />

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 4 + index * 0.35,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative mx-auto mb-5 flex h-44 w-full items-center justify-center sm:h-48"
              >
                <img
                  src={stat.image}
                  alt={stat.alt}
                  className="h-full w-full object-contain drop-shadow-[0_22px_26px_rgba(79,70,229,0.18)] transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.div>

              <div className="mx-auto mb-5 h-px w-20 bg-gradient-to-r from-transparent via-indigo-300 to-transparent" />

              <div className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} shouldStart={isInView} />
              </div>
              <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-slate-500">
                {stat.label}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
