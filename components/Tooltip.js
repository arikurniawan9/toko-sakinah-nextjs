// components/Tooltip.js
'use client';

import React, { useState, useRef } from 'react';

const Tooltip = ({ children, content, position = 'top', darkMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, 500); // Delay 500ms sebelum menampilkan tooltip
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg
            ${darkMode ? 'bg-gray-800 text-white' : 'bg-blue-600 text-white'}
            whitespace-nowrap
            transform transition-all duration-200 ease-out
            ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
          `}
          style={{
            [position]: position === 'top' || position === 'bottom' ? '100%' : '50%',
            left: position === 'top' || position === 'bottom' ? '50%' : position === 'right' ? '100%' : 'auto',
            right: position === 'left' ? '100%' : 'auto',
            top: position === 'left' || position === 'right' ? '50%' : 'auto',
            transform:
              position === 'top' ? 'translate(-50%, -10px)' :
              position === 'bottom' ? 'translate(-50%, 10px)' :
              position === 'left' ? 'translateX(-10px) translateY(-50%)' :
              'translateX(10px) translateY(-50%)',
          }}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 rotate-45
              ${darkMode ? 'bg-gray-800' : 'bg-blue-600'}
            `}
            style={{
              [position === 'top' ? 'bottom' :
               position === 'bottom' ? 'top' :
               position === 'left' ? 'right' : 'left']: '-4px',
              [position === 'top' || position === 'bottom' ? 'left' :
               position === 'left' ? 'bottom' : 'bottom']: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;