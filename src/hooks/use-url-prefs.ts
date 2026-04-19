'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Global preferences persisted to the URL query string so a user's chosen
 * preset / quality / format overrides survive reloads and can be shared via
 * bookmark. Read once on mount, written via `window.history.replaceState`
 * (no router re-render, no navigation).
 *
 * Only overall/global settings persist — per-file tweaks via the FileCard
 * settings drawer do not touch the URL.
 */
export interface UrlPrefs {
  preset?: string            // 'web' | 'keep' — conversion preset id
  quality?: number           // global quality 0–100
  image?: string             // image output format override ('webp', 'jpeg', …)
  video?: string             // video output format override ('mp4-h264', …)
  audio?: string             // audio output format override ('mp3', 'opus', …)
  slices?: string            // 'auto' or a numeric string
}

const KEYS: (keyof UrlPrefs)[] = ['preset', 'quality', 'image', 'video', 'audio', 'slices']

function readFromSearch(search: string): UrlPrefs {
  const params = new URLSearchParams(search)
  const prefs: UrlPrefs = {}
  const preset = params.get('preset')
  if (preset) prefs.preset = preset
  const q = params.get('q')
  if (q) {
    const n = parseInt(q, 10)
    if (Number.isFinite(n) && n >= 0 && n <= 100) prefs.quality = n
  }
  const image = params.get('img')
  if (image) prefs.image = image
  const video = params.get('vid')
  if (video) prefs.video = video
  const audio = params.get('aud')
  if (audio) prefs.audio = audio
  const slices = params.get('slices')
  if (slices) prefs.slices = slices
  return prefs
}

/** Shortens key → URL param name. */
const URL_KEY: Record<keyof UrlPrefs, string> = {
  preset: 'preset',
  quality: 'q',
  image: 'img',
  video: 'vid',
  audio: 'aud',
  slices: 'slices',
}

/**
 * Reads preferences from the URL on mount and exposes a stable `setPrefs`
 * that merges updates into the URL (replaceState, no navigation).
 * Passing `null` for a value removes that param.
 */
export function useUrlPrefs(): {
  prefs: UrlPrefs
  setPref: (key: keyof UrlPrefs, value: string | number | null) => void
} {
  const [prefs, setPrefsState] = useState<UrlPrefs>({})

  // Read URL once on mount (client only). The setState fires exactly once to
  // sync initial client state from window.location — no cascade risk.
  useEffect(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefsState(readFromSearch(window.location.search))
  }, [])

  const setPref = useCallback((key: keyof UrlPrefs, value: string | number | null) => {
    if (typeof window === 'undefined') return

    // Merge into state
    setPrefsState(prev => {
      const next: UrlPrefs = { ...prev }
      if (value === null || value === '' || value === undefined) {
        delete next[key]
      } else if (key === 'quality') {
        next.quality = typeof value === 'number' ? value : parseInt(String(value), 10)
      } else {
        ;(next as Record<string, unknown>)[key] = String(value)
      }
      return next
    })

    // Sync to URL
    const params = new URLSearchParams(window.location.search)
    const paramKey = URL_KEY[key]
    if (value === null || value === '' || value === undefined) {
      params.delete(paramKey)
    } else {
      params.set(paramKey, String(value))
    }
    const qs = params.toString()
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', url)
  }, [])

  return { prefs, setPref }
}

/** Convenience: returns initial prefs synchronously from `window.location` (client only). */
export function readInitialUrlPrefs(): UrlPrefs {
  if (typeof window === 'undefined') return {}
  return readFromSearch(window.location.search)
}

export { KEYS as URL_PREF_KEYS }
