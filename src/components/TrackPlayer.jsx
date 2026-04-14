import { useRef, useState, useEffect, useCallback } from 'react'
import styles from './TrackPlayer.module.css'

export default function TrackPlayer({ src, cover, title, artist, spotifyUrl }) {
  const audioRef = useRef(null)
  const canvasRef = useRef(null)
  const analyserRef = useRef(null)
  const audioCtxRef = useRef(null)
  const animFrameRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)

  const initAudio = useCallback(() => {
    if (analyserRef.current) return
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 128
    analyser.smoothingTimeConstant = 0.8
    const source = ctx.createMediaElementSource(audioRef.current)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    audioCtxRef.current = ctx
    analyserRef.current = analyser
  }, [])

  const drawBars = useCallback(() => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyser.getByteFrequencyData(dataArray)

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barCount = 40
    const barWidth = Math.floor(canvas.width / barCount) - 2
    const step = Math.floor(bufferLength / barCount)

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i * step] / 255
      const barHeight = Math.max(4, value * canvas.height)
      const x = i * (barWidth + 2)
      const y = canvas.height - barHeight

      // Gradient: white at top, slightly transparent at base
      const grad = ctx.createLinearGradient(0, y, 0, canvas.height)
      grad.addColorStop(0, `rgba(255, 255, 255, ${0.5 + value * 0.5})`)
      grad.addColorStop(1, `rgba(255, 255, 255, 0.15)`)

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.roundRect(x, y, barWidth, barHeight, 2)
      ctx.fill()
    }

    animFrameRef.current = requestAnimationFrame(drawBars)
  }, [])

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const barCount = 40
    const barWidth = Math.floor(canvas.width / barCount) - 2

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + 2)
      const barHeight = 4 + Math.sin(i * 0.4) * 8
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.beginPath()
      ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 2)
      ctx.fill()
    }
  }, [])

  useEffect(() => {
    drawIdle()
  }, [drawIdle])

  useEffect(() => {
    const audio = audioRef.current
    const onTimeUpdate = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => {
      setPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
      drawIdle()
      setProgress(0)
    }
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('ended', onEnded)
    }
  }, [drawIdle])

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [])

  const togglePlay = async () => {
    initAudio()
    if (audioCtxRef.current?.state === 'suspended') {
      await audioCtxRef.current.resume()
    }

    if (playing) {
      audioRef.current.pause()
      cancelAnimationFrame(animFrameRef.current)
      drawIdle()
      setPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        drawBars()
        setPlaying(true)
      } catch {
        // autoplay blocked or file missing
      }
    }
  }

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = ratio * audioRef.current.duration
  }

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    audioRef.current.volume = val
  }

  return (
    <div className={styles.row}>
      <img src={cover} alt={title} className={styles.cover} />

      <button
        onClick={togglePlay}
        className={`${styles.playBtn} ${playing ? styles.playing : ''}`}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <rect x="5" y="3" width="4" height="18" rx="1" />
            <rect x="15" y="3" width="4" height="18" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className={styles.visualizerWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          width={420}
          height={90}
        />
        <div className={styles.trackInfo}>
          <span className={styles.trackTitle}>{title}</span>
          <span className={styles.trackArtist}>{artist}</span>
        </div>
        <div className={styles.progressBar} onClick={seek}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {spotifyUrl && (
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.spotifyBtn}
          aria-label={`Listen to ${title} on Spotify`}
          onClick={e => e.stopPropagation()}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </a>
      )}

      <div className={styles.volumeWrap}>
        {/* Speaker icon — changes at 0, low, and full */}
        <svg viewBox="0 0 24 24" fill="none" width="16" height="16" className={styles.volIcon}>
          {volume === 0 ? (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.6)" />
              <line x1="23" y1="9" x2="17" y2="15" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              <line x1="17" y1="9" x2="23" y2="15" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
            </>
          ) : volume < 0.5 ? (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.6)" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </>
          ) : (
            <>
              <path d="M11 5L6 9H2v6h4l5 4V5z" fill="rgba(255,255,255,0.6)" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </>
          )}
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={volume}
          onChange={handleVolume}
          className={styles.volSlider}
          aria-label="Track volume"
        />
      </div>

      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
    </div>
  )
}
