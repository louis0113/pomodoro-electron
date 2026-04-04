import Dropdown from '../Template/Dropdown'

const timesOptions = [
  { id: 1, value: '1', text: '1 loop' },
  { id: 2, value: '2', text: '2 loops' },
  { id: 3, value: '3', text: '3 loops' },
  { id: 4, value: '4', text: '4 loops' }
]

function Times({ value, onChange, disabled }) {
  return (
    <Dropdown
      options={timesOptions}
      label="Loops"
      value={value}
      onChange={onChange}
      disabled={disabled}
    />
  )
}

export default Times
