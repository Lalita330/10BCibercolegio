import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = resolve(projectRoot, 'public', 'assets', 'sonidos')
const sampleRate = 22050

const soundDefinitions = {
  campana: {
    gain: 0.22,
    notes: [
      { frequency: 987.77, start: 0, duration: 0.66, envelope: 'bell', harmonics: [1, 0.52, 0.22, 0.1] },
    ],
  },
  ding: {
    gain: 0.19,
    notes: [
      { frequency: 659.25, start: 0, duration: 0.58, envelope: 'soft', harmonics: [1, 0.1] },
      { frequency: 880, start: 0.34, duration: 0.66, envelope: 'soft', harmonics: [1, 0.08] },
    ],
  },
  arpa: {
    gain: 0.16,
    notes: [
      { frequency: 523.25, start: 0, duration: 0.75, envelope: 'pluck', harmonics: [1, 0.34, 0.15] },
      { frequency: 659.25, start: 0.17, duration: 0.82, envelope: 'pluck', harmonics: [1, 0.3, 0.12] },
      { frequency: 783.99, start: 0.34, duration: 0.88, envelope: 'pluck', harmonics: [1, 0.25, 0.09] },
      { frequency: 1046.5, start: 0.52, duration: 0.96, envelope: 'pluck', harmonics: [1, 0.2, 0.06] },
    ],
  },
  institucional: {
    gain: 0.17,
    notes: [
      { frequency: 261.63, start: 0, duration: 1.15, envelope: 'slow', harmonics: [1, 0.22, 0.08] },
      { frequency: 392, start: 0.08, duration: 1.12, envelope: 'slow', harmonics: [1, 0.16, 0.05] },
      { frequency: 523.25, start: 0.22, duration: 0.95, envelope: 'slow', harmonics: [1, 0.1] },
    ],
  },
}

function getEnvelope(type, localTime, duration) {
  const progress = localTime / duration
  if (type === 'bell') return Math.min(1, localTime / 0.008) * Math.exp(-5.5 * progress)
  if (type === 'pluck') return Math.min(1, localTime / 0.006) * Math.exp(-6.2 * progress)
  if (type === 'slow') return Math.min(1, localTime / 0.075) * Math.pow(Math.max(0, 1 - progress), 1.7)
  return Math.min(1, localTime / 0.025) * Math.pow(Math.max(0, 1 - progress), 2.3)
}

function createWave({ notes, gain }) {
  const totalDuration = Math.max(...notes.map((note) => note.start + note.duration)) + 0.12
  const sampleCount = Math.ceil(totalDuration * sampleRate)
  const dataSize = sampleCount * 2
  const buffer = Buffer.alloc(44 + dataSize)

  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(1, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * 2, 28)
  buffer.writeUInt16LE(2, 32)
  buffer.writeUInt16LE(16, 34)
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate
    let sample = 0
    for (const note of notes) {
      const localTime = time - note.start
      if (localTime < 0 || localTime > note.duration) continue
      const envelope = getEnvelope(note.envelope, localTime, note.duration)
      note.harmonics.forEach((strength, harmonicIndex) => {
        const harmonic = harmonicIndex + 1
        sample += Math.sin(2 * Math.PI * note.frequency * harmonic * localTime) * envelope * strength * gain
      })
    }
    const value = Math.max(-1, Math.min(1, sample))
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2)
  }

  return buffer
}

mkdirSync(outputDirectory, { recursive: true })
for (const [name, definition] of Object.entries(soundDefinitions)) {
  writeFileSync(resolve(outputDirectory, `${name}.wav`), createWave(definition))
}

console.log(`Sonidos creados en ${outputDirectory}`)
