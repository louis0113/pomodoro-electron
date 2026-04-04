import { useState, useEffect } from 'react'
import ButtonMin from './Buttons/ButtonMin'
import ButtonMax from './Buttons/ButtonMax'
import ButtonClose from './Buttons/ButtonClose'

function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const api = window.widgetAPI
    if (!api?.onMaximizeChange) return
    const cleanup = api.onMaximizeChange((val) => setIsMaximized(val))
    return cleanup
  }, [])

  return (
    <div className={`window-controls${isMaximized ? '' : ' window-controls--compact'}`}>
      <ButtonMin />
      <ButtonMax />
      <ButtonClose />
    </div>
  )
}

export default WindowControls
