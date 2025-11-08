import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Tooltip = ({ children, content, position = 'right' }) => { // Default to right
  const [isVisible, setIsVisible] = useState(false);
  const childRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [portalRoot, setPortalRoot] = useState(null);

  useEffect(() => {
    // Create a div element to be our portal root
    let element = document.getElementById('tooltip-root');
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', 'tooltip-root');
      document.body.appendChild(element);
    }
    setPortalRoot(element);

    return () => {
      // Clean up the element if it was created by this component
      if (element && element.parentNode === document.body && element.children.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);

  const calculatePosition = () => {
    if (!childRef.current) return;

    const rect = childRef.current.getBoundingClientRect();
    const style = {};

    // Always position to the right, adjusted for viewport
    style.left = `${rect.right + 8}px`; // 8px padding from the element
    style.top = `${rect.top + rect.height / 2}px`;
    style.transform = 'translateY(-50%)'; // Center vertically

    // Prevent tooltip from going off-screen to the right
    if (rect.right + 8 + (content.length * 8) > window.innerWidth) { // Rough estimate of tooltip width
      style.left = `${rect.left - 8 - (content.length * 8)}px`; // Position to the left instead
      style.transform = 'translateY(-50%)';
    }

    // Prevent tooltip from going off-screen to the top/bottom
    if (rect.top < 0) {
      style.top = '8px'; // Stick to top with some padding
      style.transform = 'none';
    } else if (rect.bottom > window.innerHeight) {
      style.top = `${window.innerHeight - rect.height - 8}px`; // Stick to bottom
      style.transform = 'none';
    }

    setTooltipStyle(style);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
    } else {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
    }
    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, content]); // Recalculate if content changes

  const handleMouseEnter = () => {
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  if (!portalRoot) {
    return (
      <div ref={childRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="cursor-pointer">
        {children}
      </div>
    );
  }

  return (
    <>
      <div ref={childRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="cursor-pointer">
        {children}
      </div>
      {isVisible && ReactDOM.createPortal(
        <div
          className="absolute z-50 whitespace-nowrap text-sm text-white bg-gray-900 px-2 py-1 rounded-md shadow-lg"
          style={tooltipStyle}
        >
          {content}
          {/* No arrow needed for right-aligned portal tooltip */}
        </div>,
        portalRoot
      )}
    </>
  );
};

export default Tooltip;