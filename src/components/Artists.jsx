import { useEffect, useState } from 'react'
import RainCanvas from './RainCanvas'
import ArtistCard from './ArtistCard'
import { fetchAllArtists } from '../spotify/client'
import styles from './Artists.module.css'

const CATEGORIES = [
  {
    id: 'pioneers',
    label: 'The Pioneers',
    subtitle: 'Foundational Influence',
    color: 'rgba(250, 108, 87, 0.88)',
    artists: ['Nujabes', 'J Dilla', 'Madlib', 'Fat Jon', 'Uyama Hiroto', 'DJ Krush', 'MF DOOM'],
  },
  {
    id: 'modern',
    label: 'Modern Icons',
    subtitle: 'Lofi Girl / Chillhop Era',
    color: 'rgba(103, 142, 237, 0.88)',
    artists: [
      'Idealism', 'Jinsang', 'bsd.u', 'Elijah Who', 'shiloh dynasty', 'SwuM', 'potsu',
      'Kupla', 'Sleepy Fish', 'Philanthrope', 'The Deli', 'Tomppabeats', 'Saib.',
      "L'Indécis", 'Mishka', 'invention_', 'Wun Two', 'Flovry', 'tender spring',
    ],
  },
  {
    id: 'benders',
    label: 'Genre-Benders',
    subtitle: 'Jazz, Acoustic & Study Beats',
    color: 'rgba(118, 191, 119, 0.88)',
    artists: [
      'Brockbeat', 'Cloudchord', 'Nohidea', 'sarcastic sounds', 'quickly, quickly',
      'Harris Cole', 'Aso', 'Plusma', 'Moondrops', 'kno', 'Vanilla', 'Birocratic',
      'Blue Wednesday', 'Shopan',
    ],
  },
  {
    id: 'global',
    label: 'Global & Emerging',
    subtitle: 'Cross-genre & New Wave',
    color: 'rgba(160, 120, 200, 0.88)',
    artists: ['Toro y Moi', 'Kalaido', 'Amanogawa', 'Guggenz'],
  },
  {
    id: 'bonus',
    label: 'Bonus Picks',
    color: 'rgba(240, 185, 80, 0.88)',
    artists: ['HM Surf', 'Takamado', 'Kudasaibeats', 'Eevee', 'Team Astro'],
  },
]

const ALL_NAMES = CATEGORIES.flatMap(c => c.artists)

export default function Artists() {
  const [artistMap, setArtistMap] = useState({})
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  useEffect(() => {
    fetchAllArtists(ALL_NAMES)
      .then(map => setArtistMap(map))
      .catch(err => { console.error(err); setError(err.message) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <img src="/images/bg.png" alt="" className={styles.bgFixed} />
      <RainCanvas fixed />

      <div className={styles.layout}>
        <main className={styles.main}>
          {error ? (
            <p className={styles.loading}>⚠ {error}</p>
          ) : loading ? (
            <p className={styles.loading}>loading artists...</p>
          ) : (
            CATEGORIES.map(cat => (
              <section key={cat.id} className={styles.category}>
                <div className={styles.categoryHeader} style={{ '--cat-color': cat.color }}>
                  <h2 className={styles.categoryTitle}>{cat.label}</h2>
                  {cat.subtitle && (
                    <p className={styles.categorySubtitle}>{cat.subtitle}</p>
                  )}
                </div>
                <div className={styles.grid}>
                  {cat.artists.map(name => (
                    <ArtistCard
                      key={name}
                      name={name}
                      data={artistMap[name]}
                      color={cat.color}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  )
}
