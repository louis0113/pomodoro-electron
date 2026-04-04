import Button from '../Template/Button'

function ButtonMax() {
  return <Button func={() => window.widgetAPI?.maximizar()} className="btn-max" value="□" />
}

export default ButtonMax
