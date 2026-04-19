'use client'

import { useEffect, useState } from 'react'

/**
 * Tracks whether a file drag is currently happening anywhere on the window.
 * Uses a counter pattern so overlapping dragenter/leave events don't flicker
 * state. Returns `true` only for drags that include File entries, so the
 * UI doesn't react to text selection drags or other non-file payloads.
 */
export function useWindowDrag() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let counter = 0

    const isFileDrag = (e: DragEvent) => e.dataTransfer?.types.includes('Files')

    const onEnter = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      counter += 1
      if (counter === 1) setActive(true)
    }
    const onLeave = (e: DragEvent) => {
      if (!isFileDrag(e)) return
      counter -= 1
      if (counter === 0) setActive(false)
    }
    const onDrop = () => {
      counter = 0
      setActive(false)
    }
    const onOver = (e: DragEvent) => {
      // Allow drop anywhere on the window
      e.preventDefault()
    }

    window.addEventListener('dragenter', onEnter)
    window.addEventListener('dragleave', onLeave)
    window.addEventListener('drop', onDrop)
    window.addEventListener('dragover', onOver)
    return () => {
      window.removeEventListener('dragenter', onEnter)
      window.removeEventListener('dragleave', onLeave)
      window.removeEventListener('drop', onDrop)
      window.removeEventListener('dragover', onOver)
    }
  }, [])

  return active
}
