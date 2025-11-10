import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';

interface ThemeContextType {
  toggleColorMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a CustomThemeProvider');
  }
  return context;
};

interface CustomThemeProviderProps {
  children: ReactNode;
}

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'dark'
            ? {
                // DARK THEME - Black & Grey (No Blue)
                primary: {
                  main: '#e0e0e0', // Light Grey
                },
                secondary: {
                  main: '#bdbdbd', // Medium Grey
                },
                background: {
                  default: '#000000', // Pure Black
                  paper: '#1e1e1e',   // Dark Grey
                },
                text: {
                  primary: '#ffffff', // White
                  secondary: '#b3b3b3', // Light Grey
                },
              }
            : {
                // LIGHT THEME
                primary: {
                  main: '#333333', // Dark Grey
                },
                secondary: {
                  main: '#666666', // Medium Grey
                },
                background: {
                  default: '#f5f5f5', // Light Grey
                  paper: '#ffffff',   // White
                },
                text: {
                  primary: '#000000', // Black
                  secondary: '#666666', // Dark Grey
                },
              }),
        },
        components: {
          MuiAppBar: {
            styleOverrides: {
              root: {
                backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                color: mode === 'dark' ? '#ffffff' : '#000000',
                backgroundImage: 'none',
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: 'none',
              },
            },
          },
        },
      }),
    [mode]
  );

  const contextValue = useMemo(() => ({ toggleColorMode }), []);

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContext;