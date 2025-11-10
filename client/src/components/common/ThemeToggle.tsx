import React from 'react';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { toggleColorMode } = useThemeContext();

  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      <Brightness4 />
    </IconButton>
  );
};

export default ThemeToggle;