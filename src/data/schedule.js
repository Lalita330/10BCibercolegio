export const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves']

export const scheduleRows = [
  { time: '7:30–8:20', start: '07:30', classes: ['—', 'Sociales', '—', 'Inglés'] },
  { time: '8:20–9:05', start: '08:20', classes: ['Economía', 'Lenguaje', 'Sociales', 'Química'] },
  { time: '9:05–9:20', start: '09:05', classes: ['Descanso', 'Descanso', 'Descanso', 'Descanso'], break: true },
  { time: '9:20–10:05', start: '09:20', classes: ['Inglés', 'Inglés', 'Física', '—'] },
  { time: '10:05–10:50', start: '10:05', classes: ['Física', 'Tecnología', 'Lenguaje', 'Matemáticas'] },
  { time: '10:50–11:00', start: '10:50', classes: ['Descanso', 'Descanso', 'Descanso', 'Descanso'], break: true },
  { time: '11:00–11:45', start: '11:00', classes: ['Lenguaje', 'Química', '—', '—'] },
  { time: '11:45–12:30', start: '11:45', classes: ['Tecnología', 'Matemáticas', 'Matemáticas', '—'] },
]

export const soundOptions = [
  { id: 'brisa', label: 'Campana breve', description: 'Nítida · 0,7 s', file: 'assets/sonidos/campana.wav' },
  { id: 'luna', label: 'Ding doble', description: 'Dos notas · 1,0 s', file: 'assets/sonidos/ding.wav' },
  { id: 'bosque', label: 'Arpa', description: 'Cuatro cuerdas · 1,6 s', file: 'assets/sonidos/arpa.wav' },
  { id: 'aurora', label: 'Institucional', description: 'Grave y sereno · 1,3 s', file: 'assets/sonidos/institucional.wav' },
]

export const defaultNotificationSettings = {
  enabled: false,
  sound: 'brisa',
  minutesBefore: 5,
}

export function getUpcomingClass(now, minutesBefore) {
  const dayIndex = now.getDay() - 1
  if (dayIndex < 0 || dayIndex > 3) return null

  for (const row of scheduleRows) {
    const subject = row.classes[dayIndex]
    if (!subject || subject === '—' || subject === 'Descanso') continue

    const [hour, minute] = row.start.split(':').map(Number)
    const classTime = new Date(now)
    classTime.setHours(hour, minute, 0, 0)
    const difference = classTime.getTime() - now.getTime()
    const threshold = minutesBefore * 60 * 1000

    if (difference > 0 && difference <= threshold) {
      return {
        key: `${now.toISOString().slice(0, 10)}-${row.start}-${subject}`,
        subject,
        time: row.time,
      }
    }
  }

  return null
}
