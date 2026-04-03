import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useSound } from '../hooks/useSound'

const TimerContext = createContext(null)

export function TimerProvider({ children }) {
  // --- Estados de Configuração e Persistência ---
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'pomodoro')
  const [minutes, setMinutes] = useState(() => localStorage.getItem('minutes') || '25:00:5:00')
  const [loops, setLoops] = useState(() => Number(localStorage.getItem('loops')) || 1)

  // --- Estado do Histórico (Necessário para o componente History) ---
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('pomodoro-history')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  // --- Estados de Controle do Cronômetro ---
  const [phase, setPhase] = useState('idle') // idle, focus, break, done
  const [currentLoop, setCurrentLoop] = useState(0)
  const [remaining, setRemaining] = useState(25 * 60)
  const [total, setTotal] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('Configure e inicie sua sessão')
  const [batteryAlert, setBatteryAlert] = useState(false)

  const intervalRef = useRef(null)
  const stateRef = useRef({})

  // Atalhos para as APIs do Electron
  const api = typeof window !== 'undefined' ? window.widgetAPI : null
  const notify = typeof window !== 'undefined' ? window.notifyAPI : null
  const themeAPI = typeof window !== 'undefined' ? window.themeAPI : null
  const playSound = useSound()

  // --- Funções Auxiliares ---
  const parseTime = useCallback((val) => {
    const parts = val.split(':').map(Number)
    if (parts.length === 4) {
      return {
        focus: parts[0] * 60 + (parts[1] || 0),
        brk: parts[2] * 60 + (parts[3] || 0)
      }
    }
    return { focus: 25 * 60, brk: 5 * 60 }
  }, [])

  const addHistoryEntry = useCallback(() => {
    const today = new Date().toISOString().split('T')[0]
    setHistory((prev) => {
      const newHist = { ...prev, [today]: (prev[today] || 0) + 1 }
      localStorage.setItem('pomodoro-history', JSON.stringify(newHist))
      return newHist
    })
  }, [])

  // --- Efeitos de Sincronização e IPC ---

  // ESCUTA as mudanças vindas da janela Config
  useEffect(() => {
    if (themeAPI?.onSettings) {
      themeAPI.onSettings((data) => {
        if (data.theme) setTheme(data.theme)
        if (data.minutes) {
          setMinutes(data.minutes)
          // Se o timer não estiver rodando, atualiza a interface visual imediatamente
          if (stateRef.current.phase === 'idle' || !stateRef.current.running) {
            const { focus } = parseTime(data.minutes)
            setRemaining(focus)
            setTotal(focus)
          }
        }
        if (data.loops !== undefined) setLoops(Number(data.loops))
      })
    }
  }, [themeAPI, parseTime])

  // ENVIA as mudanças para o localStorage e para o processo Main (sincronizar outras janelas)
  useEffect(() => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('minutes', minutes)
    localStorage.setItem('loops', String(loops))

    document.documentElement.setAttribute('data-theme', theme)

    themeAPI?.sendSettings({ theme, minutes, loops })
  }, [theme, minutes, loops, themeAPI])

  // Mantém a referência de estado sincronizada para o setInterval
  useEffect(() => {
    stateRef.current = { phase, currentLoop, loops, minutes, remaining, running }
  }, [phase, currentLoop, loops, minutes, remaining, running])

  useEffect(() => {
    if (!api?.onMudancaEnergia) return
    api.onMudancaEnergia((_event, onBattery) => setBatteryAlert(onBattery))
  }, [api])

  // --- Lógica de Execução do Timer ---

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const goToNextPhase = useCallback(() => {
    const { phase: p, currentLoop: cl, loops: l, minutes: m } = stateRef.current
    const { focus, brk } = parseTime(m)

    if (p === 'focus') {
      addHistoryEntry() // Salva no histórico ao terminar um foco
      const nextLoop = cl + 1
      if (nextLoop >= l) {
        clearTimer()
        setRunning(false)
        setPhase('done')
        setRemaining(0)
        setMessage('🎉 Sessão completa! Ótimo trabalho.')
        notify?.send('Pomodoro', 'Sessão completa! Ótimo trabalho.')
        playSound()
        api?.pararSessao()
      } else {
        setCurrentLoop(nextLoop)
        setPhase('break')
        setRemaining(brk)
        setTotal(brk)
        setMessage('Hora de descansar!')
        notify?.send('Pomodoro', 'Foco concluído! Hora de descansar.')
        playSound()
      }
    } else {
      setPhase('focus')
      setRemaining(focus)
      setTotal(focus)
      setMessage('Sessão de foco em andamento...')
      notify?.send('Pomodoro', 'Pausa concluída! De volta ao foco.')
      playSound()
    }
  }, [clearTimer, api, notify, playSound, parseTime, addHistoryEntry])

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

  // --- Funções de Controle ---

  const startSession = useCallback(async () => {
    if (running) return
    const ok = await api?.iniciarSessao()
    if (api && !ok) return

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
    setMessage('Sessão de foco parada')
    notify?.send('Pomodoro', 'A sessão de foco foi parada')
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
        theme,
        setTheme,
        minutes,
        setMinutes,
        loops,
        setLoops,
        history, // Exportado para o History.jsx
        phase,
        running,
        currentLoop,
        remaining,
        total,
        message,
        batteryAlert,
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
  if (!context) throw new Error('useTimer deve ser usado dentro de um TimerProvider')
  return context
}
