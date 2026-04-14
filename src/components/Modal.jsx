import React from 'react';
import FormField, { inputStyle } from './FormField';

const FORMALITY_OPTIONS = [
  { id: 'casual',          label: 'Casual' },
  { id: 'business casual', label: 'Business Casual' },
  { id: 'formal',          label: 'Formal' },
];

const Modal = ({
  show,
  onClose,
  onSubmit,
  newItem,
  setNewItem,
  imagePreview,
  onImageUpload,
  predictionState
}) => {
  if (!show) return null;

  const toggleFormality = (id) => {
    const current = newItem.formalities || [];
    const updated = current.includes(id)
      ? current.filter(f => f !== id)
      : [...current, id];
    setNewItem({ ...newItem, formalities: updated });
  };

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
          maxHeight: '90vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1d1d1f', margin: 0 }}>
            Add Item
          </h2>
        </div>

        <FormField label="Image">
          <input
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={onImageUpload}
            style={{ ...inputStyle, padding: '12px' }}
          />
          {imagePreview && (
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <img src={imagePreview} alt="Preview"
                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} />
            </div>
          )}
          {predictionState?.loading && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#86868b' }}>
              Predicting attributes from image...
            </div>
          )}
          {!predictionState?.loading && predictionState?.confidence !== null && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#133f63' }}>
              Auto-filled using model ({predictionState.confidence}% confidence)
            </div>
          )}
          {!predictionState?.loading && predictionState?.confidenceByHead && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              Category {predictionState.confidenceByHead.category}% • Warmth {predictionState.confidenceByHead.warmth}% • Formality {predictionState.confidenceByHead.formality}%
            </div>
          )}
          {!predictionState?.loading && predictionState?.needsReview && (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#b54708' }}>
              Low confidence prediction. Please review the auto-filled values.
            </div>
          )}
          {predictionState?.error && (
            <div style={{ marginTop: '10px', fontSize: '13px', color: '#b42318' }}>
              {predictionState.error}
            </div>
          )}
        </FormField>

        <FormField label="Name">
          <input
            type="text"
            value={newItem.name}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder="e.g. Denim Jacket"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Weather Protection">
          <select
            value={newItem.weatherProtection}
            onChange={(e) => setNewItem({ ...newItem, weatherProtection: e.target.value })}
            style={inputStyle}
          >
            <option value="none">None</option>
            <option value="waterproof">Waterproof</option>
            <option value="windproof">Windproof</option>
            <option value="both">Waterproof & Windproof</option>
          </select>
        </FormField>

        <div style={{
          marginTop: '12px',
          marginBottom: '10px',
          padding: '10px 12px',
          background: '#f8fbff',
          border: '1px solid #d8e7f5',
          borderRadius: '10px',
          fontSize: '13px',
          color: '#24557a',
          fontWeight: '500'
        }}>
          Auto-filled attributes (editable)
        </div>

        <FormField label="Category (auto-filled)">
          <select
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            style={inputStyle}
          >
            <option value="hat">Hat</option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="outerwear">Outerwear</option>
            <option value="shoes">Shoes</option>
            <option value="accessories">Accessories</option>
          </select>
        </FormField>

        <FormField label="Warmth Rating (auto-filled)">
          <select
            value={newItem.warmthRating}
            onChange={(e) => setNewItem({ ...newItem, warmthRating: parseInt(e.target.value) })}
            style={inputStyle}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Formality (auto-filled, select all that apply)">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FORMALITY_OPTIONS.map(f => {
              const selected = (newItem.formalities || []).includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFormality(f.id)}
                  style={{
                    padding: '8px 14px', borderRadius: '20px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '500', transition: 'all 0.15s',
                    border: selected ? '1px solid #133f63' : '1px solid #d2d2d7',
                    background: selected ? '#133f63' : 'white',
                    color: selected ? 'white' : '#1d1d1f',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </FormField>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px', background: '#f5f5f7', color: '#1d1d1f',
              border: 'none', borderRadius: '10px', fontSize: '17px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 1, padding: '12px', background: '#133f63', color: 'white',
              border: 'none', borderRadius: '10px', fontSize: '17px', fontWeight: '500', cursor: 'pointer'
            }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;