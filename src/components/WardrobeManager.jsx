import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const CATEGORY_LABELS = {
  hat: 'Hats', top: 'Tops', bottom: 'Bottoms',
  outerwear: 'Outerwear', shoes: 'Shoes', accessories: 'Accessories'
};

const WardrobeManager = ({ clothes, onDelete }) => {
  const [open, setOpen] = useState(false);

  const totalItems = Object.values(clothes).flat().length;

  return (
    <div style={{ marginTop: '24px', marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px',
          background: 'white', color: '#1d1d1f',
          border: '1px solid #d2d2d7', borderRadius: '12px',
          fontSize: '17px', fontWeight: '500', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}
      >
        <span>Manage Wardrobe ({totalItems} items)</span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div style={{
          background: 'white', borderRadius: '12px',
          border: '1px solid #d2d2d7', marginTop: '8px', overflow: 'hidden'
        }}>
          {Object.entries(clothes).map(([category, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={category}>
                <div style={{
                  padding: '10px 16px',
                  background: '#f5f5f7',
                  fontSize: '13px', fontWeight: '600',
                  color: '#86868b', textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {CATEGORY_LABELS[category]}
                </div>
                {items.map((item, index) => (
                  <div key={index} style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid #f0f0f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {item.image ? (
                        <img
                          src={item.image} alt={item.name}
                          style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '6px', background: '#f5f5f7' }}
                        />
                      ) : (
                        <div style={{
                          width: '36px', height: '36px', background: '#f5f5f7',
                          borderRadius: '6px', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '18px'
                        }}>
                          {categoryEmoji(category)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '500', color: '#1d1d1f' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#86868b' }}>
                          Warmth {item.warmthRating} • {item.weatherProtection} • {item.formality}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => onDelete(category, index)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#ff3b30', padding: '8px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })}

          {Object.values(clothes).flat().length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#86868b' }}>
              No items yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const categoryEmoji = (cat) => {
  const map = { hat: '🧢', top: '👕', bottom: '👖', outerwear: '🧥', shoes: '👟', accessories: '🕶️' };
  return map[cat] || '👔';
};

export default WardrobeManager;