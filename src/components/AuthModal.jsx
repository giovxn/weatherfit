import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const inputStyle = {
  width: '100%',
  border: '1px solid #d2d2d7',
  borderRadius: '10px',
  padding: '10px 12px',
  fontSize: '14px'
};

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export default function AuthModal({
  show,
  mode,
  setMode,
  onClose,
  onSubmit,
  onGoogleCredential,
  loading,
  error
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleError, setGoogleError] = useState('');
  const googleBtnRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const isSignIn = mode === 'signin';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ email: email.trim(), password });
  };

  useEffect(() => {
    if (!show || !googleClientId || !googleBtnRef.current) return;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) {
        setGoogleError('Google sign-in unavailable right now.');
        return;
      }
      try {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response?.credential && onGoogleCredential) onGoogleCredential(response.credential);
          }
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
          locale: 'en'
        });
        setGoogleError('');
      } catch (e) {
        console.error('Google Sign-In init failed:', e);
        setGoogleError('Google sign-in could not be initialized.');
        googleBtnRef.current.innerHTML = '';
      }
    };

    const existing = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existing) {
      renderGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderGoogleButton;
    script.onerror = () => setGoogleError('Failed to load Google Sign-In script.');
    document.head.appendChild(script);
  }, [show, googleClientId, onGoogleCredential]);

  useEffect(() => {
    if (!show) {
      setGoogleError('');
    }
  }, [show]);

  if (!show) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '390px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          padding: '24px'
        }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '22px', color: '#1d1d1f' }}>
          {isSignIn ? 'Sign In' : 'Create Account'}
        </h3>
        <p style={{ margin: '0 0 16px', color: '#6e6e73', fontSize: '13px' }}>
          {isSignIn ? 'Sign in to access your account.' : 'Create an account to get started.'}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '10px' }}>
            <input
              type="email"
              value={email}
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, paddingRight: '62px' }}
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '10px',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: '#133f63',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ color: '#b42318', fontSize: '12px', marginBottom: '10px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              background: '#133f63',
              color: '#fff'
            }}
          >
            {loading ? 'Please wait...' : isSignIn ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {googleClientId && (
          <>
            <div style={{
              margin: '14px 0 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#86868b',
              fontSize: '12px'
            }}>
              <div style={{ height: 1, background: '#e5e5ea', flex: 1 }} />
              <span>or</span>
              <div style={{ height: 1, background: '#e5e5ea', flex: 1 }} />
            </div>
            <div ref={googleBtnRef} style={{ display: 'flex', justifyContent: 'center' }} />
            {googleError && (
              <div style={{ marginTop: '8px', color: '#b42318', fontSize: '12px', textAlign: 'center' }}>
                {googleError}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: '14px', textAlign: 'center', fontSize: '13px', color: '#6e6e73' }}>
          {isSignIn ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => setMode(isSignIn ? 'signup' : 'signin')}
            style={{
              background: 'none',
              border: 'none',
              color: '#133f63',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            {isSignIn ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
