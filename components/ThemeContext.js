'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeColor, setThemeColor] = useState('#3c8dbc'); // Default color
  const [shopName, setShopName] = useState('Toko Sakinah');

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/pengaturan');
      if (response.ok) {
        const data = await response.json();
        if (data.themeColor) {
          setThemeColor(data.themeColor);
          document.documentElement.style.setProperty('--theme-color', data.themeColor);
        }
        if (data.shopName) {
            setShopName(data.shopName);
        }
      }
    } catch (error) {
      console.error('Failed to fetch theme settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateThemeColor = (newColor) => {
    setThemeColor(newColor);
    document.documentElement.style.setProperty('--theme-color', newColor);
  };
  
  const updateShopName = (newName) => {
    setShopName(newName);
  };


  return (
    <ThemeContext.Provider value={{ themeColor, updateThemeColor, shopName, updateShopName, fetchSettings }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
