import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  days,
  defaultNotificationSettings,
  getUpcomingClass,
  scheduleRows,
  soundOptions,
} from '../data/schedule'

const STORAGE_KEY = 'representacion10b.notificationSettings.v1'
const SENT_KEY_PREFIX = 'representacion10b.sent.'

function readSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return { ...defaultNotificationSettings, ...saved }
  } catch {
    return defaultNotificationSettings
  }
}

function getPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export default function SchedulePage() {
  const [settings, setSettings] = useState(readSettings)
  const [permission, setPermission] = useState(getPermission)
  const [message, setMessage] = useState('')

  const selectedSound = useMemo(
    () => soundOptions.find((sound) => sound.id === settings.sound) ?? soundOptions[0],
    [settings.sound],
  )

  const playSound = useCallback((sound = selectedSound) => {
    const source = `${import.meta.env.BASE_URL}${sound.file}`
    const audio = new Audio(source)
    audio.volume = 0.55
    audio.play().catch(() => {
      setMessage('El navegador bloqueó el audio automático. Usa “Probar sonido” una vez para habilitarlo.')
    })
  }, [selectedSound])

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      setMessage('No fue posible guardar la preferencia en este navegador.')
    }
  }, [settings])

  useEffect(() => {
    if (!settings.enabled || permission !== 'granted') return undefined

    const checkSchedule = () => {
      const upcoming = getUpcomingClass(new Date(), settings.minutesBefore)
      if (!upcoming) return

      const sentKey = `${SENT_KEY_PREFIX}${upcoming.key}`
      if (window.sessionStorage.getItem(sentKey)) return

      try {
        new Notification('🌙 Tu próxima clase', {
          body: `${upcoming.subject} comienza a las ${upcoming.time.split('–')[0]}.`,
          tag: upcoming.key,
          renotify: false,
        })
        window.sessionStorage.setItem(sentKey, 'true')
        playSound()
      } catch {
        setMessage('El navegador no pudo mostrar el aviso. Comprueba los permisos del sitio.')
      }
    }

    checkSchedule()
    const interval = window.setInterval(checkSchedule, 30000)
    return () => window.clearInterval(interval)
  }, [permission, playSound, settings.enabled, settings.minutesBefore])

  async function toggleNotifications() {
    setMessage('')
    if (settings.enabled) {
      setSettings((current) => ({ ...current, enabled: false }))
      setMessage('Los recordatorios quedaron desactivados en este dispositivo.')
      return
    }

    if (!('Notification' in window)) {
      setPermission('unsupported')
      setMessage('Este navegador no admite notificaciones web.')
      return
    }

    if (!window.isSecureContext) {
      setMessage('Las notificaciones requieren HTTPS o una vista local segura.')
      return
    }

    const result = Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
    setPermission(result)

    if (result === 'granted') {
      setSettings((current) => ({ ...current, enabled: true }))
      setMessage('Recordatorios activados. Mantén esta pestaña abierta para recibirlos.')
      return
    }

    setSettings((current) => ({ ...current, enabled: false }))
    setMessage(result === 'denied'
      ? 'El permiso está bloqueado. Puedes cambiarlo desde la configuración del navegador.'
      : 'No se activaron los recordatorios.')
  }

  function testSound() {
    setMessage(`Reproduciendo “${selectedSound.label}”.`)
    playSound(selectedSound)
  }

  return (
    <section className="schedule-page">
      <div className="page-intro page-container">
        <div>
          <p className="eyebrow"><span />Clases · lunes a jueves</p>
          <h1>Horario de 10B</h1>
        </div>
        <div className="intro-aside">
          <p>Consulta la jornada y activa avisos privados antes de cada clase. Todo se programa desde este navegador.</p>
          <span className="provider-label">Horario académico · 2026</span>
        </div>
      </div>

      <div className="schedule-layout page-container">
        <div className="schedule-card">
          <div className="table-heading">
            <div>
              <span className="mini-label">Semana habitual</span>
              <h2>Clases de la mañana</h2>
            </div>
            <span className="table-year">10B / 2026</span>
          </div>
          <div className="table-scroll" tabIndex="0" aria-label="Horario desplazable horizontalmente">
            <table>
              <caption className="sr-only">Horario de clases de lunes a jueves</caption>
              <thead>
                <tr>
                  <th scope="col">Hora</th>
                  {days.map((day) => <th scope="col" key={day}>{day}</th>)}
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row) => (
                  <tr className={row.break ? 'break-row' : ''} key={row.time}>
                    <th scope="row">{row.time}</th>
                    {row.classes.map((subject, index) => (
                      <td key={`${row.time}-${days[index]}`}>
                        {subject === '—' ? <span className="empty-class">—</span> : subject}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="swipe-hint"><span aria-hidden="true">↔</span> Desliza para ver todos los días</p>
        </div>

        <aside className="notification-panel" aria-labelledby="notification-title">
          <div className="panel-topline">
            <span className={`notification-light${settings.enabled ? ' is-on' : ''}`} />
            <span>{settings.enabled ? 'Avisos activos' : 'Avisos inactivos'}</span>
          </div>
          <h2 id="notification-title">Configuración de notificaciones</h2>
          <p className="panel-intro">Recibe un aviso antes de cada clase mientras esta pestaña permanezca abierta.</p>

          <button
            type="button"
            className={`notification-toggle${settings.enabled ? ' is-on' : ''}`}
            onClick={toggleNotifications}
            aria-pressed={settings.enabled}
          >
            <span className="toggle-track"><span className="toggle-knob" /></span>
            <span>
              <strong>{settings.enabled ? 'Notificaciones activadas' : 'Activar notificaciones'}</strong>
              <small>{permission === 'denied' ? 'Permiso bloqueado' : 'Solo en este dispositivo'}</small>
            </span>
          </button>

          <div className="setting-group">
            <label htmlFor="advance-time">Avisar con anticipación</label>
            <div className="select-wrap">
              <select
                id="advance-time"
                value={settings.minutesBefore}
                onChange={(event) => setSettings((current) => ({
                  ...current,
                  minutesBefore: Number(event.target.value),
                }))}
              >
                {[1, 5, 10, 15].map((minutes) => (
                  <option value={minutes} key={minutes}>{minutes} {minutes === 1 ? 'minuto' : 'minutos'} antes</option>
                ))}
              </select>
              <span aria-hidden="true">⌄</span>
            </div>
          </div>

          <fieldset className="setting-group sound-fieldset">
            <legend>Sonido del aviso</legend>
            <div className="sound-grid">
              {soundOptions.map((sound) => (
                <label className={`sound-option${settings.sound === sound.id ? ' is-selected' : ''}`} key={sound.id}>
                  <input
                    type="radio"
                    name="notification-sound"
                    value={sound.id}
                    checked={settings.sound === sound.id}
                    onChange={() => setSettings((current) => ({ ...current, sound: sound.id }))}
                  />
                  <span className="sound-wave" aria-hidden="true"><i /><i /><i /></span>
                  <span><strong>{sound.label}</strong><small>{sound.description}</small></span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="button" className="button button-secondary test-button" onClick={testSound}>
            <span className="play-icon" aria-hidden="true">▶</span> Probar sonido
          </button>

          {message && <p className="settings-message" role="status">{message}</p>}
          <p className="local-note"><span aria-hidden="true">⌁</span> La configuración se guarda solamente en tu navegador.</p>
        </aside>
      </div>
    </section>
  )
}
