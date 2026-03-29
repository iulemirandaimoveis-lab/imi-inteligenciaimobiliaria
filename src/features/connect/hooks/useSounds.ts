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

const sounds: Record<SoundEvent, () => void> = {
  online: () => {
    const t = getCtx().currentTime
    tone(880, t, 0.18, 0.22, 'sine')
    tone(1318.5, t + 0.13, 0.22, 0.20, 'sine')
    tone(1760, t + 0.13, 0.16, 0.07, 'sine')
    tone(659.25, t, 0.32, 0.08, 'triangle')
  },
  offline: () => {
    const t = getCtx().currentTime
    tone(880, t, 0.16, 0.16, 'sine')
    tone(587.33, t + 0.16, 0.28, 0.16, 'sine')
    tone(440, t + 0.16, 0.25, 0.05, 'triangle')
  },
  away: () => {
    const t = getCtx().currentTime
    tone(659.25, t, 0.18, 0.12, 'sine')
    tone(554.37, t + 0.18, 0.28, 0.12, 'sine')
  },
  busy: () => {
    const t = getCtx().currentTime
    tone(220, t, 0.10, 0.16, 'sawtooth')
    tone(440, t + 0.16, 0.14, 0.20, 'sawtooth')
    tone(523.25, t + 0.18, 0.10, 0.10, 'sine')
  },
  message: () => {
    const t = getCtx().currentTime
    tone(1046.5, t, 0.08, 0.15, 'sine')
    tone(1318.5, t + 0.08, 0.12, 0.12, 'sine')
  },
  nudge: () => {
    const t = getCtx().currentTime
    for (let i = 0; i < 8; i++) {
      tone(120 + seededRandom(i * 7 + 42) * 80, t + i * 0.04, 0.035, 0.14, 'square')
    }
  },
  mention: () => {
    const t = getCtx().currentTime
    tone(1046.5, t, 0.06, 0.18, 'sine')
    tone(1318.5, t + 0.06, 0.06, 0.16, 'sine')
    tone(1568, t + 0.12, 0.10, 0.14, 'sine')
    tone(1046.5, t + 0.22, 0.08, 0.10, 'triangle')
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
