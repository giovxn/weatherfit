import React from 'react';
import { Trash2 } from 'lucide-react';

const CATEGORY_LABELS = {
  hat: 'Hats', top: 'Tops', bottom: 'Bottoms',
  outerwear: 'Outerwear', shoes: 'Shoes', accessories: 'Accessories'
};

const categoryEmoji = (cat) => {
  const map = { hat: '🧢', top: '👕', bottom: '👖', outerwear: '🧥', shoes: '👟', accessories: '🕶️' };
  return map[cat] || '👔';
};

const DeleteItemModal = ({ show, onClose, clothes, onDelete }) => {
  if (!show) return null;

  const allCategories = Object.entries(clothes).filter(([, items]) => items.length > 0);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        padding: '20px', zIndex: 1000
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '20px', padding: '32px',
          maxWidth: '500px', width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxHeight: '80vh', overflowY: 'auto'
        }}
      >
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1d1d1f', marginBottom: '24px' }}>
          My Wardrobe
        </h2>

        {allCategories.length === 0 ? (
          <p style={{ color: '#86868b', textAlign: 'center' }}>No items yet.</p>
        ) : (
          allCategories.map(([category, items]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <div style={{
                fontSize: '12px', fontWeight: '600', color: '#86868b',
                textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px'
              }}>
                {CATEGORY_LABELS[category]}
              </div>
              {items.map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 0',
                  borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}>
                  {item.image ? (
                    <img src={item.image} alt={item.name}
                      style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px', background: '#f5f5f7' }} />
                  ) : (
                    <div style={{
                      width: '36px', height: '36px', background: '#f5f5f7',
                      borderRadius: '8px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '18px'
                    }}>
                      {categoryEmoji(category)}
                    </div>
                  )}
                  <span style={{ flex: 1, fontSize: '15px', fontWeight: '500', color: '#1d1d1f' }}>
                    {item.name}
                  </span>
                  <button
                    onClick={() => onDelete(category, item.name)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#d2d2d7', padding: '4px', borderRadius: '6px',
                      display: 'flex', alignItems: 'center', transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#ff3b30'}
                    onMouseLeave={e => e.currentTarget.style.color = '#d2d2d7'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', marginTop: '8px',
            background: '#f5f5f7', color: '#1d1d1f',
            border: 'none', borderRadius: '10px',
            fontSize: '17px', fontWeight: '500', cursor: 'pointer'
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default DeleteItemModal;