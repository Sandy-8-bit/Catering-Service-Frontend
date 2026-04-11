import React, { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, Download } from 'lucide-react'

interface AudioPlayerProps {
  audioBlob: Blob
  title?: string
  onDownload?: () => void
  isDownloading?: boolean
  compact?: boolean
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBlob,
  title = 'Order Audio',
  onDownload,
  isDownloading = false,
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  // Create object URL for the blob
  useEffect(() => {
    const url = URL.createObjectURL(audioBlob)
    if (audioRef.current) {
      audioRef.current.src = url
    }
    return () => URL.revokeObjectURL(url)
  }, [audioBlob])

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-blue-50 p-3 ring-1 ring-blue-200">
        <audio
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
        <button
          onClick={togglePlayPause}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700"
        >
          {isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} className="ml-0.5" />
          )}
        </button>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-xs font-medium text-blue-900">{title}</span>
          <div className="h-1 flex-1 rounded-full bg-blue-200">
            <div
              className="h-1 rounded-full bg-blue-600 transition-all"
              style={{
                width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
              }}
            />
          </div>
          <span className="text-xs text-blue-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="text-blue-600 transition-colors hover:text-blue-700 disabled:opacity-50"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border-2 border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-6 shadow-sm">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <Volume2 size={20} className="text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        {/* Play/Pause Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={togglePlayPause}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition-all hover:bg-blue-700 hover:shadow-lg active:scale-95"
          >
            {isPlaying ? (
              <Pause size={24} />
            ) : (
              <Play size={24} className="ml-1" />
            )}
          </button>

          {/* Progress Bar */}
          <div className="flex flex-1 items-center gap-3">
            <span className="text-xs font-medium text-blue-700">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-blue-200 outline-none"
              style={{
                background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #e0e7ff ${
                  duration > 0 ? (currentTime / duration) * 100 : 0
                }%, #e0e7ff 100%)`,
              }}
            />
            <span className="text-xs font-medium text-blue-700">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <Volume2 size={16} className="text-blue-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-blue-200 outline-none max-w-xs"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                volume * 100
              }%, #e0e7ff ${volume * 100}%, #e0e7ff 100%)`,
            }}
          />
          <span className="text-xs text-blue-700">{Math.round(volume * 100)}%</span>
        </div>

        {/* Download Button */}
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Download size={18} />
            {isDownloading ? 'Downloading...' : 'Download Audio'}
          </button>
        )}
      </div>
    </div>
  )
}

export default AudioPlayer
