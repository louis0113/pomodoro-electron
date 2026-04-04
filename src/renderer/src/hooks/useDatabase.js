import { useCallback } from 'react'

// ─── localStorage helpers ─────────────────────────────────────────────────────

function lsGetHistory() {
  try {
    const raw = localStorage.getItem('pomodoro-history')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function lsAddHistory(date) {
  const history = lsGetHistory()
  history[date] = (history[date] || 0) + 1
  localStorage.setItem('pomodoro-history', JSON.stringify(history))
  return history
}

function lsGetSessions() {
  try {
    const raw = localStorage.getItem('pomodoro-sessions')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function lsSaveSessions(sessions) {
  localStorage.setItem('pomodoro-sessions', JSON.stringify(sessions))
}

let _lsSessionId = 0

function lsCreateSession(data) {
  const sessions = lsGetSessions()
  const session = {
    id: `ls_${Date.now()}_${++_lsSessionId}`,
    startTime: new Date().toISOString(),
    endTime: null,
    totalLoops: data.totalLoops ?? 1,
    completedLoops: 0,
    totalDuration: null,
    status: 'running'
  }
  sessions.unshift(session)
  lsSaveSessions(sessions)
  return session
}

function lsUpdateSession(id, patch) {
  const sessions = lsGetSessions()
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx === -1) return null
  sessions[idx] = { ...sessions[idx], ...patch }
  lsSaveSessions(sessions)
  return sessions[idx]
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useDatabase() {
  // Tenta o IPC; se falhar ou não houver DB, usa localStorage
  async function tryDb(ipcCall, fallback) {
    try {
      const res = await ipcCall()
      if (res?.ok && res.data !== null) return res.data
    } catch {
      // IPC indisponível (ex: janela sem contexto Electron)
    }
    return fallback()
  }

  // ─── History ───────────────────────────────────────────────────────────────

  const getHistory = useCallback(async () => {
    return tryDb(() => window.dbAPI?.history.get(), lsGetHistory)
  }, [])

  const addHistoryEntry = useCallback(async (date) => {
    const today = date ?? new Date().toISOString().split('T')[0]

    // Sempre atualiza localStorage como backup
    lsAddHistory(today)

    // Cria timestamp no DB se disponível
    try {
      await window.dbAPI?.timestamp.create({ type: 'pomodoro' })
    } catch {
      // silencioso
    }

    return lsGetHistory()
  }, [])

  // ─── Session ───────────────────────────────────────────────────────────────

  const createSession = useCallback(async ({ totalLoops }) => {
    return tryDb(
      () => window.dbAPI?.session.create({ totalLoops }),
      () => lsCreateSession({ totalLoops })
    )
  }, [])

  const completeSession = useCallback(async (id, completedLoops) => {
    return tryDb(
      () => window.dbAPI?.session.complete(id, completedLoops),
      () =>
        lsUpdateSession(id, {
          status: 'completed',
          endTime: new Date().toISOString(),
          completedLoops
        })
    )
  }, [])

  const stopSession = useCallback(async (id) => {
    return tryDb(
      () => window.dbAPI?.session.stop(id),
      () => lsUpdateSession(id, { status: 'stopped', endTime: new Date().toISOString() })
    )
  }, [])

  const cancelSession = useCallback(async (id) => {
    return tryDb(
      () => window.dbAPI?.session.cancel(id),
      () => lsUpdateSession(id, { status: 'cancelled', endTime: new Date().toISOString() })
    )
  }, [])

  const listSessions = useCallback(async (opts) => {
    return tryDb(() => window.dbAPI?.session.list(opts), lsGetSessions)
  }, [])

  return {
    getHistory,
    addHistoryEntry,
    createSession,
    completeSession,
    stopSession,
    cancelSession,
    listSessions
  }
}

// ─── localStorage helpers for CalendarNote ────────────────────────────────────

const LS_CAL_KEY = 'cal-notes'

function lsGetCalendarNotes() {
  try {
    return JSON.parse(localStorage.getItem(LS_CAL_KEY) || '{}')
  } catch {
    return {}
  }
}

function lsSaveCalendarNotes(notes) {
  localStorage.setItem(LS_CAL_KEY, JSON.stringify(notes))
}

export function useCalendarNotes() {
  const getNotes = useCallback(async () => {
    try {
      const res = await window.dbAPI?.calendar.get()
      if (res?.ok && res.data !== null) {
        // Sincroniza localStorage com o DB para offline posterior
        lsSaveCalendarNotes(res.data)
        return res.data
      }
    } catch {
      // IPC indisponível
    }
    return lsGetCalendarNotes()
  }, [])

  const setNote = useCallback(async (date, note) => {
    // Atualiza localStorage imediatamente
    const notes = lsGetCalendarNotes()
    if (note && note.trim()) notes[date] = note.trim()
    else delete notes[date]
    lsSaveCalendarNotes(notes)

    // Persiste no DB se disponível
    try {
      if (note && note.trim()) {
        await window.dbAPI?.calendar.set(date, note)
      } else {
        await window.dbAPI?.calendar.delete(date)
      }
    } catch {
      // silencioso
    }

    return lsGetCalendarNotes()
  }, [])

  const deleteNote = useCallback(async (date) => {
    return setNote(date, '')
  }, [setNote])

  return { getNotes, setNote, deleteNote }
}
