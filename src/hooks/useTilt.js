import { useCallback } from 'react'

/**
 * Returns onMouseMove / onMouseLeave handlers that apply a 3D perspective
 * tilt + lift to whatever element they're attached to.
 *
 * @param {number} maxDeg  – maximum rotation in degrees (default 10)
 */
export function useTilt(maxDeg = 10) {
  const onMouseMove = useCallback((e) => {
    const el = e.currentTarget
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = (e.clientX - left) / width   // 0 → 1
    const y = (e.clientY - top)  / height  // 0 → 1

    const rotX = (y - 0.5) * -maxDeg
    const rotY = (x - 0.5) *  maxDeg

    // Remove transition while tracking so it follows the cursor instantly
    el.style.transition = 'box-shadow 0.15s ease'
    el.style.transform  = `perspective(900px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.035)`
    el.style.boxShadow  = `${-rotY * 2}px ${Math.abs(rotX) + 14}px 40px rgba(0,0,0,0.32)`
    el.style.zIndex     = '5'
  }, [maxDeg])

  const onMouseLeave = useCallback((e) => {
    const el = e.currentTarget
    // Smooth spring-back
    el.style.transition = 'transform 0.65s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.5s ease'
    el.style.transform  = 'perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)'
    el.style.boxShadow  = ''
    el.style.zIndex     = ''
  }, [])

  return { onMouseMove, onMouseLeave }
}
