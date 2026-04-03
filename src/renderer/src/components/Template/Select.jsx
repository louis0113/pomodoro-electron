function Select({ options, label, name, value, func, disabled = false }) {
  const listOptions = options.map((option) => (
    <option
      key={option.id}
      value={option.value}
      className="select-row__option" // Classname adicionada aqui
    >
      {option.text}
    </option>
  ))

  return (
    <div className="select-row">
      <label htmlFor={name}>{label}</label>
      <select id={name} name={name} value={value} onChange={func} disabled={disabled}>
        {listOptions}
      </select>
    </div>
  )
}

export default Select
