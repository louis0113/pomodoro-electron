import { useEffect, useRef, useCallback } from 'react'
import notificationSound from '../assets/sounds/notification.wav'

const FREESOUND_API = 'https://freesound.org/apiv2/sounds'

// ID do FreeSound para cada evento
const SOUND_IDS = {
  FOCUS_START:      609725,
  FOCUS_TO_BREAK:   376193,
  BREAK_TO_FOCUS:   633159,
  SESSION_COMPLETE: 634089,
  SESSION_STOP:     263802,
  SESSION_CANCEL:   493551
}

async function fetchPreviewUrl(soundId, token) {
  const res = await fetch(`${FREESOUND_API}/${soundId}/?token=${token}`)
  if (!res.ok) throw new Error(`FreeSound ${res.status}`)
  const data = await res.json()
  return data.previews['preview-hq-mp3'] || data.previews['preview-lq-mp3']
}

export function useSound() {
  // cache: event -> Audio object
  const cache = useRef({})

  useEffect(() => {
    async function preload() {
      const token = await window.configAPI?.getFreesoundToken()
      if (!token) return

      for (const [event, id] of Object.entries(SOUND_IDS)) {
        try {
          const url = await fetchPreviewUrl(id, token)
          cache.current[event] = new Audio(url)
        } catch (err) {
          console.warn(`useSound: falha ao carregar ${event} (id ${id}):`, err.message)
        }
      }
    }

    preload()
  }, [])

  const play = useCallback((event) => {
    const audio = cache.current[event]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((err) => console.error('playSound error:', err))
      return
    }

    // Fallback: som padrão local
    new Audio(notificationSound).play().catch((err) => console.error('playSound fallback error:', err))
  }, [])

  return play
}
