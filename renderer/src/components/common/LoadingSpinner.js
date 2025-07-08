import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ 
  size = 'medium', 
  color = '#3b82f6', 
  text = '', 
  className = '' 
}) => {
  const spinnerClassName = `loading-spinner ${size} ${className}`;

  return (
    <div className={spinnerClassName}>
      <div className="spinner-container">
        <div 
          className="spinner" 
          style={{ borderTopColor: color }}
        />
        {text && <span className="spinner-text">{text}</span>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
