import { useRef, useState, useCallback, useEffect } from 'react'
import styles from './RainAmbience.module.css'

function createRain(ctx) {
  const bufferSize = 4 * ctx.sampleRate
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate)

  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + white * 0.0555179
      b1 = 0.99332 * b1 + white * 0.0750759
      b2 = 0.96900 * b2 + white * 0.1538520
      b3 = 0.86650 * b3 + white * 0.3104856
      b4 = 0.55000 * b4 + white * 0.5329522
      b5 = -0.7616 * b5 - white * 0.0168980
      b6 = white * 0.5362
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.115926) * 0.11
    }
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const lowpass = ctx.createBiquadFilter()
  lowpass.type = 'lowpass'
  lowpass.frequency.value = 1200
  lowpass.Q.value = 0.5

  const highpass = ctx.createBiquadFilter()
  highpass.type = 'highpass'
  highpass.frequency.value = 200

  const gain = ctx.createGain()
  gain.gain.value = 0

  source.connect(lowpass)
  lowpass.connect(highpass)
  highpass.connect(gain)
  gain.connect(ctx.destination)

  return { source, gain }
}

const FADE_TIME = 1.5

export default function RainAmbience() {
  const ctxRef    = useRef(null)
  const gainRef   = useRef(null)
  const sourceRef = useRef(null)
  const [active, setActive] = useState(false)
  const [volume, setVolume] = useState(0.1125)

  const start = useCallback((vol) => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    const ctx = ctxRef.current
    if (ctx.state === 'suspended') ctx.resume()

    const { source, gain } = createRain(ctx)
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + FADE_TIME)
    source.start()

    gainRef.current  = gain
    sourceRef.current = source
    setActive(true)
  }, [])

  const stop = useCallback(() => {
    const ctx    = ctxRef.current
    const gain   = gainRef.current
    const source = sourceRef.current
    if (!ctx || !gain || !source) return

    const stopAt = ctx.currentTime + FADE_TIME
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0, stopAt)
    source.stop(stopAt)

    sourceRef.current = null
    gainRef.current   = null
    setActive(false)
  }, [])

  const toggle = () => {
    if (active) stop()
    else start(volume)
  }

  const handleVolume = (e) => {
    const val = parseFloat(e.target.value)
    setVolume(val)
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.setTargetAtTime(val, ctxRef.current.currentTime, 0.02)
    }
  }

  useEffect(() => {
    return () => {
      // Stop the source but leave the AudioContext open —
      // browsers (especially Safari) cap how many contexts can be created
      // per page, so closing and recreating on every HMR reload burns through the limit.
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
    }
  }, [])

  return (
    <div className={`${styles.container} ${active ? styles.active : ''}`}>
      {/* Volume slider — always visible, disabled when off */}
      <label className={styles.sliderLabel} aria-label="Rain volume">
        <input
          type="range"
          min="0"
          max="0.3"
          step="0.005"
          value={volume}
          onChange={handleVolume}
          disabled={!active}
          className={styles.slider}
        />
      </label>

      {/* Toggle button */}
      <button
        onClick={toggle}
        className={styles.btn}
        title={active ? 'Mute rain' : 'Play rain ambience'}
        aria-label={active ? 'Mute rain ambience' : 'Play rain ambience'}
      >
        <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
          <path
            d="M6 18a4 4 0 0 1-.5-7.96A6 6 0 1 1 17.5 13H18a3 3 0 0 1 0 6H6z"
            fill={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)'}
          />
          <line x1="8"  y1="21" x2="7"  y2="23" stroke={active ? '#aef' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="21" x2="11" y2="23" stroke={active ? '#aef' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="16" y1="21" x2="15" y2="23" stroke={active ? '#aef' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}
