import { DataTypes, Model } from 'sequelize'

export function initCalendarNote(sequelize) {
  class CalendarNote extends Model {}

  CalendarNote.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
        comment: 'YYYY-MM-DD'
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'CalendarNote',
      tableName: 'calendar_notes',
      timestamps: true
    }
  )

  return CalendarNote
}
