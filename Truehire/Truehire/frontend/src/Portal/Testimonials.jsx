import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, MessageSquareText, Quote, Sparkles, Star, Users } from 'lucide-react'
import apiService from '../lib/api'

const DEFAULT_PROFILE_IMAGE = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23e2e8f0"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="%23475569">U</text></svg>'

const normalizeReviews = (items) => {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => ({
    id: item?.id || item?._id || `review-${index}`,
    name: item?.user_name || item?.userName || item?.name || 'Anonymous User',
    role: item?.job_title || item?.jobTitle || 'Professional',
    company: item?.company_name || item?.companyName || item?.company || 'TrueHire',
    image: item?.profile_image || item?.profileImage || item?.avatar || null,
    content: item?.review_message || item?.review || item?.message || '',
    rating: Math.max(0, Math.min(5, Math.round(Number(item?.rating || 0) || 0)))
  }))
}

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const listRef = useRef(null)
  const stepWidthRef = useRef(0)
  const animationFrameRef = useRef(null)
  const resumeAutoScrollTimeoutRef = useRef(null)
  const isAutoScrollPausedRef = useRef(false)
  const autoScrollSpeedRef = useRef(0.45)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const loadTestimonials = async () => {
      setLoading(true)
      try {
        const response = await apiService.request('/reviews', { returnErrorObject: true })
        const raw = Array.isArray(response) ? response : response?.reviews || response?.data || []
        setTestimonials(normalizeReviews(raw))
      } catch (error) {
        setTestimonials([])
      } finally {
        setLoading(false)
      }
    }

    loadTestimonials()
  }, [])

  const updateScrollState = () => {
    const hasMultiple = testimonials.length > 1
    setCanScrollLeft(hasMultiple)
    setCanScrollRight(hasMultiple)
  }

  const getStepWidth = () => {
    const list = listRef.current
    if (!list) return 0
    const card = list.querySelector('[data-review-card]')
    if (!card) return 0
    const styles = getComputedStyle(list.firstElementChild || list)
    const gap = parseFloat(styles.columnGap || styles.gap || '0')
    return card.getBoundingClientRect().width + gap
  }

  const handleManualScroll = (direction) => {
    const list = listRef.current
    if (!list) return
    isAutoScrollPausedRef.current = true
    if (resumeAutoScrollTimeoutRef.current) {
      window.clearTimeout(resumeAutoScrollTimeoutRef.current)
    }
    const step = stepWidthRef.current || getStepWidth() || 280
    list.scrollBy({
      left: direction * step,
      behavior: 'smooth'
    })
    resumeAutoScrollTimeoutRef.current = window.setTimeout(() => {
      isAutoScrollPausedRef.current = false
    }, 1200)
  }

  useEffect(() => {
    const handleResize = () => {
      stepWidthRef.current = getStepWidth()
      updateScrollState()
    }
    stepWidthRef.current = getStepWidth()
    updateScrollState()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [testimonials.length])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const list = listRef.current
    if (!list || testimonials.length <= 1) return

    let lastTime = performance.now()

    const tick = (now) => {
      const elapsed = now - lastTime
      lastTime = now

      if (!isAutoScrollPausedRef.current) {
        const maxScrollLeft = Math.max(0, list.scrollWidth - list.clientWidth)
        if (maxScrollLeft > 0) {
          const delta = (elapsed / 16.67) * autoScrollSpeedRef.current
          const next = list.scrollLeft + delta
          list.scrollLeft = next >= maxScrollLeft ? 0 : next
        }
      }

      animationFrameRef.current = window.requestAnimationFrame(tick)
    }

    animationFrameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      if (resumeAutoScrollTimeoutRef.current) {
        window.clearTimeout(resumeAutoScrollTimeoutRef.current)
        resumeAutoScrollTimeoutRef.current = null
      }
    }
  }, [testimonials.length])

  return (
    <section
      data-reveal
      className="relative overflow-hidden bg-[linear-gradient(135deg,#f8fafc_0%,#eef2ff_42%,#ecfeff_100%)] py-20 reveal-on-scroll"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-cyan-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-indigo-700 shadow-sm">
            <Sparkles className="h-4 w-4 text-cyan-600" aria-hidden="true" />
            Community stories
          </div>
          <h2 className="text-3xl font-semibold leading-tight text-slate-950 md:text-5xl">
            What Our <span className="text-gradient">Community</span> Says
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
            Real stories from professionals who found better opportunities, clearer choices, and stronger career momentum with TrueHire.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/80 bg-white/75 p-6 shadow-[0_28px_70px_-38px_rgba(15,23,42,0.45)] backdrop-blur">
            <div className="grid gap-4 md:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-44 animate-pulse rounded-3xl bg-slate-200/70" />
              ))}
            </div>
          </div>
        ) : testimonials.length === 0 ? (
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/80 bg-white/80 p-6 shadow-[0_32px_80px_-42px_rgba(15,23,42,0.45)] backdrop-blur md:p-8">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.8fr]">
              <div className="text-center lg:text-left">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 lg:mx-0">
                  <MessageSquareText className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-2xl font-semibold text-slate-950 md:text-3xl">
                  Your story could be the first one here.
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 md:text-base">
                  The community review wall is ready for the first success story. Join TrueHire and help shape what future professionals see.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200/80 bg-slate-950 p-5 text-white shadow-2xl shadow-slate-950/20">
                <div className="mb-8 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-200">Review preview</p>
                    <p className="mt-2 text-lg font-semibold">Coming soon</p>
                  </div>
                  <Quote className="h-9 w-9 text-indigo-300" aria-hidden="true" />
                </div>
                <div className="space-y-3">
                  <div className="h-3 rounded-full bg-white/25" />
                  <div className="h-3 w-5/6 rounded-full bg-white/20" />
                  <div className="h-3 w-2/3 rounded-full bg-white/15" />
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
                    <Users className="h-5 w-5 text-cyan-200" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 w-32 rounded-full bg-white/25" />
                    <div className="mt-2 h-2 w-24 rounded-full bg-white/15" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <div
              ref={listRef}
              className="w-full overflow-x-scroll overflow-y-hidden pb-16 pt-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onMouseEnter={() => {
                isAutoScrollPausedRef.current = true
              }}
              onMouseLeave={() => {
                isAutoScrollPausedRef.current = false
              }}
              onTouchStart={() => {
                isAutoScrollPausedRef.current = true
              }}
              onTouchEnd={() => {
                isAutoScrollPausedRef.current = false
              }}
            >
              <div className="flex flex-nowrap gap-6">
                {testimonials.map((testimonial) => (
                  <article
                    key={testimonial.id}
                    data-review-card
                    className="w-[300px] shrink-0 sm:w-[330px] lg:w-[370px]"
                  >
                    <div className="relative h-full overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.55)] backdrop-blur transition duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_32px_70px_-36px_rgba(15,23,42,0.62)]">
                      <div className="absolute right-5 top-5 text-indigo-100">
                        <Quote className="h-10 w-10" aria-hidden="true" />
                      </div>

                      <div className="mb-5 flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < testimonial.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`}
                            aria-hidden="true"
                          />
                        ))}
                      </div>

                      <p className="mb-7 min-h-[7.5rem] text-sm leading-7 text-slate-600 md:text-base">
                        "{testimonial.content}"
                      </p>

                      <div className="flex items-center border-t border-slate-200/80 pt-5">
                        <img
                          src={testimonial.image || DEFAULT_PROFILE_IMAGE}
                          alt={testimonial.name}
                          className="mr-4 h-12 w-12 rounded-full object-cover ring-4 ring-indigo-50"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-slate-950">{testimonial.name}</div>
                          <div className="truncate text-sm text-slate-500">{testimonial.role} at {testimonial.company}</div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="absolute bottom-0 right-0 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleManualScroll(-1)}
                disabled={!canScrollLeft}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition duration-200 hover:scale-105 hover:text-indigo-700 disabled:opacity-35 disabled:hover:scale-100"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => handleManualScroll(1)}
                disabled={!canScrollRight}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-slate-700 shadow-sm transition duration-200 hover:scale-105 hover:text-indigo-700 disabled:opacity-35 disabled:hover:scale-100"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center">
          <p className="mb-6 text-sm font-medium text-slate-600 md:text-base">Ready to join thousands of successful professionals?</p>
          <button
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-8 py-3 text-base font-bold text-white shadow-xl shadow-indigo-600/25 transition hover:-translate-y-0.5 hover:bg-slate-950"
            onClick={() => {
              const searchSection = document.querySelector('.gradient-bg');
              if (searchSection) {
                searchSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Start Your Journey
          </button>
        </div>
      </div>
    </section>
  )
}
