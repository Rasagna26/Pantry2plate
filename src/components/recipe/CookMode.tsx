import { useEffect, useMemo, useRef, useState } from 'react'
import {
  X, ChevronLeft, ChevronRight, Volume2, VolumeX,
  Check, Settings, Timer, Play, Pause, RotateCcw,
} from 'lucide-react'
import { cn } from '../../lib/cn'
import { useVoices, useSpeech, isSpeechSupported } from '../../lib/speech'
import { parseDuration, formatTimerDisplay } from '../../lib/parseDuration'
import { playChime } from '../../lib/chime'

type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

const TTS_ENABLED_KEY = 'pantry2plate-tts-enabled'

interface CookModeProps {
  recipeName: string
  steps: string[]
  onClose: () => void
}

export function CookMode({ recipeName, steps, onClose }: CookModeProps) {
  const [index, setIndex] = useState(0)
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(
    () => isSpeechSupported() && localStorage.getItem(TTS_ENABLED_KEY) !== 'false',
  )
  const [showSettings, setShowSettings] = useState(false)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const { voices, selected, setSelected } = useVoices()
  const { speak, stop, isSpeaking } = useSpeech(selected)

  const step = steps[index]
  const atStart = index === 0
  const atEnd = index === steps.length - 1

  // Timer: inline on steps that mention a duration (e.g. "simmer for 10 min").
  // One timer per step; resets automatically when the step changes.
  const duration = useMemo(() => parseDuration(step ?? ''), [step])
  const [timerRemaining, setTimerRemaining] = useState(duration?.seconds ?? 0)
  const [timerStatus, setTimerStatus] = useState<TimerStatus>('idle')
  const [timerStepIndex, setTimerStepIndex] = useState(index)

  // Adjust-state-during-render pattern: when the step changes, re-seed the
  // timer. Avoids the setState-in-effect anti-pattern that would cause a
  // double render on every step transition.
  if (timerStepIndex !== index) {
    setTimerStepIndex(index)
    setTimerRemaining(duration?.seconds ?? 0)
    setTimerStatus('idle')
  }

  // Keep the screen awake while cooking. Browser releases the lock on tab hide;
  // re-acquire it when visible again.
  useEffect(() => {
    let active = true

    const acquire = async () => {
      if (!('wakeLock' in navigator)) return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (!active) {
          lock.release()
          return
        }
        wakeLockRef.current = lock
      } catch {
        // User denied, unsupported, or page not visible. Silently continue.
      }
    }

    acquire()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) acquire()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisibilityChange)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Speak the current step whenever it changes and TTS is on.
  useEffect(() => {
    if (!ttsEnabled || !step) return
    speak(step)
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, ttsEnabled, selected])

  // Tick down while running. When we hit zero, flip to 'done' and play the
  // chime inside the interval callback — keeping the side effect off the
  // effect body so setState isn't called synchronously during effect setup.
  useEffect(() => {
    if (timerStatus !== 'running') return
    const id = setInterval(() => {
      setTimerRemaining((s) => {
        const next = Math.max(0, s - 1)
        if (next === 0) {
          setTimerStatus('done')
          playChime()
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [timerStatus])

  // Keyboard shortcuts: Space / → next, ← prev, Esc exit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const next = () => {
    if (index < steps.length - 1) setIndex((i) => i + 1)
  }
  const prev = () => {
    if (index > 0) setIndex((i) => i - 1)
  }
  const toggleTts = () => {
    setTtsEnabled((v) => {
      const n = !v
      localStorage.setItem(TTS_ENABLED_KEY, String(n))
      if (!n) stop()
      return n
    })
  }

  const startTimer = () => setTimerStatus('running')
  const pauseTimer = () => setTimerStatus('paused')
  const resetTimer = () => {
    setTimerRemaining(duration?.seconds ?? 0)
    setTimerStatus('idle')
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-surface text-text-primary flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`Cook mode for ${recipeName}`}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <div className="min-w-0">
          <p className="text-[11px] text-text-muted uppercase tracking-wide">Cooking</p>
          <p className="text-sm font-medium text-text-primary truncate">{recipeName}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTts}
            disabled={!isSpeechSupported()}
            aria-label={ttsEnabled ? 'Mute' : 'Unmute'}
            aria-pressed={ttsEnabled}
            className={cn(
              'p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
              ttsEnabled
                ? 'text-coriander hover:bg-coriander/10'
                : 'text-text-muted hover:bg-surface-secondary',
            )}
          >
            {ttsEnabled ? (
              <Volume2 className={cn('w-5 h-5', isSpeaking && 'animate-pulse')} />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={() => setShowSettings((v) => !v)}
            aria-label="Settings"
            aria-pressed={showSettings}
            className={cn(
              'p-2 rounded-lg transition-colors',
              showSettings ? 'bg-surface-tertiary text-text-primary' : 'hover:bg-surface-secondary text-text-secondary',
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onClose}
            aria-label="Exit cook mode"
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings drawer */}
      {showSettings && voices.length > 0 && (
        <div className="border-b border-border-subtle bg-surface-secondary px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="cook-voice" className="text-sm text-text-secondary">Voice</label>
            <select
              id="cook-voice"
              value={selected?.voiceURI ?? ''}
              onChange={(e) => {
                const v = voices.find((x) => x.voiceURI === e.target.value) ?? null
                setSelected(v)
              }}
              className="text-xs bg-surface-tertiary border border-border rounded-md px-2 py-1.5 max-w-[55%] truncate"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Step {index + 1} of {steps.length}</span>
          <span>{Math.round(((index + 1) / steps.length) * 100)}%</span>
        </div>
        <div className="h-1 rounded-full bg-surface-secondary overflow-hidden">
          <div
            className="h-full bg-turmeric transition-all duration-300"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Inline timer — only rendered when the step text contains a duration. */}
      {duration && (
        <div className="px-4 pt-3">
          <div
            className={cn(
              'mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors',
              timerStatus === 'running' && 'border-turmeric bg-turmeric/5',
              timerStatus === 'done' && 'border-coriander bg-coriander/10',
              (timerStatus === 'idle' || timerStatus === 'paused') &&
                'border-border-subtle bg-surface-secondary',
            )}
            role="timer"
            aria-live="off"
            aria-label={`Timer for ${duration.matchText}`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Timer
                className={cn(
                  'w-5 h-5 shrink-0',
                  timerStatus === 'running' && 'text-turmeric animate-pulse',
                  timerStatus === 'done' && 'text-coriander',
                  (timerStatus === 'idle' || timerStatus === 'paused') && 'text-text-secondary',
                )}
              />
              <span className="font-mono text-xl tabular-nums text-text-primary">
                {formatTimerDisplay(timerRemaining)}
              </span>
              <span className="text-xs text-text-muted truncate">
                {timerStatus === 'done' ? 'Done' : duration.matchText}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {timerStatus === 'idle' && (
                <button
                  onClick={startTimer}
                  aria-label="Start timer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-turmeric text-white text-sm font-medium hover:bg-turmeric-light transition-colors"
                >
                  <Play className="w-4 h-4" strokeWidth={2.5} />
                  Start
                </button>
              )}
              {timerStatus === 'running' && (
                <button
                  onClick={pauseTimer}
                  aria-label="Pause timer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-surface-tertiary text-text-primary text-sm font-medium hover:bg-border transition-colors"
                >
                  <Pause className="w-4 h-4" strokeWidth={2.5} />
                  Pause
                </button>
              )}
              {timerStatus === 'paused' && (
                <button
                  onClick={startTimer}
                  aria-label="Resume timer"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-turmeric text-white text-sm font-medium hover:bg-turmeric-light transition-colors"
                >
                  <Play className="w-4 h-4" strokeWidth={2.5} />
                  Resume
                </button>
              )}
              {(timerStatus === 'running' ||
                timerStatus === 'paused' ||
                timerStatus === 'done') && (
                <button
                  onClick={resetTimer}
                  aria-label="Reset timer"
                  className="p-1.5 rounded-md text-text-secondary hover:bg-surface-tertiary transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step text — tap left half for previous, right half for next.
          On the last step, right tap completes and exits cook mode. */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 flex items-center justify-center px-6 py-8 overflow-y-auto pointer-events-none">
          <p className="font-heading text-2xl sm:text-3xl leading-relaxed text-text-primary text-center max-w-2xl">
            {step}
          </p>
        </div>
        <div className="absolute inset-0 flex">
          <button
            onClick={prev}
            disabled={atStart}
            aria-label="Previous step"
            className={cn(
              'group relative flex-1 transition-colors',
              atStart
                ? 'cursor-not-allowed'
                : 'active:bg-surface-secondary/50',
            )}
          >
            <ChevronLeft
              className={cn(
                'w-8 h-8 absolute left-3 top-1/2 -translate-y-1/2 transition-opacity',
                atStart
                  ? 'opacity-20 text-text-muted'
                  : 'opacity-30 text-text-muted group-hover:opacity-70 group-active:opacity-90',
              )}
            />
          </button>
          <button
            onClick={atEnd ? onClose : next}
            aria-label={atEnd ? 'Finish cooking' : 'Next step'}
            className={cn(
              'group relative flex-1 transition-colors',
              atEnd
                ? 'active:bg-coriander/10'
                : 'active:bg-surface-secondary/50',
            )}
          >
            {atEnd ? (
              <Check
                className="w-8 h-8 absolute right-3 top-1/2 -translate-y-1/2 text-coriander opacity-70 group-hover:opacity-100 transition-opacity"
                strokeWidth={2.5}
              />
            ) : (
              <ChevronRight
                className="w-8 h-8 absolute right-3 top-1/2 -translate-y-1/2 opacity-30 text-text-muted group-hover:opacity-70 group-active:opacity-90 transition-opacity"
              />
            )}
          </button>
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-[11px] text-text-muted px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {atEnd ? 'Tap right to finish · Tap left to review' : 'Tap left to go back · Tap right to advance'}
      </p>
    </div>
  )
}
