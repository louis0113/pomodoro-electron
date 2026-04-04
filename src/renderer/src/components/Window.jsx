import { useEffect, useState } from 'react'
import WindowControls from './WindowControls'
import ButtonDebug from './Buttons/ButtonDebug'
import ButtonHelp from './Buttons/ButtonHelp'
import ButtonZoom from './Buttons/ButtonZoom'
import ButtonQuit from './Buttons/ButtonQuit'
import ButtonSettings from './Buttons/ButtonSettings'
import Calendar from './Calendar'
import History from './History'

function Window() {
  const [calOpen, setCalOpen] = useState(false)
  const [histOpen, setHistOpen] = useState(false)
  const [debugMode, setDebugMode] = useState(false)

  useEffect(() => {
    window.settingsAPI?.get().then((settings) => {
      if (settings?.debugMode) setDebugMode(settings.debugMode)
    })

    const cleanup = window.themeAPI?.onSettings((settings) => {
      if (typeof settings.debugMode !== 'undefined') {
        setDebugMode(settings.debugMode)
      }
    })
    return cleanup
  }, [])

  return (
    <>
      <div className="window">
        <div className="window-settings">
          <ButtonQuit />
          <ButtonZoom />
          <ButtonHelp />
          <ButtonSettings />
          {debugMode && <ButtonDebug />}
        </div>

        <div className="window-controls">
          {/* Botão History integrado ao estilo do main.css */}
          <button
            className={`btn-history ${histOpen ? 'active' : ''}`}
            onClick={() => {
              setHistOpen(!histOpen)
              setCalOpen(false)
            }}
            title="Histórico de sessões"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 4V8L11 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2.5 8a5.5 5.5 0 1 0 1-3.18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <path
                d="M2.5 4.5V8H6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Botão Calendar integrado ao estilo do main.css */}
          <button
            className={`btn-calendar ${calOpen ? 'active' : ''}`}
            onClick={() => {
              setCalOpen(!calOpen)
              setHistOpen(false)
            }}
            title="Calendário de notas"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <rect
                x="1"
                y="3"
                width="14"
                height="12"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M1 7H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M11 1V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="5" cy="10.5" r="0.8" fill="currentColor" />
              <circle cx="8" cy="10.5" r="0.8" fill="currentColor" />
              <circle cx="11" cy="10.5" r="0.8" fill="currentColor" />
            </svg>
          </button>

          <WindowControls />
        </div>
      </div>

      {/* Renderização Condicional - Passando a prop onClose obrigatória */}
      {calOpen && <Calendar onClose={() => setCalOpen(false)} />}
      {histOpen && <History onClose={() => setHistOpen(false)} />}
    </>
  )
}

export default Window
