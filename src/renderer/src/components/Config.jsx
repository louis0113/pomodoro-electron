import { useEffect, useState } from 'react'
import { useTimer } from '../context/TimerContext'
import Minutes from './Selects/Minutes'
import Times from './Selects/Times'
import Themes from './Selects/Themes'
import WindowControls from './WindowControls'

function Config() {
  const { theme, setTheme, minutes, setMinutes, loops, setLoops, running } = useTimer()
  const [apiKey, setApiKey] = useState('')
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    window.settingsAPI?.get().then((settings) => {
      if (settings.freesoundApiKey) setApiKey(settings.freesoundApiKey)
      if (settings.debugMode) setDebugMode(settings.debugMode)
      if (settings.theme) setTheme(settings.theme)
      if (settings.minutes) setMinutes(settings.minutes)
      if (settings.loops) setLoops(settings.loops)
    })
  }, [setTheme, setMinutes, setLoops])

  const handleSave = () => {
    const newSettings = {
      freesoundApiKey: apiKey,
      debugMode,
      theme,
      minutes,
      loops
    }
    window.settingsAPI?.set(newSettings)
    window.themeAPI?.sendSettings(newSettings)
  }

  return (
    <div className="settings-config">
      <WindowControls />
      <div className="settings-config__inner">
        <span className="settings-config__section-label">Timer</span>
        <Minutes value={minutes} onChange={setMinutes} disabled={running} />
        <Times value={String(loops)} onChange={(v) => setLoops(Number(v))} disabled={running} />

        <div className="settings-config__divider" />

        <span className="settings-config__section-label">Aparência</span>
        <Themes theme={theme} setTheme={setTheme} />

        <div className="settings-config__divider" />

        <span className="settings-config__section-label">Freesound API Key</span>
        <input
          type="text"
          className="settings-config__input"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Insira sua API key"
        />

        <div className="settings-config__divider" />

        <span className="settings-config__section-label">Debug</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            className="settings-config__checkbox"
            checked={debugMode}
            onChange={(e) => setDebugMode(e.target.checked)}
          />
          Ativar modo debug
        </label>

        <button className="settings-config__button" onClick={handleSave}>
          Salvar Configurações
        </button>

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
