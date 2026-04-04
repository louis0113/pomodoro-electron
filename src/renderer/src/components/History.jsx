import { useState, useMemo } from 'react'
import '../assets/css//History.css'
import PropTypes from 'prop-types'
import { useTimer } from '../context/TimerContext'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez'
]

function getLast7Days() {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ key, date: d })
  }
  return days
}

export default function History({ onClose }) {
  const { history } = useTimer()

  const days = useMemo(() => getLast7Days(), [])

  const max = useMemo(() => Math.max(...days.map((d) => history[d.key] || 0), 1), [days, history])

  const total7 = useMemo(
    () => days.reduce((acc, d) => acc + (history[d.key] || 0), 0),
    [days, history]
  )

  const allEntries = useMemo(
    () =>
      Object.entries(history)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 30),
    [history]
  )

  const [tab, setTab] = useState('week')

  return (
    <div className="hist-overlay" onClick={onClose}>
      <div className="hist-panel" onClick={(e) => e.stopPropagation()}>
        <div className="hist-header">
          <span className="hist-title">Histórico</span>
          <div className="hist-tabs">
            <button
              className={`hist-tab ${tab === 'week' ? 'active' : ''}`}
              onClick={() => setTab('week')}
            >
              Semana
            </button>
            <button
              className={`hist-tab ${tab === 'all' ? 'active' : ''}`}
              onClick={() => setTab('all')}
            >
              Tudo
            </button>
          </div>
          <button className="hist-close" onClick={onClose} aria-label="Fechar">
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

        {tab === 'week' && (
          <>
            <div className="hist-summary">
              <div className="hist-stat">
                <span className="hist-stat-num">{total7}</span>
                <span className="hist-stat-label">últimos 7 dias</span>
              </div>
              <div className="hist-stat">
                <span className="hist-stat-num">{Math.round((total7 / 7) * 10) / 10}</span>
                <span className="hist-stat-label">média/dia</span>
              </div>
            </div>

            <div className="hist-chart">
              {days.map(({ key, date }) => {
                const count = history[key] || 0
                const pct = max > 0 ? (count / max) * 100 : 0
                const isToday = key === days[6].key
                return (
                  <div key={key} className="hist-bar-wrap">
                    <span className="hist-bar-count">{count || ''}</span>
                    <div className="hist-bar-track">
                      <div
                        className={`hist-bar-fill ${isToday ? 'is-today' : ''}`}
                        style={{ height: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="hist-bar-label">{isToday ? 'hoje' : DAYS[date.getDay()]}</span>
                    <span className="hist-bar-date">
                      {date.getDate()}/{date.getMonth() + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {tab === 'all' && (
          <div className="hist-list">
            {allEntries.length === 0 && (
              <p className="hist-empty">Nenhuma sessão registrada ainda.</p>
            )}
            {allEntries.map(([key, count]) => {
              const [y, m, d] = key.split('-').map(Number)
              const date = new Date(y, m - 1, d)
              return (
                <div key={key} className="hist-row">
                  <div className="hist-row-date">
                    <span className="hist-row-day">{d}</span>
                    <span className="hist-row-month">
                      {MONTHS_SHORT[m - 1]} {y}
                    </span>
                  </div>
                  <div className="hist-row-dots">
                    {Array.from({ length: Math.min(count, 12) }).map((_, i) => (
                      <span key={i} className="hist-pomo-dot" />
                    ))}
                    {count > 12 && <span className="hist-row-extra">+{count - 12}</span>}
                  </div>
                  <span className="hist-row-count">
                    {count} {count === 1 ? 'sessão' : 'sessões'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

History.propTypes = {
  onClose: PropTypes.func.isRequired
}
