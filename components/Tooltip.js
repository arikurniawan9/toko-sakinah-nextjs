import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`absolute z-10 whitespace-nowrap text-sm text-white bg-gray-900 px-2 py-1 rounded-md shadow-lg ${positionClasses[position]}`}
        >
          {content}
          <div className={`absolute w-2 h-2 bg-gray-900 transform rotate-45 ${position === 'top' ? 'bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2' : 
            position === 'bottom' ? 'top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2' : 
            position === 'left' ? 'right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2' : 
            'left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2'}`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;