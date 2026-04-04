import Button from '../Template/Button'

export default function ButtonZoom() {
  return (
    <Button
      className="btn-settings"
      value="Zoom"
      menuOptions={[
        { label: 'Aumentar zoom', onClick: () => window.menuAPI?.send('zoom-in') },
        { label: 'Diminuir zoom', onClick: () => window.menuAPI?.send('zoom-out') },
        { label: 'Tamanho original', onClick: () => window.menuAPI?.send('zoom-reset') },
        { label: 'Fullscreen', onClick: () => window.menuAPI?.send('fullscreen') }
      ]}
    />
  )
}
