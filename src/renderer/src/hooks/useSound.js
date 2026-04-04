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

// Eventos que interrompem qualquer som em reprodução sem tocar outro
const STOP_ONLY = new Set(['SESSION_STOP', 'SESSION_CANCEL'])

function stopAudio(audio) {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

export function useSound() {
  const cache = useRef({})
  const current = useRef(null) // áudio em reprodução no momento

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
    // Para qualquer som que esteja tocando
    stopAudio(current.current)
    current.current = null

    // Ações de parar/cancelar apenas interrompem, não tocam nada
    if (STOP_ONLY.has(event)) return

    const audio = cache.current[event]
    if (audio) {
      audio.currentTime = 0
      audio.play().catch((err) => console.error('playSound error:', err))
      current.current = audio
      audio.onended = () => { current.current = null }
      return
    }

    // Fallback: som padrão local
    const fallback = new Audio(notificationSound)
    fallback.play().catch((err) => console.error('playSound fallback error:', err))
    current.current = fallback
    fallback.onended = () => { current.current = null }
  }, [])

  return play
}
