// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#71C9CE',
      light: '#A6E3E9',
      dark: '#CBF1F5',
      contrastText: '#fff',
    },
    background: {
      default: '#E3FDFD',
      paper: '#CBF1F5',
    },
    custom: {
      one: '#E3FDFD',
      two: '#CBF1F5',
      three: '#A6E3E9',
      four: '#71C9CE',
    }
  },
});

export default theme;