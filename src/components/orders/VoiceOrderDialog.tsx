import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Square, Upload } from 'lucide-react'
import { useUploadVoiceOrder } from '@/queries/ordersQueries'

type RecordingStatus = 'idle' | 'recording' | 'paused' | 'done'
type PermissionState = 'unknown' | 'granted' | 'denied' | 'prompt'

interface VoiceOrderDialogProps {
  onClose: () => void
  eventDate: string // YYYY-MM-DD
}

const VoiceOrderDialog: React.FC<VoiceOrderDialogProps> = ({
  onClose,
  eventDate,
}) => {
  const [customerName, setCustomerName] = useState('')
  const [selectedEventDate, setSelectedEventDate] = useState(eventDate)
  const [formError, setFormError] = useState<string | null>(null)
  const [status, setStatus] = useState<RecordingStatus>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [permissionState, setPermissionState] =
    useState<PermissionState>('unknown')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    mutate: uploadVoiceOrder,
    isPending,
    isSuccess,
    isError,
  } = useUploadVoiceOrder()

  /* ── Check mic permission on mount ─────────── */
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const result = await navigator.permissions.query({
          name: 'microphone' as PermissionName,
        })
        setPermissionState(result.state as PermissionState)
        result.onchange = () =>
          setPermissionState(result.state as PermissionState)
      } catch {
        // iOS Safari / some PWAs don't support permissions API
        setPermissionState('unknown')
      }
    }

    checkPermission()
  }, [])

  /* ── Timer helpers ─────────────────────────── */
  const startTimer = () => {
    timerRef.current = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
  }

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  /* ── Recording controls ────────────────────── */
  const startRecording = async () => {
    if (permissionState === 'denied') {
      setFormError(
        'Microphone access is blocked. Please enable it in your browser or device settings.'
      )
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionState('granted')
      setFormError(null)
      streamRef.current = stream

      const mimeType =
        ['audio/mp4', 'audio/webm', 'audio/ogg'].find((type) =>
          MediaRecorder.isTypeSupported(type)
        ) ?? ''

      const mediaRecorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      )
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        setStatus('done')
        stopTimer()
      }

      mediaRecorder.start()
      setStatus('recording')
      setElapsedSeconds(0)
      startTimer()
    } catch (err) {
      if (
        err instanceof DOMException &&
        (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
      ) {
        setPermissionState('denied')
        setFormError(
          'Microphone access denied. Please enable it in your browser settings and try again.'
        )
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setFormError('No microphone found on this device.')
      } else {
        setFormError('Could not access microphone. Please try again.')
      }
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setStatus('paused')
      stopTimer()
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setStatus('recording')
      startTimer()
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }

  /* ── Upload ────────────────────────────────── */
  const handleUpload = async () => {
    if (!audioBlob) return
    if (!customerName.trim()) {
      setFormError('Customer name is required')
      return
    }
    if (!selectedEventDate) {
      setFormError('Event date is required')
      return
    }

    setFormError(null)

    uploadVoiceOrder(
      {
        file: audioBlob,
        customerName: customerName.trim(),
        eventDate: selectedEventDate,
      },
      {
        onSuccess: () => handleCancel(),
        onError: () => setFormError('Upload failed. Please try again.'),
      }
    )
  }

  /* ── Cancel / close ────────────────────────── */
  const handleCancel = () => {
    stopTimer()
    if (
      mediaRecorderRef.current &&
      (mediaRecorderRef.current.state === 'recording' ||
        mediaRecorderRef.current.state === 'paused')
    ) {
      mediaRecorderRef.current.onstop = null
      mediaRecorderRef.current.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
    onClose()
  }

  /* ── Derived UI values ─────────────────────── */
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)

  const iconBg =
    status === 'recording'
      ? 'animate-pulse bg-red-500'
      : status === 'paused'
        ? 'bg-orange-400'
        : status === 'done'
          ? 'bg-green-500'
          : 'bg-zinc-200'

  const statusLabel =
    status === 'idle'
      ? 'Press record to start'
      : status === 'recording'
        ? 'Recording…'
        : status === 'paused'
          ? 'Paused'
          : 'Recording complete'

  return (
    <div className="flex w-full flex-col gap-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-2">
        <Mic className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-bold text-zinc-900">Create Voice Order</h2>
      </div>

      {/* ── Customer + event inputs ── */}
      <div className="grid grid-cols-1 gap-3 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="voice-order-customer-name"
            className="text-xs font-semibold tracking-wider text-zinc-400 uppercase"
          >
            Customer Name
          </label>
          <input
            id="voice-order-customer-name"
            type="text"
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="Enter customer name"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-orange-400"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="voice-order-event-date"
            className="text-xs font-semibold tracking-wider text-zinc-400 uppercase"
          >
            Event Date
          </label>
          <input
            id="voice-order-event-date"
            type="date"
            value={selectedEventDate}
            onChange={(event) => setSelectedEventDate(event.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-orange-400"
          />
        </div>
      </div>

      {/* ── Permission denied banner ── */}
      {permissionState === 'denied' && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-200">
          <MicOff className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-red-700">
              Microphone access blocked
            </p>
            <p className="text-xs text-red-500">
              {isIOS
                ? 'Go to Settings → Safari → Microphone and allow access, then refresh.'
                : 'Click the lock icon in your browser address bar, allow microphone access, then refresh.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Visualiser / timer ── */}
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 py-6">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all ${iconBg}`}
        >
          {status === 'recording' ? (
            <Mic className="h-7 w-7 text-white" />
          ) : status === 'paused' ? (
            <MicOff className="h-7 w-7 text-white" />
          ) : status === 'done' ? (
            <Upload className="h-7 w-7 text-white" />
          ) : (
            <Mic className="h-7 w-7 text-zinc-500" />
          )}
        </div>
        <p className="font-mono text-2xl font-bold text-zinc-800">
          {formatTime(elapsedSeconds)}
        </p>
        <p className="text-sm text-zinc-400">{statusLabel}</p>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-row gap-3">
        {status === 'idle' && (
          <button
            type="button"
            onClick={startRecording}
            disabled={permissionState === 'denied'}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mic className="h-4 w-4" /> Record
          </button>
        )}

        {status === 'recording' && (
          <>
            <button
              type="button"
              onClick={pauseRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-400 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-500"
            >
              <MicOff className="h-4 w-4" /> Pause
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          </>
        )}

        {status === 'paused' && (
          <>
            <button
              type="button"
              onClick={resumeRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600"
            >
              <Mic className="h-4 w-4" /> Resume
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-700 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
            >
              <Square className="h-4 w-4" /> Stop
            </button>
          </>
        )}

        {status === 'done' && (
          <button
            type="button"
            onClick={handleUpload}
            disabled={isPending || isSuccess}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-600 disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {isPending ? 'Uploading…' : isSuccess ? 'Uploaded ✓' : 'Upload'}
          </button>
        )}
      </div>

      {/* ── Feedback ── */}
      {isSuccess && (
        <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 ring-1 ring-green-200">
          Voice order uploaded successfully!
        </p>
      )}
      {isError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          Upload failed. Please try again.
        </p>
      )}
      {formError && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {formError}
        </p>
      )}

      {/* ── Cancel ── */}
      <button
        type="button"
        onClick={handleCancel}
        className="w-full rounded-xl border-2 border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        Cancel
      </button>
    </div>
  )
}

export default VoiceOrderDialog
