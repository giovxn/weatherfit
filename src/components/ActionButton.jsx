import React, { useState } from 'react';

const ActionButton = ({ onClick, children, variant = 'primary' }) => {
  const styles = {
    primary: {
      background: '#133f63',
      color: 'white',
      hoverBg: '#0077ED'
    },
    secondary: {
      background: 'white',
      color: '#133f63',
      border: '1px solid #d2d2d7',
      hoverBorder: '#133f63'
    }
  };

  const style = styles[variant];
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: '100%',
        padding: '14px',
        background: style.background,
        color: style.color,
        border: style.border || 'none',
        borderColor: isHovered && style.hoverBorder ? style.hoverBorder : style.border?.split(' ')[2],
        borderRadius: '12px',
        fontSize: '17px',
        fontWeight: '500',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
      }}
    >
      {children}
    </button>
  );
};

export default ActionButton;