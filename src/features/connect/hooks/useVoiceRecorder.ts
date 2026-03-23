'use client'

import { useState, useRef, useCallback } from 'react'

interface VoiceRecorderState {
    isRecording: boolean
    duration: number
    waveformData: number[]
    audioBlob: Blob | null
    error: string | null
}

export function useVoiceRecorder() {
    const [state, setState] = useState<VoiceRecorderState>({
        isRecording: false, duration: 0, waveformData: [], audioBlob: null, error: null,
    })
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const animFrameRef = useRef<number | null>(null)

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 48000 }
            })
            const audioContext = new AudioContext()
            const source = audioContext.createMediaStreamSource(stream)
            const analyser = audioContext.createAnalyser()
            analyser.fftSize = 256
            source.connect(analyser)
            audioContextRef.current = audioContext
            analyserRef.current = analyser

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus' : 'audio/mp4'
            const mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 })
            chunksRef.current = []
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(100)

            let duration = 0
            timerRef.current = setInterval(() => {
                duration += 0.1
                setState(prev => ({ ...prev, duration }))
            }, 100)

            const waveformData: number[] = []
            const captureWaveform = () => {
                if (!analyserRef.current) return
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
                analyserRef.current.getByteFrequencyData(dataArray)
                const avg = dataArray.reduce((a, b) => a + b) / dataArray.length / 255
                waveformData.push(avg)
                setState(prev => ({ ...prev, waveformData: [...waveformData] }))
                animFrameRef.current = requestAnimationFrame(captureWaveform)
            }
            captureWaveform()
            setState(prev => ({ ...prev, isRecording: true, duration: 0, waveformData: [], error: null }))
        } catch {
            setState(prev => ({ ...prev, error: 'Permissao de microfone negada' }))
        }
    }, [])

    const stopRecording = useCallback(async (): Promise<Blob> => {
        return new Promise((resolve) => {
            const mr = mediaRecorderRef.current
            if (!mr) throw new Error('No recorder')
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mr.mimeType })
                setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }))
                mr.stream.getTracks().forEach(t => t.stop())
                if (timerRef.current) clearInterval(timerRef.current)
                if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
                if (audioContextRef.current) audioContextRef.current.close()
                resolve(blob)
            }
            mr.stop()
        })
    }, [])

    const cancelRecording = useCallback(() => {
        const mr = mediaRecorderRef.current
        if (mr && mr.state !== 'inactive') {
            mr.stream.getTracks().forEach(t => t.stop())
            mr.stop()
        }
        if (timerRef.current) clearInterval(timerRef.current)
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        if (audioContextRef.current) audioContextRef.current.close()
        setState({ isRecording: false, duration: 0, waveformData: [], audioBlob: null, error: null })
    }, [])

    return { ...state, startRecording, stopRecording, cancelRecording }
}
