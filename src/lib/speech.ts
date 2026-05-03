import { useEffect, useRef, useState } from 'react'

const VOICE_STORAGE_KEY = 'pantry2plate-voice'

// Rank available voices to pick the best-sounding one automatically.
//
// Voice-family tiers (largest factor):
//   1. Microsoft Edge neural voices (e.g. "Microsoft Neerja Online (Natural)")
//      — Azure-quality TTS, available in Edge on every platform and sometimes
//      in Chrome on Windows.
//   2. Apple premium Siri voices — the `-premium` voiceURI suffix is the
//      definitive marker on macOS/iOS.
//   3. Google TTS — decent on Android, okay on Chrome desktop.
//   4. Microsoft offline voices (Zira/David/Hazel) — robotic but intelligible.
//   5. Apple compact / eSpeak / novelty — last resort, penalised.
//
// Language preference: en-IN first, then en-US, then other English locales,
// then user's own locale as a secondary bonus.
export function scoreVoice(v: SpeechSynthesisVoice): number {
  const name = v.name
  const uri = v.voiceURI ?? ''
  const lang = v.lang.toLowerCase()
  let score = 0

  // --- Voice family / engine quality ---
  if (/online\s*\(natural\)/i.test(name)) score += 120
  else if (/\bneural\b/i.test(name)) score += 90
  else if (/\bnatural\b/i.test(name)) score += 80
  else if (/enhanced|premium/i.test(name)) score += 55

  // Apple premium voices — the voiceURI carries the quality tier on Apple.
  if (/premium/i.test(uri)) score += 60
  else if (/enhanced/i.test(uri)) score += 35

  // Google TTS (Android, Chrome desktop)
  if (/google/i.test(name)) score += 45

  // Microsoft offline voices (not the Online neural ones)
  if (/microsoft/i.test(name) && !/online/i.test(name)) score += 25

  // Known Apple Siri voice names — covers platforms that don't expose a quality
  // tier in voiceURI. Includes en-IN voices (Rishi, Veena) so Indian English
  // users land on a native voice when available.
  if (/\b(samantha|alex|daniel|karen|moira|fiona|tessa|serena|kate|victoria|ava|allison|susan|nicky|zoe|rishi|veena|aaron|fred|tom|oliver|martha)\b/i.test(name)) {
    score += 35
  }
  if (/siri/i.test(name)) score += 25

  // Moira (en-IE) is a particularly warm, natural Apple voice — make her the
  // default on Apple platforms (macOS Safari/Chrome/Arc/etc.) where available.
  // No-op elsewhere since she isn't installed outside Apple systems.
  if (/\bmoira\b/i.test(name)) score += 80

  // --- Penalties for known-low-quality engines ---
  if (/compact|novelty|espeak|flite|fallback|pico/i.test(name)) score -= 100
  if (/compact/i.test(uri)) score -= 60

  // --- Language preference (Indian > US > other English) ---
  if (lang === 'en-in') score += 55
  else if (lang === 'en-us') score += 40
  else if (lang === 'en-gb' || lang === 'en-au') score += 25
  else if (lang.startsWith('en')) score += 15

  // Bonus for matching the user's own locale (doesn't override English pref)
  const uiLang = navigator.language.toLowerCase()
  if (lang === uiLang) score += 8
  else if (lang.split('-')[0] === uiLang.split('-')[0]) score += 4

  return score
}

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0]
}

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selected, setSelectedState] = useState<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return

    const load = () => {
      const list = window.speechSynthesis.getVoices()
      setVoices(list)

      // Always re-resolve the selected voice against the latest list — some
      // engines (Chrome mobile especially) invalidate the old voice object
      // reference when voices reload, which makes `u.voice = old` a no-op.
      setSelectedState((current) => {
        if (current) {
          const fresh = list.find((v) => v.voiceURI === current.voiceURI)
          if (fresh) return fresh
        }
        const storedURI = localStorage.getItem(VOICE_STORAGE_KEY)
        const stored = storedURI ? list.find((v) => v.voiceURI === storedURI) : null
        return stored ?? pickBestVoice(list)
      })
    }

    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  const setSelected = (v: SpeechSynthesisVoice | null) => {
    setSelectedState(v)
    if (v) localStorage.setItem(VOICE_STORAGE_KEY, v.voiceURI)
  }

  return { voices, selected, setSelected }
}

// Speak `text` with the given voice. Returns controls and an `isSpeaking` flag
// so the UI can show playback state and stop on unmount/step change.
export function useSpeech(voice: SpeechSynthesisVoice | null) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stop = () => {
    if (!('speechSynthesis' in window)) return
    if (pendingRef.current) {
      clearTimeout(pendingRef.current)
      pendingRef.current = null
    }
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window) || !text.trim()) return

    // Cancel any in-flight or queued speech before starting a new one.
    if (pendingRef.current) clearTimeout(pendingRef.current)
    window.speechSynthesis.cancel()

    // Chrome (especially on Android) has a race where `speak()` immediately
    // after `cancel()` gets silently dropped. Deferring to the next tick lets
    // cancel settle before we queue the new utterance.
    pendingRef.current = setTimeout(() => {
      pendingRef.current = null
      const u = new SpeechSynthesisUtterance(text)
      if (voice) {
        u.voice = voice
        // Reinforcement — some Chrome builds ignore `u.voice` unless the
        // utterance language also matches the voice's locale.
        u.lang = voice.lang
      }
      u.rate = 0.95
      u.pitch = 1
      u.onstart = () => setIsSpeaking(true)
      u.onend = () => {
        setIsSpeaking(false)
        onEnd?.()
      }
      u.onerror = () => setIsSpeaking(false)
      window.speechSynthesis.speak(u)
    }, 80)
  }

  useEffect(() => stop, [])

  return { speak, stop, isSpeaking }
}

export const isSpeechSupported = () =>
  typeof window !== 'undefined' && 'speechSynthesis' in window
