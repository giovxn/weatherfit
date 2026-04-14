import React, { useState, useRef, useEffect } from 'react';

const categoryEmoji = (cat) => {
  const map = { hat: '🧢', top: '👕', bottom: '👖', outerwear: '🧥', shoes: '👟', accessories: '🕶️' };
  return map[cat] || '👔';
};

const shuffleArray = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const OutfitCard = ({ outfits, rank, selected, onSelect }) => {
  const [shuffled, setShuffled] = useState(() => shuffleArray(outfits));
  const [groupIndex, setGroupIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const explanationRef = useRef(null);

  useEffect(() => {
    setShowExplanation(false);
    setGroupIndex(0);
    setShuffled(shuffleArray(outfits));
  }, [rank, outfits.length]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (explanationRef.current && !explanationRef.current.contains(e.target)) {
        setShowExplanation(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const outfit = shuffled[groupIndex] ?? shuffled[0];
  if (!outfit) return null;

  const rankColors = { 1: '#133f63', 2: '#3a7ca5', 3: '#86868b' };
  const rankLabels = { 1: '1st', 2: '2nd', 3: '3rd' };

  const goTo = (newIndex) => {
    setGroupIndex(newIndex);
    onSelect(shuffled[newIndex]);
  };

  return (
    <div
      onClick={() => onSelect(outfit)}
      style={{
        background: 'white', borderRadius: '16px', padding: '24px',
        marginBottom: '16px', cursor: 'pointer',
        border: selected ? '2px solid #133f63' : '1px solid #e5e5e5',
        boxShadow: selected ? '0 4px 16px rgba(19,63,99,0.1)' : '0 1px 3px rgba(0,0,0,0.05)',
        transition: 'border 0.15s, box-shadow 0.15s'
      }}
    >

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            background: rankColors[rank], color: 'white',
            borderRadius: '8px', padding: '4px 10px',
            fontSize: '13px', fontWeight: '600'
          }}>
            {rankLabels[rank]}
          </span>
        </div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: rankColors[rank] }}>
          {outfit.confidence}%
        </div>
      </div>

      {/* Items */}
      <div style={{ marginBottom: '16px' }}>
        {outfit.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0',
            borderBottom: i < outfit.items.length - 1 ? '1px solid #f0f0f0' : 'none'
          }}>
            {item.image ? (
              <img src={item.image} alt={item.name}
                style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#f5f5f7' }} />
            ) : (
              <div style={{
                width: '40px', height: '40px', background: '#f5f5f7', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
              }}>
                {categoryEmoji(item.category)}
              </div>
            )}
            <div>
              <div style={{ fontSize: '15px', fontWeight: '500', color: '#1d1d1f' }}>{item.name}</div>
              <div style={{ fontSize: '13px', color: '#86868b', textTransform: 'capitalize' }}>{item.category}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: navigation + explanation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Group navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {shuffled.length > 1 ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(Math.max(0, groupIndex - 1)); }}
                disabled={groupIndex === 0}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid #d2d2d7', background: 'white',
                  cursor: groupIndex === 0 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: groupIndex === 0 ? '#d2d2d7' : '#1d1d1f',
                  fontSize: '16px'
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '13px', color: '#86868b', minWidth: '48px', textAlign: 'center' }}>
                {groupIndex + 1} of {shuffled.length}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(Math.min(shuffled.length - 1, groupIndex + 1)); }}
                disabled={groupIndex === shuffled.length - 1}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  border: '1px solid #d2d2d7', background: 'white',
                  cursor: groupIndex === shuffled.length - 1 ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: groupIndex === shuffled.length - 1 ? '#d2d2d7' : '#1d1d1f',
                  fontSize: '16px'
                }}
              >
                ›
              </button>
            </>
          ) : (
            <span style={{ fontSize: '13px', color: '#86868b' }}>1 of 1</span>
          )}
        </div>

        {/* Why this outfit */}
        <div
          style={{ position: 'relative', display: 'inline-block' }}
          ref={explanationRef}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#133f63', fontSize: '14px', fontWeight: '500',
              padding: '0', display: 'inline-flex', alignItems: 'center', gap: '4px'
            }}
          >
            Why this outfit?
            <span style={{ fontSize: '11px' }}>{showExplanation ? '▲' : '▼'}</span>
          </button>

          {showExplanation && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 8px)', right: '0',
              background: 'white', borderRadius: '14px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              padding: '14px 16px', width: '280px', zIndex: 100
            }}>
              {outfit.explanation.map((line, i) => (
                <div key={i} style={{
                  fontSize: '14px', color: '#444', lineHeight: '1.6',
                  marginBottom: i < outfit.explanation.length - 1 ? '6px' : '0'
                }}>
                  • {line}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutfitCard;