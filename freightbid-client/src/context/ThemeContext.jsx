import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ThemeContext = createContext({
  theme: 'base',
  setTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('base');
  const location = useLocation();

  useEffect(() => {
    let resolvedTheme = 'base';
    if (location.pathname.startsWith('/supplier')) {
      resolvedTheme = 'supplier';
    } else if (location.pathname.startsWith('/transporter')) {
      resolvedTheme = 'transporter';
    } else {
      resolvedTheme = 'base';
    }
    setTheme(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [location.pathname]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div data-theme={theme} className="min-h-screen flex flex-col w-full text-brand-text-primary bg-brand-bg transition-colors duration-150">
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
