import { DataTypes, Model } from 'sequelize'
import sequelize from '../config/sequelize.js'

class Timestamp extends Model {}

Timestamp.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Duration in seconds'
    },
    type: {
      type: DataTypes.ENUM('pomodoro', 'short_break', 'long_break'),
      allowNull: false,
      defaultValue: 'pomodoro'
    },
    completed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    modelName: 'Timestamp',
    tableName: 'timestamps',
    timestamps: true
  }
)

export default Timestamp
