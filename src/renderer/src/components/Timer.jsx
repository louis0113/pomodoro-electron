import { useMemo } from 'react'
import { useTimer } from '../context/TimerContext'

function fmt(secs) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const PHASE_LABELS = {
  idle: 'pronto',
  focus: 'foco',
  break: 'pausa',
  done: 'concluído'
}

function Timer() {
  const { phase, remaining, total, currentLoop, loops, message, batteryAlert } = useTimer()

  const circumference = 2 * Math.PI * 88
  const progress = total > 0 ? remaining / total : 1
  const offset = circumference * (1 - progress)

  const dotsArray = useMemo(() => Array.from({ length: loops }), [loops])

  return (
    <div className="timer">
      {batteryAlert && (
        <div className="alerta-bateria show">⚡ Modo de economia de energia ativo</div>
      )}

      <div className="ring-wrap">
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle className="ring-bg" cx="100" cy="100" r="88" fill="none" strokeWidth="6" />
          <circle
            className={`ring-fill phase-${phase}`}
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              transition: 'stroke-dashoffset 1s linear'
            }}
          />
        </svg>

        <div className="timer-digits">
          <h1 className={`timer-time ${phase === 'done' ? 'pulsing' : ''}`}>{fmt(remaining)}</h1>
          <span className="foco">{PHASE_LABELS[phase] || phase}</span>
        </div>
      </div>

      <div className="loop-dots">
        {dotsArray.map((_, i) => (
          <span
            key={i}
            className={`dot ${i < currentLoop ? 'done' : i === currentLoop && phase !== 'idle' && phase !== 'done' ? 'active' : ''}`}
          />
        ))}
      </div>

      <p className="mensagem">{message}</p>
    </div>
  )
}

export default Timer
