import { useTimerActions } from '../../context/TimerContext'
import Button from '../Template/Button'

function ButtonCancel({ disabled }) {
  const { cancelSession } = useTimerActions()

  return <Button className="btn-cancel" value="Cancelar" func={cancelSession} disabled={disabled} />
}

export default ButtonCancel
