import Button from '../Template/Button'

function fechar() {
  const api = window.widgetAPI
  if (!api) return
  api.pararSessao?.().finally(() => api.fechar())
}

function ButtonClose() {
  return <Button func={fechar} className="btn-close" value="✕" />
}

export default ButtonClose
