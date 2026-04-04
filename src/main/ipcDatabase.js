import { ipcMain } from 'electron'
import {
  createSession,
  updateSession,
  completeSession,
  stopSession,
  cancelSession,
  listSessions,
  deleteSession,
  createTimestamp,
  completeTimestamp,
  listTimestamps,
  deleteTimestamp,
  getHistoryFromDb,
  getDbSettings,
  setDbSettings,
  getCalendarNotes,
  setCalendarNote,
  deleteCalendarNote
} from './crud.js'
import { isDbAvailable } from './database.js'

function wrap(fn) {
  return async (_, ...args) => {
    try {
      const result = await fn(...args)
      return { ok: true, data: result }
    } catch (err) {
      console.error('[DB IPC]', err.message)
      return { ok: false, error: err.message }
    }
  }
}

export function registerDatabaseHandlers() {
  ipcMain.handle('db:available', () => isDbAvailable())

  // Session
  ipcMain.handle('db:session:create', wrap(createSession))
  ipcMain.handle(
    'db:session:update',
    wrap((id, data) => updateSession(id, data))
  )
  ipcMain.handle(
    'db:session:complete',
    wrap((id, completedLoops) => completeSession(id, completedLoops))
  )
  ipcMain.handle(
    'db:session:stop',
    wrap((id) => stopSession(id))
  )
  ipcMain.handle(
    'db:session:cancel',
    wrap((id) => cancelSession(id))
  )
  ipcMain.handle(
    'db:session:list',
    wrap((opts) => listSessions(opts))
  )
  ipcMain.handle(
    'db:session:delete',
    wrap((id) => deleteSession(id))
  )

  // Timestamp
  ipcMain.handle(
    'db:timestamp:create',
    wrap((data) => createTimestamp(data))
  )
  ipcMain.handle(
    'db:timestamp:complete',
    wrap((id) => completeTimestamp(id))
  )
  ipcMain.handle(
    'db:timestamp:list',
    wrap((opts) => listTimestamps(opts))
  )
  ipcMain.handle(
    'db:timestamp:delete',
    wrap((id) => deleteTimestamp(id))
  )

  // History
  ipcMain.handle('db:history:get', wrap(getHistoryFromDb))

  // Settings
  ipcMain.handle('db:settings:get', wrap(getDbSettings))
  ipcMain.handle(
    'db:settings:set',
    wrap((data) => setDbSettings(data))
  )

  // CalendarNote
  ipcMain.handle('db:calendar:get', wrap(getCalendarNotes))
  ipcMain.handle(
    'db:calendar:set',
    wrap((date, note) => setCalendarNote(date, note))
  )
  ipcMain.handle(
    'db:calendar:delete',
    wrap((date) => deleteCalendarNote(date))
  )
}
