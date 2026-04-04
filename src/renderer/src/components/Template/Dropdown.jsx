import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

function Dropdown({ options, label, value, onChange, disabled = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function handleSelect(optValue) {
    onChange(optValue)
    setOpen(false)
  }

  return (
    <div className={`dropdown-row${disabled ? ' dropdown-row--disabled' : ''}`} ref={ref}>
      <button
        type="button"
        className="dropdown-row__trigger"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className="dropdown-row__label">{label}</span>
        <span className="dropdown-row__right">
          <span className="dropdown-row__value">{selected?.text}</span>
          <span className={`dropdown-row__arrow${open ? ' open' : ''}`}>▾</span>
        </span>
      </button>

      {open && (
        <ul className="dropdown-row__list">
          {options.map((option) => (
            <li
              key={option.id}
              className={`dropdown-row__item${option.value === value ? ' selected' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.text}
              {option.value === value && <span className="dropdown-row__check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

Dropdown.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      value: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired
    })
  ).isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
}

export default Dropdown
