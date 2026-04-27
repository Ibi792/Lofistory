import { useRef, useCallback, useEffect, useState } from 'react'
import TrackPlayer from './TrackPlayer'
import RainCanvas from './RainCanvas'
import { useTilt } from '../hooks/useTilt'
import { searchTrack } from '../spotify/client'
import styles from './Home.module.css'

const ARTISTS = [
  { src: '/images/nujabes.png',  name: 'Nujabes',       radius: '30px' },
  { src: '/images/artist2.png',  name: 'Potsu',       radius: '40px' },
  { src: '/images/lofi-girl.png',name: 'Lofi Girl',     radius: '40px' },
  { src: '/images/artist3.png',  name: 'J Dilla',        radius: '40px' },
  { src: '/images/artist4.png',  name: 'Tomppabeats',      radius: '40px' },
]

const TRACKS = [
  { cover: '/images/track1.png', src: '/audio/track1.mp3', title: 'Just Friends',    artist: 'Potsu'  },
  { cover: '/images/track2.png', src: '/audio/track2.mp3', title: 'U-Love', artist: 'J-Dilla' },
  { cover: '/images/track3.png', src: '/audio/track3.mp3', title: 'Aruarian Dance',   artist: 'Nujabes' },
]

export default function Home() {
  const bgRef     = useRef(null)
  const historyTilt = useTilt(10)
  const tracksTilt  = useTilt(8)
  const artistsTilt = useTilt(6)   // wider panel → subtler tilt

  const [spotifyUrls, setSpotifyUrls] = useState({})

  useEffect(() => {
    Promise.all(
      TRACKS.map(t => searchTrack(t.title, t.artist).catch(() => null))
    ).then(results => {
      const urls = {}
      TRACKS.forEach((t, i) => {
        if (results[i]) urls[t.title] = results[i]
      })
      setSpotifyUrls(urls)
    })
  }, [])

  // Background parallax: bg drifts opposite to cursor
  const onMainMouseMove = useCallback((e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - left) / width  - 0.5  // -0.5 → 0.5
    const y = (e.clientY - top)  / height - 0.5
    bgRef.current.style.transform = `scale(1.06) translate(${x * -22}px, ${y * -16}px)`
  }, [])

  const onMainMouseLeave = useCallback(() => {
    bgRef.current.style.transform = 'scale(1.06) translate(0px, 0px)'
  }, [])

  return (
    <main
      className={styles.main}
      onMouseMove={onMainMouseMove}
      onMouseLeave={onMainMouseLeave}
    >
        {/* Background — parallax layer */}
        <img
          ref={bgRef}
          src="/images/bg.png"
          alt=""
          className={styles.bgImage}
        />

        {/* Visual rain — sits above bg, below panels */}
        <RainCanvas />

        {/* Left panel – A Brief History */}
        <section className={styles.historyPanel} {...historyTilt}>
          <h2 className={styles.sectionTitle}>A Brief History</h2>
          <p className={styles.historyText}>
            Lo-fi, born in the 1990s, embraces imperfect sound quality with a DIY ethos.
            Known for its warm, mellow vibe, it gained popularity with the resurgence of
            "lo-fi hip-hop," creating a global phenomenon with dedicated fans through
            online platforms and study playlists.
          </p>
        </section>

        {/* Right panel – Famous Tracks */}
        <section className={styles.tracksPanel} {...tracksTilt}>
          <h2 className={styles.sectionTitle}>Famous Tracks</h2>
          <div className={styles.trackList}>
            {TRACKS.map((t, i) => (
              <TrackPlayer
                key={i}
                src={t.src}
                cover={t.cover}
                title={t.title}
                artist={t.artist}
                spotifyUrl={spotifyUrls[t.title]}
              />
            ))}
          </div>
        </section>

        {/* Bottom panel – Notable Artists */}
        <section className={styles.artistsPanel} id="artists" {...artistsTilt}>
          <h2 className={styles.notableTitle}>Notable Artist</h2>
          <div className={styles.artistGrid}>
            {ARTISTS.map((a, i) => (
              <div key={i} className={styles.artistWrap} style={{ borderRadius: a.radius }}>
                <img src={a.src} alt={a.name} className={styles.artistPhoto} />
                <div className={styles.artistOverlay}>
                  <span className={styles.artistName}>{a.name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
    </main>
  )
}
