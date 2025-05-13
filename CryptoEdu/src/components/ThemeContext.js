import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(true); // Default to dark mode

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const theme = {
    darkMode,
    toggleTheme,
    colors: {
      background: darkMode ? '#1a1a2e' : '#ffffff',
      text: darkMode ? '#ffffff' : '#1a1a1a',
      primary: '#B1FEDD',
      secondary: '#B1FEDD',
      danger: '#ef4444',
      card: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#f3f4f6',
      border: darkMode ? 'rgba(177, 254, 221, 0.2)' : '#e5e7eb',
      muted: darkMode ? '#94a3b8' : '#6b7280',
      navyBlue: '#1a1a2e',
    },
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};