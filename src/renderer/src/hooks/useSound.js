import { useEffect, useState } from 'react'
import notificationSound from '../assets/sounds/notification.wav'

export function useSound() {
  const [customPath, setCustomPath] = useState(null)

  useEffect(() => {
    window.soundAPI.getCustomSound().then(setCustomPath)
  }, [])

  const play = () => {
    const src = customPath || notificationSound
    const audio = new Audio(src)
    audio.play().catch((err) => console.error('playSound error:', err))
  }

  useEffect(() => {
    const handler = () => play()
    window.addEventListener('pomodoro:play-sound', handler)
    return () => window.removeEventListener('pomodoro:play-sound', handler)
  }, [customPath])

  return play
}