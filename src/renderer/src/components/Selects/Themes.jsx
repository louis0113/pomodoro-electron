import Dropdown from '../Template/Dropdown'

const themeOptions = [
  { id: 1, value: 'pomodoro', text: 'Pomodoro' },
  { id: 2, value: 'dark', text: 'Dark' },
  { id: 3, value: 'ocean', text: 'Ocean' },
  { id: 4, value: 'forest', text: 'Forest' },
  { id: 5, value: 'sunset', text: 'Sunset' },
  { id: 6, value: 'light', text: 'Light' },
  { id: 7, value: 'neon', text: 'Neon' },
  { id: 8, value: 'lavender', text: 'Lavender' },
  { id: 9, value: 'midnight', text: 'Midnight' },
  { id: 10, value: 'coffee', text: 'Coffee' },
  { id: 11, value: 'cyber', text: 'Cyber' },
  { id: 12, value: 'ice', text: 'Ice' },
  { id: 13, value: 'solar', text: 'Solar' }
]

function Themes({ theme, setTheme }) {
  return (
    <Dropdown
      options={themeOptions}
      label="Tema"
      value={theme}
      onChange={setTheme}
    />
  )
}

export default Themes
