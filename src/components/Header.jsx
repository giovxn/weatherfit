import React, { useState, useRef, useEffect } from 'react';
import { MapPin } from 'lucide-react';

const PRESET_CITIES = [
  'Dubai', 'London', 'Riyadh', 'New York',
  'Antarctica', 'Thailand', 'Russia'
];

const Header = ({ city, temperature, loading, weatherData, onCityChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (selectedCity) => {
    onCityChange(selectedCity);
    setShowPicker(false);
  };

  return (
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      <h1 style={{
        fontSize: '32px', fontWeight: '600', color: '#1d1d1f',
        marginBottom: '8px', letterSpacing: '-0.5px'
      }}>
        WeatherFit
      </h1>

      <div style={{ position: 'relative', display: 'inline-block' }} ref={pickerRef}>
        <button
          onClick={() => setShowPicker(!showPicker)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px 8px', borderRadius: '8px',
            display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap',
            justifyContent: 'center', gap: '6px',
            color: '#86868b', fontSize: '15px', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#e8e8ed'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <MapPin size={16} />
          <span>{city}</span>
          <span style={{ margin: '0 2px' }}>•</span>
          <span style={{ fontWeight: '500', color: '#1d1d1f' }}>
            {loading ? '...' : temperature !== null ? `${temperature}°C` : '...'}
          </span>
          {weatherData && !loading && (
            <>
              <span style={{ margin: '0 2px' }}>•</span>
              <span>{weatherData.condition}</span>
              <span style={{ margin: '0 2px' }}>•</span>
              <span>Wind {weatherData.windSpeed} km/h</span>
              <span style={{ margin: '0 2px' }}>•</span>
              <span>UV {weatherData.uvIndex}</span>
            </>
          )}
          <span style={{ fontSize: '11px', marginLeft: '2px', color: '#86868b' }}>▼</span>
        </button>

        {showPicker && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '14px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            padding: '6px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            width: '280px',
            zIndex: 100
          }}>
            {PRESET_CITIES.map(c => (
              <button
                key={c}
                onClick={() => handleSelect(c)}
                style={{
                  padding: '8px 12px', borderRadius: '8px',
                  border: city === c ? '1px solid #133f63' : '1px solid transparent',
                  background: city === c ? '#eef4f9' : 'transparent',
                  cursor: 'pointer', fontSize: '14px', fontWeight: '500',
                  color: city === c ? '#133f63' : '#1d1d1f',
                  textAlign: 'left', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { if (city !== c) e.currentTarget.style.background = '#f5f5f7'; }}
                onMouseLeave={e => { if (city !== c) e.currentTarget.style.background = 'transparent'; }}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;