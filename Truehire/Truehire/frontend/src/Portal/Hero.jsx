'use client'

import Link from 'next/link'
import { gsap } from 'gsap'

const HERO_HEADLINE = 'Find Your Dream Job with TrueHire'

export default function Hero() {
  const handleLetterEnter = (event) => {
    const letter = event.currentTarget
    if (!letter) return
    if (letter.dataset.hovered === 'true') return
    letter.dataset.hovered = 'true'
    if (letter._colorReset) {
      letter._colorReset.kill()
      letter._colorReset = null
    }
    gsap.killTweensOf(letter)
    const timeline = gsap.timeline({ defaults: { ease: 'elastic.out(1,0.35)' } })
    timeline.to(letter, { color: '#6366f1', duration: 0.5 }, 0)
    timeline
      .to(letter, { x: 8, duration: 0.3 }, 0)
      .to(letter, { x: -8, duration: 0.3 })
      .to(letter, { x: 5, duration: 0.28 })
      .to(letter, { x: -3, duration: 0.24 })
      .to(letter, { x: 0, duration: 0.28 })
    letter._colorReset = gsap.delayedCall(5, () => {
      gsap.to(letter, {
        color: '#0f172a',
        duration: 0.9,
        ease: 'power2.out'
      })
      letter._colorReset = null
    })
  }

  const handleLetterLeave = (event) => {
    const letter = event.currentTarget
    if (!letter) return
    letter.dataset.hovered = 'false'
    if (letter._colorReset) {
      letter._colorReset.kill()
      letter._colorReset = null
    }
    gsap.killTweensOf(letter)
    gsap.to(letter, {
      x: 0,
      color: '#0f172a',
      duration: 0.25,
      ease: 'power2.out'
    })
  }

  return (
    <section className="gradient-bg py-24 relative overflow-hidden">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src="/images/Animated_Video_Without_Logo.mp4"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-white/30"></div>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-100/70 text-sm font-semibold text-indigo-700 shadow-sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powered by Truerize AI Matching
              </div>
              <h1 data-parallax="cursor" data-depth="0.16" className="text-4xl md:text-6xl font-semibold leading-tight text-slate-900">
                {'Find Your Dream'.split('').map((char, index) => (
                  <span
                    key={`line1-${char}-${index}`}
                    className="hero-letter"
                    onMouseEnter={handleLetterEnter}
                    onMouseLeave={handleLetterLeave}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
                <br />
                {'Job with TrueHire'.split('').map((char, index) => (
                  <span
                    key={`line2-${char}-${index}`}
                    className="hero-letter"
                    onMouseEnter={handleLetterEnter}
                    onMouseLeave={handleLetterLeave}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </span>
                ))}
              </h1>
              <p className="text-lg md:text-xl text-slate-800 max-w-lg">
                Connect with top companies and discover opportunities that match your skills, passion, and career goals. Your next big opportunity is just a search away.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-800">10,000+ Active Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-indigo-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-800">500+ Companies</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-slate-800">AI-Powered Matching</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">Top Companies Hiring</h2>
              <p className="text-slate-800">Join industry leaders and innovative companies that are shaping the future</p>
              <Link href="/companies">
                <button data-parallax="cursor" data-depth="0.12" className="btn btn-secondary px-6 py-3 text-sm font-semibold">
                  View All Companies
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}

