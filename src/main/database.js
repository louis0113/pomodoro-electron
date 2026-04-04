import { initDatabase, getSequelize, isDbAvailable } from '../config/sequelize.js'
import { initSession } from '../models/Session.js'
import { initTimestamp } from '../models/Timestamp.js'
import { initSettings } from '../models/Settings.js'
import { initCalendarNote } from '../models/CalendarNote.js'

let models = null

export async function setupDatabase() {
  const connected = await initDatabase()
  if (!connected) return false

  const seq = getSequelize()

  const Session = initSession(seq)
  const Timestamp = initTimestamp(seq)
  const Settings = initSettings(seq)
  const CalendarNote = initCalendarNote(seq)

  Session.hasMany(Timestamp, { foreignKey: 'sessionId', as: 'timestamps' })
  Timestamp.belongsTo(Session, { foreignKey: 'sessionId', as: 'session' })

  await seq.sync({ alter: true })

  models = { Session, Timestamp, Settings, CalendarNote }
  console.log('[DB] Models synced')
  return true
}

export function getModels() {
  return models
}

export { isDbAvailable }
