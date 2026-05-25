const MOTION_STRENGTH = 4
const MAX_TRANSLATE = 6
const EASE = 0.06

const state = {
  items: new Map(),
  rafId: null,
  targetX: 0,
  targetY: 0,
  currentX: 0,
  currentY: 0,
  listening: false,
  disabled: false
}

const shouldDisable = () => {
  if (typeof window === 'undefined') return true
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  return prefersReduced || isTouch
}

const setTranslate = (el, x, y) => {
  if ('translate' in el.style) {
    el.style.translate = `${x}px ${y}px`
  } else {
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }
}

const animate = () => {
  state.currentX += (state.targetX - state.currentX) * EASE
  state.currentY += (state.targetY - state.currentY) * EASE

  state.items.forEach((depth, el) => {
    const scaledX = state.currentX * depth * MOTION_STRENGTH
    const scaledY = state.currentY * depth * MOTION_STRENGTH
    const translateX = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, scaledX))
    const translateY = Math.max(-MAX_TRANSLATE, Math.min(MAX_TRANSLATE, scaledY))
    setTranslate(el, translateX.toFixed(2), translateY.toFixed(2))
  })

  if (Math.abs(state.targetX - state.currentX) + Math.abs(state.targetY - state.currentY) > 0.001) {
    state.rafId = requestAnimationFrame(animate)
  } else {
    state.rafId = null
  }
}

const handleMove = (event) => {
  state.targetX = (event.clientX / window.innerWidth - 0.5) * 2
  state.targetY = (event.clientY / window.innerHeight - 0.5) * 2
  if (!state.rafId) {
    state.rafId = requestAnimationFrame(animate)
  }
}

const handleLeave = () => {
  state.targetX = 0
  state.targetY = 0
  if (!state.rafId) {
    state.rafId = requestAnimationFrame(animate)
  }
}

const startListening = () => {
  if (state.listening) return
  window.addEventListener('mousemove', handleMove, { passive: true })
  window.addEventListener('mouseleave', handleLeave)
  window.addEventListener('blur', handleLeave)
  state.listening = true
}

const stopListening = () => {
  if (!state.listening) return
  window.removeEventListener('mousemove', handleMove)
  window.removeEventListener('mouseleave', handleLeave)
  window.removeEventListener('blur', handleLeave)
  state.listening = false
}

export const initParallax = (scope) => {
  if (state.disabled || shouldDisable()) {
    state.disabled = true
    return () => {}
  }

  const scopeEl = typeof scope === 'string' ? document.querySelector(scope) : scope
  if (!scopeEl) return () => {}

  const elements = Array.from(scopeEl.querySelectorAll('[data-parallax="cursor"]'))
  if (!elements.length) return () => {}

  elements.forEach((el) => {
    const rawDepth = parseFloat(el.getAttribute('data-depth') || '0.4')
    const depth = Number.isFinite(rawDepth) ? rawDepth : 0.4
    state.items.set(el, depth)
  })

  startListening()

  return () => {
    elements.forEach((el) => {
      state.items.delete(el)
      setTranslate(el, '0', '0')
    })

    if (!state.items.size) {
      stopListening()
      if (state.rafId) cancelAnimationFrame(state.rafId)
      state.rafId = null
      state.targetX = 0
      state.targetY = 0
      state.currentX = 0
      state.currentY = 0
    }
  }
}
