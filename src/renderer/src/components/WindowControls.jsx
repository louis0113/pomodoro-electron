import ButtonMin from './Buttons/ButtonMin'
import ButtonMax from './Buttons/ButtonMax'
import ButtonClose from './Buttons/ButtonClose'

function WindowControls() {
  return (
    <>
      <div className="window">
        <div className="window-controls">
          <ButtonMin />
          <ButtonMax />
          <ButtonClose />
        </div>
      </div>
    </>
  )
}

export default WindowControls
