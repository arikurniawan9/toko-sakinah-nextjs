import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const childRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [portalRoot, setPortalRoot] = useState(null);
  const tooltipRef = useRef(null); // Ref for the tooltip element itself

  useEffect(() => {
    let element = document.getElementById('tooltip-root');
    if (!element) {
      element = document.createElement('div');
      element.setAttribute('id', 'tooltip-root');
      document.body.appendChild(element);
    }
    setPortalRoot(element);

    return () => {
      if (element && element.parentNode === document.body && element.children.length === 0) {
        document.body.removeChild(element);
      }
    };
  }, []);

  const calculatePosition = () => {
    if (!childRef.current || !tooltipRef.current) return;

    const childRect = childRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const style = {};

    // Default to positioning to the left
    style.left = `${childRect.left - 8}px`; // 8px padding from the element
    style.top = `${childRect.top + childRect.height / 2}px`;
    style.transform = 'translateY(-50%) translateX(-100%)'; // Center vertically, shift left by 100% of tooltip width

    // Prevent tooltip from going off-screen to the left
    if (childRect.left - 8 - tooltipRect.width < 0) {
      // If it goes off-screen left, position to the right instead
      style.left = `${childRect.right + 8}px`;
      style.transform = 'translateY(-50%)';
    }

    // Prevent tooltip from going off-screen to the top/bottom
    if (childRect.top < 0) {
      style.top = '8px'; // Stick to top with some padding
      style.transform = 'none'; // Reset transform if sticking to top
    } else if (childRect.bottom > window.innerHeight) {
      style.top = `${window.innerHeight - childRect.height - 8}px`; // Stick to bottom
      style.transform = 'none'; // Reset transform if sticking to bottom
    }

    setTooltipStyle(style);
  };

  useEffect(() => {
    if (isVisible) {
      // Recalculate position after the tooltip content has rendered and its size is known
      const timeoutId = setTimeout(calculatePosition, 0); 
      window.addEventListener('scroll', calculatePosition);
      window.addEventListener('resize', calculatePosition);
      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', calculatePosition);
        window.removeEventListener('resize', calculatePosition);
      };
    }
  }, [isVisible, content, portalRoot]); // Recalculate if content changes or portal is ready

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
          ref={tooltipRef} // Attach ref to the tooltip element
          className="absolute z-50 whitespace-nowrap text-sm text-white bg-gray-900 px-2 py-1 rounded-md shadow-lg"
          style={tooltipStyle}
        >
          {content}
        </div>,
        portalRoot
      )}
    </>
  );
};

export default Tooltip;