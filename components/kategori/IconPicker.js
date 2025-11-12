// components/kategori/IconPicker.js
'use client';

import * as LucideIcons from 'lucide-react';
import { useState } from 'react';

// A curated list of icons suitable for categories
export const availableIcons = [
  'Shirt', 'ShoppingBag', 'Tag', 'Truck', 'Users', 'CreditCard', 'Home',
  'Laptop', 'Smartphone', 'Watch', 'Headphones', 'Book', 'Gift', 'Gem',
  'Briefcase', 'Cake', 'Camera', 'Car', 'Coffee', 'Drill', 'FerrisWheel',
  'Gamepad2', 'Hammer', 'Lamp', 'Pizza', 'Plane', 'Plug', 'Rocket', 'Salad',
  'Scissors', 'Sofa', 'Spade', 'Speaker', 'SprayCan', 'Store', 'Tent',
  'Ticket', 'ToyBrick', 'Train', 'Trophy', 'Wallet', 'Wrench', 'Youtube',
  'Anchor', 'Bone', 'Cat', 'Dog', 'Fish', 'Flower', 'Grape', 'Heart',
];

export default function IconPicker({ value, onChange, darkMode }) {
  const [isOpen, setIsOpen] = useState(false);

  const SelectedIcon = value ? LucideIcons[value] : LucideIcons['Package'];

  return (
    <div className="relative">
      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        Ikon (Opsional)
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-md ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
      >
        <div className="flex items-center gap-2">
          <SelectedIcon className="h-5 w-5 text-gray-500" />
          <span>{value || 'Pilih ikon'}</span>
        </div>
        <LucideIcons.ChevronDown className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute z-10 w-full mt-1 p-2 border rounded-md shadow-lg max-h-60 overflow-y-auto ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-6 gap-2">
            {availableIcons.map(iconName => {
              const IconComponent = LucideIcons[iconName];
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => {
                    onChange(iconName);
                    setIsOpen(false);
                  }}
                  className={`p-2 rounded-md flex items-center justify-center ${
                    value === iconName
                      ? 'bg-cyan-500 text-white'
                      : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                  }`}
                >
                  <IconComponent className="h-6 w-6" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
