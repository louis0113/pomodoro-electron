import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useSound } from '../hooks/useSound'

const TimerContext = createContext(null)

export function TimerProvider({ children }) {
  // --- Estados de Configuração ---
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'pomodoro')
  const [minutes, setMinutes] = useState(() => localStorage.getItem('minutes') || '25:00:5:00')
  const [loops, setLoops] = useState(() => Number(localStorage.getItem('loops')) || 1)

  // --- Estados do Cronômetro ---
  const [phase, setPhase] = useState('idle') // idle, focus, break, done
  const [currentLoop, setCurrentLoop] = useState(0)
  const [remaining, setRemaining] = useState(25 * 60)
  const [total, setTotal] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('Configure e inicie sua sessão')
  const [batteryAlert, setBatteryAlert] = useState(false)

  // --- Referências e Hooks ---
  const intervalRef = useRef(null)
  const stateRef = useRef({}) // Helper para acessar estado atualizado dentro de intervalos
  const playSound = useSound()

  // Atalhos para as APIs do Electron (Preload)
  const api = window.widgetAPI
  const notify = window.notifyAPI
  const themeAPI = window.themeAPI

  // --- Helpers ---
  const parseTime = useCallback((val) => {
    const parts = val.split(':').map(Number)
    // Formato esperado: MM:SS:MM:SS (Foco : Pausa)
    return {
      focus: (parts[0] * 60) + (parts[1] || 0),
      brk: (parts[2] * 60) + (parts[3] || 0)
    }
  }, [])

  // --- Efeitos de Sincronização (IPC & Storage) ---

  // 1. Recebe mudanças de outras janelas (ex: aba de Configurações)
  useEffect(() => {
    themeAPI?.onSettings((data) => {
      if (data.theme) setTheme(data.theme)
      if (data.minutes) setMinutes(data.minutes)
      if (data.loops !== undefined) setLoops(Number(data.loops))
    })
  }, [themeAPI])

  // 2. Persiste e propaga mudanças locais
  useEffect(() => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('minutes', minutes)
    localStorage.setItem('loops', String(loops))

    document.documentElement.setAttribute('data-theme', theme)

    // Sincroniza com o processo Main para outras janelas
    themeAPI?.sendSettings({ theme, minutes, loops })
  }, [theme, minutes, loops, themeAPI])

  // 3. Atualiza a referência de estado para o setInterval
  useEffect(() => {
    stateRef.current = { phase, currentLoop, loops, minutes, remaining, running }
  }, [phase, currentLoop, loops, minutes, remaining, running])

  // 4. Listeners de Hardware (Bateria)
  useEffect(() => {
    api?.onMudancaEnergia((_event, onBattery) => setBatteryAlert(onBattery))
  }, [api])

  // 5. Reset do tempo quando a configuração muda em modo idle
  useEffect(() => {
    if (phase === 'idle') {
      const { focus } = parseTime(minutes)
      setRemaining(focus)
      setTotal(focus)
    }
  }, [minutes, phase, parseTime])

  // --- Lógica do Timer ---

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const goToNextPhase = useCallback(() => {
    const { phase: currPhase, currentLoop: currLoopIdx, loops: totalLoops, minutes: minVal } = stateRef.current
    const { focus, brk } = parseTime(minVal)

    if (currPhase === 'focus') {
      const nextLoop = currLoopIdx + 1

      if (nextLoop >= totalLoops) {
        // Fim da Sessão Completa
        clearTimer()
        setRunning(false)
        setPhase('done')
        setRemaining(0)
        setMessage('🎉 Sessão completa! Ótimo trabalho.')
        notify?.send('Pomodoro', 'Sessão completa! Ótimo trabalho.')
        playSound()
        api?.pararSessao()
      } else {
        // Transição para Pausa
        setCurrentLoop(nextLoop)
        setPhase('break')
        setRemaining(brk)
        setTotal(brk)
        setMessage('Hora de descansar!')
        notify?.send('Pomodoro', 'Foco concluído! Hora de descansar.')
        playSound()
      }
    } else {
      // Transição Pausa -> Foco
      setPhase('focus')
      setRemaining(focus)
      setTotal(focus)
      setMessage('Sessão de foco em andamento...')
      notify?.send('Pomodoro', 'Pausa concluída! De volta ao foco.')
      playSound()
    }
  }, [clearTimer, api, notify, playSound, parseTime])

  const startInterval = useCallback(() => {
    clearTimer()
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          goToNextPhase()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [clearTimer, goToNextPhase])

  // --- Ações Públicas ---

  const startSession = useCallback(async () => {
    if (running) return

    const ok = await api?.iniciarSessao()
    if (api && !ok) return // Bloqueia se o sistema não permitir (ex: erro no main)

    const { focus } = parseTime(minutes)
    setPhase('focus')
    setCurrentLoop(0)
    setRemaining(focus)
    setTotal(focus)
    setRunning(true)
    setMessage('Sessão de foco iniciada!')
    notify?.send('Pomodoro', 'Sessão de foco iniciada!')
    playSound()
    startInterval()
  }, [running, api, minutes, notify, playSound, startInterval, parseTime])

  const stopSession = useCallback(async () => {
    if (!running) return
    await api?.pararSessao()
    clearTimer()
    setRunning(false)
    setMessage('Sessão de foco pausada')
    notify?.send('Pomodoro', 'A sessão foi pausada')
    playSound()
  }, [running, api, clearTimer, notify, playSound])

  const cancelSession = useCallback(async () => {
    await api?.pararSessao()
    clearTimer()
    setRunning(false)
    setPhase('idle')
    setCurrentLoop(0)
    const { focus } = parseTime(minutes)
    setRemaining(focus)
    setTotal(focus)
    setMessage('Sessão cancelada.')
    playSound()
  }, [api, clearTimer, minutes, playSound, parseTime])

  const resumeSession = useCallback(() => {
    setRunning(true)
    setMessage(phase === 'break' ? 'Hora de descansar!' : 'Sessão de foco em andamento...')
    startInterval()
  }, [phase, startInterval])

  return (
    <TimerContext.Provider
      value={{
        // Configurações
        theme, setTheme,
        minutes, setMinutes,
        loops, setLoops,

        // Estado do Timer
        phase,
        running,
        currentLoop,
        remaining,
        total,
        message,
        batteryAlert,

        // Ações
        startSession,
        stopSession,
        cancelSession,
        resumeSession
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimer deve ser usado dentro de um TimerProvider')
  }
  return context
}
