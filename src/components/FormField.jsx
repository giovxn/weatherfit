import React from 'react';

const FormField = ({ label, children }) => (
  <div style={{ marginBottom: '20px' }}>
    <label style={{ 
      display: 'block', 
      fontSize: '13px', 
      fontWeight: '500', 
      color: '#1d1d1f', 
      marginBottom: '8px' 
    }}>
      {label}
    </label>
    {children}
  </div>
);

export const inputStyle = {
  width: '100%',
  padding: '12px',
  border: '1px solid #d2d2d7',
  borderRadius: '10px',
  fontSize: '17px',
  background: 'white'
};

export default FormField;