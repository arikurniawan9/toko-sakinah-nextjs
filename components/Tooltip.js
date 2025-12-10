// components/Tooltip.js
'use client';

import { useState, useEffect, useRef } from 'react';

const Tooltip = ({ children, content, position = 'top', darkMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check if the element overflows its container
    if (triggerRef.current) {
      const element = triggerRef.current;
      setIsOverflowing(element.scrollWidth > element.clientWidth || 
                      element.scrollHeight > element.clientHeight);
    }
  }, []);

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

  // Hanya tampilkan tooltip jika teks overflow atau jika tooltip selalu ditampilkan
  const shouldShowTooltip = isOverflowing || !triggerRef.current?.classList.contains('truncate');

  return (
    <div
      className="relative inline-block"
      onMouseEnter={shouldShowTooltip ? showTooltip : undefined}
      onMouseLeave={shouldShowTooltip ? hideTooltip : undefined}
      onFocus={shouldShowTooltip ? showTooltip : undefined}
      onBlur={shouldShowTooltip ? hideTooltip : undefined}
    >
      <div ref={triggerRef} className="focus:outline-none">
        {children}
      </div>

      {isVisible && (
        <div
          className={`
            absolute z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg
            ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}
            whitespace-nowrap
          `}
          style={{
            [position]: '100%',
            left: position === 'top' || position === 'bottom' ? '50%' : '100%',
            transform:
              position === 'top' ? 'translate(-50%, -10px)' :
              position === 'bottom' ? 'translate(-50%, 10px)' :
              position === 'left' ? 'translateX(-10px)' :
              'translateX(10px)',
          }}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 rotate-45
              ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-b border-gray-200'}
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

// Versi sederhana dari tooltip
const SimpleTooltip = ({ children, content, position = 'top', darkMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <div
          className={`
            absolute z-[9999] px-3 py-2 text-sm rounded-lg shadow-lg
            ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 border border-gray-200'}
            whitespace-nowrap
          `}
          style={{
            [position]: '100%',
            left: position === 'top' || position === 'bottom' ? '50%' : '100%',
            transform:
              position === 'top' ? 'translate(-50%, -10px)' :
              position === 'bottom' ? 'translate(-50%, 10px)' :
              position === 'left' ? 'translateX(-10px)' :
              'translateX(10px)',
          }}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 rotate-45
              ${darkMode ? 'bg-gray-800' : 'bg-white border-r border-b border-gray-200'}
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

export default SimpleTooltip;