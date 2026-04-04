import Button from '../Template/Button'

function ButtonMin() {
  return <Button func={() => window.widgetAPI?.minimizar()} className="btn-min" value="─" />
}

export default ButtonMin
