import React, { useEffect, useRef, useState } from 'react';
import { User } from 'lucide-react';

export default function TopNav({ currentUser, onSignOut, onRequestSignIn }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const profileLetter = currentUser?.email?.[0]?.toUpperCase() || 'U';

  const handleProfileClick = () => {
    if (!currentUser) {
      onRequestSignIn();
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleAccountClick = () => {
    setOpen(false);
    window.alert('Account page coming soon.');
  };

  const handleSettingsClick = () => {
    setOpen(false);
    window.alert('Settings page coming soon.');
  };

  const handleSignOutClick = () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    setOpen(false);
    onSignOut();
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px', position: 'relative' }} ref={ref}>
      <button
        type="button"
        onClick={handleProfileClick}
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '999px',
          border: '1px solid #d2d2d7',
          background: currentUser ? '#133f63' : '#fff',
          color: currentUser ? '#fff' : '#1d1d1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        title={currentUser ? currentUser.email : 'Sign in'}
      >
        {currentUser ? profileLetter : <User size={16} />}
      </button>

      {open && currentUser && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            width: '180px',
            background: '#fff',
            border: '1px solid #e5e5ea',
            borderRadius: '12px',
            boxShadow: '0 10px 28px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 1000
          }}
        >
          <div style={{ padding: '10px 12px', fontSize: '12px', color: '#6e6e73', borderBottom: '1px solid #f0f0f3' }}>
            {currentUser.email}
          </div>
          <button type="button" onClick={handleAccountClick} style={menuButtonStyle}>Account</button>
          <button type="button" onClick={handleSettingsClick} style={menuButtonStyle}>Settings</button>
          <button type="button" onClick={handleSignOutClick} style={{ ...menuButtonStyle, color: '#b42318' }}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

const menuButtonStyle = {
  width: '100%',
  border: 'none',
  background: '#fff',
  padding: '10px 12px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#1d1d1f'
};
