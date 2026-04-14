import { useRef, useCallback } from 'react'
import Header from './Header'
import RainCanvas from './RainCanvas'
import { useTilt } from '../hooks/useTilt'
import styles from './About.module.css'

export default function About() {
  const bgRef = useRef(null)
  const panelTilt = useTilt(8)

  const onMouseMove = useCallback((e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - left) / width - 0.5
    const y = (e.clientY - top) / height - 0.5
    bgRef.current.style.transform = `scale(1.06) translate(${x * -22}px, ${y * -16}px)`
  }, [])

  const onMouseLeave = useCallback(() => {
    bgRef.current.style.transform = 'scale(1.06) translate(0px, 0px)'
  }, [])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        <img ref={bgRef} src="/images/bg.png" alt="" className={styles.bgImage} />
        <RainCanvas />

        <section className={styles.panel} {...panelTilt}>
          <div className={styles.logoRow}>
            <img src="/images/logo.png" alt="Lofistory" className={styles.logo} />
            <h1 className={styles.title}>Lofistory</h1>
          </div>

          <p className={styles.body}>
            Lofistory is a love letter to lo-fi music — a genre born from dusty record bins,
            late-night bedroom studios, and the quiet beauty of imperfection.
          </p>

          <p className={styles.body}>
            From the jazz-soaked beats of Nujabes and J Dilla to the chillhop streams
            defining a generation of study sessions, lo-fi has always been more than
            background music. It's a mood, a memory, a culture.
          </p>

          <p className={styles.mission}>
            Our mission is to celebrate the artists, history, and sounds that built
            this world — one warm, crackling record at a time.
          </p>
        </section>
      </main>
    </div>
  )
}
