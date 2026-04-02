import Button from '../Template/Button';
const api = window.menuAPI;

export default function ButtonZoom() {
  return (
    <Button
      className="btn-settings"
      value="Zoom"
      menuOptions={[
        { label: 'Aumentar zoom', onClick: () => api.send('zoom-in') },
        { label: 'Diminuir zoom', onClick: () => api.send('zoom-out') },
        { label: 'Tamanho original', onClick: () => api.send('zoom-reset') }
      ]}
    />
  );
}
