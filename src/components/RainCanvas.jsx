import { useRef, useEffect } from 'react'
import styles from './RainCanvas.module.css'

const DROP_COUNT = 130

export default function RainCanvas({ fixed = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    const drops = Array.from({ length: DROP_COUNT }, () => ({
      x:         Math.random() * W,
      y:         Math.random() * H,
      len:       10 + Math.random() * 18,
      speed:     1.8 + Math.random() * 3.2,
      opacity:   0.04 + Math.random() * 0.12,
      thickness: 0.4 + Math.random() * 0.6,
    }))

    let frame
    const draw = () => {
      ctx.clearRect(0, 0, W, H)

      for (const d of drops) {
        ctx.beginPath()
        ctx.strokeStyle = `rgba(210, 230, 255, ${d.opacity})`
        ctx.lineWidth = d.thickness
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x - d.len * 0.18, d.y + d.len)
        ctx.stroke()

        d.y += d.speed
        d.x -= d.speed * 0.18

        if (d.y > H + d.len) {
          d.y = -d.len
          d.x = Math.random() * (W + 60)
        }
      }

      frame = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={fixed ? styles.fixed : styles.canvas}
      width={1440}
      height={917}
    />
  )
}
