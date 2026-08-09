import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  days,
  defaultNotificationSettings,
  getUpcomingClass,
  scheduleRows,
  soundOptions,
} from '../data/schedule'

const STORAGE_KEY = 'representacion10b.notificationSettings.v1'
const CUSTOM_SOUND_STORAGE_KEY = 'representacion10b.customSound.v1'
const CUSTOM_SOUND_ID = 'custom'
const SENT_KEY_PREFIX = 'representacion10b.sent.'
const MAX_CUSTOM_SOUND_BYTES = 768 * 1024
const MAX_CUSTOM_SOUND_SECONDS = 5

const acceptedAudioTypes = {
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave'],
  ogg: ['audio/ogg', 'application/ogg'],
}

function readCustomSound() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CUSTOM_SOUND_STORAGE_KEY))
    if (
      saved?.data?.startsWith('data:audio/')
      && typeof saved.name === 'string'
      && Number(saved.size) <= MAX_CUSTOM_SOUND_BYTES
      && Number(saved.duration) <= MAX_CUSTOM_SOUND_SECONDS
    ) {
      return saved
    }
  } catch {
    // Un valor incompleto o manipulado se ignora y se usa el sonido predeterminado.
  }
  return null
}

function readSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    const nextSettings = { ...defaultNotificationSettings, ...saved }
    if (nextSettings.sound === CUSTOM_SOUND_ID && !readCustomSound()) {
      nextSettings.sound = defaultNotificationSettings.sound
    }
    return nextSettings
  } catch {
    return defaultNotificationSettings
  }
}

function getPermission() {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function detectAudioFormat(buffer) {
  const bytes = new Uint8Array(buffer)
  const text = (start, length) => String.fromCharCode(...bytes.slice(start, start + length))
  if (bytes.length >= 12 && text(0, 4) === 'RIFF' && text(8, 4) === 'WAVE') return 'wav'
  if (bytes.length >= 4 && text(0, 4) === 'OggS') return 'ogg'
  if (bytes.length >= 3 && text(0, 3) === 'ID3') return 'mp3'
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'mp3'
  return null
}

function arrayBufferToDataUrl(buffer, mimeType) {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return `data:${mimeType};base64,${window.btoa(binary)}`
}

function dataUrlToArrayBuffer(dataUrl) {
  const encoded = dataUrl.split(',')[1]
  const binary = window.atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes.buffer
}

function getAudioContextConstructor() {
  return window.AudioContext || window.webkitAudioContext
}

function formatFileSize(bytes) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

export default function SchedulePage() {
  const [settings, setSettings] = useState(readSettings)
  const [permission, setPermission] = useState(getPermission)
  const [message, setMessage] = useState('')
  const [customSound, setCustomSound] = useState(readCustomSound)
  const [uploadingSound, setUploadingSound] = useState(false)
  const audioContextRef = useRef(null)
  const customBufferCache = useRef({ data: null, buffer: null })

  const selectedSound = useMemo(() => {
    if (settings.sound === CUSTOM_SOUND_ID && customSound) {
      return {
        id: CUSTOM_SOUND_ID,
        label: customSound.name,
        description: `Privado · ${customSound.duration.toFixed(1)} s`,
      }
    }
    return soundOptions.find((sound) => sound.id === settings.sound) ?? soundOptions[0]
  }, [customSound, settings.sound])

  const getAudioContext = useCallback(() => {
    const AudioContextConstructor = getAudioContextConstructor()
    if (!AudioContextConstructor) throw new Error('Este navegador no puede reproducir audio personalizado.')
    if (!audioContextRef.current) audioContextRef.current = new AudioContextConstructor()
    return audioContextRef.current
  }, [])

  const playCustomSound = useCallback(async (savedSound) => {
    const context = getAudioContext()
    if (context.state === 'suspended') await context.resume()

    let decodedBuffer = customBufferCache.current.buffer
    if (!decodedBuffer || customBufferCache.current.data !== savedSound.data) {
      decodedBuffer = await context.decodeAudioData(dataUrlToArrayBuffer(savedSound.data))
      customBufferCache.current = { data: savedSound.data, buffer: decodedBuffer }
    }

    const source = context.createBufferSource()
    const gain = context.createGain()
    gain.gain.value = 0.58
    source.buffer = decodedBuffer
    source.connect(gain)
    gain.connect(context.destination)
    source.start()
  }, [getAudioContext])

  const playSound = useCallback(async (sound = selectedSound) => {
    try {
      if (sound.id === CUSTOM_SOUND_ID) {
        if (!customSound) {
          setSettings((current) => ({ ...current, sound: defaultNotificationSettings.sound }))
          throw new Error('El sonido personalizado ya no está disponible. Se restauró la campana breve.')
        }
        await playCustomSound(customSound)
        return
      }

      const source = `${import.meta.env.BASE_URL}${sound.file}`
      const audio = new Audio(source)
      audio.volume = 0.55
      await audio.play()
    } catch (error) {
      setMessage(error instanceof Error && error.message.includes('restauró')
        ? error.message
        : 'El navegador bloqueó el audio automático. Usa “Probar” una vez para habilitarlo.')
    }
  }, [customSound, playCustomSound, selectedSound])

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

  function testSound(sound) {
    setMessage(`Reproduciendo “${sound.label}”.`)
    void playSound(sound)
  }

  async function uploadCustomSound(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setMessage('')
    setUploadingSound(true)
    try {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!['mp3', 'wav', 'ogg'].includes(extension)) {
        throw new Error('Formato no permitido. Usa un archivo MP3, WAV u OGG.')
      }
      if (file.size > MAX_CUSTOM_SOUND_BYTES) {
        throw new Error('El archivo supera el límite de 768 KB.')
      }

      const buffer = await file.arrayBuffer()
      const actualFormat = detectAudioFormat(buffer)
      if (!actualFormat || actualFormat !== extension) {
        throw new Error('El contenido real del archivo no coincide con un audio MP3, WAV u OGG válido.')
      }
      if (file.type && !acceptedAudioTypes[actualFormat].includes(file.type.toLowerCase())) {
        throw new Error('El tipo de archivo declarado no coincide con su contenido de audio.')
      }

      const AudioContextConstructor = getAudioContextConstructor()
      if (!AudioContextConstructor) throw new Error('Este navegador no puede validar el audio.')
      const validationContext = new AudioContextConstructor()
      let decoded
      try {
        decoded = await validationContext.decodeAudioData(buffer.slice(0))
      } catch {
        throw new Error('No fue posible decodificar el archivo como audio válido.')
      } finally {
        void validationContext.close()
      }

      if (decoded.duration <= 0 || decoded.duration > MAX_CUSTOM_SOUND_SECONDS) {
        throw new Error('El sonido debe durar máximo 5 segundos.')
      }

      const mimeType = acceptedAudioTypes[actualFormat][0]
      const savedSound = {
        name: file.name.slice(0, 80),
        type: mimeType,
        size: file.size,
        duration: decoded.duration,
        data: arrayBufferToDataUrl(buffer, mimeType),
      }

      try {
        window.localStorage.setItem(CUSTOM_SOUND_STORAGE_KEY, JSON.stringify(savedSound))
      } catch {
        throw new Error('No hay espacio local suficiente para guardar este sonido.')
      }

      customBufferCache.current = { data: savedSound.data, buffer: decoded }
      setCustomSound(savedSound)
      setSettings((current) => ({ ...current, sound: CUSTOM_SOUND_ID }))
      setMessage('Sonido privado guardado y seleccionado únicamente en este dispositivo.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No fue posible guardar el sonido.')
    } finally {
      setUploadingSound(false)
    }
  }

  function removeCustomSound() {
    try {
      window.localStorage.removeItem(CUSTOM_SOUND_STORAGE_KEY)
    } catch {
      // La interfaz se restaura aunque el navegador bloquee el almacenamiento.
    }
    customBufferCache.current = { data: null, buffer: null }
    setCustomSound(null)
    setSettings((current) => ({ ...current, sound: defaultNotificationSettings.sound }))
    setMessage('Sonido personalizado eliminado. Se restauró la campana breve.')
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
                <div className={`sound-choice${settings.sound === sound.id ? ' is-selected' : ''}`} key={sound.id}>
                  <label className="sound-option">
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
                  <button
                    type="button"
                    className="sound-test-button"
                    onClick={() => testSound(sound)}
                    aria-label={`Probar ${sound.label}`}
                    title={`Probar ${sound.label}`}
                  >
                    <span aria-hidden="true">▶</span>
                  </button>
                </div>
              ))}

              {customSound && (
                <div className={`sound-choice custom-choice${settings.sound === CUSTOM_SOUND_ID ? ' is-selected' : ''}`}>
                  <label className="sound-option">
                    <input
                      type="radio"
                      name="notification-sound"
                      value={CUSTOM_SOUND_ID}
                      checked={settings.sound === CUSTOM_SOUND_ID}
                      onChange={() => setSettings((current) => ({ ...current, sound: CUSTOM_SOUND_ID }))}
                    />
                    <span className="sound-wave custom-wave" aria-hidden="true"><i /><i /><i /></span>
                    <span><strong>Mi sonido</strong><small>{customSound.name}</small></span>
                  </label>
                  <button
                    type="button"
                    className="sound-test-button"
                    onClick={() => testSound(selectedSound.id === CUSTOM_SOUND_ID ? selectedSound : {
                      id: CUSTOM_SOUND_ID,
                      label: customSound.name,
                    })}
                    aria-label="Probar sonido personalizado"
                    title="Probar sonido personalizado"
                  >
                    <span aria-hidden="true">▶</span>
                  </button>
                </div>
              )}
            </div>
          </fieldset>

          <div className="custom-sound-upload">
            <div className="custom-upload-heading">
              <div>
                <strong>Subir tu propio sonido</strong>
                <span>MP3, WAV u OGG · máximo 768 KB y 5 segundos</span>
              </div>
              <label className={`upload-sound-button${uploadingSound ? ' is-busy' : ''}`}>
                <input
                  type="file"
                  accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
                  onChange={uploadCustomSound}
                  disabled={uploadingSound}
                />
                <span aria-hidden="true">＋</span>
                {uploadingSound ? 'Validando…' : customSound ? 'Reemplazar' : 'Elegir archivo'}
              </label>
            </div>

            {customSound && (
              <div className="custom-sound-meta">
                <span>{customSound.name}</span>
                <small>{formatFileSize(customSound.size)} · {customSound.duration.toFixed(1)} s</small>
                <button type="button" onClick={removeCustomSound}>Eliminar</button>
              </div>
            )}

            <p className="custom-privacy-note">
              <span aria-hidden="true">⌁</span>
              Privado: el archivo se valida y se guarda solo en este navegador. Nunca se envía ni se comparte con el curso.
            </p>
          </div>

          {message && <p className="settings-message" role="status">{message}</p>}
          <p className="local-note"><span aria-hidden="true">⌁</span> La configuración se guarda solamente en tu navegador.</p>
        </aside>
      </div>
    </section>
  )
}
