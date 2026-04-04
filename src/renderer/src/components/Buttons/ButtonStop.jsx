import { useTimerActions } from '../../context/TimerContext'
import Button from '../Template/Button'

function ButtonStop({ disabled }) {
  const { stopSession } = useTimerActions()

  return <Button className="btn-stop" value="Parar" func={stopSession} disabled={disabled} />
}

export default ButtonStop
