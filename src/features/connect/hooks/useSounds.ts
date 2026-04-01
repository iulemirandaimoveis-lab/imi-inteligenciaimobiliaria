'use client'

import { useCallback, useRef, useState } from 'react'
import type { SoundEvent } from '../types'

let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function tone(freq: number, start: number, dur: number, vol: number, type: OscillatorType) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(vol, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// MSN Messenger-accurate sound reproductions via Web Audio API
// Frequencies and timings calibrated to match the original Windows Live Messenger sounds
const sounds: Record<SoundEvent, () => void> = {
  online: () => {
    // MSN "contact online" — bright ascending D-F#-A (D major chord arpeggio)
    const t = getCtx().currentTime
    tone(587.33, t, 0.15, 0.20, 'sine')         // D5
    tone(739.99, t + 0.12, 0.15, 0.18, 'sine')  // F#5
    tone(880, t + 0.24, 0.20, 0.16, 'sine')     // A5
    // Warm harmonic layer
    tone(587.33, t, 0.35, 0.06, 'triangle')     // D5 sustain
    tone(1174.66, t + 0.24, 0.18, 0.04, 'sine') // D6 octave sparkle
  },
  offline: () => {
    // MSN "contact offline" — descending minor: A-F-D
    const t = getCtx().currentTime
    tone(880, t, 0.14, 0.16, 'sine')            // A5
    tone(698.46, t + 0.14, 0.16, 0.14, 'sine')  // F5
    tone(523.25, t + 0.28, 0.22, 0.12, 'sine')  // C5
    tone(523.25, t + 0.28, 0.20, 0.04, 'triangle')
  },
  away: () => {
    // Gentle two-note descend
    const t = getCtx().currentTime
    tone(783.99, t, 0.16, 0.10, 'sine')         // G5
    tone(659.25, t + 0.16, 0.22, 0.10, 'sine')  // E5
  },
  busy: () => {
    // Quick low double-tap
    const t = getCtx().currentTime
    tone(349.23, t, 0.08, 0.14, 'sine')         // F4
    tone(329.63, t + 0.12, 0.12, 0.14, 'sine')  // E4
  },
  message: () => {
    // MSN incoming message — the iconic ascending "do-do-do" chime
    // B4 → D5 → G5 with overtones
    const t = getCtx().currentTime
    tone(493.88, t, 0.10, 0.20, 'sine')         // B4
    tone(587.33, t + 0.09, 0.10, 0.18, 'sine')  // D5
    tone(783.99, t + 0.18, 0.16, 0.16, 'sine')  // G5
    // Harmonic shimmer
    tone(493.88, t, 0.24, 0.05, 'triangle')     // B4
    tone(783.99, t + 0.18, 0.22, 0.05, 'triangle') // G5 ring
    tone(1567.98, t + 0.20, 0.12, 0.02, 'sine') // G6 sparkle
  },
  nudge: () => {
    // MSN Nudge — rapid vibration buzzer pattern (the "earthquake" sound)
    const t = getCtx().currentTime
    const ctx = getCtx()
    for (let i = 0; i < 10; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(80 + (i % 2) * 40, t + i * 0.035)
      gain.gain.setValueAtTime(0.12, t + i * 0.035)
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.035 + 0.032)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(t + i * 0.035)
      osc.stop(t + i * 0.035 + 0.035)
    }
  },
  mention: () => {
    // Attention-grabbing — higher pitched version of message sound
    const t = getCtx().currentTime
    tone(783.99, t, 0.08, 0.18, 'sine')         // G5
    tone(987.77, t + 0.07, 0.08, 0.16, 'sine')  // B5
    tone(1174.66, t + 0.14, 0.12, 0.14, 'sine') // D6
    tone(1567.98, t + 0.22, 0.16, 0.12, 'sine') // G6
    tone(783.99, t, 0.30, 0.04, 'triangle')
  },
}

export function useSounds() {
  const [enabled, setEnabled] = useState(true)
  const lastPlayed = useRef<Record<string, number>>({})

  const play = useCallback(
    (event: SoundEvent, throttleMs = 500) => {
      if (!enabled) return
      const now = Date.now()
      if (lastPlayed.current[event] && now - lastPlayed.current[event] < throttleMs) return
      lastPlayed.current[event] = now
      try { sounds[event]() } catch { /* AudioContext may fail */ }
    },
    [enabled]
  )

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      if (next) { try { sounds.online() } catch { /* noop */ } }
      return next
    })
  }, [])

  return { play, enabled, toggle }
}

export default useSounds
