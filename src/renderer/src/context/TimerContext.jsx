/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { useSound } from '../hooks/useSound'

// Contextos separados para otimizar re-renders
const TimerStateContext = createContext(null)
const TimerConfigContext = createContext(null)
const TimerActionsContext = createContext(null)

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

  // --- Estados de Controle do Cronômetro (Mudam frequentemente) ---
  const [phase, setPhase] = useState('idle')
  const [currentLoop, setCurrentLoop] = useState(0)
  const [remaining, setRemaining] = useState(25 * 60)
  const [total, setTotal] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState('Configure e inicie sua sessão')
  const [batteryAlert, setBatteryAlert] = useState(false)

  const intervalRef = useRef(null)
  const stateRef = useRef({})
  const externalRunningUpdateRef = useRef(false)

  // Referências estáveis para as APIs do Electron (definidas uma vez pelo preload)
  const api = useRef(typeof window !== 'undefined' ? window.widgetAPI : null).current
  const notify = useRef(typeof window !== 'undefined' ? window.notifyAPI : null).current
  const themeAPI = useRef(typeof window !== 'undefined' ? window.themeAPI : null).current
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

  useEffect(() => {
    if (!themeAPI?.onSettings) return
    const cleanup = themeAPI.onSettings((data) => {
      if (data.theme) setTheme(data.theme)
      if (data.minutes) {
        setMinutes(data.minutes)
        if (stateRef.current.phase === 'idle' || !stateRef.current.running) {
          const { focus } = parseTime(data.minutes)
          setRemaining(focus)
          setTotal(focus)
        }
      }
      if (data.loops !== undefined) setLoops(Number(data.loops))
    })
    return cleanup
  }, [themeAPI, parseTime])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    localStorage.setItem('minutes', minutes)
    localStorage.setItem('loops', String(loops))

    document.documentElement.setAttribute('data-theme', theme)

    themeAPI?.sendSettings({ theme, minutes, loops })
  }, [theme, minutes, loops, themeAPI])

  useEffect(() => {
    stateRef.current = { phase, currentLoop, loops, minutes, remaining, running }
  }, [phase, currentLoop, loops, minutes, remaining, running])

  useEffect(() => {
    if (!api?.onMudancaEnergia) return
    const cleanup = api.onMudancaEnergia((onBattery) => setBatteryAlert(onBattery))
    return cleanup
  }, [api])

  useEffect(() => {
    if (externalRunningUpdateRef.current) {
      externalRunningUpdateRef.current = false
      return
    }
    themeAPI?.sendTimerState({ running })
  }, [running, themeAPI])

  useEffect(() => {
    if (!themeAPI?.onTimerState) return
    const cleanup = themeAPI.onTimerState((data) => {
      if (data.running !== undefined) {
        externalRunningUpdateRef.current = true
        setRunning(data.running)
      }
    })
    return cleanup
  }, [themeAPI])

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
      addHistoryEntry()
      const nextLoop = cl + 1
      if (nextLoop >= l) {
        clearTimer()
        setRunning(false)
        setPhase('done')
        setRemaining(0)
        setMessage('🎉 Sessão completa! Ótimo trabalho.')
        notify?.send('Pomodoro', 'Sessão completa! Ótimo trabalho.')
        playSound('SESSION_COMPLETE')
        api?.pararSessao()
      } else {
        setCurrentLoop(nextLoop)
        setPhase('break')
        setRemaining(brk)
        setTotal(brk)
        setMessage('Hora de descansar!')
        notify?.send('Pomodoro', 'Foco concluído! Hora de descansar.')
        playSound('FOCUS_TO_BREAK')
      }
    } else {
      setPhase('focus')
      setRemaining(focus)
      setTotal(focus)
      setMessage('Sessão de foco em andamento...')
      notify?.send('Pomodoro', 'Pausa concluída! De volta ao foco.')
      playSound('BREAK_TO_FOCUS')
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
    playSound('FOCUS_START')
    startInterval()
  }, [running, api, minutes, notify, playSound, startInterval, parseTime])

  const stopSession = useCallback(async () => {
    if (!running) return
    await api?.pararSessao()
    clearTimer()
    setRunning(false)
    setMessage('Sessão de foco parada')
    notify?.send('Pomodoro', 'A sessão de foco foi parada')
    playSound('SESSION_STOP')
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
    playSound('SESSION_CANCEL')
  }, [api, clearTimer, minutes, playSound, parseTime])

  const resumeSession = useCallback(() => {
    setRunning(true)
    setMessage(phase === 'break' ? 'Hora de descansar!' : 'Sessão de foco em andamento...')
    startInterval()
  }, [phase, startInterval])

  // --- Memoized Values para Contextos Separados ---

  const stateValue = useMemo(
    () => ({
      phase,
      currentLoop,
      remaining,
      total,
      running,
      message,
      batteryAlert
    }),
    [phase, currentLoop, remaining, total, running, message, batteryAlert]
  )

  const configValue = useMemo(
    () => ({
      theme,
      setTheme,
      minutes,
      setMinutes,
      loops,
      setLoops,
      history
    }),
    [theme, minutes, loops, history]
  )

  const actionsValue = useMemo(
    () => ({
      startSession,
      stopSession,
      cancelSession,
      resumeSession
    }),
    [startSession, stopSession, cancelSession, resumeSession]
  )

  return (
    <TimerStateContext.Provider value={stateValue}>
      <TimerConfigContext.Provider value={configValue}>
        <TimerActionsContext.Provider value={actionsValue}>{children}</TimerActionsContext.Provider>
      </TimerConfigContext.Provider>
    </TimerStateContext.Provider>
  )
}

TimerProvider.propTypes = {
  children: PropTypes.node.isRequired
}

function useTimerState() {
  const context = useContext(TimerStateContext)
  if (!context) throw new Error('useTimerState deve ser usado dentro de um TimerProvider')
  return context
}

function useTimerConfig() {
  const context = useContext(TimerConfigContext)
  if (!context) throw new Error('useTimerConfig deve ser usado dentro de um TimerProvider')
  return context
}

function useTimerActions() {
  const context = useContext(TimerActionsContext)
  if (!context) throw new Error('useTimerActions deve ser usado dentro de um TimerProvider')
  return context
}

// Hook compatível com versão anterior (combina tudo)
export function useTimer() {
  const state = useTimerState()
  const config = useTimerConfig()
  const actions = useTimerActions()
  return { ...state, ...config, ...actions }
}

export { useTimerState, useTimerConfig, useTimerActions }
