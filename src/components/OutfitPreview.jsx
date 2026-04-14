import React, { useState } from 'react';

const CATEGORY_ORDER = ['hat', 'outerwear', 'top', 'bottom', 'shoes', 'accessories'];

const categoryEmoji = (cat) => {
  const map = { hat: '🧢', top: '👕', bottom: '👖', outerwear: '🧥', shoes: '👟', accessories: '🕶️' };
  return map[cat] || '👔';
};

const getSize = (category) => {
  if (category === 'hat' || category === 'shoes') return '105px';
  return '200px';
};

const OutfitPreview = ({ outfit }) => {
  const [hoveringTop, setHoveringTop] = useState(false);

  const sorted = [...outfit.items].sort((a, b) =>
    CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  const hat         = sorted.find(i => i.category === 'hat');
  const outerwear   = sorted.find(i => i.category === 'outerwear');
  const top         = sorted.find(i => i.category === 'top');
  const bottom      = sorted.find(i => i.category === 'bottom');
  const shoes       = sorted.find(i => i.category === 'shoes');
  const accessories = sorted.find(i => i.category === 'accessories');

  const topSlot     = outerwear || top;
  const hasSwitch   = outerwear && top;
  const displayItem = hasSwitch ? (hoveringTop ? top : outerwear) : topSlot;

  const mainSlots = [hat, displayItem, bottom, shoes].filter(Boolean);

  const hatOffset = hat ? 105 + 8 : 0;

  const renderItem = (item, size) => {
    const isTopSlot = item === displayItem &&
      (item.category === 'top' || item.category === 'outerwear');

    return (
      <div
        onMouseEnter={() => { if (isTopSlot && hasSwitch) setHoveringTop(true); }}
        onMouseLeave={() => { if (isTopSlot && hasSwitch) setHoveringTop(false); }}
        style={{
          width: size, height: size,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
          cursor: isTopSlot && hasSwitch ? 'pointer' : 'default',
          position: 'relative',
          transition: 'opacity 0.2s'
        }}
      >
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        ) : (
          <span style={{ fontSize: '72px' }}>
            {categoryEmoji(item.category)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      padding: '16px', position: 'relative'
    }}>

      {/* Main column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        {mainSlots.map((item, i) => (
          <div key={i}>{renderItem(item, getSize(item.category))}</div>
        ))}
      </div>

      {/* Accessories */}
      {accessories && (
        <div style={{
          position: 'absolute',
          top: `calc(16px + ${hatOffset}px)`,
          left: '50%',
          transform: 'translateX(110px)',
        }}>
          {renderItem(accessories, '140px')}
        </div>
      )}
    </div>
  );
};

export default OutfitPreview;