import Button from '../Template/Button'

export default function ButtonHelp() {
  return <Button className="btn-settings" value="Ajuda" func={() => window.menuAPI?.send('help')} />
}
