import { useState, useEffect, useRef } from 'react';

function Button({ className, value, func, disabled = false, menuOptions = [] }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const handleClick = () => {
    if (menuOptions.length > 0) {
      setOpen(!open);
    } else if (func) {
      func();
    }
  };

  useEffect(() => {
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  return (
    <div className="button-wrapper" ref={wrapperRef}>
      <button onClick={handleClick} className={className} disabled={disabled}>
        {value}
      </button>
      {open && (
        <ul className="button-menu">
          {menuOptions.map((option, idx) => (
            <li key={idx}>
              <button
                className="button-menu-item"
                onClick={() => {
                  option.onClick();
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Button;

