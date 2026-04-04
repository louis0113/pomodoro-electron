import Button from '../Template/Button'

export default function ButtonSettings() {
  return (
    <Button
      className="btn-settings"
      value="Configurações"
      func={() => window.menuAPI?.send('secondary')}
    />
  )
}
