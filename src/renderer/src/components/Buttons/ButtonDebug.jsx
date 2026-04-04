import Button from '../Template/Button'

export default function ButtonDebug() {
  return (
    <Button
      className="btn-settings"
      value="Debug"
      menuOptions={[
        { label: 'Abrir console', onClick: () => window.menuAPI?.send('debug') },
        { label: 'Resetar', onClick: () => window.menuAPI?.send('reload') },
        { label: 'Forçar resetar', onClick: () => window.menuAPI?.send('force-reload') }
      ]}
    />
  )
}
