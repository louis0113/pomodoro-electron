import { useTimer } from '../context/TimerContext'
import Minutes from './Selects/Minutes'
import Times from './Selects/Times'
import Themes from './Selects/Themes'

function Config() {
  const { theme, setTheme, minutes, setMinutes, loops, setLoops, running } = useTimer()

  return (
    <div className="settings-config">
      <div className="settings-config__inner">
        <span className="settings-config__section-label">Timer</span>

        <Minutes value={minutes} onChange={setMinutes} disabled={running} />
        <Times value={String(loops)} onChange={(v) => setLoops(Number(v))} disabled={running} />

        <div className="settings-config__divider" />

        <span className="settings-config__section-label">Aparência</span>

        <Themes theme={theme} setTheme={setTheme} />

        <div className="settings-config__footer">
          <span className={`settings-config__footer-status ${running ? 'active' : ''}`}>
            {running ? '● em execução' : '● pausado'}
          </span>
          <span className="settings-config__footer-status">v1.0.0</span>
        </div>
      </div>
    </div>
  )
}

export default Config
