import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../assets/css//Calendar.css'
import { useCalendarNotes } from '../hooks/useDatabase'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
]

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function isToday(year, month, day) {
  const t = new Date()
  return t.getFullYear() === year && t.getMonth() === month && t.getDate() === day
}

function lsGetView() {
  try {
    const raw = localStorage.getItem('cal-view')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export default function Calendar({ onClose }) {
  const today = new Date()
  const savedView = lsGetView()
  const [viewYear, setViewYear] = useState(savedView?.year ?? today.getFullYear())
  const [viewMonth, setViewMonth] = useState(savedView?.month ?? today.getMonth())
  const [notes, setNotes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cal-notes') || '{}')
    } catch {
      return {}
    }
  })
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState('')
  const [animDir, setAnimDir] = useState(null)
  const overlayRef = useRef(null)
  const textareaRef = useRef(null)
  const { getNotes, setNote, deleteNote: removeNote } = useCalendarNotes()

  useEffect(() => {
    getNotes().then(setNotes)
  }, [])

  useEffect(() => {
    localStorage.setItem('cal-view', JSON.stringify({ year: viewYear, month: viewMonth }))
  }, [viewYear, viewMonth])

  useEffect(() => {
    if (selected && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [selected])

  function prevMonth() {
    setAnimDir('left')
    setTimeout(() => setAnimDir(null), 320)
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else setViewMonth((m) => m - 1)
    setSelected(null)
  }

  function nextMonth() {
    setAnimDir('right')
    setTimeout(() => setAnimDir(null), 320)
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else setViewMonth((m) => m + 1)
    setSelected(null)
  }

  function selectDay(day) {
    const key = dateKey(viewYear, viewMonth, day)
    setSelected(key)
    setDraft(notes[key] || '')
  }

  async function saveNote() {
    if (!selected) return
    const updated = await setNote(selected, draft)
    setNotes(updated)
    setSelected(null)
  }

  async function deleteNote() {
    if (!selected) return
    const updated = await removeNote(selected)
    setNotes(updated)
    setSelected(null)
  }

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose()
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const selectedLabel = selected
    ? (() => {
        const [y, m, d] = selected.split('-')
        return `${parseInt(d)} de ${MONTHS[parseInt(m) - 1]} de ${y}`
      })()
    : ''

  const monthPrefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
  const monthNotes = Object.entries(notes)
    .filter(([k]) => k.startsWith(monthPrefix))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="cal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="cal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth} aria-label="Mês anterior">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7L9 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="cal-month-label">
            <span className="cal-month">{MONTHS[viewMonth]}</span>
            <span className="cal-year">{viewYear}</span>
          </div>
          <button className="cal-nav" onClick={nextMonth} aria-label="Próximo mês">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M5 2L10 7L5 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="cal-close" onClick={onClose} aria-label="Fechar">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1 1L12 12M12 1L1 12"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="cal-weekdays">
          {WEEK_DAYS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className={`cal-grid ${animDir ? `cal-anim-${animDir}` : ''}`}>
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="cal-cell cal-empty" />
            const key = dateKey(viewYear, viewMonth, day)
            const hasNote = !!notes[key]
            const isSel = selected === key
            const todayCell = isToday(viewYear, viewMonth, day)
            return (
              <button
                key={key}
                className={`cal-cell cal-day ${todayCell ? 'is-today' : ''} ${isSel ? 'is-selected' : ''} ${hasNote ? 'has-note' : ''}`}
                onClick={() => selectDay(day)}
              >
                <span className="cal-day-num">{day}</span>
                {hasNote && <span className="cal-dot" />}
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="cal-editor">
            <div className="cal-editor-label">{selectedLabel}</div>
            <textarea
              ref={textareaRef}
              className="cal-textarea"
              placeholder="O que vai estudar nesse dia?"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) saveNote()
                if (e.key === 'Escape') setSelected(null)
              }}
              rows={3}
            />
            <div className="cal-editor-actions">
              {notes[selected] && (
                <button className="cal-btn-delete" onClick={deleteNote}>
                  Apagar
                </button>
              )}
              <button className="cal-btn-cancel" onClick={() => setSelected(null)}>
                Cancelar
              </button>
              <button className="cal-btn-save" onClick={saveNote}>
                Salvar
              </button>
            </div>
          </div>
        )}

        {!selected && monthNotes.length > 0 && (
          <div className="cal-legend">
            {monthNotes.map(([k, v]) => {
              const d = parseInt(k.split('-')[2])
              return (
                <button key={k} className="cal-legend-item" onClick={() => selectDay(d)}>
                  <span className="cal-legend-day">{d}</span>
                  <span className="cal-legend-text">{v}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

Calendar.propTypes = {
  onClose: PropTypes.func.isRequired
}
