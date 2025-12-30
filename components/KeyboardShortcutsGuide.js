// components/KeyboardShortcutsGuide.js
import React from 'react';

const KeyboardShortcutsGuide = ({ shortcuts, darkMode }) => {
  return (
    <div className={`mt-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} border`}>
      <h3 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Panduan Pintasan Keyboard</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center space-x-2">
            <kbd className={`px-2 py-1.5 text-xs font-semibold rounded-md ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'}`}>
              {shortcut.key}
            </kbd>
            <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{shortcut.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardShortcutsGuide;
