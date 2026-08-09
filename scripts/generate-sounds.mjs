import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputDirectory = resolve(projectRoot, 'public', 'assets', 'sonidos')
const sampleRate = 22050

const soundDefinitions = {
  brisa: [{ frequency: 523.25, start: 0, duration: 0.5 }, { frequency: 659.25, start: 0.34, duration: 0.62 }],
  luna: [{ frequency: 440, start: 0, duration: 0.82 }, { frequency: 659.25, start: 0.18, duration: 0.8 }],
  bosque: [{ frequency: 349.23, start: 0, duration: 0.62 }, { frequency: 523.25, start: 0.42, duration: 0.65 }],
  aurora: [{ frequency: 493.88, start: 0, duration: 0.6 }, { frequency: 622.25, start: 0.2, duration: 0.72 }, { frequency: 739.99, start: 0.42, duration: 0.7 }],
}

function createWave(notes) {
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
      const attack = Math.min(1, localTime / 0.035)
      const release = Math.pow(Math.max(0, 1 - localTime / note.duration), 2.2)
      const envelope = attack * release
      sample += Math.sin(2 * Math.PI * note.frequency * localTime) * envelope * 0.2
      sample += Math.sin(2 * Math.PI * note.frequency * 2 * localTime) * envelope * 0.035
    }
    const value = Math.max(-1, Math.min(1, sample))
    buffer.writeInt16LE(Math.round(value * 32767), 44 + index * 2)
  }

  return buffer
}

mkdirSync(outputDirectory, { recursive: true })
for (const [name, notes] of Object.entries(soundDefinitions)) {
  writeFileSync(resolve(outputDirectory, `${name}.wav`), createWave(notes))
}

console.log(`Sonidos creados en ${outputDirectory}`)
