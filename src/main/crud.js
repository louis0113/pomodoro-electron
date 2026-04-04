import { Op } from 'sequelize'
import { getModels, isDbAvailable } from './database.js'

// ─── Session ─────────────────────────────────────────────────────────────────

export async function createSession({ totalLoops }) {
  if (!isDbAvailable()) return null
  const { Session } = getModels()
  const session = await Session.create({ startTime: new Date(), totalLoops, status: 'running' })
  return session.toJSON()
}

export async function updateSession(id, data) {
  if (!isDbAvailable()) return null
  const { Session } = getModels()
  const [, [updated]] = await Session.update(data, { where: { id }, returning: true })
  return updated ? updated.toJSON() : null
}

export async function completeSession(id, completedLoops) {
  const end = new Date()
  const session = await getModels()?.Session?.findByPk(id)
  const totalDuration = session ? Math.round((end - new Date(session.startTime)) / 1000) : null
  return updateSession(id, { status: 'completed', endTime: end, completedLoops, totalDuration })
}

export async function stopSession(id) {
  return updateSession(id, { status: 'stopped', endTime: new Date() })
}

export async function cancelSession(id) {
  return updateSession(id, { status: 'cancelled', endTime: new Date() })
}

export async function listSessions({ limit = 50, offset = 0 } = {}) {
  if (!isDbAvailable()) return null
  const { Session } = getModels()
  const rows = await Session.findAll({ order: [['startTime', 'DESC']], limit, offset })
  return rows.map((r) => r.toJSON())
}

export async function deleteSession(id) {
  if (!isDbAvailable()) return null
  const { Session } = getModels()
  return await Session.destroy({ where: { id } })
}

// ─── Timestamp ────────────────────────────────────────────────────────────────

export async function createTimestamp({ sessionId = null, type = 'pomodoro' }) {
  if (!isDbAvailable()) return null
  const { Timestamp } = getModels()
  const ts = await Timestamp.create({ sessionId, startTime: new Date(), type })
  return ts.toJSON()
}

export async function completeTimestamp(id) {
  if (!isDbAvailable()) return null
  const { Timestamp } = getModels()
  const ts = await Timestamp.findByPk(id)
  if (!ts) return null
  const endTime = new Date()
  ts.endTime = endTime
  ts.duration = Math.round((endTime - ts.startTime) / 1000)
  ts.completed = true
  await ts.save()
  return ts.toJSON()
}

export async function listTimestamps({ sessionId, date, limit = 100 } = {}) {
  if (!isDbAvailable()) return null
  const { Timestamp } = getModels()
  const where = {}
  if (sessionId != null) where.sessionId = sessionId
  if (date) {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)
    where.startTime = { [Op.between]: [start, end] }
  }
  const rows = await Timestamp.findAll({ where, order: [['startTime', 'DESC']], limit })
  return rows.map((r) => r.toJSON())
}

export async function deleteTimestamp(id) {
  if (!isDbAvailable()) return null
  const { Timestamp } = getModels()
  return await Timestamp.destroy({ where: { id } })
}

export async function getHistoryFromDb() {
  if (!isDbAvailable()) return null
  const { Timestamp } = getModels()
  const rows = await Timestamp.findAll({
    where: { type: 'pomodoro', completed: true },
    attributes: ['startTime']
  })
  const history = {}
  for (const r of rows) {
    const day = new Date(r.startTime).toISOString().split('T')[0]
    history[day] = (history[day] || 0) + 1
  }
  return history
}

// ─── CalendarNote ─────────────────────────────────────────────────────────────

export async function getCalendarNotes() {
  if (!isDbAvailable()) return null
  const { CalendarNote } = getModels()
  const rows = await CalendarNote.findAll({ order: [['date', 'ASC']] })
  const notes = {}
  for (const r of rows) notes[r.date] = r.note
  return notes
}

export async function setCalendarNote(date, note) {
  if (!isDbAvailable()) return null
  const { CalendarNote } = getModels()
  if (!note || !note.trim()) {
    await CalendarNote.destroy({ where: { date } })
    return null
  }
  const [row] = await CalendarNote.upsert({ date, note: note.trim() })
  return row.toJSON()
}

export async function deleteCalendarNote(date) {
  if (!isDbAvailable()) return null
  const { CalendarNote } = getModels()
  return await CalendarNote.destroy({ where: { date } })
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export async function getDbSettings() {
  if (!isDbAvailable()) return null
  const { Settings } = getModels()
  const row = await Settings.findByPk(1)
  return row ? row.toJSON() : null
}

export async function setDbSettings(data) {
  if (!isDbAvailable()) return null
  const { Settings } = getModels()
  const [row] = await Settings.upsert({ id: 1, ...data })
  return row.toJSON()
}
