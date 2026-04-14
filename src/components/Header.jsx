import { Link } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <nav className={styles.navLeft}>
          <Link to="/artists" className={styles.navLink}>
            <img src="/images/headphones.png" alt="" className={styles.navIcon} />
            <span>Artist</span>
          </Link>
        </nav>

        <Link to="/" className={styles.brand}>
          <img src="/images/logo.png" alt="Lofistory logo" className={styles.brandLogo} />
          <span className={styles.brandName}>Lofistory</span>
        </Link>

        <nav className={styles.navRight}>
          <Link to="/about" className={styles.navLink}>
            <img src="/images/coffee-icon.png" alt="" className={styles.navIcon} />
            <span>about</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
