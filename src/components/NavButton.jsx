import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NavButton = ({ direction, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: 'transparent',
      border: 'none',
      cursor: disabled ? 'default' : 'pointer',
      padding: '8px',
      color: disabled ? '#d2d2d7' : '#1d1d1f',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    {direction === 'left' ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
  </button>
);

export default NavButton;