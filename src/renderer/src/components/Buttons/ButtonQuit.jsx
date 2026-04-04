import Button from '../Template/Button'

export default function ButtonQuit() {
  return <Button className="btn-settings" value="Sair" func={() => window.menuAPI?.send('quit')} />
}
