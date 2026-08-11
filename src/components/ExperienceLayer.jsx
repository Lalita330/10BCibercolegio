import { useEffect, useState } from 'react'

const INTRO_TEXT = 'Bienvenid@ a la página de 10°B'
const EXPERIENCE_STORAGE_KEY = 'representacion10b.experience.v1'
const INTRO_DURATION = 6000
const OPENING_DURATION = 1400
const ARRIVAL_DURATION = 27600

function shouldPlayExperience() {
  if (typeof window === 'undefined') return false

  if (new URLSearchParams(window.location.search).get('intro') === '1') return true
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false

  try {
    return window.sessionStorage.getItem(EXPERIENCE_STORAGE_KEY) !== 'seen'
  } catch {
    return true
  }
}

export default function ExperienceLayer() {
  const [phase, setPhase] = useState(() => shouldPlayExperience() ? 'intro' : 'done')
  const [typedText, setTypedText] = useState('')

  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    const timers = []

    const rememberExperience = () => {
      try {
        window.sessionStorage.setItem(EXPERIENCE_STORAGE_KEY, 'seen')
      } catch {
        // La experiencia sigue funcionando aunque el almacenamiento esté bloqueado.
      }
    }

    if (phase === 'intro') {
      body.classList.add('experience-locked')
      root.classList.remove('site-arriving')
      setTypedText('')

      let characterIndex = 0
      const typingTimer = window.setInterval(() => {
        characterIndex += 1
        setTypedText(INTRO_TEXT.slice(0, characterIndex))
        if (characterIndex >= INTRO_TEXT.length) window.clearInterval(typingTimer)
      }, 88)
      timers.push(() => window.clearInterval(typingTimer))
      timers.push(window.setTimeout(() => setPhase('opening'), INTRO_DURATION))
    }

    if (phase === 'opening') {
      body.classList.add('experience-locked')
      timers.push(window.setTimeout(() => setPhase('arrival'), OPENING_DURATION))
    }

    if (phase === 'arrival') {
      body.classList.remove('experience-locked')
      root.classList.add('site-arriving')
      timers.push(window.setTimeout(() => setPhase('done'), ARRIVAL_DURATION))
    }

    if (phase === 'done') {
      body.classList.remove('experience-locked')
      root.classList.remove('site-arriving')
      rememberExperience()
    }

    return () => {
      timers.forEach((timer) => {
        if (typeof timer === 'function') timer()
        else window.clearTimeout(timer)
      })
    }
  }, [phase])

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleMotionPreference = (event) => {
      if (event.matches) setPhase('done')
    }
    reducedMotion.addEventListener('change', handleMotionPreference)
    return () => reducedMotion.removeEventListener('change', handleMotionPreference)
  }, [])

  return (
    <>
      {(phase === 'intro' || phase === 'opening') && (
        <div
          className={`intro-experience${phase === 'opening' ? ' is-opening' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Presentación de bienvenida"
        >
          <div className="intro-noise" aria-hidden="true" />
          <div className="intro-corner intro-corner-top" aria-hidden="true">10B</div>
          <div className="intro-corner intro-corner-bottom" aria-hidden="true">Cibercolegio UCN · 2026</div>

          <div className="intro-content">
            <span className="intro-rule" aria-hidden="true" />
            <p className="intro-kicker">Archivo oficial del curso</p>
            <h1 className="intro-title">
              <span aria-hidden="true">{typedText}</span>
              <span className="intro-caret" aria-hidden="true" />
              <span className="sr-only">{INTRO_TEXT}</span>
            </h1>
            <p className="intro-caption">Un espacio para informarnos, participar y construir juntos.</p>
          </div>

          <div className="intro-progress" aria-hidden="true"><span /></div>
          <button className="experience-skip intro-skip" type="button" onClick={() => setPhase('arrival')}>
            Omitir introducción <span aria-hidden="true">→</span>
          </button>
        </div>
      )}

      {phase === 'arrival' && (
        <div className="arrival-controls" aria-live="polite">
          <span className="arrival-status">Componiendo 10B</span>
          <span className="arrival-progress" aria-hidden="true"><span /></span>
          <button className="experience-skip arrival-skip" type="button" onClick={() => setPhase('done')}>
            Omitir animación <span aria-hidden="true">→</span>
          </button>
        </div>
      )}
    </>
  )
}
